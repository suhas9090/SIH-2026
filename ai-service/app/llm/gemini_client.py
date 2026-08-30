"""
LLM Client — Google Gemini API abstraction layer
All LLM calls go through this module so the provider can be swapped later.
"""

import os
import json
import re
from typing import Any, Dict, Optional
import google.generativeai as genai
from loguru import logger

# Configure Gemini
_api_key = os.getenv("GEMINI_API_KEY", "")
if _api_key:
    genai.configure(api_key=_api_key)

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")
DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"


def get_model():
    """Get the configured Gemini model instance."""
    if not _api_key:
        raise ValueError("GEMINI_API_KEY not configured. Add it to ai-service/.env")
    return genai.GenerativeModel(GEMINI_MODEL)


async def extract_requirements_from_text(text: str, context: str = "") -> Dict[str, Any]:
    """
    Use Gemini to extract structured requirements from tender document text.
    Returns structured JSON only — no free-form responses used for compliance logic.
    """
    if DEMO_MODE and not _api_key:
        return _demo_requirements()

    prompt = f"""You are an expert procurement compliance analyst for Indian government procurement (GeM portal).

Analyze the following tender document text and extract ALL eligibility and compliance requirements.

For each requirement, return a JSON object with these exact fields:
- category: one of [FINANCIAL, TECHNICAL, LEGAL, REGISTRATION, TAX, MSME_UDYAM, STARTUP, OEM, CERTIFICATION, EXPERIENCE, MAKE_IN_INDIA, LOCAL_CONTENT, EPFO, ESIC, BLACKLISTING, OTHER]
- title: short title of the requirement
- description: full description as stated in the document
- operator: comparison operator if numeric (>=, <=, =, contains) or null
- minimumValue: numeric minimum value in base units (e.g. paise for INR) or null
- textValue: text-based value if not numeric (e.g. "Active", "Registered") or null
- unit: unit of measurement (e.g. "INR", "years", "employees") or null
- currency: currency code or null
- period: time period if mentioned (e.g. "preceding 3 financial years") or null
- mandatory: true if this is a mandatory/essential requirement, false otherwise
- requiredEvidence: array of document types required as evidence
- sourcePage: page number where requirement appears, or null

Return ONLY a valid JSON object like:
{{
  "requirements": [
    {{...}},
    {{...}}
  ],
  "totalFound": <number>,
  "documentType": "TENDER"
}}

Do NOT invent requirements. Only extract what is explicitly stated.
If a value is unknown, use null.

TENDER TEXT:
{text[:8000]}

{f'ADDITIONAL CONTEXT: {context}' if context else ''}
"""

    try:
        model = get_model()
        response = model.generate_content(prompt)
        result_text = response.text

        # Extract JSON from response
        json_match = re.search(r'\{[\s\S]*\}', result_text)
        if json_match:
            return json.loads(json_match.group())
        return {"requirements": [], "totalFound": 0, "error": "Could not parse LLM response"}
    except Exception as e:
        logger.error(f"LLM requirement extraction failed: {e}")
        if DEMO_MODE:
            return _demo_requirements()
        raise


async def extract_evidence_from_document(text: str, doc_type: str, org_name: str = "") -> Dict[str, Any]:
    """
    Use Gemini to extract structured evidence from a bidder document.
    Returns structured JSON only.
    """
    if DEMO_MODE and not _api_key:
        return _demo_evidence(doc_type, org_name)

    prompt = f"""You are an expert at analyzing Indian government procurement documents.

Analyze this {doc_type} document and extract all relevant compliance information.

Return ONLY a valid JSON object with these fields (use null if not found):
{{
  "documentType": "{doc_type}",
  "companyName": null,
  "gstin": null,
  "pan": null,
  "udyamNo": null,
  "cinNo": null,
  "registrationDate": null,
  "expiryDate": null,
  "status": null,
  "annualTurnover": null,
  "financialYear": null,
  "currency": "INR",
  "category": null,
  "authorizedFor": null,
  "issuedBy": null,
  "validUpto": null,
  "employeeCount": null,
  "otherFields": {{}}
}}

Rules:
- Preserve numbers exactly as found
- Preserve dates exactly as found
- Do NOT invent information
- If a field is not in the document, use null

DOCUMENT TEXT:
{text[:6000]}
"""

    try:
        model = get_model()
        response = model.generate_content(prompt)
        result_text = response.text

        json_match = re.search(r'\{[\s\S]*\}', result_text)
        if json_match:
            return json.loads(json_match.group())
        return {}
    except Exception as e:
        logger.error(f"LLM evidence extraction failed: {e}")
        if DEMO_MODE:
            return _demo_evidence(doc_type, org_name)
        raise


