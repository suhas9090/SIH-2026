"""
PDF Parser + OCR Pipeline
Determines whether to use text extraction or OCR.
Tesseract OCR is used for scanned documents/images.
"""

import io
import os
import re
from typing import Tuple, Optional
from pathlib import Path

try:
    import pymupdf as fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    try:
        import fitz
        PYMUPDF_AVAILABLE = True
    except ImportError:
        PYMUPDF_AVAILABLE = False

try:
    import pytesseract
    from PIL import Image
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False

from loguru import logger


def extract_text_from_file(file_path: str) -> Tuple[str, bool, float]:
    """
    Main entry point. Returns (text, ocr_used, confidence).
    
    Pipeline:
    1. Check if PDF has selectable text
    2. If yes -> use PDF text extraction
    3. If no -> use OCR
    """
    file_path = Path(file_path)
    
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")
    
    suffix = file_path.suffix.lower()
    
    if suffix == '.pdf':
        return _process_pdf(str(file_path))
    elif suffix in ['.jpg', '.jpeg', '.png', '.tiff', '.bmp', '.gif']:
        return _process_image(str(file_path))
    elif suffix in ['.txt']:
        text = file_path.read_text(encoding='utf-8', errors='ignore')
        return text, False, 1.0
    else:
        # Try PDF processing anyway
        try:
            return _process_pdf(str(file_path))
        except Exception:
            return "", False, 0.0


def _process_pdf(file_path: str) -> Tuple[str, bool, float]:
    """Process PDF: first try text extraction, fallback to OCR."""
    if not PYMUPDF_AVAILABLE:
        logger.warning("PyMuPDF not available. Attempting OCR fallback.")
        return _process_pdf_with_ocr(file_path)
    
    try:
        doc = fitz.open(file_path)
        text_pages = []
        has_text = False
        
        for page_num, page in enumerate(doc):
            text = page.get_text("text")
            clean = _clean_text(text)
            
            if len(clean.strip()) > 50:
                has_text = True
                text_pages.append(f"[Page {page_num + 1}]\n{clean}")
        
        if has_text:
            full_text = "\n\n".join(text_pages)
            logger.info(f"PDF text extraction successful: {len(full_text)} chars")
            return full_text, False, 0.95
        
        # No text found -> OCR
        logger.info("No selectable text found. Switching to OCR...")
        return _process_pdf_with_ocr(file_path)
    
    except Exception as e:
        logger.error(f"PDF processing error: {e}")
        return _process_pdf_with_ocr(file_path)


def _process_pdf_with_ocr(file_path: str) -> Tuple[str, bool, float]:
    """Convert PDF pages to images and OCR them."""
    if not PYMUPDF_AVAILABLE or not TESSERACT_AVAILABLE:
        return f"[OCR not available. File: {Path(file_path).name}]", True, 0.0
    
    try:
        doc = fitz.open(file_path)
        text_pages = []
        
        for page_num, page in enumerate(doc):
            mat = fitz.Matrix(2, 2)  # 2x zoom for better OCR
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_data))
            
            text = pytesseract.image_to_string(img, lang='eng', config='--psm 6')
            clean = _clean_text(text)
            text_pages.append(f"[Page {page_num + 1} - OCR]\n{clean}")
        
        full_text = "\n\n".join(text_pages)
        logger.info(f"OCR complete: {len(full_text)} chars from {len(text_pages)} pages")
        return full_text, True, 0.75
    
    except Exception as e:
        logger.error(f"OCR error: {e}")
        return f"[OCR failed: {str(e)}]", True, 0.0


def _process_image(file_path: str) -> Tuple[str, bool, float]:
    """OCR a single image file."""
    if not TESSERACT_AVAILABLE:
        return f"[OCR not available for image: {Path(file_path).name}]", True, 0.0
    
    try:
        img = Image.open(file_path)
        text = pytesseract.image_to_string(img, lang='eng', config='--psm 6')
        clean = _clean_text(text)
        return clean, True, 0.75
    except Exception as e:
        logger.error(f"Image OCR error: {e}")
        return f"[Image OCR failed: {str(e)}]", True, 0.0


def _clean_text(text: str) -> str:
    """Clean extracted text without altering numbers, dates, or legal content."""
    if not text:
        return ""
    
    # Normalize unicode
    text = text.encode('ascii', 'ignore').decode('ascii')
    
    # Fix common OCR errors
    text = re.sub(r'[^\S\n]+', ' ', text)  # Multiple spaces -> single
    text = re.sub(r'\n{3,}', '\n\n', text)  # Multiple newlines -> double
    text = re.sub(r'^\s+', '', text, flags=re.MULTILINE)  # Leading whitespace
    
    # Remove page headers/footers patterns (common in tender docs)
    text = re.sub(r'Page \d+ of \d+', '', text)
    
    return text.strip()


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list:
    """
    Split text into overlapping chunks for embedding and RAG.
    Preserves sentence boundaries.
    """
    if not text:
        return []
    
    # Split by double newlines (sections) first
    sections = text.split('\n\n')
    chunks = []
    current_chunk = ""
    chunk_idx = 0
    
    for section in sections:
        if len(current_chunk) + len(section) < chunk_size:
            current_chunk += section + "\n\n"
        else:
            if current_chunk.strip():
                chunks.append({
                    "chunkIndex": chunk_idx,
                    "text": current_chunk.strip(),
                    "pageNumber": _extract_page_number(current_chunk)
                })
                chunk_idx += 1
            
            # Keep overlap
            words = current_chunk.split()
            overlap_text = ' '.join(words[-overlap//10:]) if words else ""
            current_chunk = overlap_text + "\n\n" + section + "\n\n"
    
    if current_chunk.strip():
        chunks.append({
            "chunkIndex": chunk_idx,
            "text": current_chunk.strip(),
            "pageNumber": _extract_page_number(current_chunk)
        })
    
    return chunks


def _extract_page_number(text: str) -> Optional[int]:
    """Extract page number from chunk text."""
    match = re.search(r'\[Page (\d+)', text)
    return int(match.group(1)) if match else None
