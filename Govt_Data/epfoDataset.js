/**
 * Synthetic Employees' Provident Fund Organisation (EPFO) Dataset
 * DISCLAIMER: Purely SYNTHETIC / FICTIONAL data for prototype demonstration.
 */

const SYNTHETIC_EPFO_RECORDS = [
  {
    establishmentId: 'KNBNG0012345000',
    employerName: 'ABC Safety Technologies Private Limited',
    panNumber: 'SYNPA0001C',
    registrationDate: '2018-08-01',
    registrationStatus: 'ACTIVE',
    employeeCount: 142,
    contributionStatus: 'UP_TO_DATE',
    lastContributionDate: '2026-01-15',
    pendingContributions: 0,
    complianceStatus: 'COMPLIANT',
    verificationSource: 'SYNTHETIC_EPFO_SHRAM_SUVIDHA',
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    establishmentId: 'MHBAN0023456000',
    employerName: 'Apex Industrial Protective Equipments LLP',
    panNumber: 'SYNPA0002L',
    registrationDate: '2020-01-10',
    registrationStatus: 'ACTIVE',
    employeeCount: 28,
    contributionStatus: 'UP_TO_DATE',
    lastContributionDate: '2026-01-12',
    pendingContributions: 0,
    complianceStatus: 'COMPLIANT',
    verificationSource: 'SYNTHETIC_EPFO_SHRAM_SUVIDHA',
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    establishmentId: 'GJAHM0089012000',
    employerName: 'Reliable Industrial Workwear Private Limited',
    panNumber: 'SYNPA0008C',
    registrationDate: '2019-04-15',
    registrationStatus: 'ACTIVE',
    employeeCount: 86,
    contributionStatus: 'DEFAULTED',
    lastContributionDate: '2025-08-10',
    pendingContributions: 480000, // INR 4.8 Lakhs default in labor statutory dues
    complianceStatus: 'NON_COMPLIANT',
    verificationSource: 'SYNTHETIC_EPFO_SHRAM_SUVIDHA',
    lastVerifiedAt: new Date().toISOString(),
  },
];

module.exports = {
  SYNTHETIC_EPFO_RECORDS,
  findEpfoRecord: (establishmentId) => {
    if (!establishmentId) return null;
    const clean = establishmentId.trim().toUpperCase();
    return SYNTHETIC_EPFO_RECORDS.find(r => r.establishmentId === clean) || null;
  },
  findEpfoByPan: (pan) => {
    if (!pan) return null;
    const cleanPan = pan.trim().toUpperCase();
    return SYNTHETIC_EPFO_RECORDS.find(r => r.panNumber === cleanPan) || null;
  }
};
