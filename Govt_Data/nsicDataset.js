/**
 * Synthetic National Small Industries Corporation (NSIC) Single Point Registration Dataset
 * DISCLAIMER: Purely SYNTHETIC / FICTIONAL data for prototype demonstration.
 */

const SYNTHETIC_NSIC_RECORDS = [
  {
    nsicRegistrationNumber: 'NSIC-SPR-2020-001122',
    enterpriseName: 'ABC Safety Technologies Private Limited',
    panNumber: 'SYNPA0001C',
    registrationDate: '2020-09-01',
    validityDate: '2027-08-31',
    certificateStatus: 'ACTIVE',
    productOrServiceCategory: 'Safety Helmets, Fall Arrest Harnesses, Protective Eyewear',
    monetaryLimit: 50000000, // INR 5.00 Cr
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    verificationSource: 'SYNTHETIC_NSIC_SPR_PORTAL',
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    nsicRegistrationNumber: 'NSIC-SPR-2018-003344',
    enterpriseName: 'Zenith Protection Gear & Safety Works',
    panNumber: 'SYNPA0003P',
    registrationDate: '2018-04-10',
    validityDate: '2021-04-09',
    certificateStatus: 'EXPIRED', // Expired certificate scenario
    productOrServiceCategory: 'Fire Protection Suits',
    monetaryLimit: 10000000,
    state: 'Delhi',
    district: 'South Delhi',
    verificationSource: 'SYNTHETIC_NSIC_SPR_PORTAL',
    lastVerifiedAt: new Date().toISOString(),
  },
];

module.exports = {
  SYNTHETIC_NSIC_RECORDS,
  findNsicRecord: (regNumber) => {
    if (!regNumber) return null;
    const clean = regNumber.trim().toUpperCase();
    return SYNTHETIC_NSIC_RECORDS.find(r => r.nsicRegistrationNumber === clean) || null;
  }
};
