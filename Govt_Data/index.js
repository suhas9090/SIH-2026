/**
 * =============================================================================
 * COMPLYGEM GOVT_DATA MASTER REGULATORY REPOSITORY & LOOKUP ENGINE
 * =============================================================================
 * 
 * Centralized mock/synthetic government verification data repository.
 * Contains high-fidelity datasets representing official Indian Government portals:
 * - CBDT / Income Tax (PAN, ITR Returns)
 * - GSTN (GSTIN, Filing regularity, Taxpayer profile)
 * - Ministry of MSME (Udyam Enterprise Registry, Classification)
 * - Ministry of Corporate Affairs (MCA21, ROC, DIN Directors)
 * - Ministry of Labour / EPFO & ESIC (Social Security & Statutory Dues)
 * - Central Debarment & Blacklist Registry (CVC, GeM Incident Management)
 * - Bureau of Indian Standards (BIS / ISI Quality Marks)
 * - DigiLocker Document Signature & Verification Gateway
 * - GeM Seller Registry & Incident Tracking
 * - Make in India (MII / Public Procurement Preference Local Content)
 * - NSIC Single Point Registration
 * - DPIIT Startup India Recognition
 * - Officer & Auditor Authorized Directories
 * - 10 Linked Bidder Test Scenarios
 */

const { SYNTHETIC_AADHAAR_RECORDS, findAadhaarRecord, findAadhaarByPan } = require('./aadhaarDataset');
const { SYNTHETIC_PAN_RECORDS, findPanRecord } = require('./panDataset');
const { SYNTHETIC_UDYAM_RECORDS, findUdyamRecord, findUdyamByPan } = require('./udyamDataset');
const { SYNTHETIC_GST_RECORDS, findGstRecord, findGstByPan } = require('./gstDataset');
const { SYNTHETIC_INCOME_TAX_RECORDS, findTaxRecord } = require('./incomeTaxDataset');
const { SYNTHETIC_MCA_RECORDS, findMcaRecord, findMcaByPan } = require('./mcaDataset');
const { SYNTHETIC_EPFO_RECORDS, findEpfoRecord, findEpfoByPan } = require('./epfoDataset');
const { SYNTHETIC_ESIC_RECORDS, findEsicRecord } = require('./esicDataset');
const { SYNTHETIC_BLACKLIST_RECORDS, checkBlacklistStatus } = require('./blacklistDataset');
const { SYNTHETIC_BIS_RECORDS, findBisRecord } = require('./bisDataset');
const { SYNTHETIC_DIGILOCKER_RECORDS, findDigilockerRecord } = require('./digilockerDataset');
const { SYNTHETIC_GEM_SELLER_RECORDS, findGemSellerRecord } = require('./gemDataset');
const { SYNTHETIC_LOCAL_CONTENT_RECORDS, findLocalContentRecord } = require('./localContentDataset');
const { SYNTHETIC_NSIC_RECORDS, findNsicRecord } = require('./nsicDataset');
const { SYNTHETIC_STARTUP_RECORDS, findStartupRecord, findStartupByPan } = require('./startupDataset');
const { SYNTHETIC_OFFICER_DIRECTORY, findOfficerRecord } = require('./officerDirectory');
const { SYNTHETIC_AUDITOR_DIRECTORY, findAuditorRecord } = require('./auditorDirectory');
const { BIDDER_SCENARIOS, findScenarioById } = require('./bidderScenarios');

