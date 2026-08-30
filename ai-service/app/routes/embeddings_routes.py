"""Embeddings route."""
from fastapi import APIRouter
from pydantic import BaseModel
from app.vector_store.faiss_store import get_embedding

router = APIRouter()

class EmbeddingRequest(BaseModel):
    text: str

@router.post("/generate")
async def generate_embedding(req: EmbeddingRequest):
    emb = await get_embedding(req.text)
    return {"embedding": emb.tolist() if emb is not None else [], "dimension": len(emb) if emb is not None else 0}
