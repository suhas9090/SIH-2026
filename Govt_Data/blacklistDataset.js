/**
 * Synthetic Central Blacklist, Debarment & Vigilance Database
 * (Consolidates CVC, GeM Incident Management, CPPP, and State Procurement Debarments)
 * DISCLAIMER: Purely SYNTHETIC / FICTIONAL data for prototype demonstration.
 */

const SYNTHETIC_BLACKLIST_RECORDS = [
  {
    entityId: 'BLK-2023-089',
    entityName: 'Global Shield Corporation India Private Limited',
    panNumber: 'SYNPA0006C',
    gstin: '19SYNPA0006C1Z4',
    cin: 'U74999DL2016PTC298765',
    authority: 'Central Vigilance Commission / GeM Debarment Committee',
    caseReference: 'CVC/DEB/2023/8921',
    reason: 'Submission of forged laboratory test certificates and collusive bidding in municipal procurement',
    blacklistStatus: 'DEBARRED',
    startDate: '2023-04-01',
    endDate: '2028-03-31',
    issuingAuthority: 'Ministry of Commerce & Industry, Procurement Oversight Wing',
    isDebarred: true,
    verificationSource: 'SYNTHETIC_CENTRAL_DEBARMENT_REGISTRY',
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    entityId: 'BLK-2024-012',
    entityName: 'Titan Protective Gears Private Limited',
    panNumber: 'SYNPA0009C',
    gstin: '06SYNPA0009C1Z3',
    cin: 'U35999HR2014PTC054321',
    authority: 'State Public Works Department (PWD) Debarment Board',
    caseReference: 'PWD/BLK/2024/014',
    reason: 'Repeated supply default and non-compliance with warranty rectification obligations',
    blacklistStatus: 'BLACKLISTED',
    startDate: '2024-01-15',
    endDate: '2027-01-14',
    issuingAuthority: 'State Level Debarment Committee',
    isDebarred: true,
    verificationSource: 'SYNTHETIC_CENTRAL_DEBARMENT_REGISTRY',
    lastVerifiedAt: new Date().toISOString(),
  },
];

module.exports = {
  SYNTHETIC_BLACKLIST_RECORDS,
  checkBlacklistStatus: (panOrGstinOrName) => {
    if (!panOrGstinOrName) return { isBlacklisted: false, record: null };
    const query = panOrGstinOrName.trim().toUpperCase();
    const found = SYNTHETIC_BLACKLIST_RECORDS.find(r =>
      r.panNumber === query ||
      r.gstin === query ||
      r.cin === query ||
      r.entityName.toUpperCase().includes(query)
    );
    return {
      isBlacklisted: !!found,
      status: found ? found.blacklistStatus : 'NOT_BLACKLISTED',
      record: found || null,
      verificationSource: 'SYNTHETIC_CENTRAL_DEBARMENT_REGISTRY',
    };
  }
};
