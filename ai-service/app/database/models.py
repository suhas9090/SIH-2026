"""
SQLAlchemy 2.x Models for ComplyGeM AI (SIH26100)
Contains all 16 relational database tables with constraints, indexes, and JSONB fields.
"""

import uuid
from datetime import datetime
from typing import List, Optional, Any, Dict
from sqlalchemy import (
    String, Text, Boolean, Integer, Float, DateTime, ForeignKey, Index,
    CheckConstraint, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database.session import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


# =============================================================================
# 1. ORGANIZATIONS
# =============================================================================
class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    organization_type: Mapped[str] = mapped_column(String(50), nullable=False)  # MINISTRY, PSU, PRIVATE_COMPANY, MSME, STARTUP, OEM
    registration_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # CIN / GSTIN / UDYAM
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    users: Mapped[List["User"]] = relationship("User", back_populates="organization")
    tenders: Mapped[List["Tender"]] = relationship("Tender", back_populates="organization")


# =============================================================================
# 2. USERS (Application Profile linked via Firebase UID)
# =============================================================================
class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    firebase_uid: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    organization_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="bidder")  # admin, procurement_officer, reviewer, bidder
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")  # pending, approved, suspended, active
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    organization: Mapped[Optional["Organization"]] = relationship("Organization", back_populates="users")
    tenders_created: Mapped[List["Tender"]] = relationship("Tender", back_populates="procurement_officer")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user")


# =============================================================================
# 3. TENDERS
# =============================================================================
class Tender(Base):
    __tablename__ = "tenders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tender_reference: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)  # e.g. GEM/2026/B/1234567
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    organization_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    procurement_officer_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    estimated_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    publication_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    submission_deadline: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="DRAFT", index=True)  # DRAFT, PUBLISHED, OPEN, CLOSED, UNDER_EVALUATION, AWARDED, CANCELLED
    source: Mapped[str] = mapped_column(String(50), default="GEM_PORTAL")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    organization: Mapped[Optional["Organization"]] = relationship("Organization", back_populates="tenders")
    procurement_officer: Mapped[Optional["User"]] = relationship("User", back_populates="tenders_created")
    requirements: Mapped[List["TenderRequirement"]] = relationship("TenderRequirement", back_populates="tender", cascade="all, delete-orphan")
    bids: Mapped[List["Bid"]] = relationship("Bid", back_populates="tender", cascade="all, delete-orphan")
    review_assignments: Mapped[List["ReviewAssignment"]] = relationship("ReviewAssignment", back_populates="tender")


# =============================================================================
# 4. TENDER REQUIREMENTS (AI Extracted from Specs)
# =============================================================================
class TenderRequirement(Base):
    __tablename__ = "tender_requirements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tender_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenders.id", ondelete="CASCADE"), nullable=False, index=True)
    requirement_code: Mapped[str] = mapped_column(String(50), nullable=False)  # REQ_GST_01, REQ_FIN_TURNOVER
    requirement_text: Mapped[str] = mapped_column(Text, nullable=False)
    requirement_type: Mapped[str] = mapped_column(String(50), nullable=False)  # GST, PAN, UDYAM, FINANCIAL, OEM, EXPERIENCE, BLACKLISTING, LOCAL_CONTENT, EPFO
    mandatory: Mapped[bool] = mapped_column(Boolean, default=True)
    source_page: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    verification_method: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # GST_PORTAL, MCA21, UDYAM_API, DOCUMENT_MATCHING
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    tender: Mapped["Tender"] = relationship("Tender", back_populates="requirements")
    compliance_checks: Mapped[List["ComplianceCheck"]] = relationship("ComplianceCheck", back_populates="requirement")


