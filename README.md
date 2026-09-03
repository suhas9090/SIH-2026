<div align="center">

# <img src="./complygem_logo.png" width="44" height="44" style="vertical-align: middle; border-radius: 10px; margin-right: 8px;" /> COMPLYGEM-AI
### AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement

<p align="center">
  <img src="./frontend/public/complygem_hero_banner.png" alt="ComplyGeM AI Executive 3D Platform" width="100%" style="border-radius: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" />
</p>

[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%205%20%7C%20Tailwind-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.10+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Express](https://img.shields.io/badge/Gateway-Node.js%20%7C%20Express%20REST-brightgreen?style=for-the-badge&logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2018%20%7C%20Prisma%20ORM-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Gemini](https://img.shields.io/badge/AI%2FLLM-Gemini%201.5%20Pro%20%7C%20FAISS%20Vector-8E44AD?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Presentation](https://img.shields.io/badge/Presentation-Project%20PPT%20Deck-EA4335?style=for-the-badge&logo=googledrive&logoColor=white)](https://drive.google.com/file/d/1xMndcX6KonrEeBUFsQzmoAtvNU76YQNz/view?usp=sharing)

<p align="center">
  <strong>An enterprise-grade, explainable compliance verification platform that automates tender clause extraction, validates bidder evidence across authoritative government gateways (GST, PAN, Udyam, MCA), and delivers auditable human-in-the-loop decision dossiers.</strong>
</p>

<p align="center">
  <a href="https://drive.google.com/file/d/1xMndcX6KonrEeBUFsQzmoAtvNU76YQNz/view?usp=sharing" target="_blank">
    <img src="https://img.shields.io/badge/📊_View_Project_Presentation_(PPT)-Google_Drive-4285F4?style=for-the-badge&logo=googleslides&logoColor=white" alt="View Project Presentation" />
  </a>
</p>

</div>

---

## 📌 Problem Statement

### **SIH26100 — AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement**

In public procurement on the **Government e-Marketplace (GeM)**, procurement officers must verify complex bidder eligibility criteria across 50+ page tender specifications and heterogeneous submitted PDFs. Today, this process suffers from systemic bottlenecks:

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
2. **Turnover & Clause Mismatches**: Unintentional or fraudulent discrepancies (e.g., audited 3-year turnover deficits or expired OEM authorization) are frequently missed during manual scans.
3. **Black-Box AI Hallucinations**: Generic AI models produce unsupported claims without referencing specific document pages or clauses.
4. **Lack of Auditability**: Manual evaluations lack a tamper-proof digital log of who approved what, when, and based on which document excerpt.

---

## 🗺️ System Architecture

ComplyGeM AI is engineered as a secure, decoupled, multi-tier microservice architecture:

```mermaid
flowchart TB
    subgraph TIER1["1. PRESENTATION TIER (React 18 + Vite 5 SPA)"]
        direction LR
        P1["🛡️ Admin Portal<br/>(User Mgmt, Companies)"]
        P2["🏛️ Officer Portal<br/>(Tenders, Verify, Bids)"]
        P3["🏢 Bidder Portal<br/>(Onboarding, My Bids)"]
    end

    subgraph TIER2["2. API GATEWAY & SECURITY TIER (Node.js Express — Port 5000)"]
        direction TB
        GW["REST API Gateway & Reverse Proxy"]
        AUTH["Zero-Trust RBAC & Custom Claims"]
        RATE["Security Middleware (Rate-Limit, CORS, Password Policy)"]
        ROUTERS["Route Handlers (/auth, /tenders, /bids, /compliance, /admin)"]
        GW --> AUTH --> RATE --> ROUTERS
    end

    subgraph TIER3["3. AI & COMPLIANCE SERVICE (Python FastAPI — Port 8000)"]
        direction TB
        EXTRACT["Dual-Pass Extraction Engine<br/>• PyMuPDF (Digital Text/Tables)<br/>• Tesseract OCR (Scanned/CA Stamps)"]
        VECTOR["Vector Search Engine<br/>• FAISS 768-Dim Dense Index<br/>• text-embedding-004"]
        LLM["Grounded Reasoning Layer<br/>• Google Gemini 1.5 Pro / Flash"]
        RULES["Deterministic Risk Engine v2<br/>(Mathematical Decision Boundaries)"]
        EXTRACT --> VECTOR --> LLM --> RULES
    end

    subgraph TIER4["4. AUTHORITATIVE GOVERNMENT DATA GATEWAYS"]
        direction LR
        G1["💳 CBDT / PAN<br/>(ITD Registry)"]
        G2["🏛️ GSTN Portal<br/>(GSTR Returns)"]
        G3["🏭 MSME Udyam<br/>(Class & Turnovers)"]
        G4["🏢 MCA21<br/>(CIN & Directors)"]
    end

    subgraph TIER5["5. DATA & PERSISTENCE TIER"]
        direction LR
        DB["🗄️ PostgreSQL 18<br/>(16 Relational Tables via Prisma / SQLAlchemy)"]
        STORE["💾 Resilient Transaction Store<br/>(bidderOnboardingMemoryStore + JSON)"]
        AUDIT["📜 Append-Only Audit Ledger<br/>(Immutable GFR 2017 Trail)"]
    end

    TIER1 <== "HTTPS / REST / JWT" ==> TIER2
    TIER2 <== "Internal Service Key" ==> TIER3
    TIER2 <== "Secure Adapters" ==> TIER4
    TIER3 <== "Registry Context" ==> TIER4
    TIER2 <== "SQL / Connection Pool" ==> TIER5
    TIER3 <== "Extraction Storage" ==> TIER5
```

---

## ⚡ The 5-Stage Verification Pipeline

```mermaid
flowchart LR
    subgraph S1["1. INPUTS"]
        A["📄 GeM Tender RFP<br/>+<br/>📁 Bidder Documents<br/>(GST, PAN, CA Certs)"]
    end

    subgraph S2["2. DUAL-PASS OCR/NLP"]
        B["⚡ PyMuPDF (Digital Text)<br/>+<br/>🔍 Tesseract (Stamps & Seals)"]
    end

    subgraph S3["3. GOVT PORTAL APIS"]
        C["🏛️ Real-Time Adapters<br/>• CBDT PAN<br/>• GSTN Portal<br/>• MSME Udyam<br/>• MCA21 Registry"]
    end

    subgraph S4["4. HYBRID REASONING"]
        D["🧠 FAISS 768-dim RAG<br/>+<br/>🤖 Gemini 1.5 Pro<br/>+<br/>⚙️ Risk Engine v2"]
    end

    subgraph S5["5. FINAL DECISION"]
        E["📊 Explainable Dossier<br/>• Exact Page Citations<br/>• Officer Sign-off<br/>• PDF Audit Dossier"]
    end

    A --> B --> C --> D --> E
```

1. **Multi-Source Inputs**: Ingests RFP tender documents, financial criteria, and vendor submissions.
2. **Dual-Pass Extraction Engine**:
   * *Digital Layer*: Streams native text and financial tables via `PyMuPDF` in sub-300ms.
   * *Scanned Layer*: Triggers `Tesseract OCR` only for physical stamps, CA signatures, and scanned balance sheets.
3. **Statutory Registry Gateways**: Verifies existence, status, and legal classification across CBDT (PAN), GSTN (GST), MSME (Udyam), and MCA21 (CIN).
4. **Hybrid Reasoning & Dense Vector RAG**: Maps tender conditions to bidder clauses via FAISS 768-dim embeddings (`text-embedding-004`) while deterministic mathematical rule engines compute financial thresholds (*Zero Decision Autonomy*).
5. **Human-in-the-Loop Evaluation Dossier**: Delivers a single-page compliance dossier with verbatim clause citations, page numbers, and 1-click supervisory **Approve / Reject** actions.

---

## 👥 The 3 Platform Roles & Dedicated Portals

ComplyGeM AI is structured around **3 core procurement personas**:

| Capabilities & Actions | 🛡️ System Administrator | 🏛️ Procurement Officer | 🏢 Bidder / Supplier |
| :--- | :---: | :---: | :---: |
| **Create & Publish Tenders** | ❌ | ✅ | ❌ |
| **Inspect & Verify Company Profiles** | View Only | ✅ (Approve / Reject) | ❌ |
| **Verify Bid Compliance & Evidence** | View Only | ✅ (Sign-off & Score) | ❌ |
| **Live PAN / GST / Udyam Registry Lookup** | View Only | ✅ | ❌ |
| **Approve / Reject Government Staff Accounts** | ✅ | ❌ | ❌ |
| **Provision GeM Officer Accounts** | ✅ | ❌ | ❌ |
| **Download Official Statutory PDF Dossiers** | ✅ | ✅ | ❌ |
| **Browse Tenders & Submit Bids** | ❌ | ❌ | ✅ |
| **Upload Company Certificates (GST/PAN/CA)** | ❌ | ❌ | ✅ |
| **Track Bid Application Status** | ❌ | ❌ | ✅ |

---

## 🔄 Company Registration & Onboarding Lifecycle Flow

```mermaid
flowchart TD
    subgraph PHASE1["PHASE 1: REGISTRATION & SECURITY"]
        A["🏢 Vendor Registers Name, Email, Phone"]
        B["🔒 Password Criteria (Min 6 chars, 1 caps, 1 num, 1 special) + Eye Toggle (👁️/🙈)"]
        C["📱 Dual OTP Verification (Email OTP + SMS OTP)"]
        A --> B --> C
    end

    subgraph PHASE2["PHASE 2: STATUTORY ONBOARDING"]
        D["🏛️ Statutory Identifiers (PAN, GSTIN, Udyam, CIN, Registered Address)"]
        E["📂 Upload Certificates (PAN Card, GST, 3-Yr CA Balance Sheets, OEM Auth)"]
        C --> D --> E
    end

    subgraph PHASE3["PHASE 3: AUTOMATED CROSS-CHECKS"]
        F["⚡ Multi-Gateway Checks (CBDT, GSTN, Udyam, MCA21)"]
        G["📊 Compliance Match Calculated (0-100% Match Rate)"]
        E --> F --> G
    end

    subgraph PHASE4["PHASE 4: OFFICER QUEUE & VERIFICATION"]
        H["📋 LIFO Queue: Newest company appears at TOP of table"]
        I["🔍 Officer Inspects Profile & Live PAN Lookup"]
        J{"⚖️ Supervisory Decision"}
        K["✓ APPROVED_TO_BID (Inspect button disappears, unlocked to bid)"]
        L["✕ REJECTED (Disqualified with mandatory remarks)"]
        M["📥 Official GFR 2017 PDF Audit Certificate Exportable"]
        G --> H --> I --> J
        J -- "Passes Criteria" --> K --> M
        J -- "Defects Detected" --> L --> M
    end
```

---

## 🗄️ Database Architecture (PostgreSQL 18 & Prisma)

The relational schema comprises **16 tables** managed through Prisma ORM and SQLAlchemy models:

```
USER ──────────────► TENDER ──────────► REQUIREMENT
 │                      │                      │
 ├─► BIDDER_PROFILE     ├─► BIDDER ────────────┼─► COMPLIANCE_ITEM
 │    │                 │    │                 │      │
 │    ├─► COMPANY       │    ├─► DOCUMENT ─────┘      └─► COMPLIANCE_REVIEW
 │    ├─► DOCUMENTS     │    │    └─► CHUNKS (FAISS 768-dim)
 │    └─► GOVT_VERIF    │    ├─► VERIFICATION_RESULT
 │                      │    └─► COMPLIANCE_REPORT
 └─► AUDIT_LOG ◄────────┴────────────────────────────── (GFR 2017 Ledger)
```

### Table Specifications:
* **`User`**: System accounts (`ADMIN`, `PROCUREMENT_OFFICER`, `BIDDER`), Firebase UID, password hashes, approval status.
* **`Tender`**: Tender reference numbers, department, estimated value, submission deadlines.
* **`Requirement`**: Extracted criteria clauses, operators (`>=`, `<=`), financial turnover caps, source page numbers.
* **`Bidder`**: Tender-specific vendor submissions.
* **`Document` & `DocumentChunk`**: Uploaded evidence PDFs, page-level text, and dense vector embeddings (`text-embedding-004`).
* **`VerificationResult`**: External registry outputs from CBDT, GSTN, Udyam, and MCA21.
* **`ComplianceItem`**: Clause-by-clause evaluation, similarity score, evidence text excerpt, and page citations.
* **`ComplianceReport`**: Final overall compliance percentage (0–100%) and risk categorization.
* **`BidderProfile` & `BidderCompany`**: Master enterprise directory, statutory identifiers (PAN, GSTIN, CIN, Udyam), registered office address.
* **`AuditLog`**: Append-only cryptographic log recording every user action, verification query, and override.

---

## 📊 Feasibility & Viability Analysis

### The 6 Feasibility Pillars
1. **Technical Feasibility**: Built on battle-tested technologies (`PyMuPDF`, `Tesseract OCR`, `FAISS`, `FastAPI`, `Node.js`, `PostgreSQL 18`).
2. **Economic Feasibility**: Slashes technical scrutiny time by **80%** (from 3–14 days to under 2 minutes), delivering massive cost savings across Central Public Sector Enterprises (CPSEs).
3. **Social Feasibility**: Standardized, objective verification protects legitimate MSMEs and startups from arbitrary human bias and corruption.
4. **Legal & Compliance Feasibility (GFR 2017)**: Fully adheres to Indian General Financial Rules. Enforces **Zero Decision Autonomy**: the AI assists and cites, while the human Procurement Officer retains legal authority.
5. **Operational Feasibility**: Clean, human-built interface with zero learning curve, eliminating portal hopping across 4 different government websites.
6. **Security Feasibility**: Read-only integration with government portals, TLS 1.3 encryption in transit, AES-256 at rest, and an append-only audit trail.

### Real-World Risks vs. Technical Solutions:
| Real-World Challenge | Technical Strategy in ComplyGeM AI |
| :--- | :--- |
| **API Access & Rate Limits** | Phased caching architecture with transactional memory store fallback (`complygem_db.json`) during portal downtime. |
| **Cross-Portal Name Mismatch** | AI reconciliation layer with **Fuzzy Matching (Token Set Ratio & Jaro-Winkler)** normalizes legal suffixes (e.g. 'Pvt Ltd' vs 'Private Limited'). |
| **AI False Positives / Hallucinations** | **Ground-Truth Citations**: Every finding links to exact document page numbers and verbatim excerpts. AI cannot issue unilateral pass/fail decisions. |
| **Officer Adoption Resistance** | Clean, restrained government UI without black-box AI buzzwords; officers maintain 100% supervisory authority. |

---

## 🔑 Live Prototype Test Credentials

Evaluate and test the working prototype using these pre-configured credentials:

| Role Portal | Portal URL | Demo Email | Password | Primary Workflow |
| :--- | :--- | :--- | :--- | :--- |
| **🛡️ System Administrator** | `/admin/dashboard` | `admin@complygem.gov.in` | `Admin@123456` | User provisioning, inspecting registered companies, downloading PDF reports. |
| **🏛️ Procurement Officer** | `/procurement/dashboard` | `officer@complygem.gov.in` | `Admin@123456` | Reviewing newest profiles at top of queue, live PAN lookups, verifying bids. |
| **🏢 Bidder / Supplier** | `/bidder/dashboard` | `vendor@abcindustries.com` | `Admin@123456` | Browsing tenders, submitting bid documents, tracking live compliance status. |

---

## 💻 Running the Full Stack Locally

### Prerequisites
* **Node.js**: v18.0 or higher
* **Python**: v3.10 or higher
* **PostgreSQL**: v16, v17, or v18 running locally or on cloud
* **Git**: Installed and configured

### Step 1: Start the AI Service (FastAPI)
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
* Interactive API Documentation: **`http://localhost:8000/docs`**

### Step 2: Start the Backend Gateway (Node.js Express)
```bash
cd backend
npm install
npm run dev
```
* Backend Gateway: **`http://localhost:5000`**

### Step 3: Start the Frontend UI (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
* Web Application: **`http://localhost:5173`**

---

## 👥 Authors & Team

Developed for **Smart India Hackathon (SIH26100)**:
* **Project**: ComplyGeM AI (AI-Powered Integrated Bid Compliance Verification Platform for GeM)
* **Repository**: [https://github.com/suhas9090/SIH-2026](https://github.com/suhas9090/SIH-2026)
* **Presentation Deck (PPT)**: [Google Drive Presentation Link](https://drive.google.com/file/d/1xMndcX6KonrEeBUFsQzmoAtvNU76YQNz/view?usp=sharing)

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.

<div align="center">
  <sub>Built with security, transparency, and explainability for government procurement.</sub>
</div>
