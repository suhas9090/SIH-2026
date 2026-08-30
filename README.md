<div align="center">

# ⚖️ COMPLYGEM AI (कम्प्लाईजेम)
### AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement

<p align="center">
  <img src="./frontend/public/complygem_hero_banner.png" alt="ComplyGeM AI Executive 3D Platform" width="100%" style="border-radius: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" />
</p>

[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%205%20%7C%20Tailwind-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.10+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2018%20%7C%20SQLAlchemy%202.x-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Firebase](https://img.shields.io/badge/Auth-Firebase%20Security%20%7C%20RBAC-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Gemini](https://img.shields.io/badge/AI%2FLLM-Gemini%201.5%20Pro%20%7C%20FAISS%20Vector-8E44AD?style=for-the-badge&logo=google)](https://ai.google.dev/)

<p align="center">
  <strong>An enterprise-grade, explainable compliance verification platform that automates tender clause extraction, validates bidder evidence across authoritative government gateways (GST, PAN, Udyam, MCA), and delivers auditable human-in-the-loop decision dossiers.</strong>
</p>

</div>

---

## 🔒 Security & Architecture [NEW]

To meet the stringent data integrity and governance standards required for public sector procurement, ComplyGeM AI implements a hardened multi-tier architecture:

* **🛡️ Zero-Trust Identity & Custom Claims**: Role assignment is managed strictly server-side using Firebase Admin Custom Claims (`PROCUREMENT_OFFICER`, `REVIEWER`, `BIDDER`, `ADMIN`). Public self-registration as an Administrator is strictly blocked.
* **🏛️ Two-Tier Government Approval Gate**: Accounts registering for Government privileges (*Procurement Officer* or *Reviewer*) are initialized in `PENDING` status and require administrative review before gaining access to procurement files.
* **🗄️ Relational System of Record (PostgreSQL 18)**: All 16 core business entities (Tenders, Requirements, Bids, Evidence, Reviews, and Audit Trails) are maintained in PostgreSQL 18 with foreign-key constraints, indexed search, and `JSONB` parameterization via **SQLAlchemy 2.0+** and **Psycopg 3**.
* **📜 Immutable Audit Ledger**: Every file upload, OCR extraction, verification query, and reviewer override is cryptographically logged in an append-only audit trail (`/audit_logs`).
* **🧊 Executive 3D Glassmorphism UI**: Built with a restrained 3D glass aesthetic (`backdrop-filter: blur(20px)`, `#070B14` charcoal dark canvas, floating document dossiers, and tactile perspective panels).

---

## 📌 Problem Statement

### **SIH26100 — AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement**

In public procurement on the **Government e-Marketplace (GeM)**, procurement officers must verify complex bidder eligibility criteria against heterogeneous submitted PDFs. Today, this process suffers from systemic bottlenecks:

```
Tender Specifications (50+ Pages)
               │
               ▼
Bidder Submissions (GST, Balances, OEM Certs, PAN)
               │
               ▼
Manual Scrutiny Across Disparate Portals (GSTN, ITD, Udyam, MCA21)
               │
               ▼
High Risk of Overlooked Discrepancies & Fraudulent Submissions
```

1. **Information Silos**: Verifying a single bidder requires logging into separate, disconnected government portals (GSTN, Income Tax, Udyam MSME, MCA21).
2. **Turnover & Clause Mismatches**: Unintentional or fraudulent discrepancies (e.g. audited 3-year turnover deficits or expired OEM authorization) are frequently missed during manual scans.
3. **Black-Box AI Hallucinations**: Generic AI models often produce unsupported claims without referencing specific document pages or clauses.
4. **Lack of Auditability**: Manual evaluations lack a tamper-proof digital log of who approved what, when, and based on which document excerpt.

---

## 🚀 The Solution: ComplyGeM AI

**ComplyGeM AI** unifies document intelligence, statutory data verification, semantic vector search, deterministic compliance rules, and role-based workflows into a unified, transparent compliance dashboard.

<p align="center">
  <img src="./frontend/public/complygem_login_card.png" alt="ComplyGeM 3D Elevated Interface" width="500px" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.6);" />
</p>

### 🧠 Core Breakthroughs

1. **Dual-Pass Extraction (Digital + OCR)**:
   - **Digital Layer**: Direct text and table stream extraction via `PyMuPDF` for crystal-clear native PDFs.
   - **Scanned Layer**: Automatic optical character recognition via `Tesseract OCR` for stamped certificates, CA signatures, and scanned balance sheets.

2. **Ground-Truth Requirement Extraction (Gemini 1.5 Pro)**:
   - Identifies financial thresholds, turnover requirements, mandatory tax registrations, and OEM partnerships directly from tender specifications.

3. **Dense Vector Matching & RAG (FAISS 768-dim)**:
   - Maps bidder document clauses directly to tender conditions using dense embeddings (`models/text-embedding-004`).

4. **Multi-Gateway Cross-Referencing**:
   - Cross-checks entity identity, turnover, registration date, and debarment status against official registry parameters.

