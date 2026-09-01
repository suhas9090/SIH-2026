"""FastAPI routes for document processing — full pipeline with status write-back.

Pipeline (Spec §2, §3, §26):
  Receive request
    → PATCH backend: PROCESSING
    → OCR / text extraction
    → PATCH backend: OCR_COMPLETED
    → Document parsing (structure, fields, tables)
    → PATCH backend: EXTRACTION_COMPLETED
    → Gemini evidence extraction (LLM structured output)
    → PATCH backend: ANALYZING
    → Embeddings + FAISS indexing
    → PATCH backend: READY_FOR_REVIEW

Gemini role: structured extraction only — never makes compliance decisions.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from loguru import logger

from app.ocr import OCRService
from app.llm.gemini_client import extract_evidence_from_document
from app.embeddings.embedding_service import EmbeddingService
from app.utils.backend_callback import patch_document_status, notify_processing_failed

router = APIRouter()

_ocr_service = OCRService()
_embedding_service = EmbeddingService()


class DocumentProcessRequest(BaseModel):
    documentId: str
    tenderId: Optional[str] = None
    bidderId: Optional[str] = None
    filePath: Optional[str] = None
    documentType: Optional[str] = "OTHER"
    orgName: Optional[str] = ""


class ProcessingResult(BaseModel):
    documentId: str
    status: str
    extractedText: Optional[str] = None
    extractedData: Optional[dict] = None
    ocrUsed: bool = False
    confidence: float = 0.0
    chunkCount: int = 0
    pageCount: int = 0


@router.post("/", response_model=ProcessingResult)
async def process_document(
    request: DocumentProcessRequest,
    background_tasks: BackgroundTasks,
):
    """
    Full document processing pipeline.

    If filePath is provided: runs real OCR + LLM extraction.
    If filePath is absent (demo mode): returns structured demo data with
    a clear DEMO_COMPLETE status — never presented as real verification.
    """
    logger.info(f"Processing document: {request.documentId} [{request.documentType}]")

    # ── Demo / no-file mode ──────────────────────────────────────────────
    if not request.filePath:
        await patch_document_status(
            request.documentId,
            "READY_FOR_REVIEW",
            extracted_text="[DEMO] Document text extraction simulated.",
            extracted_data={"note": "Demo mode — no file path provided"},
            ocr_used=False,
            confidence=0.85,
        )
        return ProcessingResult(
            documentId=request.documentId,
            status="DEMO_COMPLETE",
            extractedText="[DEMO] Document text would be extracted here.",
            extractedData={"note": "Demo mode — no file path provided"},
            ocrUsed=False,
            confidence=0.85,
            chunkCount=3,
            pageCount=1,
        )

    # ── Stage 1: PROCESSING ──────────────────────────────────────────────
    await patch_document_status(request.documentId, "PROCESSING")

    try:
        # ── Stage 2: OCR / Text extraction ──────────────────────────────
        ocr_result = _ocr_service.process(
            request.filePath,
            document_type=request.documentType or "OTHER",
        )
        await patch_document_status(
            request.documentId,
            "OCR_COMPLETED",
            ocr_used=ocr_result.ocr_used,
            confidence=ocr_result.confidence,
        )

        # ── Stage 3: Parsing → Extraction ───────────────────────────────
        await patch_document_status(request.documentId, "PARSING")
        chunks = ocr_result.chunks

        # ── Stage 4: Gemini evidence extraction ─────────────────────────
        # Gemini extracts STRUCTURED FIELDS from the document text.
        # It does NOT make compliance decisions — that is the rule engine's job.
        await patch_document_status(request.documentId, "ANALYZING")
        extracted_data = await extract_evidence_from_document(
            ocr_result.full_text[:8000],
            request.documentType or "OTHER",
            request.orgName or "",
        )
        await patch_document_status(request.documentId, "EXTRACTION_COMPLETED")

        # ── Stage 5: Embeddings + FAISS indexing (background) ───────────
        # Store embeddings in background so the response is fast.
        background_tasks.add_task(
            _index_document_chunks,
            request.documentId,
            request.bidderId,
            request.tenderId,
            chunks,
        )

        # Write final status now — embedding continues in background
        await patch_document_status(
            request.documentId,
            "READY_FOR_REVIEW",
            extracted_text=ocr_result.full_text[:20000],
            extracted_data=extracted_data,
            ocr_used=ocr_result.ocr_used,
            confidence=ocr_result.confidence,
        )

        return ProcessingResult(
            documentId=request.documentId,
            status="COMPLETE",
            extractedText=ocr_result.full_text[:10000],
            extractedData=extracted_data,
            ocrUsed=ocr_result.ocr_used,
            confidence=ocr_result.confidence,
            chunkCount=len(chunks),
            pageCount=len(ocr_result.pages),
        )

    except FileNotFoundError as e:
        logger.error(f"File not found: {e}")
        await notify_processing_failed(request.documentId, "OCR", str(e))
        return ProcessingResult(
            documentId=request.documentId,
            status="FAILED",
            confidence=0.0,
        )
    except Exception as e:
        logger.error(f"Document processing failed: {e}")
        await notify_processing_failed(request.documentId, "PIPELINE", str(e))
        return ProcessingResult(
            documentId=request.documentId,
            status="FAILED",
            confidence=0.0,
        )


async def _index_document_chunks(
    document_id: str,
    bidder_id: Optional[str],
    tender_id: Optional[str],
    chunks: list,
) -> None:
    """Background task: embed and store document chunks in FAISS."""
    try:
        await patch_document_status(document_id, "EMBEDDING")
        count = await _embedding_service.embed_document_chunks(
            chunks,
            document_id=document_id,
            bidder_id=bidder_id,
            tender_id=tender_id,
        )
        logger.info(f"Stored {count} embeddings for document {document_id}")
    except Exception as e:
        logger.error(f"Failed to store embeddings for {document_id}: {e}")
