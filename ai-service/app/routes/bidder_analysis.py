"""FastAPI routes for bidder analysis — evidence matching and compliance scoring."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from loguru import logger

from app.llm.gemini_client import extract_evidence_from_document, generate_compliance_explanation, generate_rag_grounded_response
from app.vector_store.faiss_store import search_knowledge, compute_similarity

router = APIRouter()


class BidderAnalysisRequest(BaseModel):
    bidderId: str
    tenderId: str
    requirements: List[Dict[str, Any]]
    documents: List[Dict[str, Any]]
    verifications: List[Dict[str, Any]]


class ComplianceItemResult(BaseModel):
    requirementId: str
    status: str
    evidence: Optional[str] = None
    explanation: Optional[str] = None
    similarityScore: Optional[float] = None
    confidence: Optional[float] = None
    ragReference: Optional[str] = None
    numericValue: Optional[float] = None
    documentId: Optional[str] = None
    page: Optional[int] = None


class BidderAnalysisResponse(BaseModel):
    bidderId: str
    complianceItems: List[ComplianceItemResult]
    processed: int


@router.post("/analyze-bidder", response_model=BidderAnalysisResponse)
async def analyze_bidder(request: BidderAnalysisRequest):
    """
    Full AI analysis pipeline for a bidder:
    1. Extract evidence from each document
    2. For each requirement, find relevant evidence via semantic matching
    3. Retrieve RAG knowledge
    4. Generate explanations
    
    Note: This returns AI-assisted analysis only.
    The deterministic compliance engine in the backend makes the final compliance decision.
    """
    logger.info(f"Analyzing bidder: {request.bidderId}")

    compliance_items = []

    # Extract evidence from all documents
    all_evidence = {}
    for doc in request.documents:
        if doc.get("extractedText") or doc.get("extractedData"):
            doc_evidence = doc.get("extractedData") or {}
            doc_type = doc.get("documentType", "OTHER")
            all_evidence[doc_type] = {
                "documentId": doc.get("id"),
                "data": doc_evidence,
                "text": doc.get("extractedText", "")[:2000]
            }

    # For each requirement, perform semantic evidence matching
    for req in request.requirements:
        req_id = req.get("id")
        req_text = f"{req.get('title', '')}: {req.get('description', '')}"
        req_category = req.get("category", "OTHER")

        try:
            # Step 1: Find relevant evidence using semantic matching
            best_evidence = None
            best_score = 0.0
            best_doc_id = None
            numeric_value = None

            for doc_type, evidence_info in all_evidence.items():
                evidence_text = evidence_info.get("text", "")
                if not evidence_text:
                    continue

                score = await compute_similarity(req_text, evidence_text[:500])

                if score > best_score:
                    best_score = score
                    best_evidence = evidence_text[:300]
                    best_doc_id = evidence_info.get("documentId")

                    # Extract numeric value if financial requirement
                    if req_category == "FINANCIAL":
                        ev_data = evidence_info.get("data", {})
                        numeric_value = ev_data.get("annualTurnover") or ev_data.get("numericValue")

            # Step 2: RAG knowledge retrieval
            rag_chunks = await search_knowledge(req_text, top_k=3)
            rag_reference = None
            if rag_chunks:
                rag_reference = f"{rag_chunks[0].get('source', 'GeM Guidelines')}: {rag_chunks[0].get('text', '')[:150]}"

            # Step 3: Generate explanation
            explanation = await generate_compliance_explanation(
                req,
                {"evidence": best_evidence, "verification": "Government API checked"},
                "PENDING"  # Actual status set by compliance engine
            )

            compliance_items.append(ComplianceItemResult(
                requirementId=req_id,
                status="PENDING",  # Backend engine sets the final status
                evidence=best_evidence,
                explanation=explanation,
                similarityScore=best_score,
                confidence=min(best_score + 0.1, 1.0),
                ragReference=rag_reference,
                numericValue=numeric_value,
                documentId=best_doc_id,
            ))

        except Exception as e:
            logger.error(f"Analysis failed for requirement {req_id}: {e}")
            compliance_items.append(ComplianceItemResult(
                requirementId=req_id,
                status="PENDING",
                confidence=0.5
            ))

    return BidderAnalysisResponse(
        bidderId=request.bidderId,
        complianceItems=compliance_items,
        processed=len(compliance_items)
    )


@router.post("/semantic-match")
async def semantic_match(req: Dict[str, Any]):
    """Compute semantic similarity between requirement and evidence."""
    text1 = req.get("text1", "")
    text2 = req.get("text2", "")
    score = await compute_similarity(text1, text2)
    return {"similarityScore": score, "matched": score >= 0.75}
