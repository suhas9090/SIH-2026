/**
 * Synthetic Udyam / MSME Verification Dataset (Ministry of MSME)
 * DISCLAIMER: All data in this file is purely SYNTHETIC / FICTIONAL for prototype demonstration.
 */

const SYNTHETIC_UDYAM_RECORDS = [
  {
    udyamRegistrationNumber: 'UDYAM-KR-03-0012345',
    enterpriseName: 'ABC Safety Technologies Private Limited',
    panNumber: 'SYNPA0001C',
    gstin: '29SYNPA0001C1Z5',
    enterpriseType: 'SMALL',
    organisationType: 'Private Limited Company',
    dateOfRegistration: '2020-08-12',
    majorActivity: 'MANUFACTURING',
    nicCode: '32909',
    nicDescription: 'Manufacture of other protective safety equipment not elsewhere classified',
    investmentInPlantAndMachinery: 42000000, // INR 4.20 Cr (Within Small Enterprise limit <= INR 10 Cr)
    annualTurnover: 185000000, // INR 18.50 Cr (Within Small Enterprise limit <= INR 50 Cr)
    classification: 'SMALL',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    registrationStatus: 'ACTIVE',
    validity: 'PERMANENT',
    verificationSource: 'SYNTHETIC_UDYAM_REGISTRY',
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    udyamRegistrationNumber: 'UDYAM-MH-01-0023456',
    enterpriseName: 'Apex Industrial Protective Equipments LLP',
    panNumber: 'SYNPA0002L',
    gstin: '27SYNPA0002L1Z2',
    enterpriseType: 'MICRO',
    organisationType: 'Limited Liability Partnership',
    dateOfRegistration: '2021-02-14',
    majorActivity: 'TRADING_SERVICES',
    nicCode: '46599',
    nicDescription: 'Wholesale of personal safety gear and workwear',
    investmentInPlantAndMachinery: 8500000, // INR 85 Lakhs (Micro <= INR 1 Cr)
    annualTurnover: 32000000, // INR 3.20 Cr (Micro <= INR 5 Cr)
    classification: 'MICRO',
    state: 'Maharashtra',
    district: 'Mumbai City',
    registrationStatus: 'ACTIVE',
    validity: 'PERMANENT',
    verificationSource: 'SYNTHETIC_UDYAM_REGISTRY',
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    udyamRegistrationNumber: 'UDYAM-DL-02-0034567',
    enterpriseName: 'Zenith Protection Gear & Safety Works',
    panNumber: 'SYNPA0003P',
    gstin: '07SYNPA0003P1Z9',
    enterpriseType: 'MICRO',
    organisationType: 'Proprietorship',
    dateOfRegistration: '2016-11-04',
    majorActivity: 'MANUFACTURING',
    nicCode: '32909',
    nicDescription: 'Manufacture of safety helmets',
    investmentInPlantAndMachinery: 4500000,
    annualTurnover: 12000000,
    classification: 'MICRO',
    state: 'Delhi',
    district: 'South Delhi',
    registrationStatus: 'EXPIRED_TRANSITION_REQUIRED', // Requires re-classification
    validity: 'PENDING_RENEWAL',
    verificationSource: 'SYNTHETIC_UDYAM_REGISTRY',
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    udyamRegistrationNumber: 'UDYAM-TS-05-0045678',
    enterpriseName: 'Paramount Defence Gear Private Limited',
    panNumber: 'SYNPA0004C',
    gstin: '36SYNPA0004C1Z1',
    enterpriseType: 'MEDIUM',
    organisationType: 'Private Limited Company',
    dateOfRegistration: '2020-09-18',
    majorActivity: 'MANUFACTURING',
    nicCode: '14101',
    nicDescription: 'Manufacture of tactical all-weather apparel and ballistic vests',
    investmentInPlantAndMachinery: 280000000, // INR 28 Cr (Medium <= INR 50 Cr)
    annualTurnover: 920000000, // INR 92 Cr (Medium <= INR 250 Cr)
    classification: 'MEDIUM',
    state: 'Telangana',
    district: 'Hyderabad',
    registrationStatus: 'ACTIVE',
    validity: 'PERMANENT',
    verificationSource: 'SYNTHETIC_UDYAM_REGISTRY',
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    udyamRegistrationNumber: 'UDYAM-TN-04-0056789',
    enterpriseName: 'Kavach Safety Equipment Manufacturing Limited',
    panNumber: 'SYNPA0005C',
    gstin: '33SYNPA0005C1Z7',
    enterpriseType: 'MEDIUM',
    organisationType: 'Public Limited Company',
    dateOfRegistration: '2018-03-22',
    majorActivity: 'MANUFACTURING',
    nicCode: '32909',
    nicDescription: 'Manufacture of fall arrest harnesses and lifelines',
    investmentInPlantAndMachinery: 380000000, // INR 38 Cr
    annualTurnover: 1450000000, // INR 145 Cr
    classification: 'MEDIUM',
    state: 'Tamil Nadu',
    district: 'Chennai',
    registrationStatus: 'ACTIVE',
    validity: 'PERMANENT',
    verificationSource: 'SYNTHETIC_UDYAM_REGISTRY',
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    udyamRegistrationNumber: 'UDYAM-GJ-01-0089012',
    enterpriseName: 'Reliable Industrial Workwear Private Limited',
    panNumber: 'SYNPA0008C',
    gstin: '24SYNPA0008C1Z6',
    enterpriseType: 'SMALL',
    organisationType: 'Private Limited Company',
    dateOfRegistration: '2021-06-10',
    majorActivity: 'MANUFACTURING',
    nicCode: '14105',
    nicDescription: 'Manufacture of industrial fire-retardant protective garments',
    investmentInPlantAndMachinery: 68000000, // INR 6.8 Cr
    annualTurnover: 290000000, // INR 29 Cr
    classification: 'SMALL',
    state: 'Gujarat',
    district: 'Ahmedabad',
    registrationStatus: 'ACTIVE',
    validity: 'PERMANENT',
    verificationSource: 'SYNTHETIC_UDYAM_REGISTRY',
    lastVerifiedAt: new Date().toISOString(),
  },
];

module.exports = {
  SYNTHETIC_UDYAM_RECORDS,
  findUdyamRecord: (udyamNo) => {
    if (!udyamNo) return null;
    const cleanUdyam = udyamNo.trim().toUpperCase();
    return SYNTHETIC_UDYAM_RECORDS.find(r => r.udyamRegistrationNumber === cleanUdyam) || null;
  },
  findUdyamByPan: (pan) => {
    if (!pan) return null;
    const cleanPan = pan.trim().toUpperCase();
    return SYNTHETIC_UDYAM_RECORDS.find(r => r.panNumber === cleanPan) || null;
  }
};
