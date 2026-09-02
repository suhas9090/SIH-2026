# 🏛️ COMPLYGeM Government Data Simulator

> **Autonomous Simulated Government Regulatory Verification Microservice**  
> Built for the Smart India Hackathon (SIH 2026) — Problem Statement: AI-Powered Bid Compliance Verification for GeM Procurement.

---

## 📌 Overview

This repository is **completely decoupled** from the main `COMPLYGeM-AI` application. It provides realistic mock REST APIs representing official Indian Government verification systems:

1. **CBDT** — Permanent Account Number (PAN) Registry (`/api/pan/:panNumber`)
2. **GSTN** — Goods and Services Tax Network Taxpayer Profile & GSTR-3B Filing History (`/api/gst/:gstin`)
3. **Ministry of MSME** — Udyam Enterprise Classification & Micro/Small/Medium Registry (`/api/udyam/:udyamNumber`)
4. **MCA21 / ROC** — Corporate Identity Number (CIN/LLPIN) and Authorized Director Registry (`/api/mca/:cin`)
5. **Income Tax CPC** — Income Tax Return (ITR-6/5/3) Filing Regularity & Turnover (`/api/income-tax/:pan`)
6. **EPFO** — Shram Suvidha Social Security & Active Labor Members (`/api/epfo/:establishmentId`)
7. **ESIC** — Employees' State Insurance 17-Digit Employer Code & Dues (`/api/esic/:employerCode`)
8. **NSIC** — Single Point Registration Scheme (SPR) & Bidding Monetary Limits (`/api/nsic/:registrationNumber`)
9. **DPIIT Startup India** — DIPP Recognitions & Tender Exemption Entitlements (`/api/startup/:recognitionNumber`)
10. **DigiLocker Gateway** — Cryptographically Signed Verified Credentials & SHA-256 Hashes (`/api/digilocker/:docId`)
11. **BIS Manak Online** — ISI Quality Marks & Conformity Standards (`/api/bis/:certNo`)
12. **GeM SPV** — Government e-Marketplace Seller ID, Ratings & Incident Log (`/api/gem-seller/:sellerId`)
13. **Make in India (MII)** — Local Content Percentage Declarations (`/api/local-content/:declId`)
14. **Central Debarment & Vigilance** — CVC Blacklist, Suspension & Banned Entity Registry (`/api/blacklist/:identifier`)

---

## 🚀 Quick Start

### 1. Installation
```bash
cd COMPLYGeM-Government-Data-Simulator
npm install
```

### 2. Run the Server
```bash
# Production mode
npm start

# Development mode with hot-reloading
npm run dev
```

The simulator runs on `http://127.0.0.1:8001`.

---

## 📋 API Catalog & Endpoints

| Gateway | Method | Endpoint | Example Request |
|---|---|---|---|
| **PAN Verification** | `GET` | `/api/pan/:panNumber` | `/api/pan/SYNPA0001C` |
| **Aadhaar/PAN OTP** | `POST` | `/api/pan/verify-otp` | Body: `{ "panNumber": "SYNPA0001C", "otp": "123456" }` |
| **GSTIN Verification** | `GET` | `/api/gst/:gstin` | `/api/gst/29SYNPA0001C1Z5` |
| **Udyam MSME Check** | `GET` | `/api/udyam/:udyamNumber` | `/api/udyam/UDYAM-KR-03-0012345` |
| **MCA21 Company Profile** | `GET` | `/api/mca/:cin` | `/api/mca/U29100KA2018PTC112233` |
| **ITR Compliance Check** | `GET` | `/api/income-tax/:pan` | `/api/income-tax/SYNPA0001C` |
| **EPFO Labor Verification** | `GET` | `/api/epfo/:establishmentId` | `/api/epfo/KNBNG0012345000` |
| **ESIC Dues Verification** | `GET` | `/api/esic/:employerCode` | `/api/esic/53000123450001001` |
| **NSIC SPR Limit Check** | `GET` | `/api/nsic/:registrationNumber` | `/api/nsic/NSIC/REG/2021/8892` |
| **Startup India Exemption** | `GET` | `/api/startup/:recognitionNumber` | `/api/startup/DIPP-44912` |
| **DigiLocker Credential** | `GET` | `/api/digilocker/:docId` | `/api/digilocker/DL-DOC-001-SYNPA0001C` |
| **BIS Quality Standard** | `GET` | `/api/bis/:certNo` | `/api/bis/CM/L-8899001` |
| **GeM Seller Rating** | `GET` | `/api/gem-seller/:sellerId` | `/api/gem-seller/GEM-SELLER-1001` |
| **Make in India Local Content** | `GET` | `/api/local-content/:declId` | `/api/local-content/MII-DECL-001` |
| **Central Blacklist / CVC** | `GET` | `/api/blacklist/:identifier` | `/api/blacklist/SYNPA0006C` |

---

## 🔒 Security & Data Principles
- **Zero Real PII**: Uses 100% synthetic corporate identities with mock identifiers.
- **RESTful Decoupling**: The main application communicates exclusively over standard HTTP/JSON requests.
- **Future-Proof**: When official government APIs (API Setu / OpenForge) are integrated, only the endpoint configurations in `COMPLYGeM-AI` need to be redirected.
