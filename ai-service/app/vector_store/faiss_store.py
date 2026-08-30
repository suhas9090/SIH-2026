"""
FAISS Vector Store
Manages embeddings for: procurement knowledge, tender requirements, bidder evidence.
"""

import os
import json
import numpy as np
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from loguru import logger

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    logger.warning("FAISS not available. Vector search will use demo mode.")

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = bool(os.getenv("GEMINI_API_KEY"))
except ImportError:
    GEMINI_AVAILABLE = False

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "models/text-embedding-004")
EMBEDDING_DIM = 768  # Gemini text-embedding-004 dimension
FAISS_INDEX_PATH = Path(os.getenv("FAISS_INDEX_PATH", "./data/faiss_index"))

# In-memory stores
_knowledge_index: Optional[object] = None
_knowledge_metadata: List[Dict] = []
_requirement_index: Optional[object] = None
_requirement_metadata: List[Dict] = []


async def initialize_faiss():
    """Initialize or load FAISS indexes."""
    global _knowledge_index, _knowledge_metadata
    
    if not FAISS_AVAILABLE:
        logger.warning("FAISS not available. Running without vector search.")
        return
    
    FAISS_INDEX_PATH.mkdir(parents=True, exist_ok=True)
    
    knowledge_index_file = FAISS_INDEX_PATH / "knowledge.index"
    knowledge_meta_file = FAISS_INDEX_PATH / "knowledge_meta.json"
    
    if knowledge_index_file.exists():
        try:
            _knowledge_index = faiss.read_index(str(knowledge_index_file))
            with open(knowledge_meta_file) as f:
                _knowledge_metadata = json.load(f)
            logger.info(f"Loaded knowledge FAISS index with {_knowledge_index.ntotal} vectors")
        except Exception as e:
            logger.error(f"Failed to load FAISS index: {e}")
            _knowledge_index = _create_new_index()
    else:
        _knowledge_index = _create_new_index()
        logger.info("Created new FAISS knowledge index")
        # Load demo knowledge base
        await _load_demo_knowledge()


def _create_new_index():
    """Create a new flat L2 FAISS index."""
    if not FAISS_AVAILABLE:
        return None
    return faiss.IndexFlatL2(EMBEDDING_DIM)


async def get_embedding(text: str) -> Optional[np.ndarray]:
    """Get embedding vector for text using Gemini API."""
    if not GEMINI_AVAILABLE:
        # Return random demo embedding
        return np.random.rand(EMBEDDING_DIM).astype(np.float32)
    
    try:
        result = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=text,
            task_type="retrieval_document"
        )
        return np.array(result['embedding'], dtype=np.float32)
    except Exception as e:
        logger.error(f"Embedding error: {e}")
        return np.random.rand(EMBEDDING_DIM).astype(np.float32)


async def add_to_knowledge_base(chunks: List[Dict]) -> int:
    """Add text chunks to the knowledge FAISS index."""
    global _knowledge_index, _knowledge_metadata
    
    if not FAISS_AVAILABLE or _knowledge_index is None:
        return 0
    
    embeddings = []
    for chunk in chunks:
        emb = await get_embedding(chunk.get("text", ""))
        if emb is not None:
            embeddings.append(emb)
            _knowledge_metadata.append(chunk)
    
    if embeddings:
        embeddings_array = np.vstack(embeddings)
        _knowledge_index.add(embeddings_array)
        _save_knowledge_index()
    
    return len(embeddings)


async def search_knowledge(query: str, top_k: int = 5) -> List[Dict]:
    """Search knowledge base for relevant chunks."""
    global _knowledge_index, _knowledge_metadata
    
    if not FAISS_AVAILABLE or _knowledge_index is None or _knowledge_index.ntotal == 0:
        return _demo_search_results(query)
    
    query_emb = await get_embedding(query)
    if query_emb is None:
        return _demo_search_results(query)
    
    distances, indices = _knowledge_index.search(query_emb.reshape(1, -1), min(top_k, _knowledge_index.ntotal))
    
    results = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx < len(_knowledge_metadata) and idx >= 0:
            item = _knowledge_metadata[idx].copy()
            item["similarityScore"] = float(1 / (1 + dist))
            results.append(item)
    
    return results


