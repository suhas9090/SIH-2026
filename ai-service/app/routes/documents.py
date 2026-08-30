"""FastAPI routes for document processing."""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from loguru import logger

from app.parser.pdf_parser import extract_text_from_file, chunk_text
from app.llm.gemini_client import extract_evidence_from_document
from app.vector_store.faiss_store import get_embedding, add_to_knowledge_base

router = APIRouter()


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


@router.post("/", response_model=ProcessingResult)
async def process_document(request: DocumentProcessRequest, background_tasks: BackgroundTasks):
    """
    Full document processing pipeline:
    PDF/Image -> Text extraction/OCR -> Cleaning -> Chunking -> LLM extraction -> Embeddings
    """
    logger.info(f"Processing document: {request.documentId}")

    if not request.filePath:
        # Demo mode: return structured demo data
        return ProcessingResult(
            documentId=request.documentId,
            status="DEMO_COMPLETE",
            extractedText="[DEMO] Document text would be extracted here.",
            extractedData={"note": "Demo mode - no file path provided"},
            ocrUsed=False,
            confidence=0.85,
            chunkCount=3
        )

    try:
        # Step 1: Extract text
        text, ocr_used, confidence = extract_text_from_file(request.filePath)

        # Step 2: Chunk text
        chunks = chunk_text(text)

        # Step 3: Extract structured data with LLM
        extracted_data = await extract_evidence_from_document(
            text[:8000],
            request.documentType or "OTHER",
            request.orgName or ""
        )

        # Step 4: Generate embeddings and store (background)
        background_tasks.add_task(
            _store_document_embeddings,
            request.documentId,
            chunks
        )

        return ProcessingResult(
            documentId=request.documentId,
            status="COMPLETE",
            extractedText=text[:10000],
            extractedData=extracted_data,
            ocrUsed=ocr_used,
            confidence=confidence,
            chunkCount=len(chunks)
        )
    except Exception as e:
        logger.error(f"Document processing failed: {e}")
        return ProcessingResult(
            documentId=request.documentId,
            status="FAILED",
            confidence=0.0,
            chunkCount=0
        )


async def _store_document_embeddings(document_id: str, chunks: list):
    """Background task: generate and store embeddings for document chunks."""
    try:
        enriched_chunks = [
            {**chunk, "documentId": document_id, "source": f"document:{document_id}"}
            for chunk in chunks
        ]
        count = await add_to_knowledge_base(enriched_chunks)
        logger.info(f"Stored {count} embeddings for document {document_id}")
    except Exception as e:
        logger.error(f"Failed to store embeddings: {e}")
