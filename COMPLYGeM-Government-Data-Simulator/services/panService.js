const express = require('express');
const router = express.Router();
const { findPanRecord, SYNTHETIC_PAN_RECORDS } = require('../datasets/panDataset');
const { formatSuccessResponse, formatNotFoundResponse, formatErrorResponse } = require('../shared/responseFormatter');
const { findGstByPan } = require('../datasets/gstDataset');
const { findUdyamByPan } = require('../datasets/udyamDataset');
const { SYNTHETIC_MCA_RECORDS } = require('../datasets/mcaDataset');
const { findEpfoByPan } = require('../datasets/epfoDataset');
const { findStartupByPan } = require('../datasets/startupDataset');
const { checkBlacklistStatus } = require('../datasets/blacklistDataset');
const { findTaxRecord } = require('../datasets/incomeTaxDataset');
const { SYNTHETIC_ESIC_RECORDS } = require('../datasets/esicDataset');
const { SYNTHETIC_GEM_SELLER_RECORDS } = require('../datasets/gemDataset');
const { SYNTHETIC_NSIC_RECORDS } = require('../datasets/nsicDataset');
const { SYNTHETIC_BIS_RECORDS } = require('../datasets/bisDataset');
const { SYNTHETIC_LOCAL_CONTENT_RECORDS } = require('../datasets/localContentDataset');

/**
 * GET /api/pan/lookup-bundle/:panNumber
 * Returns complete correlated government registry data (PAN, GSTN, Address, Udyam, MCA21, EPFO, ESIC, GeM, ITR) for instant auto-fill.
 */
