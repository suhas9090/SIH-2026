/**
 * Synthetic Ministry of Corporate Affairs (MCA21 / ROC) Dataset
 * DISCLAIMER: All director names and company data in this file are purely SYNTHETIC / FICTIONAL.
 */

const SYNTHETIC_MCA_RECORDS = [
  {
    cinOrLlpin: 'U29100KA2018PTC112233',
    legalName: 'ABC Safety Technologies Private Limited',
    companyType: 'Private Limited Company',
    incorporationDate: '2018-06-15',
    registeredAddress: 'Plot 42, Peenya Industrial Area, Phase II, Bengaluru, Karnataka 560058',
    companyStatus: 'ACTIVE',
    authorisedCapital: 50000000,
    paidUpCapital: 25000000,
    directors: [
      { din: '08123456', name: 'Vikramaditya Rao (Synthetic)', appointmentDate: '2018-06-15', designation: 'Director' },
      { din: '08123457', name: 'Sunita Krishnan (Synthetic)', appointmentDate: '2018-06-15', designation: 'Managing Director' },
    ],
    annualFilingStatus: 'COMPLIANT_FY24_25',
    financialStatementFilingStatus: 'FILED_AOC4',
    lastFilingDate: '2025-10-30',
    registeredState: 'Karnataka',
    rocLocation: 'ROC Bengaluru',
    verificationSource: 'SYNTHETIC_MCA21_REGISTRY',
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    cinOrLlpin: 'AAQ-1234',
    legalName: 'Apex Industrial Protective Equipments LLP',
    companyType: 'Limited Liability Partnership',
    incorporationDate: '2019-11-20',
    registeredAddress: 'Unit 104, MIDC Industrial Zone, Andheri East, Mumbai, Maharashtra 400093',
    companyStatus: 'ACTIVE',
    authorisedCapital: 10000000,
    paidUpCapital: 10000000,
    directors: [
      { din: '08987654', name: 'Rohan Deshmukh (Synthetic)', appointmentDate: '2019-11-20', designation: 'Designated Partner' },
      { din: '08987655', name: 'Ananya Iyer (Synthetic)', appointmentDate: '2020-04-01', designation: 'Designated Partner' },
    ],
    annualFilingStatus: 'COMPLIANT_FY24_25',
    financialStatementFilingStatus: 'FILED_FORM8',
    lastFilingDate: '2025-10-20',
    registeredState: 'Maharashtra',
    rocLocation: 'ROC Mumbai',
    verificationSource: 'SYNTHETIC_MCA21_REGISTRY',
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    cinOrLlpin: 'U74999DL2016PTC298765',
    legalName: 'Global Shield Corporation India Private Limited',
    companyType: 'Private Limited Company',
    incorporationDate: '2016-04-22',
    registeredAddress: 'Sector V, Salt Lake, Kolkata, West Bengal 700091',
    companyStatus: 'UNDER_LIQUIDATION', // Under liquidation / Insolvency test case
    authorisedCapital: 20000000,
    paidUpCapital: 5000000,
    directors: [
      { din: '07111222', name: 'Devraj Sen (Synthetic)', appointmentDate: '2016-04-22', designation: 'Director (Disqualified under Sec 164)' },
    ],
    annualFilingStatus: 'DEFAULTER_3_YEARS',
    financialStatementFilingStatus: 'NOT_FILED',
    lastFilingDate: '2022-09-15',
    registeredState: 'West Bengal',
    rocLocation: 'ROC Kolkata',
    verificationSource: 'SYNTHETIC_MCA21_REGISTRY',
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    cinOrLlpin: 'U18101DL2020PTC367890',
    legalName: 'Paramount Defence Gear Private Limited',
    companyType: 'Private Limited Company',
    incorporationDate: '2020-01-14',
    registeredAddress: 'Hardware Park, Shamshabad, Hyderabad, Telangana 501218',
    companyStatus: 'ACTIVE',
    authorisedCapital: 100000000,
    paidUpCapital: 75000000,
    directors: [
      { din: '08555666', name: 'Kavitha Reddy (Synthetic)', appointmentDate: '2020-01-14', designation: 'Managing Director' },
    ],
    annualFilingStatus: 'COMPLIANT_FY24_25',
    financialStatementFilingStatus: 'FILED_AOC4',
    lastFilingDate: '2025-10-25',
    registeredState: 'Telangana',
    rocLocation: 'ROC Hyderabad',
    verificationSource: 'SYNTHETIC_MCA21_REGISTRY',
    lastVerifiedAt: new Date().toISOString(),
  },
];

module.exports = {
  SYNTHETIC_MCA_RECORDS,
  findMcaRecord: (cinOrLlpin) => {
    if (!cinOrLlpin) return null;
    const clean = cinOrLlpin.trim().toUpperCase();
    return SYNTHETIC_MCA_RECORDS.find(r => r.cinOrLlpin === clean) || null;
  }
};