5. **Explainable AI (XAI) Citations**:
   - Every compliance finding references the exact document name, page number, and highlighted excerpt for 100% human-in-the-loop auditability.

---

## 🛠️ Complete Workflow & Features

ComplyGeM AI is structured around **4 dedicated user personas**:

```
                          ┌───────────────────────────┐
                          │       ADMINISTRATOR       │
                          │ (User Mgmt, RBAC, Audits) │
                          └─────────────┬─────────────┘
                                        │
                ┌───────────────────────┴───────────────────────┐
                │                                               │
                ▼                                               ▼
┌───────────────────────────────┐               ┌───────────────────────────────┐
│     PROCUREMENT OFFICER       │               │      REVIEWER / EVALUATOR     │
│ (Creates Tenders, Verifies)   │               │ (Inspects Flags, Citations)   │
└───────────────┬───────────────┘               └───────────────┬───────────────┘
                │                                               │
                └───────────────────────┬───────────────────────┘
                                        │
                                        ▼
                        ┌───────────────────────────────┐
                        │       BIDDER (Supplier)       │
                        │ (Submits Bids, Tracks Status) │
                        └───────────────────────────────┘
```

### 1. 🏛️ For Procurement Officers
* **Tender Creation & Ingestion**: Upload tender PDFs; AI parses eligibility criteria, financial minimums, and mandatory certificates.
* **Comprehensive Compliance Dossier**: View overall bid compliance percentage (0–100%), highlighted risk indicators, and statutory verification status.
* **Instant Discrepancy Alerts**: Visual alerts for turnover deficits, expired OEM validity, or inactive GSTIN numbers.
* **One-Click Audit Reports**: Export formal, executive-ready PDF compliance reports.

### 2. 🔍 For Reviewers / Evaluators
* **Human-in-the-Loop Review Center**: Dedicated queue of flagged cases requiring human evaluation.
* **Evidence Citation Viewer**: Side-by-side view of extracted tender criteria alongside bidder document text snippets and source page numbers.
* **Actionable Overrides**: One-click actions to `✔ Accept Finding`, `✖ Mark as Incorrect`, or `↩ Request Re-verification`.

### 3. 🏢 For Bidders / Suppliers
* **Supplier Discovery Portal**: Search and view active tenders matching organization capability.
* **Encrypted Document Submission**: Upload encrypted technical and financial bid documents.
* **Live Compliance Feedback**: Real-time progress indicators showing document receipt and verification stages.

### 4. 🛡️ For System Administrators
* **Government User Approval Queue**: Authorize or decline accounts requesting *Procurement Officer* and *Reviewer* privileges.
* **System Health Monitor**: Live telemetry for OCR, LLM, Database connection pool, and Vector Store.
* **Immutable Audit Trail**: Filter and export complete system action histories.

---

## 🏛️ Authoritative Data Gateways

To guarantee regulatory compliance, external sources are classified into operational tiers:

| Gateway | Source Authority | Integration Tier | Verification Scope |
| :--- | :--- | :---: | :--- |
| **GST Portal** | GSTN Database | 🟢 **Live / Sandbox** | Active GSTIN status, legal entity name, return filing regularity |
| **Income Tax** | CBDT / ITD | 🟢 **Live / Sandbox** | PAN validity, entity status, name match |
| **MSME Udyam** | Ministry of MSME | 🟢 **Live / Sandbox** | Enterprise category (Micro/Small/Medium), turnover threshold caps |
| **MCA21** | Ministry of Corporate Affairs | 🟡 **Sandbox / Demo** | CIN validity, active directors, incorporation date |
| **EPFO / ESIC** | Ministry of Labour | 🟡 **Sandbox / Demo** | Active establishment code, labour welfare compliance |
| **Debarment Registry** | GeM / Central Vigilance | 🟡 **Sandbox / Demo** | Blacklist & debarment registry verification |

---

## 🗄️ Database Architecture (PostgreSQL 18)

The relational schema comprises **16 tables** managed through SQLAlchemy 2.0+ models:

```
organizations ─────────► users (firebase_uid, role, status)
     │
     └──► tenders ─────► tender_requirements (clauses, categories)
            │
            └──► bids ──► bid_documents ──► document_extractions (JSONB)
                   │
                   ├──► government_verifications (JSONB)
                   │
                   └──► compliance_checks
                          ├──► evidence (page, excerpt, confidence)
                          └──► review_decisions (override, notes)
```

---

## 💻 Running the App Locally

Follow these instructions to run the full stack locally on your development machine:

### 1. Prerequisites
* **Node.js**: v18.0 or higher
* **Python**: v3.10 or higher
* **PostgreSQL**: v16, v17, or v18 running locally or on cloud (e.g. Supabase/Neon)
* **Git**: Installed and configured

### 2. Clone the Repository
```bash
git clone https://github.com/suhas9090/SIH-2026.git
cd SIH-2026
```

