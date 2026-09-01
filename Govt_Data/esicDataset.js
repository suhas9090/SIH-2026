/**
 * Synthetic Employees' State Insurance Corporation (ESIC) Dataset
 * DISCLAIMER: Purely SYNTHETIC / FICTIONAL data for prototype demonstration.
 */

const SYNTHETIC_ESIC_RECORDS = [
  {
    employerId: 'ESI-KN-560058-001',
    employerName: 'ABC Safety Technologies Private Limited',
    registrationNumber: '53000123450001001',
    registrationStatus: 'ACTIVE',
    employeeCount: 110,
    contributionStatus: 'PAID',
    lastContributionDate: '2026-01-14',
    pendingContribution: 0,
    complianceStatus: 'COMPLIANT',
    verificationSource: 'SYNTHETIC_ESIC_PORTAL',
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    employerId: 'ESI-GJ-382445-008',
    employerName: 'Reliable Industrial Workwear Private Limited',
    registrationNumber: '37000890120001008',
    registrationStatus: 'ACTIVE',
    employeeCount: 65,
    contributionStatus: 'PENDING_ARREARS',
    lastContributionDate: '2025-09-10',
    pendingContribution: 175000,
    complianceStatus: 'NON_COMPLIANT',
    verificationSource: 'SYNTHETIC_ESIC_PORTAL',
    lastVerifiedAt: new Date().toISOString(),
  },
];

module.exports = {
  SYNTHETIC_ESIC_RECORDS,
  findEsicRecord: (employerId) => {
    if (!employerId) return null;
    const clean = employerId.trim().toUpperCase();
    return SYNTHETIC_ESIC_RECORDS.find(r => r.employerId === clean || r.registrationNumber === clean) || null;
  }
};
