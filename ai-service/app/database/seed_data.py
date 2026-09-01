"""
Database Initializer & Development Seed Script
Creates all tables and populates development seed data (safely marked as DEMO).
"""

from datetime import datetime, timedelta
from loguru import logger
from app.database.session import engine, SessionLocal, Base
from app.database.models import (
    Organization, User, Tender, TenderRequirement, Bid, BidDocument,
    DocumentExtraction, GovernmentVerification, ComplianceCheck, Evidence,
    ReviewDecision, ComplianceReport, AuditLog, Notification
)


def init_db():
    """Create all 16 relational tables in PostgreSQL."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Successfully created/verified all 16 PostgreSQL tables via SQLAlchemy")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise


def seed_demo_data():
    """Seed initial development demonstration data."""
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Organization).first():
            logger.info("Database already contains records. Skipping seed.")
            return

        logger.info("Seeding initial development demo data...")

        # 1. Organizations
        ministry_org = Organization(
            name="Ministry of Labour & Employment",
            organization_type="MINISTRY",
            registration_number="GOV-IND-LABOUR-01",
            address="Shram Shakti Bhawan, Rafi Marg, New Delhi",
        )
        bidder_org_1 = Organization(
            name="ABC Industries Pvt Ltd",
            organization_type="PRIVATE_COMPANY",
            registration_number="29AABCA1234C1Z5",
            address="Industrial Estate, Peenya, Bengaluru, Karnataka",
        )
        bidder_org_2 = Organization(
            name="XYZ Technologies Ltd",
            organization_type="MSME",
            registration_number="UDYAM-KA-01-0000001",
            address="Electronics City, Phase 1, Bengaluru",
        )
        db.add_all([ministry_org, bidder_org_1, bidder_org_2])
        db.flush()

        # 2. Users (Linked with Firebase UIDs)
        officer = User(
            firebase_uid="firebase_officer_uid_001",
            full_name="Rajesh Sharma",
            email="rajesh.officer@gem.gov.in",
            phone="+919876543210",
            organization_id=ministry_org.id,
            role="procurement_officer",
            status="approved",
        )
        reviewer = User(
            firebase_uid="firebase_reviewer_uid_002",
            full_name="Dr. Anita Desai",
            email="anita.reviewer@nic.gov.in",
            phone="+919876543211",
            organization_id=ministry_org.id,
            role="reviewer",
            status="approved",
        )
        bidder_user = User(
            firebase_uid="firebase_bidder_uid_003",
            full_name="Vikram Mehta",
            email="vikram@abc-industries.com",
            phone="+919876543212",
            organization_id=bidder_org_1.id,
            role="bidder",
            status="approved",
        )
        db.add_all([officer, reviewer, bidder_user])
        db.flush()

        # 3. Tender
        tender = Tender(
            tender_reference="GEM/2026/B/1234567",
            title="Supply of Industrial Safety Equipment",
            description="Procurement of certified industrial safety helmets, boots, and harnesses for factory inspection personnel.",
            organization_id=ministry_org.id,
            procurement_officer_id=officer.id,
            category="Industrial Safety",
            estimated_value=50000000.0,  # ₹5 Crore
            publication_date=datetime.utcnow() - timedelta(days=5),
            submission_deadline=datetime.utcnow() + timedelta(days=15),
            status="OPEN",
            source="GEM_PORTAL",
        )
        db.add(tender)
        db.flush()

        # 4. Tender Requirements
        req_gst = TenderRequirement(
            tender_id=tender.id,
            requirement_code="REQ_GST_01",
            requirement_text="Bidder must possess a valid, active GST registration certificate.",
            requirement_type="GST",
            mandatory=True,
            source_page=3,
            verification_method="GST_PORTAL",
        )
        req_turnover = TenderRequirement(
            tender_id=tender.id,
            requirement_code="REQ_FIN_TURNOVER",
            requirement_text="Bidder shall have an average annual turnover of at least INR 5.00 Crore over the preceding 3 FYs.",
            requirement_type="FINANCIAL",
            mandatory=True,
            source_page=4,
            verification_method="DOCUMENT_MATCHING",
        )
        req_oem = TenderRequirement(
            tender_id=tender.id,
            requirement_code="REQ_OEM_AUTH",
            requirement_text="Bidder must submit a valid OEM authorization certificate specifying validity and coverage.",
            requirement_type="OEM",
            mandatory=True,
            source_page=5,
            verification_method="DOCUMENT_MATCHING",
        )
        db.add_all([req_gst, req_turnover, req_oem])
        db.flush()

        # 5. Bid
        bid = Bid(
            tender_id=tender.id,
            bidder_organization_id=bidder_org_1.id,
            status="UNDER_REVIEW",
            overall_compliance_score=72.0,
            risk_level="MEDIUM",
        )
        db.add(bid)
        db.flush()

        # 6. Bid Documents (PDF in Firebase Storage, metadata here)
        doc_gst = BidDocument(
            bid_id=bid.id,
            document_type="GST_CERTIFICATE",
            file_name="GST_Registration_Certificate.pdf",
            storage_path="bids/bid_001/documents/gst_cert.pdf",
            mime_type="application/pdf",
            file_size=1048576,
            uploaded_by="firebase_bidder_uid_003",
            processing_status="COMPLETED",
        )
        doc_fin = BidDocument(
            bid_id=bid.id,
            document_type="FINANCIAL_STATEMENT",
            file_name="Audited_PL_Statement_2025-26.pdf",
            storage_path="bids/bid_001/documents/fin_statement.pdf",
            mime_type="application/pdf",
            file_size=2097152,
            uploaded_by="firebase_bidder_uid_003",
            processing_status="COMPLETED",
        )
        db.add_all([doc_gst, doc_fin])
        db.flush()

        # 7. Document Extractions (JSONB)
        db.add(DocumentExtraction(
            document_id=doc_gst.id,
            ocr_text="GOVERNMENT OF INDIA - CERTIFICATE OF GST REGISTRATION...",
            structured_data={"gstin": "29AABCA1234C1Z5", "legal_name": "ABC Industries Pvt Ltd", "status": "Active"},
            confidence_score=0.98,
            page_count=2,
            processing_status="COMPLETED",
        ))
        db.add(DocumentExtraction(
            document_id=doc_fin.id,
            ocr_text="AUDITED FINANCIAL STATEMENT FY 2025-26 - TURNOVER: INR 32,000,000...",
            structured_data={"annual_turnover": 32000000, "currency": "INR", "financial_year": "2025-26"},
            confidence_score=0.92,
            page_count=8,
            processing_status="COMPLETED",
        ))

        # 8. Government Verification
        db.add(GovernmentVerification(
            bid_id=bid.id,
            document_id=doc_gst.id,
            verification_type="GST",
            reference_number="29AABCA1234C1Z5",
            source="GST_PORTAL",
            status="VERIFIED",
            response_data={"status": "ACTIVE", "legal_name": "ABC Industries Pvt Ltd", "state": "Karnataka", "demo_mode": True},
            confidence=1.0,
        ))

        # 9. Compliance Checks
        cc_gst = ComplianceCheck(
            bid_id=bid.id,
            requirement_id=req_gst.id,
            status="COMPLIANT",
            reason="GSTIN 29AABCA1234C1Z5 verified as ACTIVE on GST Portal.",
            confidence=1.0,
        )
        cc_turnover = ComplianceCheck(
            bid_id=bid.id,
            requirement_id=req_turnover.id,
            status="NON_COMPLIANT",
            reason="Submitted FY 2025-26 turnover is INR 3.20 Cr, which is below the mandatory minimum of INR 5.00 Cr.",
            confidence=0.92,
        )
        db.add_all([cc_gst, cc_turnover])
        db.flush()

        # 10. Evidence
        db.add(Evidence(
            compliance_check_id=cc_gst.id,
            document_id=doc_gst.id,
            source_type="PORTAL_API",
            page_number=1,
            text_excerpt="GSTIN: 29AABCA1234C1Z5 | Status: Active",
            evidence_score=1.0,
        ))
        db.add(Evidence(
            compliance_check_id=cc_turnover.id,
            document_id=doc_fin.id,
            source_type="DOCUMENT",
            page_number=4,
            text_excerpt="Total Turnover from Operations: INR 3,20,00,000 (INR 3.20 Crore)",
            evidence_score=0.92,
        ))

        # 11. Compliance Report
        db.add(ComplianceReport(
            bid_id=bid.id,
            generated_by=officer.id,
            overall_score=72.0,
            compliant_count=2,
            non_compliant_count=1,
            missing_count=0,
            inconsistent_count=0,
            risk_level="MEDIUM",
        ))

        # 12. Audit Log
        db.add(AuditLog(
            actor_uid="firebase_officer_uid_001",
            actor_role="procurement_officer",
            action="TENDER_CREATED",
            resource_type="TENDER",
            resource_id=tender.id,
            metadata_json={"reference": tender.tender_reference, "title": tender.title},
        ))

        db.commit()
        logger.info("Successfully seeded development demo data into PostgreSQL!")

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to seed demo data: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    seed_demo_data()
