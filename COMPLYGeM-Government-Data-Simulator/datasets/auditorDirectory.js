/**
 * Synthetic Authorized Compliance & Vigilance Auditor Directory
 * DISCLAIMER: All records in this file are purely SYNTHETIC / FICTIONAL for prototype demonstration.
 */

const SYNTHETIC_AUDITOR_DIRECTORY = [
  {
    auditorId: 'AUD-CAG-001',
    name: 'Dr. Anita Desai (Synthetic)',
    email: 'auditor@complygem.gov.in',
    organization: 'Comptroller and Auditor General of India (CAG)',
    department: 'Procurement Oversight & Audit Division',
    designation: 'Senior Audit Officer / Compliance Reviewer',
    status: 'ACTIVE_AUTHORIZED',
    verificationSource: 'SYNTHETIC_AUDITOR_REGISTRY',
  },
  {
    auditorId: 'AUD-CVC-009',
    name: 'Sunil Nair (Synthetic)',
    email: 'sunil.nair@cvc.gov.in',
    organization: 'Central Vigilance Commission (CVC)',
    department: 'Tender & Technical Audit Wing',
    designation: 'Chief Technical Examiner',
    status: 'ACTIVE_AUTHORIZED',
    verificationSource: 'SYNTHETIC_AUDITOR_REGISTRY',
  },
];

module.exports = {
  SYNTHETIC_AUDITOR_DIRECTORY,
  findAuditorRecord: (auditorId) => {
    if (!auditorId) return null;
    const clean = auditorId.trim().toUpperCase();
    return SYNTHETIC_AUDITOR_DIRECTORY.find(r => r.auditorId === clean) || null;
  }
};
