"""
ComplyGeM AI Service — FastAPI Application
Handles all AI/ML processing: OCR, PDF parsing, NLP, LLM, embeddings, RAG, FAISS,
and connects to the PostgreSQL 18 relational database via SQLAlchemy 2.x & Psycopg 3.
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from loguru import logger

load_dotenv()

# Import database initializer
from app.database.seed_data import init_db, seed_demo_data

# Import routers
from app.routes import documents, requirements, bidder_analysis, embeddings_routes, rag_routes, health

app = FastAPI(
    title="ComplyGeM AI Service",
    description="AI processing engine for bid compliance verification connected to PostgreSQL 18 and Firebase",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health.router, tags=["Health"])
app.include_router(documents.router, prefix="/process-document", tags=["Document Processing"])
app.include_router(requirements.router, tags=["Requirements"])
app.include_router(bidder_analysis.router, tags=["Bidder Analysis"])
app.include_router(embeddings_routes.router, prefix="/embeddings", tags=["Embeddings"])
app.include_router(rag_routes.router, prefix="/rag", tags=["RAG"])


@app.on_event("startup")
async def startup_event():
    logger.info("ComplyGeM AI Service starting up...")
    logger.info(f"Demo Mode: {os.getenv('DEMO_MODE', 'true')}")
    logger.info(f"Gemini Model: {os.getenv('GEMINI_MODEL', 'gemini-1.5-pro')}")

    # 1. Initialize PostgreSQL Database Schema & Seed Data
    try:
        init_db()
        seed_demo_data()
        logger.info("PostgreSQL database tables initialized & verified")
    except Exception as e:
        logger.warning(f"Database startup initialization note: {e}")

    # 2. Initialize FAISS Vector Index
    from app.vector_store.faiss_store import initialize_faiss
    await initialize_faiss()
    logger.info("FAISS vector store initialized")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("ComplyGeM AI Service shutting down...")
