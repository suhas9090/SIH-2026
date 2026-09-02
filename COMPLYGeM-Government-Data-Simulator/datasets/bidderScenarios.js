/**
 * Synthetic Bidder Test Scenarios (10 Linked Case Studies)
 * Designed for SIH 2026 Live Demonstrations & Autonomous Testing.
 * 
 * Each scenario maps a complete corporate profile to linked synthetic databases,
 * producing distinctly varied compliance decisions (Compliant, Discrepant, Debarred, etc.).
 */

const BIDDER_SCENARIOS = [
  {
    scenarioId: 'SCENARIO-01-COMPLIANT',
    title: 'Scenario 1: 100% Fully Compliant Bidder',
    description: 'All statutory IDs match across CBDT, GSTN, Udyam, MCA, and EPFO. Class-I Local Content (68.5%) and valid BIS certifications.',
    expectedOutcome: {
      complianceScore: 98,
      riskLevel: 'LOW',
      recommendation: 'RECOMMENDED_FOR_COMMERCIAL_OPENING',
      flagCount: 0,
    },
    bidderProfile: {
      organizationName: 'ABC Safety Technologies Private Limited',
      pan: 'SYNPA0001C',
      gstin: '29SYNPA0001C1Z5',
      udyamNo: 'UDYAM-KR-03-0012345',
      cinNo: 'U29100KA2018PTC112233',
      contactName: 'Suresh Patil',
      contactEmail: 'suresh@abcsafetytech.com',
      contactPhone: '+91 98801 12345',
      address: 'Plot 42, Peenya Industrial Area, Phase II, Bengaluru, Karnataka 560058',
      turnoverDeclared: 185000000, // INR 18.5 Cr
      experienceYearsDeclared: 6,
      localContentDeclared: 68.5,
      isMsme: true,
      isStartup: false,
    }
  },
  {
    scenarioId: 'SCENARIO-02-NAME-MISMATCH',
    title: 'Scenario 2: Legal Name Discrepancy (Cross-Portal Mismatch)',
    description: 'PAN records list "Apex Industrial Protective Equipments LLP" while GST records list "Apex Safety Solutions LLP". Flagged for human review.',
    expectedOutcome: {
      complianceScore: 78,
      riskLevel: 'MEDIUM',
      recommendation: 'REQUIRES_HUMAN_REVIEW',
      flagCount: 1,
    },
    bidderProfile: {
      organizationName: 'Apex Safety Solutions LLP',
      pan: 'SYNPA0002L',
      gstin: '27SYNPA0002L1Z2',
      udyamNo: 'UDYAM-MH-01-0023456',
      cinNo: 'AAQ-1234',
      contactName: 'Nitin Roy',
      contactEmail: 'nitin@apexsafety.in',
      contactPhone: '+91 98200 54321',
      address: 'Unit 104, MIDC Industrial Zone, Andheri East, Mumbai 400093',
      turnoverDeclared: 32000000,
      experienceYearsDeclared: 4,
      localContentDeclared: 35.0,
      isMsme: true,
      isStartup: true,
    }
  },
  {
    scenarioId: 'SCENARIO-03-GST-SUSPENDED',
    title: 'Scenario 3: Inactive PAN & Suspended GSTIN',
    description: 'Bidder submitted an inactive PAN and GST registration has been suspended by tax authorities for non-filing of GSTR-3B.',
    expectedOutcome: {
      complianceScore: 42,
      riskLevel: 'HIGH',
      recommendation: 'NON_COMPLIANT_STATUTORY_DEFAULT',
      flagCount: 2,
    },
    bidderProfile: {
      organizationName: 'Zenith Protection Gear & Safety Works',
      pan: 'SYNPA0003P',
      gstin: '07SYNPA0003P1Z9',
      udyamNo: 'UDYAM-DL-02-0034567',
      cinNo: null,
      contactName: 'Anil Gupta',
      contactEmail: 'anil@zenithgear.com',
      contactPhone: '+91 98110 98765',
      address: 'Shop 12, Okhla Industrial Area Phase I, New Delhi 110020',
      turnoverDeclared: 12000000,
      experienceYearsDeclared: 8,
      localContentDeclared: 40.0,
      isMsme: true,
      isStartup: false,
    }
  },
  {
    scenarioId: 'SCENARIO-04-UDYAM-CLASSIFICATION',
    title: 'Scenario 4: Valid Enterprise with Medium MSME Classification',
    description: 'High-turnover defence manufacturer registered under Medium MSME category with valid CBDT & GST compliance.',
    expectedOutcome: {
      complianceScore: 94,
      riskLevel: 'LOW',
      recommendation: 'RECOMMENDED_FOR_COMMERCIAL_OPENING',
      flagCount: 0,
    },
    bidderProfile: {
      organizationName: 'Paramount Defence Gear Private Limited',
      pan: 'SYNPA0004C',
      gstin: '36SYNPA0004C1Z1',
      udyamNo: 'UDYAM-TS-05-0045678',
      cinNo: 'U14101TG2020PTC123456',
      contactName: 'Kavita Reddy',
      contactEmail: 'kavita@paramounttactical.in',
      contactPhone: '+91 99490 11223',
      address: 'Sector 5, HITEC City, Hyderabad, Telangana 500081',
      turnoverDeclared: 920000000,
      experienceYearsDeclared: 5,
      localContentDeclared: 75.0,
      isMsme: true,
      isStartup: false,
    }
  },
  {
    scenarioId: 'SCENARIO-05-EXPIRED-CERT-LOW-LOCAL-CONTENT',
    title: 'Scenario 5: Expired BIS Standard & Low Local Content (< 20%)',
    description: 'Submitted ISI standard certification CM/L-8899005 expired in 2023. Local content declared at only 12% (Non-Local Supplier).',
    expectedOutcome: {
      complianceScore: 54,
      riskLevel: 'HIGH',
      recommendation: 'NON_COMPLIANT_TECHNICAL_CRITERIA',
      flagCount: 2,
    },
    bidderProfile: {
      organizationName: 'Kavach Safety Equipment Manufacturing Limited',
      pan: 'SYNPA0005C',
      gstin: '33SYNPA0005C1Z7',
      udyamNo: 'UDYAM-TN-04-0056789',
      cinNo: 'U32909TN2017PLC098765',
      contactName: 'M. S. Sundaram',
      contactEmail: 'sundaram@kavachgear.com',
      contactPhone: '+91 98400 33445',
      address: '88 Guindy Industrial Estate, Chennai, Tamil Nadu 600032',
      turnoverDeclared: 1450000000,
      experienceYearsDeclared: 7,
      localContentDeclared: 12.0,
      isMsme: false,
      isStartup: false,
    }
  },
  {
    scenarioId: 'SCENARIO-06-BLACKLISTED-DEBARRED',
    title: 'Scenario 6: Debarred Entity on Central Debarment Database',
    description: 'Matches active 5-year debarment order by CVC & GeM Debarment Committee for fraudulent test documentation.',
    expectedOutcome: {
      complianceScore: 10,
      riskLevel: 'CRITICAL',
      recommendation: 'REJECT_STATUTORY_DEBARMENT',
      flagCount: 3,
    },
    bidderProfile: {
      organizationName: 'Global Shield Corporation India Private Limited',
      pan: 'SYNPA0006C',
      gstin: '19SYNPA0006C1Z4',
      udyamNo: null,
      cinNo: 'U74999DL2016PTC298765',
      contactName: 'Devraj Sen',
      contactEmail: 'devraj@globalshieldcorp.in',
      contactPhone: '+91 98300 77889',
      address: 'Sector V, Salt Lake, Kolkata, West Bengal 700091',
      turnoverDeclared: 50000000,
      experienceYearsDeclared: 8,
      localContentDeclared: 30.0,
      isMsme: false,
      isStartup: false,
    }
  },
  {
    scenarioId: 'SCENARIO-07-TAX-DEMAND-OUTSTANDING',
    title: 'Scenario 7: Income Tax Disputed Demand & DPIIT Startup',
    description: 'Recognized DPIIT Startup (DIPP10007) with active GST compliance, but Income Tax record flags an outstanding tax demand.',
    expectedOutcome: {
      complianceScore: 82,
      riskLevel: 'MEDIUM',
      recommendation: 'REQUIRES_OFFICER_CLARIFICATION',
      flagCount: 1,
    },
    bidderProfile: {
      organizationName: 'Vanguard Security Works LLP',
      pan: 'SYNPA0007L',
      gstin: '27SYNPA0007L1Z8',
      udyamNo: null,
      cinNo: 'AAZ-9988',
      contactName: 'Tanvi Shah',
      contactEmail: 'tanvi@vanguardsecurity.io',
      contactPhone: '+91 98900 11998',
      address: 'Magarpatta Cybercity, Tower 7, Pune, Maharashtra 411028',
      turnoverDeclared: 14200000,
      experienceYearsDeclared: 3,
      localContentDeclared: 62.0,
      isMsme: false,
      isStartup: true,
    }
  },
  {
    scenarioId: 'SCENARIO-08-EPFO-ESIC-DEFAULT',
    title: 'Scenario 8: EPFO / Labor Statutory Contribution Deficit',
    description: 'Valid GST and PAN records, but EPFO database reflects INR 4.80 Lakhs in defaulted employee provident fund dues.',
    expectedOutcome: {
      complianceScore: 71,
      riskLevel: 'MEDIUM',
      recommendation: 'REQUIRES_HUMAN_REVIEW',
      flagCount: 1,
    },
    bidderProfile: {
      organizationName: 'Reliable Industrial Workwear Private Limited',
      pan: 'SYNPA0008C',
      gstin: '24SYNPA0008C1Z6',
      udyamNo: 'UDYAM-GJ-01-0089012',
      cinNo: 'U14105GJ2019PTC106789',
      contactName: 'Harsh Patel',
      contactEmail: 'harsh@reliableworkwear.co.in',
      contactPhone: '+91 98250 44556',
      address: 'GIDC Industrial Estate, Vatva, Ahmedabad, Gujarat 382445',
      turnoverDeclared: 290000000,
      experienceYearsDeclared: 5,
      localContentDeclared: 55.0,
      isMsme: true,
      isStartup: false,
    }
  },
  {
    scenarioId: 'SCENARIO-09-MCA-STRUCK-OFF',
    title: 'Scenario 9: Company Struck Off by ROC (Defunct Entity)',
    description: 'MCA database indicates company legal status is STRUCK_OFF under Section 248 of the Companies Act. Ineligible to execute government contracts.',
    expectedOutcome: {
      complianceScore: 18,
      riskLevel: 'CRITICAL',
      recommendation: 'REJECT_LEGAL_ENTITY_DEFUNCT',
      flagCount: 2,
    },
    bidderProfile: {
      organizationName: 'Titan Protective Gears Private Limited',
      pan: 'SYNPA0009C',
      gstin: '06SYNPA0009C1Z3',
      udyamNo: null,
      cinNo: 'U35999HR2014PTC054321',
      contactName: 'Manish Bhatia',
      contactEmail: 'manish@titangears.in',
      contactPhone: '+91 98100 66778',
      address: 'Udyog Vihar Phase IV, Gurugram, Haryana 122016',
      turnoverDeclared: 8500000,
      experienceYearsDeclared: 10,
      localContentDeclared: 45.0,
      isMsme: false,
      isStartup: false,
    }
  },
  {
    scenarioId: 'SCENARIO-10-MULTI-FAILURE-CRITICAL',
    title: 'Scenario 10: Multi-Factor Discrepancy & Unverifiable Credentials',
    description: 'Multiple compounding discrepancies: Unregistered on Udyam, invalid digital signature on DigiLocker, and turnover below mandatory tender threshold.',
    expectedOutcome: {
      complianceScore: 35,
      riskLevel: 'HIGH',
      recommendation: 'REJECT_MULTIPLE_FAILURES',
      flagCount: 3,
    },
    bidderProfile: {
      organizationName: 'Shree Ram Industrial Supplies Private Limited',
      pan: 'SYNPA0010C',
      gstin: '08SYNPA0010C1Z0',
      udyamNo: null,
      cinNo: 'U32909RJ2015PTC047890',
      contactName: 'Gopal Sharma',
      contactEmail: 'gopal@shreeramsupplies.com',
      contactPhone: '+91 94140 88990',
      address: 'VKIA Industrial Area Road No 14, Jaipur, Rajasthan 302013',
      turnoverDeclared: 18000000,
      experienceYearsDeclared: 9,
      localContentDeclared: 42.0,
      isMsme: false,
      isStartup: false,
    }
  },
];

module.exports = {
  BIDDER_SCENARIOS,
  findScenarioById: (scenarioId) => {
    if (!scenarioId) return null;
    return BIDDER_SCENARIOS.find(s => s.scenarioId === scenarioId) || null;
  }
};