# =============================================================================
# 5. BIDS
# =============================================================================
class Bid(Base):
    __tablename__ = "bids"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tender_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenders.id", ondelete="CASCADE"), nullable=False, index=True)
    bidder_organization_id: Mapped[str] = mapped_column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    submission_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="SUBMITTED", index=True)  # DRAFT, SUBMITTED, UNDER_REVIEW, COMPLIANT, NON_COMPLIANT, REJECTED
    overall_compliance_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 0 to 100
    risk_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # LOW, MEDIUM, HIGH, CRITICAL
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    tender: Mapped["Tender"] = relationship("Tender", back_populates="bids")
    bidder_organization: Mapped["Organization"] = relationship("Organization")
    documents: Mapped[List["BidDocument"]] = relationship("BidDocument", back_populates="bid", cascade="all, delete-orphan")
    government_verifications: Mapped[List["GovernmentVerification"]] = relationship("GovernmentVerification", back_populates="bid", cascade="all, delete-orphan")
    compliance_checks: Mapped[List["ComplianceCheck"]] = relationship("ComplianceCheck", back_populates="bid", cascade="all, delete-orphan")
    compliance_reports: Mapped[List["ComplianceReport"]] = relationship("ComplianceReport", back_populates="bid", cascade="all, delete-orphan")


# =============================================================================
# 6. BID DOCUMENTS (PDF stored in Firebase Storage, metadata in PostgreSQL)
# =============================================================================
class BidDocument(Base):
    __tablename__ = "bid_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    bid_id: Mapped[str] = mapped_column(String(36), ForeignKey("bids.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type: Mapped[str] = mapped_column(String(50), nullable=False)  # GST_CERTIFICATE, PAN_CARD, UDYAM_CERTIFICATE, FINANCIAL_STATEMENT, OEM_AUTHORIZATION
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)  # Firebase Storage path
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False, default="application/pdf")
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    uploaded_by: Mapped[str] = mapped_column(String(128), nullable=False)  # Firebase UID
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    processing_status: Mapped[str] = mapped_column(String(50), default="PENDING")  # PENDING, PROCESSING, COMPLETED, FAILED

    # Relationships
    bid: Mapped["Bid"] = relationship("Bid", back_populates="documents")
    extractions: Mapped[List["DocumentExtraction"]] = relationship("DocumentExtraction", back_populates="document", cascade="all, delete-orphan")


# =============================================================================
# 7. DOCUMENT EXTRACTIONS (OCR & NLP Structured Output)
# =============================================================================
class DocumentExtraction(Base):
    __tablename__ = "document_extractions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    document_id: Mapped[str] = mapped_column(String(36), ForeignKey("bid_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    ocr_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    structured_data: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    ocr_engine: Mapped[str] = mapped_column(String(50), default="PyMuPDF_Tesseract")
    confidence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    page_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    processing_status: Mapped[str] = mapped_column(String(50), default="COMPLETED")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    document: Mapped["BidDocument"] = relationship("BidDocument", back_populates="extractions")


# =============================================================================
# 8. GOVERNMENT VERIFICATIONS (GST, PAN, MCA, Udyam, Blacklist)
# =============================================================================
class GovernmentVerification(Base):
    __tablename__ = "government_verifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    bid_id: Mapped[str] = mapped_column(String(36), ForeignKey("bids.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("bid_documents.id", ondelete="SET NULL"), nullable=True)
    verification_type: Mapped[str] = mapped_column(String(50), nullable=False)  # GST, PAN, UDYAM, MCA, EPFO, ESIC, BLACKLIST
    reference_number: Mapped[str] = mapped_column(String(100), nullable=False)
    source: Mapped[str] = mapped_column(String(100), nullable=False)  # GST_PORTAL, IT_DEPT, UDYAM_API, CVC_BLACKLIST
    request_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    response_timestamp: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="PENDING")  # VERIFIED, NOT_VERIFIED, MISMATCH, UNAVAILABLE, PENDING, MANUAL_REVIEW, DEMO_VERIFIED
    response_data: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    bid: Mapped["Bid"] = relationship("Bid", back_populates="government_verifications")


