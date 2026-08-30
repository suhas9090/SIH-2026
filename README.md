# ComplyGeM AI — SIH26100

**AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement**  
*Smart India Hackathon 2026 Prototype*

---

## 🏛️ System Architecture

```
                  React / Next.js Frontend
               (Role-Specific Dashboards)
                           │
                           ▼
                  Firebase Authentication
            (Custom Claims: role, status, UID)
                           │
                           ▼
               FastAPI / Express Backend
      (Token Verification, OCR, NLP, RAG, Rules)
       ┌───────────────────┼───────────────────┐
       │                   │                   │
       ▼                   ▼                   ▼
 PostgreSQL 18     Firebase Storage     Government APIs
 (System of Record) (Tender & Bid PDFs) (GST, PAN, Udyam)
```

---

## 🔐 Separation of Responsibilities

| Service | Primary Responsibility | What It Stores / Executes |
| :--- | :--- | :--- |
| **Firebase Auth** | Identity & Custom Claims | User accounts, passwords, `role` claims, session tokens |
| **Firebase Storage** | Unstructured Documents | Tender PDFs, Bidder certificates, Balance sheets |
| **PostgreSQL 18** | Relational System of Record | Tenders, Bids, OCR extractions, Verification data, Audit logs |
| **FastAPI** | Backend & Intelligence Engine | OCR, Gemini LLM extraction, FAISS Vector search, RAG |
| **React / Vite / Tailwind** | User Interface | Role dashboards (Officer, Reviewer, Bidder, Admin) |

---

## 🗄️ PostgreSQL Database (16 Relational Tables)

1. `organizations` — Ministries, PSUs, MSMEs, Startups, OEMs
2. `users` — Application profiles linked via unique `firebase_uid`
3. `tenders` — GeM tender specifications and deadlines
4. `tender_requirements` — AI-extracted eligibility requirements
5. `bids` — Bidder tender submissions
6. `bid_documents` — Document metadata and Firebase Storage paths
7. `document_extractions` — OCR text and JSONB structured data
8. `government_verifications` — GST, PAN, Udyam, MCA, and Blacklist results
9. `compliance_checks` — Requirement-to-bid compliance evaluation
10. `evidence` — Citations, page numbers, and text excerpts for explainability
11. `review_assignments` — Reviewer case allocations
12. `review_decisions` — Human-in-the-loop decisions (Approved / Rejected)
13. `compliance_reports` — Summary scores and risk assessments
14. `ai_processing_jobs` — Async OCR/NLP/LLM tracking
15. `audit_logs` — Immutable audit trail of all sensitive operations
16. `notifications` — Role-based system alerts

---

## 🚀 Quick Setup Guide

### 1. PostgreSQL 18 Setup
Create database and non-superuser application role:
```sql
CREATE DATABASE complygem;
CREATE ROLE complygem_app WITH LOGIN PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE complygem TO complygem_app;
```

### 2. AI Service & Backend (Python + FastAPI)
```bash
cd ai-service
pip install -r requirements.txt
# Configure DATABASE_URL and GEMINI_API_KEY in .env
python -m uvicorn app.main:app --reload --port 8000
```

### 3. Frontend (React + Tailwind)
```bash
cd frontend
npm install
npm run dev
# Running at http://localhost:5173
```
