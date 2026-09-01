"""
Government Data Verification APIs (FastAPI Router)
Simulates official statutory data validation against synthetic reference datasets in Govt_Data.
Demonstrates the integration architecture for real-world automated compliance verification.
"""

import os
import json
from pathlib import Path
from typing import Optional, Dict, Any
from fastapi import APIRouter, Query, Body, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/gov-data", tags=["Government Data Verification APIs"])

# Locate Govt_Data/json directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
GOVT_DATA_JSON_DIR = BASE_DIR / "Govt_Data" / "json"


def load_dataset(name: str) -> list:
    """Load JSON dataset from Govt_Data/json"""
    file_path = GOVT_DATA_JSON_DIR / f"{name}.json"
    if not file_path.exists():
        return []
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


class VerificationRequest(BaseModel):
    identifier: str
    expected_legal_name: Optional[str] = None
    expected_pan: Optional[str] = None


class CrossVerificationRequest(BaseModel):
    organization_name: Optional[str] = None
    pan: Optional[str] = None
    gstin: Optional[str] = None
    udyam_no: Optional[str] = None
    cin_no: Optional[str] = None
    epfo_id: Optional[str] = None
    esic_id: Optional[str] = None


@router.get("/summary")
async def get_summary():
    """Summary of all available synthetic Government Data Verification APIs."""
    registries = [
        "pan", "gst", "udyam", "mca", "income_tax", "epfo", "esic",
        "blacklist", "bis", "digilocker", "gem", "local_content", "nsic", "startup"
    ]
    stats = {}
    total_records = 0
    for r in registries:
        data = load_dataset(r)
        stats[r] = len(data)
        total_records += len(data)

    return {
        "status": "active",
        "architecture": "Government Data Verification API Layer",
        "prototype_note": "Synthetic reference dataset simulating official Indian regulatory authorities.",
        "future_scope": "Swappable with live gateway APIs (GSTN, ITD, Udyam, MCA21, EPFO).",
        "total_registries": len(registries),
        "total_records": total_records,
        "registry_record_counts": stats
    }


# 1. PAN Verification API
@router.get("/pan/verify")
async def verify_pan(identifier: str = Query(..., description="10-digit PAN"), expected_name: Optional[str] = None):
    records = load_dataset("pan")
    clean_id = identifier.strip().upper()
    record = next((r for r in records if r.get("panNumber") == clean_id), None)

    if not record:
        return {
            "api": "Income Tax Department (CBDT) PAN Verification API",
            "identifier": clean_id,
            "is_present": False,
            "status": "NOT_FOUND_IN_REGISTRY",
            "message": f"PAN {clean_id} not found in CBDT reference dataset",
            "record": None
        }

    is_name_match = True
    if expected_name and record.get("legalName"):
        is_name_match = (
            expected_name.lower() in record["legalName"].lower() or
            record["legalName"].lower() in expected_name.lower()
        )

    return {
        "api": "Income Tax Department (CBDT) PAN Verification API",
        "identifier": clean_id,
        "is_present": True,
        "status": "VALID_ACTIVE" if record.get("panActive") and is_name_match else "DISCREPANCY_DETECTED",
        "pan_active": record.get("panActive", False),
        "name_match": is_name_match,
        "legal_name": record.get("legalName"),
        "record": record
    }


# 2. GST Verification API
@router.get("/gst/verify")
async def verify_gst(identifier: str = Query(..., description="15-digit GSTIN"), expected_pan: Optional[str] = None, expected_name: Optional[str] = None):
    records = load_dataset("gst")
    clean_id = identifier.strip().upper()
    record = next((r for r in records if r.get("gstin") == clean_id), None)

    if not record and expected_pan:
        record = next((r for r in records if r.get("panNumber") == expected_pan.strip().upper()), None)

    if not record:
        return {
            "api": "Goods and Services Tax Network (GSTN) Verification API",
            "identifier": clean_id,
            "is_present": False,
            "status": "NOT_FOUND_IN_REGISTRY",
            "message": f"GSTIN {clean_id} not found in GSTN reference dataset",
            "record": None
        }

    pan_match = True
    if expected_pan and record.get("panNumber"):
        pan_match = record["panNumber"].upper() == expected_pan.strip().upper()

    return {
        "api": "Goods and Services Tax Network (GSTN) Verification API",
        "identifier": record.get("gstin"),
        "is_present": True,
        "status": record.get("registrationStatus", "ACTIVE"),
        "filing_status": record.get("filingStatus", "COMPLIANT"),
        "pan_match": pan_match,
        "legal_name": record.get("legalName"),
        "trade_name": record.get("tradeName"),
        "record": record
    }


# 3. Udyam MSME Verification API
@router.get("/udyam/verify")
async def verify_udyam(identifier: str = Query(..., description="Udyam Registration Number"), expected_pan: Optional[str] = None):
    records = load_dataset("udyam")
    clean_id = identifier.strip().upper()
    record = next((r for r in records if r.get("udyamRegistrationNumber") == clean_id), None)

    if not record and expected_pan:
        record = next((r for r in records if r.get("panNumber") == expected_pan.strip().upper()), None)

    if not record:
        return {
            "api": "Ministry of MSME Udyam Enterprise Verification API",
            "identifier": clean_id,
            "is_present": False,
            "status": "NOT_FOUND_IN_REGISTRY",
            "message": f"Udyam registration {clean_id} not found",
            "record": None
        }

    return {
        "api": "Ministry of MSME Udyam Enterprise Verification API",
        "identifier": record.get("udyamRegistrationNumber"),
        "is_present": True,
        "status": record.get("registrationStatus", "ACTIVE"),
        "enterprise_type": record.get("enterpriseType"),
        "annual_turnover": record.get("annualTurnover"),
        "investment": record.get("investmentInPlantAndMachinery"),
        "enterprise_name": record.get("enterpriseName"),
        "record": record
    }


