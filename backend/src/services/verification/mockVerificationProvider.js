/**
 * Mock / Synthetic Government Verification Provider
 * 
 * Implements the BaseVerificationProvider using high-fidelity synthetic regulatory datasets.
 * Clearly labels all records as SYNTHETIC / DEMO DATA for transparent evaluation.
 */

const { BaseVerificationProvider } = require('./providerInterface');
const { findPanRecord } = require('./syntheticData/panDataset');
const { findGstRecord, findGstByPan } = require('./syntheticData/gstDataset');
const { findUdyamRecord, findUdyamByPan } = require('./syntheticData/udyamDataset');
const { findMcaRecord } = require('./syntheticData/mcaDataset');
const { findTaxRecord } = require('./syntheticData/incomeTaxDataset');
const { findEpfoRecord, findEpfoByPan } = require('./syntheticData/epfoDataset');
const { findEsicRecord } = require('./syntheticData/esicDataset');
const { findStartupRecord, findStartupByPan } = require('./syntheticData/startupDataset');
const { findNsicRecord } = require('./syntheticData/nsicDataset');
const { findGemSellerRecord } = require('./syntheticData/gemDataset');
const { findDigilockerRecord } = require('./syntheticData/digilockerDataset');
const { findBisRecord } = require('./syntheticData/bisDataset');
const { findLocalContentRecord } = require('./syntheticData/localContentDataset');
const { checkBlacklistStatus } = require('./syntheticData/blacklistDataset');

class MockVerificationProvider extends BaseVerificationProvider {
  constructor() {
    super('SYNTHETIC_MOCK_GOVERNMENT_PROVIDER', true);
  }

  async verifyPAN(pan, expectedLegalName) {
    const record = findPanRecord(pan);
    const isValidFormat = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(pan || '');

    if (!record) {
      return {
        verificationType: 'PAN',
        inputValue: pan,
        referenceValue: null,
        result: isValidFormat ? 'NOT_FOUND_IN_REGISTRY' : 'INVALID_FORMAT',
        confidence: isValidFormat ? 0.6 : 0.1,
        source: 'SYNTHETIC_REGULATORY_DATASET',
        isSynthetic: true,
        disclaimer: 'PROTOTYPE VERIFICATION: Synthetic Regulatory Dataset (Production connects to authorized Income Tax Department API)',
        status: 'UNVERIFIED',
        details: { message: `PAN ${pan} was not found in synthetic CBDT registry.` },
        timestamp: new Date().toISOString(),
      };
    }

    const isNameMatch = !expectedLegalName || 
      record.legalName.toLowerCase().includes(expectedLegalName.toLowerCase()) ||
      expectedLegalName.toLowerCase().includes(record.legalName.toLowerCase());

    return {
      verificationType: 'PAN',
      inputValue: pan,
      referenceValue: record.panNumber,
      result: record.panActive && isNameMatch ? 'MATCH' : (!record.panActive ? 'PAN_INACTIVE' : 'NAME_MISMATCH'),
      confidence: 0.98,
      source: 'SYNTHETIC_REGULATORY_DATASET',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Synthetic Regulatory Dataset (Production connects to authorized Income Tax Department API)',
      status: record.panActive && isNameMatch ? 'VERIFIED' : 'DISCREPANCY_DETECTED',
      data: record,
      timestamp: new Date().toISOString(),
    };
  }

