/**
 * Synthetic Central Blacklist, Debarment & Vigilance Database
 * Contains full vigilance & debarment status for all 20 master corporate identities.
 * DISCLAIMER: Purely SYNTHETIC / FICTIONAL data for prototype demonstration.
 */

const { SYNTHETIC_PAN_RECORDS } = require('./panDataset');

const SYNTHETIC_BLACKLIST_RECORDS = SYNTHETIC_PAN_RECORDS.map((rec, i) => {
  if (rec.panNumber === 'SYNPA0006C') {
    return {
      entityId: 'BLK-2023-089',
      entityName: rec.legalName,
      panNumber: rec.panNumber,
      gstin: '19SYNPA0006C1Z4',
      cin: 'U74999WB2016PTC298765',
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
    };
  }

  if (rec.panNumber === 'SYNPA0009C') {
    return {
      entityId: 'BLK-2024-012',
      entityName: rec.legalName,
      panNumber: rec.panNumber,
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
    };
  }

  if (rec.panNumber === 'SYNPA0003P') {
    return {
      entityId: 'BLK-2024-033',
      entityName: rec.legalName,
      panNumber: rec.panNumber,
      gstin: '07SYNPA0003P1Z9',
      cin: null,
      authority: 'Directorate General of Goods & Services Tax Intelligence',
      caseReference: 'DGGI/ND/2024/4412',
      reason: 'Under show-cause notice for non-filing of GST returns and outstanding tax demand',
      blacklistStatus: 'UNDER_NOTICE',
      startDate: '2024-06-01',
      endDate: '2025-05-31',
      issuingAuthority: 'Enforcement Directorate (Commercial Taxes)',
      isDebarred: false,
      verificationSource: 'SYNTHETIC_CENTRAL_DEBARMENT_REGISTRY',
      lastVerifiedAt: new Date().toISOString(),
    };
  }

  // Clean vendors
  return {
    entityId: `VIG-CLEAN-${String(i + 1).padStart(3, '0')}`,
    entityName: rec.legalName,
    panNumber: rec.panNumber,
    gstin: null,
    cin: null,
    authority: 'Central Vigilance Commission (CVC) Clearance Cell',
    caseReference: `CVC/CLR/2026/${1000 + i}`,
    reason: 'Clean regulatory standing with no adverse vigilance or debarment proceedings',
    blacklistStatus: 'NOT_BLACKLISTED',
    startDate: null,
    endDate: null,
    issuingAuthority: 'Central Debarment Oversight Portal',
    isDebarred: false,
    verificationSource: 'SYNTHETIC_CENTRAL_DEBARMENT_REGISTRY',
    lastVerifiedAt: new Date().toISOString(),
  };
});

module.exports = {
  SYNTHETIC_BLACKLIST_RECORDS,
  checkBlacklistStatus: (panOrGstinOrName) => {
    if (!panOrGstinOrName) return { isBlacklisted: false, status: 'NOT_BLACKLISTED', record: null };
    const query = panOrGstinOrName.trim().toUpperCase();
    const found = SYNTHETIC_BLACKLIST_RECORDS.find(r =>
      r.panNumber === query ||
      r.gstin === query ||
      r.cin === query ||
      (r.entityName && r.entityName.toUpperCase().includes(query))
    );
    return {
      isBlacklisted: !!(found && found.isDebarred),
      status: found ? found.blacklistStatus : 'NOT_BLACKLISTED',
      record: found || null,
      verificationSource: 'SYNTHETIC_CENTRAL_DEBARMENT_REGISTRY',
    };
  }
};
