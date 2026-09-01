"""
OCR Service — Public Interface
Wraps the existing PDF parser + Tesseract pipeline.
Returns per-page structured output so evidence can be traced back to its source.
"""

from app.parser.pdf_parser import extract_text_from_file, chunk_text
from pathlib import Path
from typing import List, Dict, Any, Optional
from loguru import logger


class OCRResult:
    """Structured output from the OCR pipeline."""

    def __init__(
        self,
        full_text: str,
        ocr_used: bool,
        confidence: float,
        pages: List[Dict[str, Any]],
        chunks: List[Dict[str, Any]],
    ):
        self.full_text = full_text
        self.ocr_used = ocr_used
        self.confidence = confidence
        self.pages = pages          # [{page_number, text, confidence}]
        self.chunks = chunks        # [{chunkIndex, text, pageNumber}]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "fullText": self.full_text,
            "ocrUsed": self.ocr_used,
            "confidence": self.confidence,
            "pageCount": len(self.pages),
            "pages": self.pages,
            "chunks": self.chunks,
        }


class OCRService:
    """
    Single public entry point for all document text extraction.

    Usage:
        service = OCRService()
        result = service.process(file_path, document_type="GST_CERTIFICATE")
    """

    def process(
        self,
        file_path: str,
        document_type: str = "OTHER",
    ) -> OCRResult:
        """
        Extract text from a file using the appropriate method:
        - Digital PDF  → direct text extraction (PyMuPDF)
        - Scanned PDF  → page-by-page OCR (Tesseract)
        - Image file   → OCR (Tesseract)
        - Text file    → direct read

        Returns OCRResult with per-page breakdown preserved.
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"OCR input file not found: {file_path}")

        logger.info(f"OCRService processing: {path.name} [{document_type}]")

        # Delegate to the existing pipeline
        full_text, ocr_used, confidence = extract_text_from_file(file_path)

        # Parse per-page blocks from the page markers embedded by pdf_parser
        pages = self._parse_page_blocks(full_text, ocr_used, confidence)

        # Chunk for embeddings + RAG retrieval
        chunks = chunk_text(full_text)

        logger.info(
            f"OCR complete: {len(full_text)} chars, {len(pages)} pages, "
            f"ocr={ocr_used}, confidence={confidence:.2f}"
        )

        return OCRResult(
            full_text=full_text,
            ocr_used=ocr_used,
            confidence=confidence,
            pages=pages,
            chunks=chunks,
        )

    def _parse_page_blocks(
        self,
        full_text: str,
        ocr_used: bool,
        base_confidence: float,
    ) -> List[Dict[str, Any]]:
        """
        Split full text into per-page records using [Page N] markers
        inserted by pdf_parser.py.
        """
        import re

        # Split on [Page N] or [Page N - OCR] markers
        pattern = r"\[Page (\d+)(?:\s*-\s*OCR)?\]"
        parts = re.split(pattern, full_text)

        if len(parts) <= 1:
            # Single block — no page markers
            return [
                {
                    "page_number": 1,
                    "text": full_text.strip(),
                    "confidence": base_confidence,
                    "ocr_used": ocr_used,
                }
            ]

        pages = []
        # parts alternates: [prefix, page_num, text, page_num, text, ...]
        i = 1
        while i < len(parts) - 1:
            page_num = int(parts[i])
            text = parts[i + 1].strip()
            pages.append(
                {
                    "page_number": page_num,
                    "text": text,
                    "confidence": base_confidence,
                    "ocr_used": ocr_used,
                }
            )
            i += 2

        return pages