async def generate_compliance_explanation(requirement: Dict, evidence: Dict, rule_result: str) -> str:
    """
    Generate a natural language explanation for a compliance result.
    This is for display only — it does NOT override the deterministic rule result.
    """
    if DEMO_MODE and not _api_key:
        return _demo_explanation(requirement, evidence, rule_result)

    prompt = f"""You are a procurement compliance expert explaining a compliance decision to a procurement officer.

Requirement: {requirement.get('title', 'Unknown')}
Category: {requirement.get('category', 'Unknown')}
Description: {requirement.get('description', '')}
Required Value: {requirement.get('textValue') or requirement.get('minimumValue', 'N/A')}

Evidence Found: {evidence.get('evidence', 'None')}
Government Verification: {evidence.get('verification', 'Not performed')}
Rule Applied: {evidence.get('rule', 'N/A')}
Result: {rule_result}

Write a clear, concise explanation (2-3 sentences) for why this requirement is {rule_result}.
Be factual. Do not make up information. Reference the evidence and rule clearly.
"""

    try:
        model = get_model()
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logger.error(f"LLM explanation generation failed: {e}")
        return f"Requirement is {rule_result} based on the compliance rule applied."


async def generate_rag_grounded_response(query: str, context_chunks: list) -> str:
    """
    Generate a RAG-grounded response using retrieved procurement knowledge chunks.
    """
    if not context_chunks:
        return "No relevant procurement guidelines found for this requirement."

    if DEMO_MODE and not _api_key:
        return f"Based on GeM procurement guidelines: This requirement relates to standard procurement norms under GFR 2017 and GeM guidelines."

    context = "\n\n".join([f"[Source: {c.get('source', 'Unknown')}]\n{c.get('text', '')}" for c in context_chunks[:3]])

    prompt = f"""You are a GeM procurement expert. Using ONLY the provided procurement guidelines below, answer the query.
If the guidelines do not contain relevant information, say so clearly.
Do NOT make up information or cite sources not provided.

PROCUREMENT GUIDELINES:
{context}

QUERY: {query}

Answer concisely (2-3 sentences) based strictly on the provided guidelines:"""

    try:
        model = get_model()
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logger.error(f"RAG response generation failed: {e}")
        return "Could not retrieve relevant procurement guidelines at this time."


# Demo fallback data

