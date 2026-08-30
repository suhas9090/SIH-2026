# COMPLYGEM AI

### AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement

> An intelligent enterprise platform assisting procurement officers in verifying bidder eligibility, extracting tender requirements, cross-referencing authoritative data gateways, identifying compliance risks, and generating explainable, evidence-backed assessments.

[![Stack](https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20Tailwind-blue)](#technology-stack)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Node.js-green)](#technology-stack)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2018%20%7C%20SQLAlchemy%202.x-indigo)](#database-design)
[![Security](https://img.shields.io/badge/Auth-Firebase%20%7C%20Custom%20Claims%20%7C%20App%20Check-orange)](#security)
[![AI/ML](https://img.shields.io/badge/AI%2FML-Gemini%201.5%20Pro%20%7C%20FAISS%20%7C%20Tesseract-purple)](#aiml-components)

---

## 📋 Table of Contents
1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Proposed Solution](#3-proposed-solution)
4. [Objectives](#4-objectives)
5. [Key Features](#5-key-features)
6. [System Workflow](#6-system-workflow)
7. [System Architecture](#7-system-architecture)
8. [Technology Stack](#8-technology-stack)
9. [AI / ML Components](#9-aiml-components)
10. [Authentication & Role Architecture](#10-authentication--role-architecture)
11. [Security by Design](#11-security-by-design)
12. [Database Design](#12-database-design)
13. [External Data Gateways & Integration Levels](#13-external-data-gateways--integration-levels)
14. [Repository Structure](#14-repository-structure)
15. [Installation & Setup](#15-installation--setup)
16. [Environment Variables](#16-environment-variables)
17. [Running the Application](#17-running-the-application)
18. [Sample Verification Walkthrough](#18-sample-verification-walkthrough)
19. [Compliance Assessment Matrix](#19-compliance-assessment-matrix)
20. [API Documentation](#20-api-documentation)
21. [Testing & Verification](#21-testing--verification)
22. [Limitations & Assumptions](#22-limitations--assumptions)
23. [Future Scope](#23-future-scope)
24. [License](#24-license)

---

## 1. Project Overview

Government procurement through the **Government e-Marketplace (GeM)** mandates that procurement officers thoroughly verify bidder eligibility and statutory compliance. This requires scrutinizing disparate physical and digital documents—including **GST registrations, PAN and tax filings, MCA corporate data, Udyam MSME status, OEM authorizations, financial statements, and debarment registries**.

Manual examination across multiple portal silos is labor-intensive, error-prone, and vulnerable to missed inconsistencies or fraudulent submissions.

**COMPLYGEM AI** provides an integrated, transparent, and auditable verification workbench. The platform automatically extracts requirement criteria from tender specifications, extracts structured entities from bidder-submitted documents via dual-pass OCR/NLP, cross-references authoritative government sources, computes deterministic compliance metrics, and presents an explainable decision dossier with exact page citations for human-in-the-loop review.

---

## 2. Problem Statement

### SIH26100
**AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement**

### The Core Challenge
The operational hurdle in procurement verification is not simply parsing text from PDFs. The primary challenge lies in:
1. **Clause-to-Evidence Grounding**: Automatically mapping complex tender eligibility criteria (e.g. *average 3-year turnover >= ₹5 Cr*, *valid OEM coverage*, *MSME category limitations*) against heterogeneous bidder PDFs.
2. **Authoritative Cross-Referencing**: Validating whether extracted claims match authoritative statutory databases (GSTN, Income Tax, Udyam, MCA21).
3. **Deterministic Reasoning & Explainability**: Preventing arbitrary LLM hallucinations by grounding every compliance flag in exact document excerpts and statutory rules.
4. **Human Accountability**: Maintaining a strict separation where AI provides evidence-backed recommendations, leaving the final binding decision to authorized procurement officers.

---

## 3. Proposed Solution

COMPLYGEM AI unifies document intelligence, statutory data verification, semantic vector search, deterministic compliance rules, and role-based workflows:

```
Tender Document (PDF)
        │
        ▼
Requirement Extraction (NLP / LLM)
        │
Bidder Submissions (PDFs/Images)
        │
        ▼
Dual-Pass OCR & Entity Parsing (PyMuPDF + Tesseract)
        │
        ▼
Government Gateway Connectors (GST, PAN, Udyam, MCA)
        │
        ▼
Semantic Evidence Matching (FAISS Vector Store + RAG)
        │
        ▼
Deterministic Compliance Engine & Risk Scoring
        │
        ▼
Role-Specific Dashboard (Officer / Reviewer / Bidder / Admin)
        │
        ▼
Human-in-the-Loop Review & Decision Dossier
        │
        ▼
Immutable System Audit Trail + PDF Compliance Report
```

---

## 4. Objectives

- **Accelerate Verification**: Reduce bid compliance verification time from days to minutes.
- **Eliminate Manual Oversight**: Automatically identify missing documents, expired certificates, turnover deficits, and portal mismatches.
- **Explainable AI (XAI)**: Ground every compliance flag with direct document citations, source pages, and text excerpts.
- **Strict Role-Based Security**: Provide tailored, isolated views for Procurement Officers, Reviewers, Bidders, and Administrators.
- **Enterprise-Grade Auditability**: Cryptographically log all user actions, document uploads, AI findings, and human overrides in an immutable audit ledger.

---

## 5. Key Features

### 📄 Document Intelligence
- Native text extraction for digital PDFs via **PyMuPDF**.
- Optical Character Recognition (OCR) via **Tesseract** for scanned certificates and stamps.
- Structured entity extraction output stored in PostgreSQL `JSONB` format.

### 🧠 Requirement Extraction
- Automated clause extraction categorizing criteria into **Financial, Tax, MSME, OEM, Experience, and Legal**.
- Automatic distinction between **Mandatory** and **Optional/Relaxed** conditions.

### 🏛️ Multi-Source Verification
- Modular connectors for **GSTN, Income Tax (PAN), MSME Udyam, MCA21, EPFO/ESIC, and CVC Debarment**.
- Explicit operational mode tagging (**Live**, **Sandbox/Demo**, **Manual Review Required**).

### ⚖️ Deterministic Compliance Engine
- Strict numeric and rule-based evaluation (e.g. comparing reported turnover vs. tender threshold).
- Overall compliance score (0–100%) and multi-level risk classification (**LOW**, **MEDIUM**, **HIGH**, **CRITICAL**).

### 🔍 Human-in-the-Loop Oversight
- Dedicated Reviewer workbench with interactive actions: `✔ Accept Finding`, `✖ Mark as Incorrect`, `↩ Request Re-verification`, and `💬 Add Remarks`.

### 🛡️ Enterprise Security
- Firebase Authentication with email verification, strict RFC email validation, and strong password enforcement.
- Server-side RBAC with Custom Claims (No self-registered Administrators).
- Immutable audit log preventing data tampering.

---

## 6. System Workflow

```
                        ┌───────────────────────────────┐
                        │      TENDER SPECIFICATION     │
                        └───────────────┬───────────────┘
                                        │
                                        ▼
                        ┌───────────────────────────────┐
                        │ AI REQUIREMENT EXTRACTION     │
                        │ (Financial, GST, OEM, Udyam)  │
                        └───────────────┬───────────────┘
                                        │
┌───────────────────────────────┐       │
│      BIDDER SUBMISSIONS       │       │
│ (GST, Balance Sheet, OEM)     │       │
└───────────────┬───────────────┘       │
                │                       │
                ▼                       │
┌───────────────────────────────┐       │
│   DUAL-PASS OCR & PARSING     │       │
│  (PyMuPDF + Tesseract Engine) │       │
└───────────────┬───────────────┘       │
                │                       │
                ▼                       │
┌───────────────────────────────┐       │
│ GOVERNMENT DATA GATEWAYS      │       │
│ (GSTN, PAN, Udyam, Debarment) │       │
└───────────────┬───────────────┘       │
                │                       │
                ▼                       │
┌───────────────────────────────┐       │
│ FAISS VECTOR SIMILARITY & RAG │◄──────┘
│ (768-dim Embedding Matching)  │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│ DETERMINISTIC COMPLIANCE RULE │
│ (Score, Inconsistencies, Risk)│
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│ HUMAN-IN-THE-LOOP REVIEW      │
│ (Officer / Reviewer Decision) │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│ AUDIT LOG + COMPLIANCE REPORT │
└───────────────────────────────┘
```

---

## 7. System Architecture

```
                       React / Vite Frontend
                     (Executive 3D Dashboard)
                                │
                                ▼
                     Firebase Authentication
               (Custom Claims: role, status, UID)
                                │
                                ▼
                     FastAPI Backend Engine
              (Token Verification & Business Logic)
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
   PostgreSQL 18         Firebase Storage       Government APIs
 (System of Record)    (PDFs & Certificates)    (GST, PAN, Udyam)
         │
 ┌───────┴───────┐
 ▼               ▼
FAISS Store    Gemini 1.5 Pro
(Vector Index) (Reasoning Engine)
```

---

## 8. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | React 18, Vite 5, Tailwind CSS | High-performance SPA with 3D glassmorphism |
| **Authentication** | Firebase Authentication | Identity management, custom claims, session restoration |
| **Backend API** | FastAPI (Python 3.10+) | High-throughput asynchronous REST microservice |
| **Relational DB** | PostgreSQL 18 | Relational system of record for all structured procurement data |
| **ORM & Driver** | SQLAlchemy 2.0+, Psycopg 3 (`psycopg[binary]`) | Type-safe ORM with connection pooling |
| **DB Migrations** | Alembic | Version-controlled database schema migrations |
| **Object Storage** | Firebase Storage / Local Filesystem | Storage for raw tender and bidder PDF documents |
| **Document OCR** | PyMuPDF (fitz), Tesseract OCR | Digital and scanned document text extraction |
| **LLM & Reasoning**| Google Gemini 1.5 Pro | Semantic requirement extraction and reasoning |
| **Embeddings** | `models/text-embedding-004` (768-dim) | Dense vector representations of requirements and clauses |
| **Vector Search** | FAISS (`faiss-cpu`) | Fast nearest-neighbor similarity search for RAG |

---

## 9. AI/ML Components

### 1. Dual-Pass Document Extraction
- **Pass 1 (Digital Vector Text)**: Uses `PyMuPDF` to instantly extract text layers, embedded fonts, and coordinate bounding boxes.
- **Pass 2 (Optical Character Recognition)**: Uses `pytesseract` to extract text from scanned stamp certificates and scanned balance sheets.

### 2. Semantic Embedding & FAISS Vector Index
- Requirements and document chunks are converted into 768-dimensional dense vectors.
- Stored in a local **FAISS L2 Flat Index**, enabling sub-millisecond retrieval of the most relevant document clauses matching a specific tender condition.

### 3. Retrieval-Augmented Generation (RAG)
- Before evaluating compliance, the RAG engine queries the vector index with the tender requirement.
- Relevant document snippets are injected into a structured prompt along with GFR 2017 procurement guidelines, ensuring the LLM reasons solely on retrieved facts.

### 4. Deterministic Compliance Analysis
- AI output is validated by a rule engine that verifies numbers (turnover, dates, percentage shares) deterministically to prevent false compliance scores.

---

## 10. Authentication & Role Architecture

The platform enforces **4 distinct user personas**:

```
                       ADMINISTRATOR
                             │
             ┌───────────────┴───────────────┐
             │                               │
     PROCUREMENT OFFICER           REVIEWER / EVALUATOR
             │                               │
             └───────────────┬───────────────┘
                             │
                      BIDDER (Supplier)
```

| Persona | Primary Functionality | Access Scope |
| :--- | :--- | :--- |
| 🏛️ **Procurement Officer** | Creates tenders, uploads specifications, initiates compliance checks, views scorecards, and generates audit reports. | Full tender management & report access. |
| 🔍 **Reviewer / Evaluator** | Human-in-the-loop verification. Inspects AI-flagged inconsistencies, examines evidence, accepts/overrides findings. | Assigned tenders, review queue, audit logs. |
| 🏢 **Bidder (Supplier)** | Registers organization, discovers eligible tenders, submits documents, tracks verification status. | **Strictly isolated**: Views only own submissions. |
| 🛡️ **Administrator** | System governance. Approves government account requests, configures RBAC matrix, monitors system health. | **Invitation-Only**: Cannot self-register. |

---

## 11. Security by Design

- **No Self-Registered Administrators**: Public registration rejects `ADMIN` requests (`403 ROLE_NOT_ALLOWED`). Admin accounts are provisioned exclusively via authorized invitations.
- **Government Approval Gate**: Accounts requesting *Procurement Officer* or *Reviewer* roles are initialized in `PENDING` status and restricted until an Administrator approves them.
- **Strict RFC Email & Phone Validation**: Inputs are validated against rigorous regex patterns and sanitized server-side.
- **Zero Frontend Secrets**: Database credentials, LLM keys, and service account keys reside exclusively in backend environment variables.
- **Immutable Audit Trail**: Audit records in `/audit_logs` are write-once/append-only; update and delete operations are prohibited.

---

## 12. Database Design

PostgreSQL 18 maintains **16 relational tables** with foreign keys, indexes, and `JSONB` storage:

```
ORGANIZATIONS
  ├── USERS (linked via unique firebase_uid)
  └── TENDERS
        ├── TENDER_REQUIREMENTS
        └── BIDS
              ├── BID_DOCUMENTS ──► DOCUMENT_EXTRACTIONS (JSONB)
              ├── GOVERNMENT_VERIFICATIONS (JSONB)
              ├── COMPLIANCE_CHECKS
              │     ├── EVIDENCE (Page numbers, excerpts)
              │     └── REVIEW_DECISIONS (Approved / Overridden)
              ├── REVIEW_ASSIGNMENTS
              └── COMPLIANCE_REPORTS
```

### Table Index Summary:
1. `organizations` — Ministries, PSUs, MSMEs, Startups, OEMs.
2. `users` — Application profiles with `firebase_uid`, roles, and status.
3. `tenders` — GeM tender specifications, categories, and deadlines.
4. `tender_requirements` — AI-extracted eligibility criteria.
5. `bids` — Bidder submissions and risk levels.
6. `bid_documents` — Storage paths and MIME metadata.
7. `document_extractions` — OCR text and structured `JSONB` entities.
8. `government_verifications` — Statutory portal responses (`JSONB`).
9. `compliance_checks` — Requirement-to-bid compliance evaluation.
10. `evidence` — Citations, page numbers, and text excerpts.
11. `review_assignments` — Reviewer case allocations.
12. `review_decisions` — Human-in-the-loop decisions.
13. `compliance_reports` — Summary scores and risk assessments.
14. `ai_processing_jobs` — Async OCR/NLP/LLM tracking.
15. `audit_logs` — Immutable audit trail of all sensitive operations.
16. `notifications` — Role-based system alerts.

---

## 13. External Data Gateways & Integration Levels

To maintain procurement integrity, data sources are classified into operational tiers:

| Gateway | Source Entity | Integration Tier | Verification Parameter |
| :--- | :--- | :--- | :--- |
| **GST Portal** | GSTN Database | **Sandbox / Live** | Active status, legal trade name, filing regularity |
| **PAN / Income Tax** | IT Department | **Sandbox / Live** | Entity name match, valid status |
| **MSME Udyam** | Ministry of MSME | **Sandbox / Live** | Enterprise category (Micro/Small/Medium), turnover cap |
| **MCA21** | Ministry of Corporate Affairs | **Sandbox / Demo** | CIN validity, active directors, incorporation date |
| **EPFO / ESIC** | Ministry of Labour | **Sandbox / Demo** | Active establishment code, remittance regularity |
| **Debarment Registry**| Central Vigilance / GeM | **Sandbox / Demo** | Blacklist status check |

> ⚠️ *Note: Where official government production APIs require departmental clearances, the system operates in verified Sandbox/Demo mode and explicitly marks records as `DEMO_VERIFIED`.*

---

## 14. Repository Structure

```
ComplyGeM-SIH2026/
├── frontend/                     # React + Vite + Tailwind Frontend
│   ├── src/
│   │   ├── components/           # Sidebar, Navbars, 3D Panels
│   │   ├── contexts/             # AuthContext (Firebase + Demo Switcher)
│   │   ├── pages/                # Role Dashboards, Landing, Login, Register, Tenders
│   │   ├── services/             # Axios API client
│   │   └── config/firebase.js    # Client Firebase setup
│   └── package.json
│
├── backend/                      # Node.js Express Middleware & Prisma Layer
│   ├── src/
│   │   ├── middleware/           # auth.js (RBAC, validators, rate limiters)
│   │   ├── routes/               # auth, tenders, bidders, compliance, audit, admin
│   │   ├── services/             # complianceEngine, riskEngine, firebaseAuthService
│   │   └── prisma/schema.prisma  # Prisma schema definition
│   └── package.json
│
├── ai-service/                   # Python FastAPI Intelligence & PostgreSQL Layer
│   ├── app/
│   │   ├── auth/                 # firebase_auth.py (FastAPI token verifier)
│   │   ├── database/             # session.py, models.py (16 tables), seed_data.py
│   │   ├── llm/                  # gemini_client.py (Google Gemini API)
│   │   ├── parser/               # pdf_parser.py (PyMuPDF + Tesseract)
│   │   ├── vector_store/         # faiss_store.py (FAISS 768-dim index)
│   │   ├── routes/               # requirements, documents, analysis, rag, health
│   │   └── main.py               # FastAPI application entry point
│   ├── alembic/                  # Alembic migration environment
│   ├── alembic.ini
│   └── requirements.txt
│
├── firebase.json                 # Firebase Hosting, Firestore, & Storage configuration
├── firestore.rules               # Production-grade Firestore RBAC rules
├── storage.rules                 # Strict Firebase Storage security rules
└── README.md
```

---

## 15. Installation & Setup

### Prerequisites
- **Node.js**: v18.0 or higher
- **Python**: v3.10 or higher
- **PostgreSQL**: v16, v17, or v18
- **Tesseract OCR**: (Optional for scanned document OCR)

### 1. Clone the Repository
```bash
git clone https://github.com/suhas9090/SIH-2026.git
cd SIH-2026
```

### 2. Setup AI Service (FastAPI + PostgreSQL)
```bash
cd ai-service
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Setup Frontend (React + Vite)
```bash
cd ../frontend
npm install
```

### 4. Setup Backend (Node.js Express)
```bash
cd ../backend
npm install
```

---

## 16. Environment Variables

Create `.env` files in each respective directory using the provided `.env.example` templates:

### `frontend/.env`
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=compylgem-sih-2026.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=compylgem-sih-2026
VITE_FIREBASE_STORAGE_BUCKET=compylgem-sih-2026.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=http://localhost:5000
```

### `ai-service/.env`
```env
DATABASE_URL=postgresql+psycopg://complygem_app:your_password@localhost:5432/complygem
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-pro
EMBEDDING_MODEL=models/text-embedding-004
FIREBASE_PROJECT_ID=compylgem-sih-2026
DEMO_MODE=true
```

### `backend/.env`
```env
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/complygem?schema=public
FIREBASE_PROJECT_ID=compylgem-sih-2026
AI_SERVICE_URL=http://localhost:8000
DEMO_MODE=true
```

---

## 17. Running the Application

In 3 separate terminal tabs:

### Tab 1: AI Service & PostgreSQL Backend
```bash
cd ai-service
python -m uvicorn app.main:app --reload --port 8000
# API available at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### Tab 2: Backend Gateway Service
```bash
cd backend
npm run dev
# Running on http://localhost:5000
```

### Tab 3: Frontend Client
```bash
cd frontend
npm run dev
# Web application available at http://localhost:5173
```

---

## 18. Sample Verification Walkthrough

1. **Procurement Officer** logs in and creates a tender (`GEM/2026/B/1234567`).
2. Uploads tender specification PDF:
   - AI extracts: `[REQ_GST_01] Valid GSTIN`, `[REQ_TURNOVER] Minimum ₹5.00 Cr 3-yr turnover`, `[REQ_OEM] Valid OEM authorization`.
3. **Bidder** (*ABC Industries Pvt Ltd*) submits bid documents.
4. **AI Pipeline Processing**:
   - `GST_Certificate.pdf` → OCR extracts `GSTIN: 29AABCA1234C1Z5` → Gateway confirms **ACTIVE** status.
   - `Financial_Statement.pdf` → OCR extracts `FY 2025-26 Turnover: ₹3.20 Cr` → Flagged as **NON-COMPLIANT** (Deficit of ₹1.80 Cr).
5. **Reviewer** opens the Case Dossier:
   - Inspects AI reasoning chain with exact page number and text snippet.
   - Records human decision: `✔ Accept Finding` or `↩ Request Clarification`.
6. System generates an auditable PDF compliance report and logs the decision into the immutable audit ledger.

---

## 19. Compliance Assessment Matrix

| Status | Code | Meaning | Action Triggered |
| :--- | :---: | :--- | :--- |
| 🟢 **COMPLIANT** | `COMPLIANT` | Document evidence matches tender requirement and portal verification. | Passed to evaluation table. |
| 🔴 **NON_COMPLIANT** | `NON_COMPLIANT` | Submitted evidence fails criteria (e.g. turnover below minimum threshold). | Flagged in compliance dossier. |
| 🟡 **INCONSISTENT** | `INCONSISTENT` | Document data contradicts official portal records (e.g. entity name mismatch). | Routed to Reviewer queue. |
| ⚪ **MISSING** | `MISSING` | Mandatory document was not submitted by bidder. | Defect notice generated. |
| 🔵 **MANUAL_REVIEW**| `MANUAL_REVIEW`| Complex clause requiring human statutory interpretation. | Assigned to Reviewer. |

---

## 20. API Documentation

Interactive Swagger documentation is available at **`http://localhost:8000/docs`**.

### Key Endpoints:
- `POST /process-document/` — Upload PDF/image for dual-pass OCR extraction.
- `POST /extract-requirements/` — Extract structured eligibility criteria from tender text.
- `POST /analyze-bidder/` — Execute requirement-to-evidence matching.
- `POST /embeddings/generate` — Generate dense vector representations.
- `POST /rag/retrieve` — Query FAISS vector index with procurement context.
- `GET /health` — Inspect operational status of OCR, LLM, Vector Store, and DB.

---

## 21. Testing & Verification

- **Automated Schema Initialization**: Run `python -m app.database.seed_data` in `ai-service/` to test table creation and seed data insertion.
- **Frontend E2E Test**: Use the interactive **Demo Role Switcher** on the sidebar to test role transitions and permission enforcement.
- **Security Assertions**: Verify that unauthorized route access returns `403 Forbidden` and self-registration as `ADMIN` is rejected.

---

## 22. Limitations & Assumptions

1. **Government API Access**: In development environments without direct government firewall whitelisting, the platform relies on high-fidelity Sandbox/Demo gateways.
2. **Document Quality**: OCR extraction accuracy is dependent on source scan resolution (recommended >= 300 DPI for stamped certificates).
3. **Decision Authority**: AI findings serve solely as decision support. Final procurement decisions remain the statutory responsibility of authorized officers.

---

## 23. Future Scope

- Direct DigiLocker for Business integration for instant tamper-proof document ingestion.
- Multilingual document OCR supporting 12+ Indian regional languages.
- Integration with the GeM 4.0 API ecosystem.
- Predictive vendor risk modeling based on historical procurement fulfillment.

---

## 24. License

Distributed under the **MIT License**. See `LICENSE` for more information.

```
© 2026 COMPLYGEM AI. Built with security, transparency, and explainability for government procurement.
```
