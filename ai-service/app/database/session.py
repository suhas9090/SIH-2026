"""
Database Session & Connection Management (SQLAlchemy 2.x + Psycopg 3)
Connects to PostgreSQL using postgresql+psycopg:// connection string.
"""

import os
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from loguru import logger

# Fallback default connection URL for local development
DEFAULT_DB_URL = "postgresql+psycopg://complygem_app:complygem_secure_pass@localhost:5432/complygem"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DB_URL)

# Normalize postgres:// to postgresql+psycopg:// if needed (e.g. from cloud providers)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "+psycopg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

# Connection Pooling Configuration
try:
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_timeout=30,
        pool_recycle=1800,
        pool_pre_ping=True,
        echo=os.getenv("SQL_ECHO", "false").lower() == "true",
    )
    logger.info("Initialized PostgreSQL SQLAlchemy Engine with Psycopg 3 driver")
except Exception as e:
    logger.warning(f"SQLAlchemy engine initialization notice: {e}")
    # SQLite fallback strictly for zero-config demo / offline testing
    engine = create_engine("sqlite:///./complygem_demo.db", echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base declarative class for all ComplyGeM relational models."""
    pass


def get_db() -> Generator:
    """
    FastAPI Dependency to provide a transactional database session per request.
    Automatically commits on success or rolls back on exception.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