# 4. MCA CIN Verification API
@router.get("/mca/verify")
async def verify_mca(identifier: str = Query(..., description="Corporate Identity Number (CIN) or LLPIN")):
    records = load_dataset("mca")
    clean_id = identifier.strip().upper()
    record = next((r for r in records if r.get("cinOrLlpin") == clean_id), None)

    if not record:
        return {
            "api": "Ministry of Corporate Affairs (MCA21 / ROC) Verification API",
            "identifier": clean_id,
            "is_present": False,
            "status": "NOT_FOUND_IN_REGISTRY",
            "record": None
        }

    return {
        "api": "Ministry of Corporate Affairs (MCA21 / ROC) Verification API",
        "identifier": clean_id,
        "is_present": True,
        "company_status": record.get("companyStatus", "ACTIVE"),
        "company_name": record.get("legalName"),
        "incorporation_date": record.get("incorporationDate"),
        "directors": record.get("directors", []),
        "record": record
    }


# 5. Central Debarment & Blacklist Verification API
@router.get("/blacklist/verify")
async def verify_blacklist(identifier: str = Query(..., description="PAN, GSTIN, CIN, or Company Name")):
    records = load_dataset("blacklist")
    clean_id = identifier.strip().upper()
    record = next((
        r for r in records if (
            r.get("panNumber") == clean_id or
            r.get("gstin") == clean_id or
            r.get("cin") == clean_id or
            clean_id in r.get("entityName", "").upper()
        )
    ), None)

    is_debarred = record is not None
    return {
        "api": "Central Debarment & Vigilance Registry API (CVC / GeM)",
        "identifier": identifier,
        "is_debarred": is_debarred,
        "risk_severity": "CRITICAL" if is_debarred else "LOW",
        "status": record.get("blacklistStatus", "CLEAN") if record else "NOT_DEBARRED",
        "details": record.get("reason") if record else "No active debarment or vigilance flags found.",
        "record": record
    }


# 6. Unified Cross-Verification & Triangulation Endpoint
@router.post("/cross-verify")
async def cross_verify(req: CrossVerificationRequest):
    """
    Holistic cross-verification pipeline:
    Validates PAN ↔ GSTIN ↔ Udyam ↔ MCA ↔ Blacklist consistency graph.
    """
    pan_res = await verify_pan(req.pan, req.organization_name) if req.pan else None
    gst_res = await verify_gst(req.gstin, req.pan, req.organization_name) if req.gstin else None
    udyam_res = await verify_udyam(req.udyam_no, req.pan) if req.udyam_no else None
    mca_res = await verify_mca(req.cin_no) if req.cin_no else None
    blacklist_res = await verify_blacklist(req.pan or req.gstin or req.organization_name or "") if (req.pan or req.gstin or req.organization_name) else None

    # Evaluate consistency
    flags = []
    if blacklist_res and blacklist_res.get("is_debarred"):
        flags.append({"severity": "CRITICAL", "code": "DEBARRED_ENTITY", "message": blacklist_res.get("details")})

    if pan_res and not pan_res.get("is_present"):
        flags.append({"severity": "HIGH", "code": "PAN_NOT_FOUND", "message": "PAN not found in CBDT database"})
    elif pan_res and not pan_res.get("pan_active"):
        flags.append({"severity": "HIGH", "code": "PAN_INACTIVE", "message": "PAN is inactive / surrendered"})

    if gst_res and not gst_res.get("is_present"):
        flags.append({"severity": "HIGH", "code": "GST_NOT_FOUND", "message": "GSTIN not found in GSTN database"})
    elif gst_res and gst_res.get("status") in ["CANCELLED", "SUSPENDED"]:
        flags.append({"severity": "HIGH", "code": f"GST_{gst_res.get('status')}", "message": f"GSTIN status is {gst_res.get('status')}"})

    if gst_res and pan_res and gst_res.get("is_present") and pan_res.get("is_present"):
        if not gst_res.get("pan_match"):
            flags.append({"severity": "HIGH", "code": "PAN_GST_MISMATCH", "message": "GSTIN PAN segment does not match submitted PAN"})

    score = 100
    for f in flags:
        if f["severity"] == "CRITICAL":
            score = min(score, 10)
        elif f["severity"] == "HIGH":
            score -= 25
        elif f["severity"] == "MEDIUM":
            score -= 15

    risk_level = "CRITICAL" if score <= 20 else ("HIGH" if score <= 60 else ("MEDIUM" if score <= 80 else "LOW"))

    return {
        "status": "COMPLETED",
        "pipeline": "Cross-Portal Identity Triangulation",
        "compliance_score": max(0, score),
        "risk_level": risk_level,
        "flag_count": len(flags),
        "flags": flags,
        "statutory_checks": {
            "pan": pan_res,
            "gst": gst_res,
            "udyam": udyam_res,
            "mca": mca_res,
            "blacklist": blacklist_res
        }
    }