  async verifyGST(gstin, expectedLegalName, expectedPan) {
    const record = findGstRecord(gstin) || (expectedPan ? findGstByPan(expectedPan) : null);
    const isValidFormat = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(gstin || '');

    if (!record) {
      return {
        verificationType: 'GST',
        inputValue: gstin,
        referenceValue: null,
        result: isValidFormat ? 'NOT_FOUND_IN_REGISTRY' : 'INVALID_FORMAT',
        confidence: isValidFormat ? 0.6 : 0.1,
        source: 'SYNTHETIC_REGULATORY_DATASET',
        isSynthetic: true,
        disclaimer: 'PROTOTYPE VERIFICATION: Synthetic Regulatory Dataset (Production connects to authorized GSTN API)',
        status: 'UNVERIFIED',
        details: { message: `GSTIN ${gstin} was not found in synthetic GSTN registry.` },
        timestamp: new Date().toISOString(),
      };
    }

    const isNameMatch = !expectedLegalName ||
      record.legalName.toLowerCase().includes(expectedLegalName.toLowerCase()) ||
      expectedLegalName.toLowerCase().includes(record.legalName.toLowerCase()) ||
      record.tradeName.toLowerCase().includes(expectedLegalName.toLowerCase());

    const isPanMatch = !expectedPan || record.panNumber.toUpperCase() === expectedPan.trim().toUpperCase();

    const isCompliant = record.registrationStatus === 'ACTIVE' && isNameMatch && isPanMatch;

    return {
      verificationType: 'GST',
      inputValue: gstin,
      referenceValue: record.gstin,
      result: isCompliant ? 'MATCH' : (!isPanMatch ? 'PAN_GST_RELATIONSHIP_MISMATCH' : (record.registrationStatus !== 'ACTIVE' ? `STATUS_${record.registrationStatus}` : 'NAME_MISMATCH')),
      confidence: 0.98,
      source: 'SYNTHETIC_REGULATORY_DATASET',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Synthetic Regulatory Dataset (Production connects to authorized GSTN API)',
      status: isCompliant ? 'VERIFIED' : 'DISCREPANCY_DETECTED',
      data: record,
      timestamp: new Date().toISOString(),
    };
  }

  async verifyUdyam(udyamNumber, expectedLegalName, expectedPan) {
    const record = findUdyamRecord(udyamNumber) || (expectedPan ? findUdyamByPan(expectedPan) : null);

    if (!record) {
      return {
        verificationType: 'UDYAM',
        inputValue: udyamNumber,
        referenceValue: null,
        result: 'NOT_FOUND_IN_REGISTRY',
        confidence: 0.6,
        source: 'SYNTHETIC_REGULATORY_DATASET',
        isSynthetic: true,
        disclaimer: 'PROTOTYPE VERIFICATION: Synthetic Regulatory Dataset (Production connects to authorized Udyam API)',
        status: 'NOT_REGISTERED_OR_NOT_FOUND',
        timestamp: new Date().toISOString(),
      };
    }

    const isPanMatch = !expectedPan || record.panNumber.toUpperCase() === expectedPan.trim().toUpperCase();
    const isCompliant = record.registrationStatus === 'ACTIVE' && isPanMatch;

    return {
      verificationType: 'UDYAM',
      inputValue: udyamNumber,
      referenceValue: record.udyamRegistrationNumber,
      result: isCompliant ? 'MATCH' : (!isPanMatch ? 'PAN_UDYAM_MISMATCH' : 'REGISTRATION_EXPIRED_OR_INACTIVE'),
      confidence: 0.98,
      source: 'SYNTHETIC_REGULATORY_DATASET',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Synthetic Regulatory Dataset (Production connects to authorized Ministry of MSME API)',
      status: isCompliant ? 'VERIFIED' : 'DISCREPANCY_DETECTED',
      data: record,
      timestamp: new Date().toISOString(),
    };
  }

  async verifyMCA(cinOrLlpin, expectedLegalName) {
    const record = findMcaRecord(cinOrLlpin);

    if (!record) {
      return {
        verificationType: 'MCA',
        inputValue: cinOrLlpin,
        referenceValue: null,
        result: 'NOT_FOUND_IN_REGISTRY',
        confidence: 0.6,
        source: 'SYNTHETIC_REGULATORY_DATASET',
        isSynthetic: true,
        disclaimer: 'PROTOTYPE VERIFICATION: Synthetic Regulatory Dataset (Production connects to authorized MCA21 API)',
        status: 'UNVERIFIED',
        timestamp: new Date().toISOString(),
      };
    }

    const isCompliant = record.companyStatus === 'ACTIVE';

    return {
      verificationType: 'MCA',
      inputValue: cinOrLlpin,
      referenceValue: record.cinOrLlpin,
      result: isCompliant ? 'MATCH' : `COMPANY_STATUS_${record.companyStatus}`,
      confidence: 0.98,
      source: 'SYNTHETIC_REGULATORY_DATASET',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Synthetic Regulatory Dataset (Production connects to authorized MCA21 API)',
      status: isCompliant ? 'VERIFIED' : 'DISCREPANCY_DETECTED',
      data: record,
      timestamp: new Date().toISOString(),
    };
  }