// Registry Metadata Dictionary
const REGISTRIES = {
  aadhaar: {
    id: 'aadhaar',
    name: 'Unique Identification Authority of India (UIDAI) - Aadhaar Demo Identity',
    authority: 'UIDAI',
    identifierType: 'Aadhaar (12-digit numeric)',
    count: SYNTHETIC_AADHAAR_RECORDS.length,
    dataset: SYNTHETIC_AADHAAR_RECORDS,
    finder: (id, options = {}) => findAadhaarRecord(id) || (options.pan ? findAadhaarByPan(options.pan) : null),
  },
  pan: {
    id: 'pan',
    name: 'Income Tax Department (CBDT) - Permanent Account Number',
    authority: 'Central Board of Direct Taxes',
    identifierType: 'PAN (10-character alphanumeric)',
    count: SYNTHETIC_PAN_RECORDS.length,
    dataset: SYNTHETIC_PAN_RECORDS,
    finder: (id) => findPanRecord(id),
  },
  gst: {
    id: 'gst',
    name: 'Goods and Services Tax Network (GSTN)',
    authority: 'GST Council / CBIC',
    identifierType: 'GSTIN (15-character alphanumeric)',
    count: SYNTHETIC_GST_RECORDS.length,
    dataset: SYNTHETIC_GST_RECORDS,
    finder: (id, options = {}) => findGstRecord(id) || (options.pan ? findGstByPan(options.pan) : null),
  },
  udyam: {
    id: 'udyam',
    name: 'Udyam MSME Enterprise Registry',
    authority: 'Ministry of Micro, Small and Medium Enterprises',
    identifierType: 'Udyam Registration Number (e.g., UDYAM-XX-00-0000000)',
    count: SYNTHETIC_UDYAM_RECORDS.length,
    dataset: SYNTHETIC_UDYAM_RECORDS,
    finder: (id, options = {}) => findUdyamRecord(id) || (options.pan ? findUdyamByPan(options.pan) : null),
  },
  mca: {
    id: 'mca',
    name: 'Ministry of Corporate Affairs (MCA21 / ROC)',
    authority: 'Ministry of Corporate Affairs',
    identifierType: 'Corporate Identity Number (CIN) / LLPIN',
    count: SYNTHETIC_MCA_RECORDS.length,
    dataset: SYNTHETIC_MCA_RECORDS,
    finder: (id) => findMcaRecord(id),
  },
  income_tax: {
    id: 'income_tax',
    name: 'Income Tax Return (ITR) Compliance & CPC Gateway',
    authority: 'Centralized Processing Center, Bengaluru',
    identifierType: 'PAN',
    count: SYNTHETIC_INCOME_TAX_RECORDS.length,
    dataset: SYNTHETIC_INCOME_TAX_RECORDS,
    finder: (id) => findTaxRecord(id),
  },
  epfo: {
    id: 'epfo',
    name: "Employees' Provident Fund Organisation (Shram Suvidha)",
    authority: 'Ministry of Labour and Employment',
    identifierType: 'EPFO Establishment ID / PAN',
    count: SYNTHETIC_EPFO_RECORDS.length,
    dataset: SYNTHETIC_EPFO_RECORDS,
    finder: (id, options = {}) => findEpfoRecord(id) || (options.pan ? findEpfoByPan(options.pan) : null),
  },
  esic: {
    id: 'esic',
    name: "Employees' State Insurance Corporation",
    authority: 'Ministry of Labour and Employment',
    identifierType: 'ESIC Employer Code / Sub-code',
    count: SYNTHETIC_ESIC_RECORDS.length,
    dataset: SYNTHETIC_ESIC_RECORDS,
    finder: (id) => findEsicRecord(id),
  },
  blacklist: {
    id: 'blacklist',
    name: 'Central Debarment, Blacklist & Vigilance Database',
    authority: 'Central Vigilance Commission / GeM Incident Oversight',
    identifierType: 'PAN / GSTIN / CIN / Legal Name',
    count: SYNTHETIC_BLACKLIST_RECORDS.length,
    dataset: SYNTHETIC_BLACKLIST_RECORDS,
    finder: (id) => {
      const res = checkBlacklistStatus(id);
      return res.isBlacklisted ? res.record : null;
    },
  },
  bis: {
    id: 'bis',
    name: 'Bureau of Indian Standards (BIS Manak Online)',
    authority: 'Ministry of Consumer Affairs, Food & Public Distribution',
    identifierType: 'BIS License / Standard Certificate Number',
    count: SYNTHETIC_BIS_RECORDS.length,
    dataset: SYNTHETIC_BIS_RECORDS,
    finder: (id) => findBisRecord(id),
  },
  digilocker: {
    id: 'digilocker',
    name: 'DigiLocker Document Verification Gateway',
    authority: 'National e-Governance Division (NeGD) / MeitY',
    identifierType: 'Document URI / Identifier / Hash',
    count: SYNTHETIC_DIGILOCKER_RECORDS.length,
    dataset: SYNTHETIC_DIGILOCKER_RECORDS,
    finder: (id) => findDigilockerRecord(id),
  },
  gem: {
    id: 'gem',
    name: 'Government e-Marketplace (GeM) Seller Registry',
    authority: 'GeM SPV, Ministry of Commerce & Industry',
    identifierType: 'GeM Seller ID / PAN',
    count: SYNTHETIC_GEM_SELLER_RECORDS.length,
    dataset: SYNTHETIC_GEM_SELLER_RECORDS,
    finder: (id) => findGemSellerRecord(id),
  },
  local_content: {
    id: 'local_content',
    name: 'Make in India (MII) / Public Procurement Preference Registry',
    authority: 'DPIIT, Ministry of Commerce & Industry',
    identifierType: 'MII Declaration ID / PAN',
    count: SYNTHETIC_LOCAL_CONTENT_RECORDS.length,
    dataset: SYNTHETIC_LOCAL_CONTENT_RECORDS,
    finder: (id) => findLocalContentRecord(id),
  },
  nsic: {
    id: 'nsic',
    name: 'National Small Industries Corporation (Single Point Registration)',
    authority: 'Ministry of MSME',
    identifierType: 'NSIC SPR Registration Number',
    count: SYNTHETIC_NSIC_RECORDS.length,
    dataset: SYNTHETIC_NSIC_RECORDS,
    finder: (id) => findNsicRecord(id),
  },
  startup: {
    id: 'startup',
    name: 'Startup India / DPIIT Recognition Portal',
    authority: 'DPIIT, Ministry of Commerce & Industry',
    identifierType: 'DIPP Certificate Number / PAN',
    count: SYNTHETIC_STARTUP_RECORDS.length,
    dataset: SYNTHETIC_STARTUP_RECORDS,
    finder: (id, options = {}) => findStartupRecord(id) || (options.pan ? findStartupByPan(options.pan) : null),
  },
  officers: {
    id: 'officers',
    name: 'Authorized Government Procurement Officers Directory',
    authority: 'Central HRMS / CPWD / Railways / Defence',
    identifierType: 'Employee ID',
    count: SYNTHETIC_OFFICER_DIRECTORY.length,
    dataset: SYNTHETIC_OFFICER_DIRECTORY,
    finder: (id) => findOfficerRecord(id),
  },
  auditors: {
    id: 'auditors',
    name: 'Authorized Compliance Auditors & CAG Reviewers Directory',
    authority: 'Comptroller & Auditor General of India / CVC',
    identifierType: 'Auditor ID',
    count: SYNTHETIC_AUDITOR_DIRECTORY.length,
    dataset: SYNTHETIC_AUDITOR_DIRECTORY,
    finder: (id) => findAuditorRecord(id),
  },
  scenarios: {
    id: 'scenarios',
    name: 'Pre-Configured Judge & Evaluator Bidder Scenarios',
    authority: 'SIH 2026 Evaluation Framework',
    identifierType: 'Scenario ID',
    count: BIDDER_SCENARIOS.length,
    dataset: BIDDER_SCENARIOS,
    finder: (id) => findScenarioById(id),
  }
};

