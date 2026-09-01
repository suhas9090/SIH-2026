"""
Backend Callback Utility (Spec §28)

The AI service calls these functions to write processing results
back to the Node.js backend REST API.

This closes the loop:
  AI Service processes document
    → calls PATCH /api/documents/:id/status
    → backend DB updated
    → frontend poll gets real state

Design:
- 3 retries with exponential backoff
- If all retries fail: log error, do NOT crash the AI pipeline
- Never silently return fake results
"""

import os
import asyncio
from typing import Any, Dict, Optional
from loguru import logger

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False
    logger.warning("httpx not available — backend callbacks will be skipped")

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")
INTERNAL_SERVICE_KEY = os.getenv("INTERNAL_SERVICE_KEY", "internal-service-key-dev")

MAX_RETRIES = 3
BASE_DELAY = 1.0  # seconds


async def patch_document_status(
    document_id: str,
    processing_status: str,
    extracted_text: Optional[str] = None,
    extracted_data: Optional[Dict[str, Any]] = None,
    ocr_used: bool = False,
    confidence: float = 0.0,
    error_message: Optional[str] = None,
) -> bool:
    """
    Notify the backend that a document's processing status has changed.
    Called at each stage of the AI pipeline.

    Processing states (Spec §26):
      UPLOADED → PROCESSING → OCR_COMPLETED → PARSING →
      EXTRACTION_COMPLETED → EMBEDDING → ANALYZING →
      VERIFICATION_COMPLETED → READY_FOR_REVIEW → FAILED
    """
    if not HTTPX_AVAILABLE:
        logger.debug(f"[callback skip] Document {document_id}: {processing_status}")
        return True

    url = f"{BACKEND_URL}/api/documents/{document_id}/status"
    payload: Dict[str, Any] = {
        "processingStatus": processing_status,
        "ocrUsed": ocr_used,
        "confidence": confidence,
    }

    if extracted_text is not None:
        payload["extractedText"] = extracted_text[:20000]  # cap at 20K chars
    if extracted_data is not None:
        payload["extractedData"] = extracted_data
    if error_message is not None:
        payload["errorMessage"] = error_message

    headers = {
        "X-Internal-Service-Key": INTERNAL_SERVICE_KEY,
        "Content-Type": "application/json",
    }

    for attempt in range(MAX_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.patch(url, json=payload, headers=headers)
                if response.status_code in (200, 204):
                    logger.debug(
                        f"Document {document_id} status → {processing_status} [OK]"
                    )
                    return True
                else:
                    logger.warning(
                        f"Backend callback returned {response.status_code} "
                        f"for document {document_id} (attempt {attempt + 1})"
                    )
        except Exception as e:
            logger.warning(
                f"Backend callback attempt {attempt + 1} failed "
                f"for document {document_id}: {e}"
            )

        if attempt < MAX_RETRIES - 1:
            await asyncio.sleep(BASE_DELAY * (2 ** attempt))

    logger.error(
        f"Backend callback failed after {MAX_RETRIES} attempts "
        f"for document {document_id} — status: {processing_status}"
    )
    return False


async def notify_processing_failed(
    document_id: str,
    stage: str,
    error: str,
) -> None:
    """
    Report a processing failure to the backend.
    Spec §28: "Never silently return fake results."
    """
    await patch_document_status(
        document_id=document_id,
        processing_status="FAILED",
        error_message=f"Failed at stage [{stage}]: {error}",
    )
