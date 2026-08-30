"""FastAPI health check route."""
from fastapi import APIRouter
import os

router = APIRouter()

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ComplyGeM AI Service",
        "version": "1.0.0",
        "geminiConfigured": bool(os.getenv("GEMINI_API_KEY")),
        "demoMode": os.getenv("DEMO_MODE", "true")
    }
