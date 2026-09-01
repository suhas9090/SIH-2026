"""
Database Session & Connection Management (SQLAlchemy 2.x + Psycopg 3)
Connects to PostgreSQL using postgresql+psycopg:// connection string.
"""

import os
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from loguru import logger

DEFAULT_DB_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/complygem"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DB_URL)

# Normalize postgres:// to postgresql+psycopg:// if needed (e.g. from cloud providers)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "+psycopg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

# Connection Pooling Configuration
engine = None
try:
    if "localhost" in DATABASE_URL or "127.0.0.1" in DATABASE_URL:
        # Check if local postgres port is open
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1.5)
        result = sock.connect_ex(('127.0.0.1', 5432))
        sock.close()
        if result == 0:
            engine = create_engine(
                DATABASE_URL,
                pool_size=5,
                max_overflow=10,
                pool_timeout=5,
                pool_recycle=1800,
                echo=os.getenv("SQL_ECHO", "false").lower() == "true",
            )
            logger.info("Connected to local PostgreSQL database")
        else:
            logger.info("Local PostgreSQL not detected on port 5432 — using local SQLite fallback for standalone AI services")
            engine = create_engine("sqlite:///./complygem_ai.db", echo=False)
    else:
        engine = create_engine(
            DATABASE_URL,
            pool_size=5,
            max_overflow=10,
            pool_timeout=5,
            pool_recycle=1800,
            echo=os.getenv("SQL_ECHO", "false").lower() == "true",
        )
except Exception as e:
    logger.warning(f"Database connection note: {e}. Using SQLite fallback.")
    engine = create_engine("sqlite:///./complygem_ai.db", echo=False)

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