/**
 * Check whether a specific identifier is present in a government registry.
 * 
 * @param {string} registry - Registry key (e.g. 'pan', 'gst', 'udyam', 'mca', 'blacklist', etc.)
 * @param {string} identifier - The ID/Code to verify
 * @param {object} [options] - Additional search parameters (e.g. { pan, legalName })
 * @returns {object} Presence verification result
 */
function checkPresence(registry, identifier, options = {}) {
  const normRegistry = (registry || '').toLowerCase().trim().replace(/[-\s]/g, '_');
  const regConfig = REGISTRIES[normRegistry];

  if (!regConfig) {
    return {
      isPresent: false,
      registry,
      identifier,
      status: 'REGISTRY_NOT_FOUND',
      message: `Unknown registry "${registry}". Available registries: ${Object.keys(REGISTRIES).join(', ')}`,
      timestamp: new Date().toISOString(),
    };
  }

  if (!identifier) {
    return {
      isPresent: false,
      registry: regConfig.id,
      registryName: regConfig.name,
      identifier: null,
      status: 'IDENTIFIER_EMPTY',
      message: 'No identifier provided for registry check',
      timestamp: new Date().toISOString(),
    };
  }

  const record = regConfig.finder(identifier, options);
  const isPresent = !!record;

  return {
    isPresent,
    registry: regConfig.id,
    registryName: regConfig.name,
    authority: regConfig.authority,
    identifier,
    status: isPresent ? 'RECORD_PRESENT' : 'RECORD_NOT_FOUND',
    message: isPresent 
      ? `Record successfully found in ${regConfig.name}` 
      : `Identifier "${identifier}" was not found in ${regConfig.name}`,
    record: record || null,
    source: 'GOVT_DATA_MOCK_REPOSITORY',
    isMockData: true,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Check presence across all government registries simultaneously for a bidder profile
 */
function checkAllRegistriesForBidder(bidder = {}) {
  const {
    pan,
    gstin,
    udyamNo,
    cinNo,
    epfoEstablishmentId,
    esicEmployerId,
    bisCertNo,
    digilockerDocId,
    gemSellerId,
    localContentDeclId,
    nsicRegistrationNo,
    startupRecognitionNo,
    organizationName,
  } = bidder;

  const results = {};
  let totalChecked = 0;
  let presentCount = 0;
  let missingCount = 0;

  const checks = [
    { key: 'pan', id: pan, options: { legalName: organizationName } },
    { key: 'gst', id: gstin, options: { pan, legalName: organizationName } },
    { key: 'udyam', id: udyamNo, options: { pan, legalName: organizationName } },
    { key: 'mca', id: cinNo, options: { legalName: organizationName } },
    { key: 'income_tax', id: pan, options: {} },
    { key: 'epfo', id: epfoEstablishmentId, options: { pan } },
    { key: 'esic', id: esicEmployerId, options: {} },
    { key: 'blacklist', id: pan || gstin || cinNo || organizationName, options: {} },
    { key: 'bis', id: bisCertNo, options: { pan } },
    { key: 'digilocker', id: digilockerDocId, options: { pan } },
    { key: 'gem', id: gemSellerId, options: { pan } },
    { key: 'local_content', id: localContentDeclId, options: { pan } },
    { key: 'nsic', id: nsicRegistrationNo, options: {} },
    { key: 'startup', id: startupRecognitionNo, options: { pan } },
  ];

  for (const check of checks) {
    if (check.id) {
      totalChecked++;
      const res = checkPresence(check.key, check.id, check.options);
      results[check.key] = res;
      if (res.isPresent) presentCount++;
      else missingCount++;
    }
  }

  // Blacklist check is special — presence in blacklist means critical risk!
  const isDebarred = results.blacklist ? results.blacklist.isPresent : false;

  return {
    organizationName: organizationName || 'Unknown Entity',
    totalChecked,
    presentCount,
    missingCount,
    isDebarred,
    presenceScore: totalChecked > 0 ? Math.round((presentCount / totalChecked) * 100) : 0,
    registries: results,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Global search across all datasets
 */
function searchAllRegistries(query) {
  if (!query || typeof query !== 'string') return [];
  const q = query.trim().toUpperCase();
  const matched = [];

  for (const [key, reg] of Object.entries(REGISTRIES)) {
    const hits = reg.dataset.filter(item => {
      const str = JSON.stringify(item).toUpperCase();
      return str.includes(q);
    });

    if (hits.length > 0) {
      matched.push({
        registry: key,
        registryName: reg.name,
        matchCount: hits.length,
        records: hits,
      });
    }
  }

  return matched;
}

/**
 * Summary telemetry of entire Govt_Data repository
 */
function getSummary() {
  const registryStats = {};
  let totalRecords = 0;

  for (const [key, reg] of Object.entries(REGISTRIES)) {
    registryStats[key] = {
      name: reg.name,
      authority: reg.authority,
      count: reg.count,
    };
    totalRecords += reg.count;
  }

  return {
    folder: 'Govt_Data',
    description: 'Centralized Mock Indian Government Verification Repository for ComplyGeM AI',
    disclaimer: 'SYNTHETIC_REGULATORY_DATA: High-fidelity simulated records used for compliance verification.',
    totalRegistries: Object.keys(REGISTRIES).length,
    totalRecords,
    registries: registryStats,
  };
}

module.exports = {
  // Master API Engine
  REGISTRIES,
  checkPresence,
  checkAllRegistriesForBidder,
  searchAllRegistries,
  getSummary,

  // Individual Datasets
  SYNTHETIC_PAN_RECORDS,
  SYNTHETIC_UDYAM_RECORDS,
  SYNTHETIC_GST_RECORDS,
  SYNTHETIC_INCOME_TAX_RECORDS,
  SYNTHETIC_MCA_RECORDS,
  SYNTHETIC_EPFO_RECORDS,
  SYNTHETIC_ESIC_RECORDS,
  SYNTHETIC_BLACKLIST_RECORDS,
  SYNTHETIC_BIS_RECORDS,
  SYNTHETIC_DIGILOCKER_RECORDS,
  SYNTHETIC_GEM_SELLER_RECORDS,
  SYNTHETIC_LOCAL_CONTENT_RECORDS,
  SYNTHETIC_NSIC_RECORDS,
  SYNTHETIC_STARTUP_RECORDS,
  SYNTHETIC_OFFICER_DIRECTORY,
  SYNTHETIC_AUDITOR_DIRECTORY,
  BIDDER_SCENARIOS,

  // Finder Helpers
  findAadhaarRecord,
  findAadhaarByPan,
  findPanRecord,
  findUdyamRecord,
  findUdyamByPan,
  findGstRecord,
  findGstByPan,
  findTaxRecord,
  findMcaRecord,
  findMcaByPan,
  findEpfoRecord,
  findEpfoByPan,
  findEsicRecord,
  checkBlacklistStatus,
  findBisRecord,
  findDigilockerRecord,
  findGemSellerRecord,
  findLocalContentRecord,
  findNsicRecord,
  findStartupRecord,
  findStartupByPan,
  findOfficerRecord,
  findAuditorRecord,
  findScenarioById,
};
