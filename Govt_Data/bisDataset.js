/**
 * Synthetic Bureau of Indian Standards (BIS) & DPIIT Quality Certification Dataset
 * DISCLAIMER: Purely SYNTHETIC / FICTIONAL data for prototype demonstration.
 */

const SYNTHETIC_BIS_RECORDS = [
  {
    certificateNumber: 'CM/L-8899001',
    organisationName: 'ABC Safety Technologies Private Limited',
    panNumber: 'SYNPA0001C',
    certificationType: 'ISI_MARK_CERTIFICATION',
    productCategory: 'Industrial Safety Helmets',
    standardCode: 'IS 2925:1984',
    issueDate: '2020-05-15',
    expiryDate: '2027-05-14',
    certificateStatus: 'ACTIVE',
    issuingAuthority: 'Bureau of Indian Standards, Central Laboratory',
    verificationSource: 'SYNTHETIC_BIS_MANAK_ONLINE',
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    certificateNumber: 'CM/L-8899005',
    organisationName: 'Kavach Safety Equipment Manufacturing Limited',
    panNumber: 'SYNPA0005C',
    certificationType: 'ISI_MARK_CERTIFICATION',
    productCategory: 'Industrial Full Body Harness',
    standardCode: 'IS 3521 (Part 1):2021',
    issueDate: '2019-03-10',
    expiryDate: '2023-03-09', // Expired BIS Certificate scenario
    certificateStatus: 'EXPIRED',
    issuingAuthority: 'Bureau of Indian Standards, Chennai Branch',
    verificationSource: 'SYNTHETIC_BIS_MANAK_ONLINE',
    lastVerifiedAt: new Date().toISOString(),
  },
];

module.exports = {
  SYNTHETIC_BIS_RECORDS,
  findBisRecord: (certNo) => {
    if (!certNo) return null;
    const clean = certNo.trim().toUpperCase();
    return SYNTHETIC_BIS_RECORDS.find(r => r.certificateNumber === clean || r.panNumber === clean) || null;
  }
};