router.get('/lookup-bundle/:panNumber', (req, res) => {
  try {
    const { panNumber } = req.params;
    const cleanPan = (panNumber || '').trim().toUpperCase();

    const panRecord = findPanRecord(cleanPan);
    const gstRecord = findGstByPan(cleanPan);
    const udyamRecord = findUdyamByPan(cleanPan);
    
    // Correlate MCA by legal name
    const candidateName = panRecord?.legalName || gstRecord?.legalName || udyamRecord?.enterpriseName || '';
    const mcaRecord = candidateName 
      ? SYNTHETIC_MCA_RECORDS.find(m => m.legalName?.toLowerCase().trim() === candidateName.toLowerCase().trim() ||
                                        candidateName.toLowerCase().includes(m.legalName?.toLowerCase()) ||
                                        m.legalName?.toLowerCase().includes(candidateName.toLowerCase()))
      : null;

    const taxRecord = findTaxRecord(cleanPan);
    const epfoRecord = findEpfoByPan(cleanPan);
    const esicRecord = SYNTHETIC_ESIC_RECORDS.find(e => (candidateName && e.employerName?.toLowerCase().includes(candidateName.toLowerCase())));
    const startupRecord = findStartupByPan(cleanPan);
    const gemRecord = SYNTHETIC_GEM_SELLER_RECORDS.find(g => g.panNumber === cleanPan || (gstRecord && g.gstin === gstRecord.gstin) || (candidateName && g.organizationName?.toLowerCase().includes(candidateName.toLowerCase())));
    const nsicRecord = SYNTHETIC_NSIC_RECORDS.find(n => (candidateName && n.unitName?.toLowerCase().includes(candidateName.toLowerCase())));
    const bisRecord = SYNTHETIC_BIS_RECORDS.find(b => (candidateName && b.licenseeName?.toLowerCase().includes(candidateName.toLowerCase())));
    const miiRecord = SYNTHETIC_LOCAL_CONTENT_RECORDS.find(m => (candidateName && m.supplierName?.toLowerCase().includes(candidateName.toLowerCase())));
    const blacklistRecord = checkBlacklistStatus(cleanPan);

    if (!panRecord && !gstRecord && !udyamRecord && !mcaRecord) {
      return res.status(404).json(
        formatNotFoundResponse({
          authority: 'Unified Government Data Gateway',
          registryId: 'pan_bundle',
          identifier: cleanPan,
          message: `No government statutory records found for PAN "${cleanPan}".`
        })
      );
    }

    const legalName = panRecord?.legalName || gstRecord?.legalName || udyamRecord?.enterpriseName || mcaRecord?.legalName || '';
    const state = gstRecord?.principalPlaceOfBusiness?.state || mcaRecord?.registeredState || udyamRecord?.location?.state || 'Karnataka';
    const district = gstRecord?.principalPlaceOfBusiness?.district || udyamRecord?.location?.district || 'Bengaluru';
    const pincode = gstRecord?.principalPlaceOfBusiness?.pincode || udyamRecord?.location?.pincode || '560001';
    const fullAddress = gstRecord?.principalPlaceOfBusiness?.address || mcaRecord?.registeredAddress || (udyamRecord?.location ? `${district}, ${state} - ${pincode}` : '');

    return res.json({
      found: true,
      panNumber: cleanPan,
      legalName,
      tradeName: gstRecord?.tradeName || legalName,
      entityType: panRecord?.entityType || mcaRecord?.companyType || 'Private Limited Company',
      status: panRecord?.status || 'ACTIVE',
      panActive: panRecord?.status === 'ACTIVE',
      jurisdiction: panRecord?.jurisdiction || 'DCIT/ITO Corporate Ward, Bengaluru',
      dateOfIncorporation: panRecord?.dateOfIncorporation || mcaRecord?.incorporationDate || '2018-06-15',
      aadhaarLinked: panRecord?.aadhaarLinked ?? true,

      // Registered Address Details
      registeredAddress: fullAddress,
      state,
      district,
      pincode,

      // GSTN Details
      gstin: gstRecord?.gstin || '',
      gstLegalName: gstRecord?.legalName || legalName,
      gstTradeName: gstRecord?.tradeName || legalName,
      gstStatus: gstRecord?.registrationStatus || (gstRecord ? 'ACTIVE' : 'NOT_FOUND'),
      taxpayerType: gstRecord?.taxpayerType || 'Regular',
      gstFilingFrequency: gstRecord?.filingStatus?.frequency || 'Monthly',
      gstComplianceScore: gstRecord?.complianceRating || '10/10',

      // MSME Udyam Details
      udyamNumber: udyamRecord?.udyamRegistrationNumber || '',
      enterpriseName: udyamRecord?.enterpriseName || legalName,
      enterpriseType: udyamRecord?.enterpriseType || 'Small Enterprise',
      majorActivity: udyamRecord?.majorActivity || 'Manufacturing & Technical Solutions',
      nicCode: udyamRecord?.nic2DigitCode || '26 - Manufacture of Computer, Electronic & Optical Products',

      // MCA21 Corporate Details
      cinNumber: mcaRecord?.cinOrLlpin || '',
      companyType: mcaRecord?.companyType || 'Private Limited Company',
      rocLocation: mcaRecord?.rocLocation || 'ROC Bengaluru',
      authorisedCapital: mcaRecord?.authorisedCapital || 50000000,
      paidUpCapital: mcaRecord?.paidUpCapital || 25000000,
      directors: mcaRecord?.directors || [
        { din: '08123456', name: 'Vikramaditya Rao', designation: 'Director' },
        { din: '08123457', name: 'Sunita Krishnan', designation: 'Managing Director' }
      ],

      // Income Tax (ITR) Profile
      taxFilingStatus: taxRecord?.filingRegularity || 'Regular (Last 3 AYs Filed)',
      latestAssessmentYear: taxRecord?.assessmentYear || '2025-26',
      itrFormType: taxRecord?.itrForm || 'ITR-6 (Corporate)',
      grossTurnover: taxRecord?.grossTotalIncome || 48500000,
      taxAuditApplicable: taxRecord?.auditApplicable ?? true,

      // Labour Welfare (EPFO & ESIC)
      epfoEstablishmentId: epfoRecord?.establishmentId || '',
      epfoStatus: epfoRecord ? 'ACTIVE / Regular Contributions' : 'Exempt / Not Applicable',
      esicEmployerCode: esicRecord?.employerCode || '',
      esicStatus: esicRecord ? 'ACTIVE / Regular Compliance' : 'Compliant',

      // GeM Marketplace Seller Details
      gemSellerId: gemRecord?.sellerId || 'GEM-SELLER-1001',
      gemRating: gemRecord?.sellerRating || 4.8,
      gemVerified: gemRecord ? true : true,
      gemPrimaryCategory: gemRecord?.primaryCategory || 'Safety Equipment & Electronic Instruments',

      // Industry Certifications & MII
      startupRegNumber: startupRecord?.recognitionNumber || '',
      isDpiitRecognized: !!startupRecord,
      nsicRegistrationNumber: nsicRecord?.registrationNumber || '',
      bisLicenseNumber: bisRecord?.licenseNumber || '',
      localContentPercentage: miiRecord?.localContentPercentage || 78,
      miiClass: miiRecord?.supplierClass || 'Class-I Local Supplier (>= 50%)',

      // Blacklist / Debarment Verification
      isDebarred: blacklistRecord?.isDebarred || false,
      debarmentDetails: blacklistRecord?.isDebarred ? blacklistRecord : null,

      source: 'CENTRALIZED_GOVERNMENT_SIMULATOR_GATEWAYS',
      is_simulated: true,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json(formatErrorResponse({ error: err.message }));
  }
});

/**
 * GET /api/pan/:panNumber
 * Returns verified PAN registry profile from Income Tax Department (CBDT) simulation.
 */
router.get('/:panNumber', (req, res) => {
  try {
    const { panNumber } = req.params;
    const record = findPanRecord(panNumber);

    if (!record) {
      return res.status(404).json(
        formatNotFoundResponse({
          authority: 'Income Tax Department (CBDT)',
          registryId: 'pan',
          identifier: panNumber,
          message: `PAN "${panNumber}" not found in CBDT simulated database.`
        })
      );
    }

    const verificationStatus = record.status === 'ACTIVE' ? 'VERIFIED' : record.status;

    return res.json(
      formatSuccessResponse({
        authority: 'Central Board of Direct Taxes (CBDT)',
        source: 'SIMULATED_CBDT_PAN_REGISTRY',
        registryId: 'pan',
        identifier: panNumber.toUpperCase(),
        verificationStatus,
        data: record
      })
    );
  } catch (err) {
    return res.status(500).json(formatErrorResponse({ error: err.message }));
  }
});

/**
 * POST /api/pan/verify-otp
 * Simulates Aadhaar/PAN OTP validation.
 */
router.post('/verify-otp', (req, res) => {
  try {
    const { panNumber, otp, aadhaarLast4 } = req.body;
    const record = findPanRecord(panNumber);

    if (!record) {
      return res.status(404).json(
        formatNotFoundResponse({
          authority: 'Income Tax Department (CBDT)',
          registryId: 'pan',
          identifier: panNumber,
        })
      );
    }

    // Prototype rule: OTP '123456' is valid for demo
    const isValid = otp === '123456' || otp === '999999';

    return res.json({
      found: true,
      verification_status: isValid ? 'OTP_VERIFIED' : 'INVALID_OTP',
      panNumber: record.panNumber,
      holderName: record.legalName,
      aadhaarLinked: record.aadhaarLinked,
      aadhaarMasked: `XXXX-XXXX-${aadhaarLast4 || '8921'}`,
      is_simulated: true,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json(formatErrorResponse({ error: err.message }));
  }
});

/**
 * GET /api/pan
 * List all simulated PAN records (Telemetry/Dev inspection)
 */
router.get('/', (req, res) => {
  res.json({
    count: SYNTHETIC_PAN_RECORDS.length,
    authority: 'Central Board of Direct Taxes (CBDT)',
    is_simulated: true,
    data: SYNTHETIC_PAN_RECORDS
  });
});

module.exports = router;
