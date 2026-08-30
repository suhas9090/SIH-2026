"""RAG route."""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.vector_store.faiss_store import search_knowledge, add_to_knowledge_base

router = APIRouter()

class RAGSearchRequest(BaseModel):
    query: str
    topK: Optional[int] = 5

@router.post("/search")
async def rag_search(req: RAGSearchRequest):
    results = await search_knowledge(req.query, req.topK or 5)
    return {"results": results, "count": len(results)}

class KnowledgeAddRequest(BaseModel):
    chunks: List[Dict[str, Any]]

@router.post("/add-knowledge")
async def add_knowledge(req: KnowledgeAddRequest):
    count = await add_to_knowledge_base(req.chunks)
    return {"added": count}