def _demo_requirements() -> Dict:
    return {
        "requirements": [
            {
                "category": "REGISTRATION",
                "title": "Valid GST Registration",
                "description": "The bidder must possess a valid GST registration certificate.",
                "operator": "=",
                "textValue": "Active",
                "mandatory": True,
                "requiredEvidence": ["GST_CERTIFICATE"],
                "sourcePage": 4
            },
            {
                "category": "TAX",
                "title": "Valid PAN",
                "description": "The bidder must have a valid Permanent Account Number (PAN).",
                "operator": "=",
                "textValue": "Active",
                "mandatory": True,
                "requiredEvidence": ["PAN_CARD"],
                "sourcePage": 4
            },
            {
                "category": "MSME_UDYAM",
                "title": "Udyam/MSME Registration",
                "description": "The bidder must be registered as MSME under Udyam portal.",
                "operator": "=",
                "textValue": "Registered",
                "mandatory": False,
                "requiredEvidence": ["UDYAM_CERTIFICATE"],
                "sourcePage": 5
            },
            {
                "category": "FINANCIAL",
                "title": "Minimum Annual Turnover",
                "description": "The bidder shall have a minimum average annual turnover of INR 5 crore during the preceding three financial years.",
                "operator": ">=",
                "minimumValue": 50000000,
                "currency": "INR",
                "unit": "INR",
                "period": "preceding 3 financial years",
                "mandatory": True,
                "requiredEvidence": ["FINANCIAL_STATEMENT"],
                "sourcePage": 6
            },
            {
                "category": "OEM",
                "title": "OEM Authorization Certificate",
                "description": "The bidder must submit a valid OEM authorization certificate from the manufacturer.",
                "mandatory": True,
                "requiredEvidence": ["OEM_AUTHORIZATION"],
                "sourcePage": 7
            },
            {
                "category": "EXPERIENCE",
                "title": "Relevant Experience",
                "description": "The bidder must have at least 3 years of experience in supply of similar products.",
                "operator": ">=",
                "minimumValue": 3,
                "unit": "years",
                "mandatory": True,
                "requiredEvidence": ["EXPERIENCE_CERTIFICATE"],
                "sourcePage": 8
            },
            {
                "category": "BLACKLISTING",
                "title": "Non-Blacklisting Declaration",
                "description": "The bidder must not be blacklisted or debarred by any government entity.",
                "mandatory": True,
                "requiredEvidence": ["OTHER"],
                "sourcePage": 9
            }
        ],
        "totalFound": 7,
        "documentType": "TENDER",
        "note": "[DEMO MODE] Sample requirements for demonstration"
    }


def _demo_evidence(doc_type: str, org_name: str) -> Dict:
    demo_data = {
        "GST_CERTIFICATE": {
            "documentType": "GST_CERTIFICATE",
            "companyName": org_name or "ABC Industries Pvt Ltd",
            "gstin": "29AABCA1234C1Z5",
            "status": "Active",
            "registrationDate": "2019-04-01",
            "note": "[DEMO] Sample extracted data"
        },
        "FINANCIAL_STATEMENT": {
            "documentType": "FINANCIAL_STATEMENT",
            "companyName": org_name or "ABC Industries Pvt Ltd",
            "annualTurnover": 32000000,
            "financialYear": "2025-26",
            "currency": "INR",
            "numericValue": 32000000,
            "note": "[DEMO] Turnover is ₹3.2 Crore — below required ₹5 Crore"
        },
        "OEM_AUTHORIZATION": {
            "documentType": "OEM_AUTHORIZATION",
            "companyName": org_name or "ABC Industries Pvt Ltd",
            "issuedBy": "XYZ Corporation",
            "authorizedFor": "Industrial Safety Equipment",
            "validUpto": "2026-12-31",
            "note": "[DEMO] Sample OEM authorization"
        }
    }
    return demo_data.get(doc_type, {
        "documentType": doc_type,
        "companyName": org_name,
        "note": "[DEMO] Generic extracted data"
    })


def _demo_explanation(requirement: Dict, evidence: Dict, rule_result: str) -> str:
    explanations = {
        "NON_COMPLIANT": f"The requirement for {requirement.get('title', 'this item')} is not met. The bidder's submitted evidence does not satisfy the minimum threshold specified in the tender.",
        "COMPLIANT": f"The requirement for {requirement.get('title', 'this item')} is satisfied. The bidder has provided valid evidence that meets the tender specification.",
        "MISSING": f"The required documentation for {requirement.get('title', 'this item')} was not found in the bidder's submission.",
        "INCONSISTENT": f"Inconsistency detected in {requirement.get('title', 'this item')}. The submitted document information does not match the verified government data."
    }
    return explanations.get(rule_result, f"Result for {requirement.get('title', 'this item')}: {rule_result}")