### 3. Step 1: Start the AI Service (FastAPI + PostgreSQL)
```bash
cd ai-service
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux / macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
* Interactive API Documentation will be live at: **`http://localhost:8000/docs`**

### 4. Step 2: Start the Backend Gateway (Node.js Express)
Open a second terminal tab:
```bash
cd backend
npm install
npm run dev
```
* Backend running at: **`http://localhost:5000`**

### 5. Step 3: Start the Frontend UI (React + Vite)
Open a third terminal tab:
```bash
cd frontend
npm install
npm run dev
```
* Web Application will be live at: **`http://localhost:5173`**

---

## ⚙️ Environment Variables

Create `.env` files in each tier using the provided templates:

### `frontend/.env`
```env
VITE_FIREBASE_API_KEY=AIzaSyDsqsvn8QbCmxVDQL0xihEBcm7Y-Xy3__s
VITE_FIREBASE_AUTH_DOMAIN=compylgem-sih-2026.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=compylgem-sih-2026
VITE_FIREBASE_STORAGE_BUCKET=compylgem-sih-2026.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=548628508289
VITE_FIREBASE_APP_ID=1:548628508289:web:def602fcfb2dceb421e780
VITE_API_URL=http://localhost:5000
```

### `ai-service/.env`
```env
DATABASE_URL=postgresql+psycopg://complygem_app:complygem_secure_pass@localhost:5432/complygem
GEMINI_API_KEY=your_gemini_api_key_here
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

## 🌐 Deployment & Hosting

### Option A: Firebase Hosting (Frontend)
```bash
# Build the production bundle
cd frontend
npm run build

# Deploy using Firebase CLI
firebase login
firebase deploy --only hosting
```

### Option B: Cloud Containers (Backend & AI Service)
* **AI Service (FastAPI)**: Deploy via Docker container to Cloud Run, Render, or Railway.
* **Database**: Managed PostgreSQL on Supabase, AWS RDS, or Google Cloud SQL.

---

## 🔑 Troubleshooting Common Setup Issues

### 1. Firebase `auth/operation-not-allowed`
> **Error**: `Firebase: Error (auth/operation-not-allowed)`
* **Fix**: Open [Firebase Console](https://console.firebase.google.com/) → **Authentication** → **Sign-in method** → Enable **Email/Password** provider → Click **Save**.

### 2. Git Push `403 Permission Denied`
> **Error**: `fatal: unable to access ... The requested URL returned error: 403`
* **Fix**: Clear cached Windows Git credentials:
  ```powershell
  cmdkey /delete:git:https://github.com
  git push -u origin main
  ```
  Then click **"Sign in with your browser"** and authorize `suhas9090`.

### 3. PostgreSQL Database Connection Refused
> **Error**: `psycopg.OperationalError: connection to server at "localhost" failed`
* **Fix**: Ensure PostgreSQL service is running and database `complygem` exists:
  ```sql
  CREATE DATABASE complygem;
  CREATE USER complygem_app WITH ENCRYPTED PASSWORD 'complygem_secure_pass';
  GRANT ALL PRIVILEGES ON DATABASE complygem TO complygem_app;
  ```

---

## 🎨 Design System & Visual Identity

ComplyGeM AI is styled with an executive, restrained procurement aesthetic:
* **The "Procurement Charcoal" Palette**: `#070B14` base background, deep sapphire `#0d1424` surfaces, and subtle cyan/emerald `#0284c7`/`#10b981` status accents.
* **3D Glassmorphism**: `backdrop-filter: blur(20px)`, thin multi-layered borders (`rgba(255,255,255,0.08)`), and soft drop shadows creating realistic depth.
* **Modern Typography**: **Outfit** for bold, clean structural headings and **Inter** for dense, legible compliance tables.
* **Restrained & Professional**: Zero cartoonish illustrations, neon gradients, or generic robot graphics.

---

## 📜 Compliance Decision States

| Status | Meaning | System Action |
| :---: | :--- | :--- |
| 🟢 **COMPLIANT** | Evidence satisfies requirement & matches portal records. | Passed to evaluation summary. |
| 🔴 **NON_COMPLIANT** | Evidence fails criteria (e.g. turnover deficit, expired certificate). | Flagged with severity in dossier. |
| 🟡 **INCONSISTENT** | Discrepancy between document and official registry. | Routed to Reviewer queue. |
| ⚪ **MISSING** | Mandatory document not provided in submission. | Defect notice logged. |
| 🔵 **MANUAL_REVIEW** | Clause requires legal or statutory interpretation. | Assigned to Reviewer for sign-off. |

---

## 👥 Authors & Team

Developed for **Smart India Hackathon (SIH26100)**:
* **Project**: ComplyGeM AI (AI-Powered Integrated Bid Compliance Verification Platform for GeM)
* **Repository**: [https://github.com/suhas9090/SIH-2026](https://github.com/suhas9090/SIH-2026)

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.

<div align="center">
  <sub>Built with security, transparency, and explainability for government procurement.</sub>
</div>
