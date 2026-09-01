"""
Embedding Service (Spec §7)

Wraps the FAISS store's get_embedding() with:
- Retry logic on API failure
- Batch processing
- Consistent metadata envelope for provenance tracing

Every embedding carries metadata so retrieved chunks can be traced back
to the exact document, page, and chunk they came from.
"""

import asyncio
from typing import List, Dict, Any, Optional
from loguru import logger

from app.vector_store.faiss_store import get_embedding, add_to_knowledge_base


class EmbeddingService:
    """
    Generates and stores embeddings for:
    - Tender requirement text
    - Bidder document chunks
    - Extracted evidence fields
    - Knowledge base / procurement policy documents

    This is the embeddings layer described in the architecture spec.
    It feeds the FAISS vector store which is then queried by the RAG pipeline.
    """

    MAX_RETRIES = 3
    RETRY_DELAY = 1.0  # seconds

    async def embed_text(self, text: str) -> Optional[List[float]]:
        """
        Generate an embedding for a single text with retry.
        Returns a float list (768-dim for Gemini text-embedding-004).
        """
        for attempt in range(self.MAX_RETRIES):
            try:
                emb = await get_embedding(text)
                if emb is not None:
                    return emb.tolist()
            except Exception as e:
                logger.warning(f"Embedding attempt {attempt + 1} failed: {e}")
                if attempt < self.MAX_RETRIES - 1:
                    await asyncio.sleep(self.RETRY_DELAY * (attempt + 1))
        logger.error(f"Embedding failed after {self.MAX_RETRIES} attempts")
        return None

    async def embed_document_chunks(
        self,
        chunks: List[Dict[str, Any]],
        document_id: str,
        bidder_id: Optional[str] = None,
        tender_id: Optional[str] = None,
    ) -> int:
        """
        Embed and store document chunks in FAISS.
        Each chunk carries a metadata envelope for evidence tracing.

        Returns the number of chunks successfully indexed.
        """
        enriched = []
        for chunk in chunks:
            enriched.append({
                "text": chunk.get("text", ""),
                "documentId": document_id,
                "bidderId": bidder_id,
                "tenderId": tender_id,
                "chunkIndex": chunk.get("chunkIndex", 0),
                "pageNumber": chunk.get("pageNumber"),
                "source": f"document:{document_id}",
                "sourceType": "BIDDER_DOCUMENT",
            })

        if not enriched:
            return 0

        try:
            count = await add_to_knowledge_base(enriched)
            logger.info(f"Indexed {count} chunks for document {document_id}")
            return count
        except Exception as e:
            logger.error(f"Failed to index chunks for document {document_id}: {e}")
            return 0

    async def embed_requirements(
        self,
        requirements: List[Dict[str, Any]],
        tender_id: str,
    ) -> int:
        """
        Embed and store tender requirements in FAISS so they can be retrieved
        during evidence matching for a bidder's documents.
        """
        chunks = []
        for req in requirements:
            text = f"{req.get('title', '')}: {req.get('description', '')}"
            chunks.append({
                "text": text,
                "tenderId": tender_id,
                "requirementId": req.get("id"),
                "requirementCategory": req.get("category"),
                "source": f"requirement:tender:{tender_id}",
                "sourceType": "TENDER_REQUIREMENT",
            })

        if not chunks:
            return 0

        try:
            count = await add_to_knowledge_base(chunks)
            logger.info(f"Indexed {count} requirements for tender {tender_id}")
            return count
        except Exception as e:
            logger.error(f"Failed to index requirements for tender {tender_id}: {e}")
            return 0