# =============================================================================
# 9. COMPLIANCE CHECKS (Requirement + Bid + Verification Mapping)
# =============================================================================
class ComplianceCheck(Base):
    __tablename__ = "compliance_checks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    bid_id: Mapped[str] = mapped_column(String(36), ForeignKey("bids.id", ondelete="CASCADE"), nullable=False, index=True)
    requirement_id: Mapped[str] = mapped_column(String(36), ForeignKey("tender_requirements.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False)  # COMPLIANT, NON_COMPLIANT, MISSING, INCONSISTENT, MANUAL_REVIEW
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    bid: Mapped["Bid"] = relationship("Bid", back_populates="compliance_checks")
    requirement: Mapped["TenderRequirement"] = relationship("TenderRequirement", back_populates="compliance_checks")
    evidence_items: Mapped[List["Evidence"]] = relationship("Evidence", back_populates="compliance_check", cascade="all, delete-orphan")
    decisions: Mapped[List["ReviewDecision"]] = relationship("ReviewDecision", back_populates="compliance_check")


# =============================================================================
# 10. EVIDENCE (Explainable AI Citations)
# =============================================================================
class Evidence(Base):
    __tablename__ = "evidence"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    compliance_check_id: Mapped[str] = mapped_column(String(36), ForeignKey("compliance_checks.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("bid_documents.id", ondelete="SET NULL"), nullable=True)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)  # DOCUMENT, PORTAL_API, RAG_GUIDELINE
    page_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    text_excerpt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    evidence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    compliance_check: Mapped["ComplianceCheck"] = relationship("ComplianceCheck", back_populates="evidence_items")


# =============================================================================
# 11. REVIEW ASSIGNMENTS
# =============================================================================
class ReviewAssignment(Base):
    __tablename__ = "review_assignments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tender_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenders.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assigned_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    status: Mapped[str] = mapped_column(String(50), default="ASSIGNED")  # ASSIGNED, IN_PROGRESS, COMPLETED

    # Relationships
    tender: Mapped["Tender"] = relationship("Tender", back_populates="review_assignments")


# =============================================================================
# 12. REVIEW DECISIONS (Human-in-the-Loop Override & Decision)
# =============================================================================
class ReviewDecision(Base):
    __tablename__ = "review_decisions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    compliance_check_id: Mapped[str] = mapped_column(String(36), ForeignKey("compliance_checks.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    decision: Mapped[str] = mapped_column(String(50), nullable=False)  # APPROVED, REJECTED, REQUEST_CLARIFICATION, OVERRIDE_AI
    comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    compliance_check: Mapped["ComplianceCheck"] = relationship("ComplianceCheck", back_populates="decisions")


# =============================================================================
# 13. COMPLIANCE REPORTS
# =============================================================================
class ComplianceReport(Base):
    __tablename__ = "compliance_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    bid_id: Mapped[str] = mapped_column(String(36), ForeignKey("bids.id", ondelete="CASCADE"), nullable=False, index=True)
    generated_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    overall_score: Mapped[float] = mapped_column(Float, nullable=False)
    compliant_count: Mapped[int] = mapped_column(Integer, default=0)
    non_compliant_count: Mapped[int] = mapped_column(Integer, default=0)
    missing_count: Mapped[int] = mapped_column(Integer, default=0)
    inconsistent_count: Mapped[int] = mapped_column(Integer, default=0)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    report_storage_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    bid: Mapped["Bid"] = relationship("Bid", back_populates="compliance_reports")


# =============================================================================
# 14. AI PROCESSING JOBS (Async Job Tracker for OCR/NLP/RAG/Embedding)
# =============================================================================
class AIProcessingJob(Base):
    __tablename__ = "ai_processing_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    bid_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("bids.id", ondelete="CASCADE"), nullable=True)
    document_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("bid_documents.id", ondelete="CASCADE"), nullable=True)
    job_type: Mapped[str] = mapped_column(String(50), nullable=False)  # OCR, REQUIREMENT_EXTRACTION, ENTITY_EXTRACTION, EMBEDDING, EVIDENCE_MATCHING, COMPLIANCE_ANALYSIS, REPORT_GENERATION
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="QUEUED")  # QUEUED, PROCESSING, COMPLETED, FAILED
    model_name: Mapped[str] = mapped_column(String(100), default="gemini-1.5-pro")
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)


# =============================================================================
# 15. AUDIT LOGS (Immutable System Audit Trail)
# =============================================================================
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    actor_uid: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    actor_role: Mapped[str] = mapped_column(String(50), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)  # LOGIN, TENDER_CREATED, BID_SUBMITTED, DOCUMENT_UPLOADED, VERIFICATION_COMPLETED, REVIEW_COMPLETED, AI_RESULT_OVERRIDDEN
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    resource_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    metadata_json: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)


# =============================================================================
# 16. NOTIFICATIONS
# =============================================================================
class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # NEW_BID, DOCUMENT_MISSING, VERIFICATION_DONE, REVIEW_ASSIGNED, INCONSISTENCY_ALERT
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notifications")
