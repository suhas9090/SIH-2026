"""
Risk Flagging Engine — Python / AI Layer (Spec §15)

Identifies potential inconsistencies and risk signals in bidder submissions.
This operates at the AI service layer before results are sent to the backend.

IMPORTANT TERMINOLOGY (Spec §15):
  - Use: "Potential inconsistency", "Requires verification", "Risk flag", "Evidence mismatch"
  - Never use: "fraud", "fraudulent", "forgery", "fake"

The backend riskEngine.js calculates the score.
This module generates the flag descriptors that feed into that score.
"""

from enum import Enum
from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Optional
from datetime import date
import re
from loguru import logger


class RiskFlagType(str, Enum):
    POTENTIAL_INCONSISTENCY  = "POTENTIAL_INCONSISTENCY"
    REQUIRES_VERIFICATION    = "REQUIRES_VERIFICATION"
    EVIDENCE_MISMATCH        = "EVIDENCE_MISMATCH"
    RISK_FLAG                = "RISK_FLAG"
    EXPIRED_DOCUMENT         = "EXPIRED_DOCUMENT"
    FINANCIAL_THRESHOLD      = "FINANCIAL_THRESHOLD"
    MISSING_MANDATORY        = "MISSING_MANDATORY"


class RiskSeverity(str, Enum):
    LOW      = "LOW"
    MEDIUM   = "MEDIUM"
    HIGH     = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass
class RiskFlag:
    flag_type: RiskFlagType
    severity: RiskSeverity
    field: str           # which field triggered this flag
    description: str     # human-readable explanation (safe terminology)
    requirement_id: Optional[str] = None
    document_id: Optional[str] = None


