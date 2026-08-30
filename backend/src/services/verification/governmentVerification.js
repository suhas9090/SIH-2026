/**
 * Government Verification Service — Mock/Demo Mode
 * 
 * All responses are clearly labelled as MOCK/DEMO data.
 * Real API connections can be plugged in by replacing individual provider methods.
 */

const DEMO_MODE = process.env.DEMO_MODE !== 'false';

const verifyAll = async (bidder) => {
  const results = [];

  if (bidder.gstin) {
    results.push(await verifyGST(bidder.gstin, bidder.organizationName));
  }
  if (bidder.pan) {
    results.push(await verifyPAN(bidder.pan, bidder.organizationName));
  }
  if (bidder.udyamNo) {
    results.push(await verifyUdyam(bidder.udyamNo, bidder.organizationName));
  }
  if (bidder.cinNo) {
    results.push(await verifyMCA(bidder.cinNo, bidder.organizationName));
  }

  results.push(await verifyBlacklist(bidder.organizationName, bidder.pan));
  results.push(await verifyEPFO(bidder.organizationName));

  return results;
};

const verifyGST = async (gstin, orgName) => {
  if (!DEMO_MODE) {
    // Real GST API integration point
    // const response = await realGSTAPI.verify(gstin);
    throw new Error('Real GST API not configured. Set DEMO_MODE=false only with real credentials.');
  }

  // Validate GSTIN format: 15 characters
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const isValidFormat = gstinRegex.test(gstin.toUpperCase());

  return {
    source: 'GST_PORTAL',
    entityId: gstin,
    status: isValidFormat ? 'MOCK_VERIFIED' : 'FAILED',
    isMockData: true,
    verifiedData: {
      gstin: gstin.toUpperCase(),
      legalName: orgName,
      tradeName: orgName,
      status: 'ACTIVE',
      registrationDate: '2019-04-01',
      state: 'Karnataka',
      businessType: 'Private Limited',
      returnFilingStatus: 'Regular',
      note: '[SANDBOX] This is demo data — not real GST portal verification.'
    }
  };
};

const verifyPAN = async (pan, orgName) => {
  if (!DEMO_MODE) {
    throw new Error('Real PAN API not configured.');
  }

  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const isValidFormat = panRegex.test(pan.toUpperCase());

  return {
    source: 'PAN_INCOME_TAX',
    entityId: pan,
    status: isValidFormat ? 'MOCK_VERIFIED' : 'FAILED',
    isMockData: true,
    verifiedData: {
      pan: pan.toUpperCase(),
      name: orgName,
      entityType: 'Company',
      status: 'ACTIVE',
      filingStatus: 'COMPLIANT',
      lastITRFiled: 'AY 2024-25',
      note: '[SANDBOX] This is demo data — not real Income Tax portal verification.'
    }
  };
};

const verifyUdyam = async (udyamNo, orgName) => {
  if (!DEMO_MODE) {
    throw new Error('Real Udyam API not configured.');
  }

  const udyamRegex = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/;
  const isValidFormat = udyamRegex.test(udyamNo.toUpperCase());

  return {
    source: 'UDYAM_PORTAL',
    entityId: udyamNo,
    status: isValidFormat ? 'MOCK_VERIFIED' : 'FAILED',
    isMockData: true,
    verifiedData: {
      udyamNo: udyamNo.toUpperCase(),
      enterpriseName: orgName,
      category: 'Small',
      majorActivity: 'Manufacturing',
      socialCategory: 'General',
      dateOfRegistration: '2020-07-01',
      note: '[SANDBOX] This is demo data — not real Udyam portal verification.'
    }
  };
};

const verifyMCA = async (cinNo, orgName) => {
  if (!DEMO_MODE) {
    throw new Error('Real MCA API not configured.');
  }

  return {
    source: 'MCA_PORTAL',
    entityId: cinNo,
    status: 'MOCK_VERIFIED',
    isMockData: true,
    verifiedData: {
      cin: cinNo,
      companyName: orgName,
      status: 'ACTIVE',
      incorporationDate: '2015-06-15',
      companyType: 'Private Limited',
      registeredState: 'Karnataka',
      note: '[SANDBOX] This is demo data — not real MCA portal verification.'
    }
  };
};

const verifyBlacklist = async (orgName, pan) => {
  if (!DEMO_MODE) {
    throw new Error('Real blacklist API not configured.');
  }

  // Demo: not blacklisted
  return {
    source: 'BLACKLIST_REGISTRY',
    entityId: pan || orgName,
    status: 'MOCK_VERIFIED',
    isMockData: true,
    verifiedData: {
      isBlacklisted: false,
      isDebarred: false,
      checkDate: new Date().toISOString(),
      registries: ['GeM Blacklist', 'CVC Debarment List', 'Ministry Debarment List'],
      result: 'NO_ADVERSE_RECORD',
      note: '[SANDBOX] This is demo data — not a real blacklist check.'
    }
  };
};

const verifyEPFO = async (orgName) => {
  if (!DEMO_MODE) {
    throw new Error('Real EPFO API not configured.');
  }

  return {
    source: 'EPFO_PORTAL',
    entityId: orgName,
    status: 'MOCK_VERIFIED',
    isMockData: true,
    verifiedData: {
      establishmentName: orgName,
      pFRegistrationNo: `KR/DEMO/${Date.now().toString().slice(-6)}`,
      status: 'ACTIVE',
      employeeCount: '50-100',
      complianceStatus: 'REGULAR',
      note: '[SANDBOX] This is demo data — not real EPFO verification.'
    }
  };
};

module.exports = { verifyAll, verifyGST, verifyPAN, verifyUdyam, verifyMCA, verifyBlacklist, verifyEPFO };