  async verifyIncomeTax(pan) {
    const record = findTaxRecord(pan);

    if (!record) {
      return {
        verificationType: 'INCOME_TAX_COMPLIANCE',
        inputValue: pan,
        referenceValue: null,
        result: 'NO_TAX_RECORDS_FOUND',
        confidence: 0.5,
        source: 'SYNTHETIC_REGULATORY_DATASET',
        isSynthetic: true,
        status: 'UNVERIFIED',
        timestamp: new Date().toISOString(),
      };
    }

    const isCompliant = record.taxComplianceStatus === 'COMPLIANT' && record.outstandingDemand === 0;

    return {
      verificationType: 'INCOME_TAX_COMPLIANCE',
      inputValue: pan,
      referenceValue: record.panNumber,
      result: isCompliant ? 'COMPLIANT' : (record.outstandingDemand > 0 ? 'DEMAND_OUTSTANDING' : record.taxComplianceStatus),
      confidence: 0.98,
      source: 'SYNTHETIC_REGULATORY_DATASET',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Synthetic Regulatory Dataset (Production connects to authorized Income Tax e-filing API)',
      status: isCompliant ? 'VERIFIED' : 'DISCREPANCY_DETECTED',
      data: record,
      timestamp: new Date().toISOString(),
    };
  }

  async verifyEPFO(establishmentId, expectedPan) {
    const record = findEpfoRecord(establishmentId) || (expectedPan ? findEpfoByPan(expectedPan) : null);

    if (!record) {
      return {
        verificationType: 'EPFO',
        inputValue: establishmentId,
        referenceValue: null,
        result: 'NOT_FOUND_IN_REGISTRY',
        confidence: 0.6,
        source: 'SYNTHETIC_REGULATORY_DATASET',
        isSynthetic: true,
        status: 'UNVERIFIED',
        timestamp: new Date().toISOString(),
      };
    }

    const isCompliant = record.complianceStatus === 'COMPLIANT' && record.pendingContributions === 0;

    return {
      verificationType: 'EPFO',
      inputValue: establishmentId,
      referenceValue: record.establishmentId,
      result: isCompliant ? 'COMPLIANT' : 'PENDING_STATUTORY_CONTRIBUTIONS',
      confidence: 0.95,
      source: 'SYNTHETIC_REGULATORY_DATASET',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Synthetic Regulatory Dataset (Production connects to authorized Shram Suvidha EPFO API)',
      status: isCompliant ? 'VERIFIED' : 'DISCREPANCY_DETECTED',
      data: record,
      timestamp: new Date().toISOString(),
    };
  }

