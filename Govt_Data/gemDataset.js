/**
 * Synthetic Government e-Marketplace (GeM) Seller Verification Dataset
 * DISCLAIMER: Purely SYNTHETIC / FICTIONAL data for prototype demonstration.
 */

const SYNTHETIC_GEM_SELLER_RECORDS = [
  {
    sellerId: 'GEM-SELLER-1001',
    sellerName: 'ABC Safety Technologies Private Limited',
    panNumber: 'SYNPA0001C',
    gstin: '29SYNPA0001C1Z5',
    udyamNumber: 'UDYAM-KR-03-0012345',
    registrationDate: '2019-01-10',
    sellerStatus: 'ACTIVE',
    sellerRating: 4.8,
    businessCategory: 'OEM_MANUFACTURER',
    productCategories: ['Safety Equipment', 'Industrial Workwear', 'Fall Protection'],
    accountStatus: 'VERIFIED',
    blacklistingStatus: 'NOT_BLACKLISTED',
    debarmentStatus: 'NONE',
    incidentHistoryCount: 0,
    verificationSource: 'SYNTHETIC_GEM_SELLER_REGISTRY',
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    sellerId: 'GEM-SELLER-1002',
    sellerName: 'Apex Industrial Protective Equipments LLP',
    panNumber: 'SYNPA0002L',
    gstin: '27SYNPA0002L1Z2',
    udyamNumber: 'UDYAM-MH-01-0023456',
    registrationDate: '2020-04-15',
    sellerStatus: 'ACTIVE',
    sellerRating: 4.4,
    businessCategory: 'RESELLER',
    productCategories: ['Helmets', 'Safety Shoes', 'Protective Gloves'],
    accountStatus: 'VERIFIED',
    blacklistingStatus: 'NOT_BLACKLISTED',
    debarmentStatus: 'NONE',
    incidentHistoryCount: 1,
    verificationSource: 'SYNTHETIC_GEM_SELLER_REGISTRY',
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    sellerId: 'GEM-SELLER-1006',
    sellerName: 'Global Shield Corporation India Private Limited',
    panNumber: 'SYNPA0006C',
    gstin: '19SYNPA0006C1Z4',
    udyamNumber: null,
    registrationDate: '2017-03-10',
    sellerStatus: 'DEBARRED', // Debarred GeM Seller
    sellerRating: 1.2,
    businessCategory: 'RESELLER',
    productCategories: ['Security Infrastructure'],
    accountStatus: 'SUSPENDED',
    blacklistingStatus: 'BLACKLISTED',
    debarmentStatus: 'DEBARRED_TILL_2028',
    incidentHistoryCount: 5,
    verificationSource: 'SYNTHETIC_GEM_SELLER_REGISTRY',
    lastVerifiedAt: new Date().toISOString(),
  },
];

module.exports = {
  SYNTHETIC_GEM_SELLER_RECORDS,
  findGemSellerRecord: (sellerId) => {
    if (!sellerId) return null;
    const clean = sellerId.trim().toUpperCase();
    return SYNTHETIC_GEM_SELLER_RECORDS.find(r => r.sellerId === clean || r.panNumber === clean) || null;
  }
};
