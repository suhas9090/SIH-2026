# 🏛️ ComplyGeM AI — `Govt_Data` Repository
### High-Fidelity Mock Government Regulatory & Statutory Datasets

> **⚠️ PROTOTYPE / HACKATHON DISCLAIMER**  
> All data in this directory is strictly **SYNTHETIC / SIMULATED** for evaluation and autonomous demonstration in the Smart India Hackathon (SIH 2026). No real personal or corporate identities are utilized. In production deployments, ComplyGeM AI connects via secure gateway adapters directly to official authenticated APIs (e.g. GSTN, Income Tax Department, Udyam Portal, MCA21).

---

## 📁 Directory Structure & Registries

| Dataset File | Registry Authority | Key Identifier | Description |
| :--- | :--- | :--- | :--- |
| [`panDataset.js`](./panDataset.js) | **Income Tax (CBDT)** | `panNumber` | Validates PAN status, entity type, incorporation date, jurisdiction |
| [`udyamDataset.js`](./udyamDataset.js) | **Ministry of MSME** | `udyamRegistrationNumber` | Validates MSME classification (Micro/Small/Medium), turnover & plant investment |
| [`gstDataset.js`](./gstDataset.js) | **GSTN / CBIC** | `gstin` | Validates GST registration status, regular filing, trade vs legal name |
| [`incomeTaxDataset.js`](./incomeTaxDataset.js) | **CBDT / CPC** | `panNumber` | ITR return filing verification, gross income, outstanding tax demands |
| [`mcaDataset.js`](./mcaDataset.js) | **MCA21 / ROC** | `cinOrLlpin` | Company incorporation, authorized capital, active DIN directors, ROC status |
| [`epfoDataset.js`](./epfoDataset.js) | **EPFO (Shram Suvidha)** | `establishmentId` / `pan` | Employee count, monthly statutory dues compliance status |
| [`esicDataset.js`](./esicDataset.js) | **ESIC Portal** | `employerId` | Employer code, labour welfare contribution arrears status |
| [`blacklistDataset.js`](./blacklistDataset.js) | **CVC / GeM Vigilance** | `pan` / `gstin` / `cin` | Central debarment registry, blacklisting terms, vigilance case records |
| [`bisDataset.js`](./bisDataset.js) | **BIS Manak Online** | `certificateNumber` | ISI quality marks, product category, certificate validity & expiry |
| [`digilockerDataset.js`](./digilockerDataset.js) | **DigiLocker / NeGD** | `documentId` | Cryptographic digital signature verification & document hash checks |
| [`gemDataset.js`](./gemDataset.js) | **GeM Seller Registry** | `sellerId` | GeM seller account status, seller rating (0-5), incident count |
| [`localContentDataset.js`](./localContentDataset.js) | **DPIIT (Make in India)** | `declarationId` | Class-I (≥50%), Class-II (20-50%), Non-Local supplier classifications |
| [`nsicDataset.js`](./nsicDataset.js) | **NSIC (MSME)** | `nsicRegistrationNumber` | Single Point Registration monetary limits & product coverage |
| [`startupDataset.js`](./startupDataset.js) | **DPIIT Startup India** | `recognitionNumber` | DIPP recognition certificate, EMD & prior experience exemption eligibility |
| [`officerDirectory.js`](./officerDirectory.js) | **Govt HRMS / Portals** | `employeeId` | Authorized Procurement Officers directory for identity verification |
| [`auditorDirectory.js`](./auditorDirectory.js) | **CAG / CVC Reviewers** | `auditorId` | Authorized Senior Compliance Auditors & Reviewers directory |
| [`bidderScenarios.js`](./bidderScenarios.js) | **Evaluation Suite** | `scenarioId` | 10 pre-configured bidder test cases (Compliant, Debarred, Defaulted, etc.) |
| [`index.js`](./index.js) | **Master Lookup Engine** | — | Exported programmatic querying, presence verification, and search API |

---

## 🚀 API Usage Examples

### 1. Check If Record is Present in a Government Registry
```javascript
const { checkPresence } = require('./Govt_Data');

// Example: Check if PAN exists
const panResult = checkPresence('pan', 'SYNPA0001C');
console.log(panResult);
// Output: { isPresent: true, status: 'RECORD_PRESENT', record: { ... } }

// Example: Check if Udyam number exists
const udyamResult = checkPresence('udyam', 'UDYAM-KR-03-0012345');
console.log(udyamResult);
// Output: { isPresent: true, status: 'RECORD_PRESENT', record: { ... } }
```

### 2. Multi-Registry Bidder Triangulation Check
```javascript
const { checkAllRegistriesForBidder } = require('./Govt_Data');

const check = checkAllRegistriesForBidder({
  organizationName: 'ABC Safety Technologies Private Limited',
  pan: 'SYNPA0001C',
  gstin: '29SYNPA0001C1Z5',
  udyamNo: 'UDYAM-KR-03-0012345',
  cinNo: 'U29100KA2018PTC112233',
});
console.log(check.presenceScore); // 100
console.log(check.isDebarred);     // false
```

### 3. REST API Endpoints Provided by Backend
The backend exposes these mock datasets via the `/api/govt-data` routes:

* `GET /api/govt-data/summary` — Full overview of all 17 registries & total record counts.
* `GET /api/govt-data/registries` — List of all supported government data registries.
* `GET /api/govt-data/check/:registry/:identifier` — Check whether a specific record is present.
* `POST /api/govt-data/check-presence` — Batch presence check across multiple government registries.
* `GET /api/govt-data/registry/:registry` — Fetch all records in a given registry.
* `GET /api/govt-data/search?q=XYZ` — Search across all government registries.
