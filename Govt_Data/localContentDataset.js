/**
 * Synthetic Make in India (MII) / Public Procurement Preference (Local Content) Dataset
 * DISCLAIMER: Purely SYNTHETIC / FICTIONAL data for prototype demonstration.
 */

const SYNTHETIC_LOCAL_CONTENT_RECORDS = [
  {
    declarationId: 'MII-DECL-001',
    bidderName: 'ABC Safety Technologies Private Limited',
    panNumber: 'SYNPA0001C',
    tenderId: 't1',
    productName: 'Industrial Safety Helmets & Fall Protection Harnesses',
    countryOfOrigin: 'India',
    localContentPercentage: 68.5, // 68.5% (Meets Class-I Local Supplier >= 50%)
    declaredClassification: 'CLASS_I_LOCAL_SUPPLIER',
    declarationDate: '2026-01-10',
    statutoryAuditorCertAttached: true,
    supportingDocument: 'Auditor_Certificate_MII_ABC.pdf',
    verificationStatus: 'COMPLIANT',
    verificationSource: 'SYNTHETIC_MII_DECLARATION_REGISTRY',
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    declarationId: 'MII-DECL-002',
    bidderName: 'Apex Industrial Protective Equipments LLP',
    panNumber: 'SYNPA0002L',
    tenderId: 't1',
    productName: 'Personal Protective Workwear & Eyewear',
    countryOfOrigin: 'India',
    localContentPercentage: 35.0, // 35% (Class-II Local Supplier 20% - 50%)
    declaredClassification: 'CLASS_II_LOCAL_SUPPLIER',
    declarationDate: '2026-01-12',
    statutoryAuditorCertAttached: true,
    supportingDocument: 'MII_Self_Declaration_Apex.pdf',
    verificationStatus: 'COMPLIANT',
    verificationSource: 'SYNTHETIC_MII_DECLARATION_REGISTRY',
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    declarationId: 'MII-DECL-005',
    bidderName: 'Kavach Safety Equipment Manufacturing Limited',
    panNumber: 'SYNPA0005C',
    tenderId: 't1',
    productName: 'Imported Heavy Fall Arrest Hardware',
    countryOfOrigin: 'Non-India',
    localContentPercentage: 12.0, // 12% (< 20% Non-Local Supplier - Ineligible if MII Class-I is mandatory)
    declaredClassification: 'NON_LOCAL_SUPPLIER',
    declarationDate: '2026-01-08',
    statutoryAuditorCertAttached: false,
    supportingDocument: 'Import_Declaration_Kavach.pdf',
    verificationStatus: 'NON_COMPLIANT_FOR_CLASS_I_TENDERS',
    verificationSource: 'SYNTHETIC_MII_DECLARATION_REGISTRY',
    lastVerifiedAt: new Date().toISOString(),
  },
];

module.exports = {
  SYNTHETIC_LOCAL_CONTENT_RECORDS,
  findLocalContentRecord: (declId) => {
    if (!declId) return null;
    const clean = declId.trim().toUpperCase();
    return SYNTHETIC_LOCAL_CONTENT_RECORDS.find(r => r.declarationId === clean || r.panNumber === clean) || null;
  }
};