async def compute_similarity(text1: str, text2: str) -> float:
    """Compute semantic similarity between two texts."""
    emb1 = await get_embedding(text1)
    emb2 = await get_embedding(text2)
    
    if emb1 is None or emb2 is None:
        return 0.5
    
    # Cosine similarity
    dot_product = np.dot(emb1, emb2)
    norm1 = np.linalg.norm(emb1)
    norm2 = np.linalg.norm(emb2)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    return float(dot_product / (norm1 * norm2))


def _save_knowledge_index():
    """Persist FAISS index to disk."""
    if not FAISS_AVAILABLE or _knowledge_index is None:
        return
    try:
        faiss.write_index(_knowledge_index, str(FAISS_INDEX_PATH / "knowledge.index"))
        with open(FAISS_INDEX_PATH / "knowledge_meta.json", "w") as f:
            json.dump(_knowledge_metadata, f)
    except Exception as e:
        logger.error(f"Failed to save FAISS index: {e}")


async def _load_demo_knowledge():
    """Load demo procurement knowledge into FAISS."""
    demo_chunks = [
        {
            "text": "Under GFR Rule 200, every government procuring entity must verify GST registration of bidders. Active GST status is mandatory for all suppliers to government.",
            "source": "GFR 2017",
            "section": "Rule 200 - Procurement norms",
            "category": "GST"
        },
        {
            "text": "MSME and Udyam registered enterprises are eligible for purchase preference under Public Procurement Policy for MSMEs 2012. Micro enterprises get 25% minimum share.",
            "source": "MSME Policy 2012",
            "section": "Purchase Preference",
            "category": "MSME"
        },
        {
            "text": "GeM portal requires all sellers to have valid GSTIN, PAN, and bank account details. Udyam registration is required to claim MSME benefits.",
            "source": "GeM Seller Guidelines",
            "section": "Eligibility Requirements",
            "category": "GeM"
        },
        {
            "text": "OEM authorization is required when a bidder is not the original manufacturer. The letter must specify the products, territory, and validity period.",
            "source": "GeM Procurement Guidelines",
            "section": "OEM Authorization",
            "category": "OEM"
        },
        {
            "text": "Make in India (MII) policy mandates minimum local content percentage for government procurement. Class I local suppliers have first preference when local content exceeds 50%.",
            "source": "Make in India Order 2017",
            "section": "Local Content Requirements",
            "category": "MakeInIndia"
        },
        {
            "text": "Financial eligibility: Minimum annual turnover requirements ensure bidders have financial capacity. Audited financial statements from Chartered Accountant are required.",
            "source": "GeM Procurement Rules",
            "section": "Financial Eligibility",
            "category": "Financial"
        },
        {
            "text": "Blacklisted or debarred companies cannot participate in government procurement. Checks must be done against Central Vigilance Commission (CVC) debarment list.",
            "source": "CVC Guidelines",
            "section": "Debarment and Blacklisting",
            "category": "Blacklisting"
        },
        {
            "text": "EPFO registration is mandatory for establishments with 20 or more employees. PF compliance is checked for labor law compliance in procurement.",
            "source": "EPF & MP Act 1952",
            "section": "EPFO Compliance",
            "category": "EPFO"
        }
    ]
    
    await add_to_knowledge_base(demo_chunks)
    logger.info(f"Loaded {len(demo_chunks)} demo knowledge chunks into FAISS")


def _demo_search_results(query: str) -> List[Dict]:
    """Return demo knowledge results when FAISS is not available."""
    query_lower = query.lower()
    
    if "gst" in query_lower:
        return [{"text": "Under GFR Rule 200, every government procuring entity must verify GST registration. Active GST status is mandatory.", "source": "GFR 2017", "similarityScore": 0.92}]
    if "msme" in query_lower or "udyam" in query_lower:
        return [{"text": "MSME and Udyam registered enterprises are eligible for purchase preference under MSME Policy 2012.", "source": "MSME Policy 2012", "similarityScore": 0.89}]
    if "oem" in query_lower:
        return [{"text": "OEM authorization must specify products, territory, and validity period.", "source": "GeM Guidelines", "similarityScore": 0.87}]
    if "blacklist" in query_lower or "debarr" in query_lower:
        return [{"text": "Blacklisted companies cannot participate in government procurement. CVC debarment list must be checked.", "source": "CVC Guidelines", "similarityScore": 0.91}]
    
    return [{"text": "Refer to GeM procurement guidelines and GFR 2017 for detailed eligibility and compliance requirements.", "source": "GeM Guidelines", "similarityScore": 0.65}]