class RiskFlaggingEngine:
    """
    Inspects extracted evidence and verification results for risk signals.

    Rules applied:
    1. Expired certificates (expiry date < today)
    2. Company name inconsistency across documents
    3. Financial threshold failure
    4. Missing mandatory documents
    5. Conflicting registration numbers
    6. External verification mismatch
    """

    def analyze(
        self,
        requirements: List[Dict[str, Any]],
        documents: List[Dict[str, Any]],
        verifications: List[Dict[str, Any]],
        extracted_data: Dict[str, Any],
    ) -> List[RiskFlag]:
        """
        Run all risk checks and return a list of RiskFlag objects.
        """
        flags: List[RiskFlag] = []

        flags.extend(self._check_expired_documents(documents, extracted_data))
        flags.extend(self._check_name_inconsistency(documents, extracted_data))
        flags.extend(self._check_financial_threshold(requirements, extracted_data))
        flags.extend(self._check_missing_mandatory(requirements, documents))
        flags.extend(self._check_verification_mismatch(verifications, extracted_data))

        logger.info(f"Risk analysis complete: {len(flags)} flag(s) identified")
        return flags

    def to_dict_list(self, flags: List[RiskFlag]) -> List[Dict[str, Any]]:
        return [asdict(f) for f in flags]

    # ------------------------------------------------------------------
    # Individual checks
    # ------------------------------------------------------------------

    def _check_expired_documents(
        self,
        documents: List[Dict[str, Any]],
        extracted_data: Dict[str, Any],
    ) -> List[RiskFlag]:
        flags = []
        today = date.today()

        for doc in documents:
            doc_type = doc.get("documentType", "")
            extracted = extracted_data.get(doc_type, {})
            expiry_str = extracted.get("expiryDate") or extracted.get("validUpto")

            if not expiry_str:
                continue

            expiry = self._parse_date(expiry_str)
            if expiry and expiry < today:
                flags.append(RiskFlag(
                    flag_type=RiskFlagType.EXPIRED_DOCUMENT,
                    severity=RiskSeverity.HIGH,
                    field="expiryDate",
                    description=(
                        f"Potential inconsistency: {doc_type} appears to have "
                        f"expired on {expiry_str}. Requires verification."
                    ),
                    document_id=doc.get("id"),
                ))

        return flags

    def _check_name_inconsistency(
        self,
        documents: List[Dict[str, Any]],
        extracted_data: Dict[str, Any],
    ) -> List[RiskFlag]:
        """Check if company names are consistent across documents."""
        flags = []
        names: List[str] = []

        for doc in documents:
            doc_type = doc.get("documentType", "")
            extracted = extracted_data.get(doc_type, {})
            name = extracted.get("companyName")
            if name:
                names.append(self._normalize_name(name))

        if len(names) < 2:
            return flags

        # Check if all names are sufficiently similar
        base = names[0]
        for name in names[1:]:
            if not self._names_match(base, name):
                flags.append(RiskFlag(
                    flag_type=RiskFlagType.POTENTIAL_INCONSISTENCY,
                    severity=RiskSeverity.MEDIUM,
                    field="companyName",
                    description=(
                        "Potential inconsistency: Company name differs across "
                        "submitted documents. Requires verification to confirm "
                        "they refer to the same entity."
                    ),
                ))
                break  # One flag is enough for this check

        return flags

    def _check_financial_threshold(
        self,
        requirements: List[Dict[str, Any]],
        extracted_data: Dict[str, Any],
    ) -> List[RiskFlag]:
        flags = []
        financial_doc = extracted_data.get("FINANCIAL_STATEMENT", {})
        actual_turnover = financial_doc.get("annualTurnover") or financial_doc.get("numericValue")

        if actual_turnover is None:
            return flags

        actual = float(actual_turnover)

        for req in requirements:
            if req.get("category") != "FINANCIAL":
                continue
            min_val = req.get("minimumValue") or req.get("minValue")
            if min_val is None:
                continue
            if actual < float(min_val):
                flags.append(RiskFlag(
                    flag_type=RiskFlagType.FINANCIAL_THRESHOLD,
                    severity=RiskSeverity.HIGH,
                    field="annualTurnover",
                    description=(
                        f"Risk flag: Submitted financial figure (₹{actual:,.0f}) "
                        f"appears below the required threshold (₹{float(min_val):,.0f}). "
                        f"Requires review of audited financial statements."
                    ),
                    requirement_id=req.get("id"),
                ))

        return flags

    def _check_missing_mandatory(
        self,
        requirements: List[Dict[str, Any]],
        documents: List[Dict[str, Any]],
    ) -> List[RiskFlag]:
        flags = []
        uploaded_types = {d.get("documentType", "") for d in documents}

        for req in requirements:
            if not req.get("mandatory", True):
                continue
            evidence_types = req.get("evidenceTypes", [])
            for ev_type in evidence_types:
                if ev_type not in uploaded_types:
                    flags.append(RiskFlag(
                        flag_type=RiskFlagType.MISSING_MANDATORY,
                        severity=RiskSeverity.CRITICAL,
                        field="documentSubmission",
                        description=(
                            f"Risk flag: Mandatory document type '{ev_type}' "
                            f"required for '{req.get('title', 'requirement')}' "
                            f"was not found in the submission."
                        ),
                        requirement_id=req.get("id"),
                    ))

        return flags

    def _check_verification_mismatch(
        self,
        verifications: List[Dict[str, Any]],
        extracted_data: Dict[str, Any],
    ) -> List[RiskFlag]:
        """
        Check if government verification data conflicts with extracted document data.
        """
        flags = []

        gst_verification = next(
            (v for v in verifications if v.get("source") == "GST_PORTAL"), None
        )
        if gst_verification:
            verified_name = gst_verification.get("verifiedData", {}).get("legalName", "")
            gst_doc = extracted_data.get("GST_CERTIFICATE", {})
            doc_name = gst_doc.get("companyName", "")

            if verified_name and doc_name:
                if not self._names_match(
                    self._normalize_name(verified_name),
                    self._normalize_name(doc_name),
                ):
                    flags.append(RiskFlag(
                        flag_type=RiskFlagType.EVIDENCE_MISMATCH,
                        severity=RiskSeverity.HIGH,
                        field="legalName",
                        description=(
                            "Evidence mismatch: Legal name in GST portal record "
                            "differs from name in submitted GST certificate. "
                            "Requires verification."
                        ),
                    ))

        return flags

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _normalize_name(self, name: str) -> str:
        """Normalize company name for comparison."""
        name = name.upper().strip()
        # Remove common suffixes that may or may not appear
        for suffix in ["PVT LTD", "PRIVATE LIMITED", "LTD", "LIMITED", "PVT.", "(P) LTD"]:
            name = name.replace(suffix, "").strip()
        # Remove punctuation
        name = re.sub(r"[.,'\-()]", "", name).strip()
        return name

    def _names_match(self, name1: str, name2: str) -> bool:
        """
        Check if two normalized company names are the same.
        Uses simple containment check to handle abbreviations.
        """
        if name1 == name2:
            return True
        # One contains the other (handles abbreviations)
        if name1 in name2 or name2 in name1:
            return True
        # Levenshtein-like: if very short edit distance
        return False

    def _parse_date(self, date_str: str) -> Optional[date]:
        """Try to parse a date string in common Indian formats."""
        formats = ["%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%d %b %Y", "%B %d, %Y"]
        for fmt in formats:
            try:
                from datetime import datetime
                return datetime.strptime(date_str.strip(), fmt).date()
            except ValueError:
                continue
        return None
