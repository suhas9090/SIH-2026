"""FastAPI routes for requirement extraction."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from loguru import logger

from app.llm.gemini_client import extract_requirements_from_text
from app.vector_store.faiss_store import get_embedding, add_to_knowledge_base

router = APIRouter()


class RequirementExtractionRequest(BaseModel):
    documentId: str
    tenderId: str
    text: str
    context: Optional[str] = ""


class RequirementExtractionResponse(BaseModel):
    tenderId: str
    requirements: List[dict]
    totalFound: int
    documentType: str = "TENDER"
    note: Optional[str] = None


@router.post("/extract-requirements", response_model=RequirementExtractionResponse)
async def extract_requirements(request: RequirementExtractionRequest):
    """
    NLP + LLM pipeline to extract structured requirements from tender text.
    Returns structured JSON — LLM output is always structured, never free-form.
    """
    logger.info(f"Extracting requirements for tender: {request.tenderId}")

    try:
        result = await extract_requirements_from_text(request.text, request.context)

        requirements = result.get("requirements", [])

        # Store requirements as embeddings for later evidence matching
        if requirements:
            req_chunks = [
                {
                    "text": f"{r.get('title', '')}: {r.get('description', '')}",
                    "source": f"requirement:tender:{request.tenderId}",
                    "requirementId": None,  # Will be assigned by backend
                    "category": r.get("category"),
                    "tenderId": request.tenderId
                }
                for r in requirements
            ]
            await add_to_knowledge_base(req_chunks)

        return RequirementExtractionResponse(
            tenderId=request.tenderId,
            requirements=requirements,
            totalFound=result.get("totalFound", len(requirements)),
            documentType=result.get("documentType", "TENDER"),
            note=result.get("note")
        )
    except Exception as e:
        logger.error(f"Requirement extraction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