  async verifyESIC(employerId) {
    const record = findEsicRecord(employerId);

    if (!record) {
      return {
        verificationType: 'ESIC',
        inputValue: employerId,
        referenceValue: null,
        result: 'NOT_FOUND_IN_REGISTRY',
        confidence: 0.6,
        source: 'SYNTHETIC_REGULATORY_DATASET',
        isSynthetic: true,
        status: 'UNVERIFIED',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      verificationType: 'ESIC',
      inputValue: employerId,
      referenceValue: record.registrationNumber,
      result: record.complianceStatus === 'COMPLIANT' ? 'COMPLIANT' : 'PENDING_ARREARS',
      confidence: 0.95,
      source: 'SYNTHETIC_REGULATORY_DATASET',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Synthetic Regulatory Dataset (Production connects to authorized ESIC API)',
      status: record.complianceStatus === 'COMPLIANT' ? 'VERIFIED' : 'DISCREPANCY_DETECTED',
      data: record,
      timestamp: new Date().toISOString(),
    };
  }

  async verifyStartup(recognitionNumber, expectedPan) {
    const record = findStartupRecord(recognitionNumber) || (expectedPan ? findStartupByPan(expectedPan) : null);

    if (!record) {
      return {
        verificationType: 'STARTUP_INDIA',
        inputValue: recognitionNumber,
        referenceValue: null,
        result: 'NOT_RECOGNIZED_STARTUP',
        confidence: 0.7,
        source: 'SYNTHETIC_REGULATORY_DATASET',
        isSynthetic: true,
        status: 'NOT_APPLICABLE',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      verificationType: 'STARTUP_INDIA',
      inputValue: recognitionNumber,
      referenceValue: record.recognitionNumber,
      result: record.recognitionStatus === 'ACTIVE' ? 'ACTIVE_DPIIT_STARTUP' : 'EXPIRED_OR_INACTIVE',
      confidence: 0.98,
      source: 'SYNTHETIC_REGULATORY_DATASET',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Synthetic Regulatory Dataset (Production connects to authorized DPIIT Startup Portal API)',
      status: record.recognitionStatus === 'ACTIVE' ? 'VERIFIED' : 'DISCREPANCY_DETECTED',
      data: record,
      timestamp: new Date().toISOString(),
    };
  }

  async verifyNSIC(registrationNumber) {
    const record = findNsicRecord(registrationNumber);

    if (!record) {
      return {
        verificationType: 'NSIC',
        inputValue: registrationNumber,
        referenceValue: null,
        result: 'NOT_FOUND_IN_REGISTRY',
        confidence: 0.6,
        source: 'SYNTHETIC_REGULATORY_DATASET',
        isSynthetic: true,
        status: 'UNVERIFIED',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      verificationType: 'NSIC',
      inputValue: registrationNumber,
      referenceValue: record.nsicRegistrationNumber,
      result: record.certificateStatus === 'ACTIVE' ? 'ACTIVE_NSIC_REGISTRATION' : 'EXPIRED_REGISTRATION',
      confidence: 0.98,
      source: 'SYNTHETIC_REGULATORY_DATASET',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Synthetic Regulatory Dataset (Production connects to authorized NSIC API)',
      status: record.certificateStatus === 'ACTIVE' ? 'VERIFIED' : 'DISCREPANCY_DETECTED',
      data: record,
      timestamp: new Date().toISOString(),
    };
  }

  async verifyGeM(sellerId, expectedPan) {
    const record = findGemSellerRecord(sellerId) || (expectedPan ? findGemSellerRecord(expectedPan) : null);

    if (!record) {
      return {
        verificationType: 'GEM_SELLER',
        inputValue: sellerId,
        referenceValue: null,
        result: 'NOT_REGISTERED_ON_GEM',
        confidence: 0.6,
        source: 'SYNTHETIC_REGULATORY_DATASET',
        isSynthetic: true,
        status: 'UNVERIFIED',
        timestamp: new Date().toISOString(),
      };
    }

    const isDebarred = record.blacklistingStatus === 'BLACKLISTED' || record.debarmentStatus !== 'NONE';

    return {
      verificationType: 'GEM_SELLER',
      inputValue: sellerId,
      referenceValue: record.sellerId,
      result: isDebarred ? 'DEBARRED_SELLER' : (record.accountStatus === 'VERIFIED' ? 'ACTIVE_VERIFIED_SELLER' : 'ACCOUNT_SUSPENDED'),
      confidence: 0.98,
      source: 'SYNTHETIC_REGULATORY_DATASET',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Synthetic Regulatory Dataset (Production connects to authorized GeM API)',
      status: !isDebarred && record.accountStatus === 'VERIFIED' ? 'VERIFIED' : 'HIGH_RISK_DEBARRED',
      data: record,
      timestamp: new Date().toISOString(),
    };
  }

  async verifyDigiLocker(documentId) {
    const record = findDigilockerRecord(documentId);

    if (!record) {
      return {
        verificationType: 'DIGILOCKER',
        inputValue: documentId,
        referenceValue: null,
        result: 'DOCUMENT_NOT_FOUND',
        confidence: 0.5,
        source: 'SYNTHETIC_REGULATORY_DATASET',
        isSynthetic: true,
        status: 'UNVERIFIED',
        timestamp: new Date().toISOString(),
      };
    }

    const isSignatureValid = record.digitalSignatureStatus === 'CRYPTOGRAPHICALLY_VALID';

    return {
      verificationType: 'DIGILOCKER',
      inputValue: documentId,
      referenceValue: record.documentId,
      result: isSignatureValid ? 'CRYPTOGRAPHICALLY_VERIFIED' : 'SIGNATURE_INVALID',
      confidence: 0.99,
      source: 'SYNTHETIC_REGULATORY_DATASET',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Synthetic Regulatory Dataset (Production connects to authorized DigiLocker API)',
      status: isSignatureValid ? 'VERIFIED' : 'SECURITY_ALERT',
      data: record,
      timestamp: new Date().toISOString(),
    };
  }

  async verifyBIS(certificateNumber) {
    const record = findBisRecord(certificateNumber);

    if (!record) {
      return {
        verificationType: 'BIS_STANDARDS',
        inputValue: certificateNumber,
        referenceValue: null,
        result: 'NOT_FOUND_IN_REGISTRY',
        confidence: 0.6,
        source: 'SYNTHETIC_REGULATORY_DATASET',
        isSynthetic: true,
        status: 'UNVERIFIED',
        timestamp: new Date().toISOString(),
      };
    }

    const isCompliant = record.certificateStatus === 'ACTIVE';

    return {
      verificationType: 'BIS_STANDARDS',
      inputValue: certificateNumber,
      referenceValue: record.certificateNumber,
      result: isCompliant ? 'ACTIVE_ISI_CERTIFICATION' : 'EXPIRED_CERTIFICATION',
      confidence: 0.98,
      source: 'SYNTHETIC_REGULATORY_DATASET',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Synthetic Regulatory Dataset (Production connects to authorized BIS Manak Online API)',
      status: isCompliant ? 'VERIFIED' : 'DISCREPANCY_DETECTED',
      data: record,
      timestamp: new Date().toISOString(),
    };
  }

  async verifyLocalContent(declarationId, minRequiredLocalContent = 50.0) {
    const record = findLocalContentRecord(declarationId);

    if (!record) {
      return {
        verificationType: 'MAKE_IN_INDIA_LOCAL_CONTENT',
        inputValue: declarationId,
        referenceValue: null,
        result: 'NO_MII_DECLARATION_FOUND',
        confidence: 0.5,
        source: 'SYNTHETIC_REGULATORY_DATASET',
        isSynthetic: true,
        status: 'UNVERIFIED',
        timestamp: new Date().toISOString(),
      };
    }

    const isMeetsRequirement = record.localContentPercentage >= minRequiredLocalContent;

    return {
      verificationType: 'MAKE_IN_INDIA_LOCAL_CONTENT',
      inputValue: declarationId,
      referenceValue: `${record.localContentPercentage}%`,
      result: isMeetsRequirement ? 'MEETS_LOCAL_CONTENT_REQUIREMENT' : 'DEFICIT_IN_LOCAL_CONTENT',
      confidence: 0.95,
      source: 'SYNTHETIC_REGULATORY_DATASET',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Synthetic Regulatory Dataset (Production verifies Auditor Certificates against Institute registries)',
      status: isMeetsRequirement ? 'VERIFIED' : 'DISCREPANCY_DETECTED',
      data: record,
      timestamp: new Date().toISOString(),
    };
  }

  async checkBlacklist(identifier) {
    const check = checkBlacklistStatus(identifier);

    return {
      verificationType: 'CENTRAL_BLACKLIST_AND_DEBARMENT',
      inputValue: identifier,
      referenceValue: check.record ? check.record.entityId : null,
      result: check.isBlacklisted ? 'BLACKLISTED_OR_DEBARRED' : 'CLEAR_OF_DEBARMENT',
      confidence: 0.99,
      source: 'SYNTHETIC_REGULATORY_DATASET',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Synthetic Regulatory Dataset (Production queries CVC, GeM & CPPP debarment registries)',
      status: check.isBlacklisted ? 'CRITICAL_RISK_DEBARRED' : 'VERIFIED_CLEAR',
      data: check.record,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = { MockVerificationProvider };
