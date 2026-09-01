"""
Evidence Matcher (Spec §8, §9)

Implements the RAG retrieval step:
  Requirement → Embedding → FAISS Search → Retrieved Evidence Chunks
  → Structured EvidenceMatch objects

This is the RETRIEVAL component of RAG.
The LLM reasoning step happens AFTER this, using the retrieved evidence as context.

The matcher never makes compliance decisions.
It only finds the most relevant evidence for each requirement.
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
from loguru import logger

from app.vector_store.faiss_store import search_knowledge, compute_similarity, get_embedding


@dataclass
class EvidenceMatch:
    """
    Structured evidence match — every compliance finding must be traceable
    to a specific document, page, and text excerpt (Spec §3, §13).
    """
    field: Optional[str]           # e.g. "annualTurnover", "gstin", "status"
    value: Optional[str]           # extracted value
    source_document: Optional[str] # document name / ID
    page_number: Optional[int]     # page where evidence was found
    text_excerpt: Optional[str]    # actual text from the document
    confidence: float              # semantic similarity score 0.0–1.0
    requirement_id: Optional[str]  # which requirement this matches
    chunk_index: Optional[int]     # chunk within document


class EvidenceMatcher:
    """
    Finds the most relevant evidence for each tender requirement by
    semantic vector search over indexed bidder document chunks.
    """

    async def match_requirement(
        self,
        requirement: Dict[str, Any],
        top_k: int = 5,
    ) -> List[EvidenceMatch]:
        """
        For a single requirement, search the FAISS index for the most
        semantically similar document chunks.

        Returns: ranked list of EvidenceMatch objects.
        """
        req_text = f"{requirement.get('title', '')}: {requirement.get('description', '')}"
        req_id = requirement.get("id")

        logger.debug(f"Matching evidence for requirement: {req_text[:80]}...")

        try:
            chunks = await search_knowledge(req_text, top_k=top_k)
        except Exception as e:
            logger.error(f"FAISS search failed for requirement {req_id}: {e}")
            return []

        matches = []
        for chunk in chunks:
            match = EvidenceMatch(
                field=self._infer_field(requirement, chunk),
                value=chunk.get("extractedValue"),
                source_document=chunk.get("documentId") or chunk.get("source"),
                page_number=chunk.get("pageNumber"),
                text_excerpt=chunk.get("text", "")[:400],
                confidence=chunk.get("similarityScore", 0.0),
                requirement_id=req_id,
                chunk_index=chunk.get("chunkIndex"),
            )
            matches.append(match)

        return matches

    async def match_all_requirements(
        self,
        requirements: List[Dict[str, Any]],
        top_k: int = 3,
    ) -> Dict[str, List[EvidenceMatch]]:
        """
        Match evidence for all requirements in a batch.
        Returns: {requirement_id: [EvidenceMatch, ...]}
        """
        results = {}
        for req in requirements:
            req_id = req.get("id")
            if not req_id:
                continue
            matches = await self.match_requirement(req, top_k=top_k)
            results[req_id] = matches
        return results

    async def compute_semantic_similarity(
        self,
        requirement_text: str,
        evidence_text: str,
    ) -> float:
        """
        Compute semantic similarity between a requirement description and
        a piece of evidence text.
        Used by the compliance engine to confirm evidence relevance.
        """
        try:
            return await compute_similarity(requirement_text, evidence_text)
        except Exception as e:
            logger.error(f"Similarity computation failed: {e}")
            return 0.0

    def best_match(self, matches: List[EvidenceMatch]) -> Optional[EvidenceMatch]:
        """Return the highest-confidence match from a list."""
        if not matches:
            return None
        return max(matches, key=lambda m: m.confidence)

    def to_dict_list(self, matches: List[EvidenceMatch]) -> List[Dict[str, Any]]:
        """Serialize EvidenceMatch list for API responses."""
        return [asdict(m) for m in matches]

    def _infer_field(
        self,
        requirement: Dict[str, Any],
        chunk: Dict[str, Any],
    ) -> Optional[str]:
        """
        Infer which field of the document this chunk likely contains,
        based on the requirement category.
        """
        category = requirement.get("category", "").upper()
        field_map = {
            "FINANCIAL":    "annualTurnover",
            "TAX":          "gstin",
            "REGISTRATION": "registrationNumber",
            "MSME_UDYAM":   "udyamNo",
            "OEM":          "oemAuthorizationRef",
            "EXPERIENCE":   "yearsOfExperience",
            "EPFO":         "pfRegistrationNo",
            "BLACKLISTING": "blacklistStatus",
        }
        return field_map.get(category)
