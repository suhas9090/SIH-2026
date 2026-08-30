"""Health check and RAG/embeddings routes."""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os

from app.vector_store.faiss_store import search_knowledge, get_embedding, add_to_knowledge_base

health_router = APIRouter()
embeddings_router = APIRouter()
rag_router = APIRouter()


# Health
@health_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ComplyGeM AI Service",
        "version": "1.0.0",
        "gemini": bool(os.getenv("GEMINI_API_KEY")),
        "demoMode": os.getenv("DEMO_MODE", "true")
    }


# Embeddings
class EmbeddingRequest(BaseModel):
    text: str


@embeddings_router.post("/generate")
async def generate_embedding(req: EmbeddingRequest):
    emb = await get_embedding(req.text)
    return {"embedding": emb.tolist() if emb is not None else [], "dimension": len(emb) if emb is not None else 0}


# RAG
class RAGSearchRequest(BaseModel):
    query: str
    topK: Optional[int] = 5


@rag_router.post("/search")
async def rag_search(req: RAGSearchRequest):
    results = await search_knowledge(req.query, req.topK or 5)
    return {"results": results, "count": len(results)}


class KnowledgeAddRequest(BaseModel):
    chunks: List[Dict[str, Any]]


@rag_router.post("/add-knowledge")
async def add_knowledge(req: KnowledgeAddRequest):
    count = await add_to_knowledge_base(req.chunks)
    return {"added": count, "message": f"Added {count} chunks to knowledge base"}
