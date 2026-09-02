/**
 * Government Verification Provider (REST Gateway Client)
 * 
 * Communicates with the standalone COMPLYGeM-Government-Data-Simulator over REST HTTP APIs.
 * Clearly labels all records as SYNTHETIC / DEMO DATA for transparent evaluation.
 */

const { BaseVerificationProvider } = require('./providerInterface');
const { govDataClient } = require('../government-data-client');

class MockVerificationProvider extends BaseVerificationProvider {
  constructor() {
    super('STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY', true);
    this.client = govDataClient;
  }

  async verifyPAN(pan, expectedLegalName) {
    const cleanPan = (pan || '').trim().toUpperCase();
    const isValidFormat = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(cleanPan);
    const res = await this.client.verifyPAN(cleanPan);

    if (!res.found || !res.data) {
      return {
        verificationType: 'PAN',
        inputValue: cleanPan,
        referenceValue: null,
        result: isValidFormat ? 'NOT_FOUND_IN_REGISTRY' : 'INVALID_FORMAT',
        confidence: isValidFormat ? 0.6 : 0.1,
        source: res.source || 'STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY',
        isSynthetic: true,
        disclaimer: 'PROTOTYPE VERIFICATION: Simulated Government Gateway API (Production connects to authorized Income Tax Department API)',
        status: 'UNVERIFIED',
        details: { message: `PAN ${cleanPan} was not found in CBDT simulated database.` },
        timestamp: new Date().toISOString(),
      };
    }

    const record = res.data;
    const isPanActive = (record.status === 'ACTIVE' || record.panActive === true);
    const isNameMatch = !expectedLegalName || 
      record.legalName?.toLowerCase().includes(expectedLegalName.toLowerCase()) ||
      expectedLegalName.toLowerCase().includes(record.legalName?.toLowerCase());

    const isVerified = isPanActive;

    return {
      verificationType: 'PAN',
      inputValue: cleanPan,
      referenceValue: record.panNumber,
      result: isVerified ? 'MATCH' : 'PAN_INACTIVE',
      nameMatch: isNameMatch,
      confidence: 0.98,
      source: 'STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Simulated Government Gateway API (Production connects to authorized Income Tax Department API)',
      status: isVerified ? 'VERIFIED' : 'DISCREPANCY_DETECTED',
      data: record,
      timestamp: new Date().toISOString(),
    };
  }

  async fetchPanBundle(pan) {
    const cleanPan = (pan || '').trim().toUpperCase();
    return await this.client.fetchPanBundle(cleanPan);
  }

  async verifyGST(gstin, expectedLegalName, expectedPan) {
    const cleanGst = (gstin || '').trim().toUpperCase();
    const isValidFormat = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(cleanGst);
    const res = await this.client.verifyGST(cleanGst);

    if (!res.found || !res.data) {
      return {
        verificationType: 'GST',
        inputValue: cleanGst,
        referenceValue: null,
        result: isValidFormat ? 'NOT_FOUND_IN_REGISTRY' : 'INVALID_FORMAT',
        confidence: isValidFormat ? 0.6 : 0.1,
        source: 'STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY',
        isSynthetic: true,
        disclaimer: 'PROTOTYPE VERIFICATION: Simulated Government Gateway API (Production connects to authorized GSTN API)',
        status: 'UNVERIFIED',
        details: { message: `GSTIN ${cleanGst} was not found in simulated GSTN registry.` },
        timestamp: new Date().toISOString(),
      };
    }

    const record = res.data;
    const isNameMatch = !expectedLegalName ||
      record.legalName?.toLowerCase().includes(expectedLegalName.toLowerCase()) ||
      expectedLegalName.toLowerCase().includes(record.legalName?.toLowerCase()) ||
      record.tradeName?.toLowerCase().includes(expectedLegalName.toLowerCase());

    const isPanMatch = !expectedPan || record.panNumber?.toUpperCase() === expectedPan.trim().toUpperCase();
    const isCompliant = record.registrationStatus === 'ACTIVE';

    return {
      verificationType: 'GST',
      inputValue: cleanGst,
      referenceValue: record.gstin,
      result: isCompliant ? 'MATCH' : (record.registrationStatus !== 'ACTIVE' ? `STATUS_${record.registrationStatus}` : 'NAME_MISMATCH'),
      nameMatch: isNameMatch,
      panMatch: isPanMatch,
      confidence: 0.98,
      source: 'STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Simulated Government Gateway API (Production connects to authorized GSTN API)',
      status: isCompliant ? 'VERIFIED' : 'DISCREPANCY_DETECTED',
      data: record,
      timestamp: new Date().toISOString(),
    };
  }

  async verifyUdyam(udyamNumber, expectedLegalName, expectedPan) {
    const cleanUdyam = (udyamNumber || '').trim().toUpperCase();
    const res = await this.client.verifyUdyam(cleanUdyam);

    if (!res.found || !res.data) {
      return {
        verificationType: 'UDYAM',
        inputValue: cleanUdyam,
        referenceValue: null,
        result: 'NOT_FOUND_IN_REGISTRY',
        confidence: 0.6,
        source: 'STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY',
        isSynthetic: true,
        disclaimer: 'PROTOTYPE VERIFICATION: Simulated Government Gateway API (Production connects to authorized Udyam API)',
        status: 'NOT_REGISTERED_OR_NOT_FOUND',
        timestamp: new Date().toISOString(),
      };
    }

    const record = res.data;
    const isPanMatch = !expectedPan || record.panNumber?.toUpperCase() === expectedPan.trim().toUpperCase();
    const isCompliant = record.certificateStatus === 'ACTIVE' || record.registrationStatus === 'ACTIVE';

    return {
      verificationType: 'UDYAM',
      inputValue: cleanUdyam,
      referenceValue: record.udyamRegistrationNumber,
      result: isCompliant ? 'MATCH' : 'REGISTRATION_EXPIRED_OR_INACTIVE',
      panMatch: isPanMatch,
      confidence: 0.98,
      source: 'STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Simulated Government Gateway API (Production connects to authorized Ministry of MSME API)',
      status: isCompliant ? 'VERIFIED' : 'DISCREPANCY_DETECTED',
      data: record,
      timestamp: new Date().toISOString(),
    };
  }

  async verifyMCA(cinOrLlpin, expectedLegalName) {
    const cleanCin = (cinOrLlpin || '').trim().toUpperCase();
    const res = await this.client.verifyMCA(cleanCin);

    if (!res.found || !res.data) {
      return {
        verificationType: 'MCA',
        inputValue: cleanCin,
        referenceValue: null,
        result: 'NOT_FOUND_IN_REGISTRY',
        confidence: 0.6,
        source: 'STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY',
        isSynthetic: true,
        disclaimer: 'PROTOTYPE VERIFICATION: Simulated Government Gateway API (Production connects to authorized MCA21 API)',
        status: 'UNVERIFIED',
        timestamp: new Date().toISOString(),
      };
    }

    const record = res.data;
    const isCompliant = record.companyStatus === 'ACTIVE';

    return {
      verificationType: 'MCA',
      inputValue: cleanCin,
      referenceValue: record.cinOrLlpin,
      result: isCompliant ? 'MATCH' : `COMPANY_STATUS_${record.companyStatus}`,
      confidence: 0.98,
      source: 'STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Simulated Government Gateway API (Production connects to authorized MCA21 API)',
      status: isCompliant ? 'VERIFIED' : 'DISCREPANCY_DETECTED',
      data: record,
      timestamp: new Date().toISOString(),
    };
  }

  async verifyIncomeTax(pan) {
    const cleanPan = (pan || '').trim().toUpperCase();
    const res = await this.client.verifyITR(cleanPan);

    if (!res.found || !res.data) {
      return {
        verificationType: 'INCOME_TAX_COMPLIANCE',
        inputValue: cleanPan,
        referenceValue: null,
        result: 'NO_TAX_RECORDS_FOUND',
        confidence: 0.5,
        source: 'STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY',
        isSynthetic: true,
        status: 'UNVERIFIED',
        timestamp: new Date().toISOString(),
      };
    }

    const record = res.data;
    const isCompliant = record.taxComplianceStatus === 'COMPLIANT' && (record.outstandingDemand || 0) === 0;

    return {
      verificationType: 'INCOME_TAX_COMPLIANCE',
      inputValue: cleanPan,
      referenceValue: record.panNumber,
      result: isCompliant ? 'COMPLIANT' : ((record.outstandingDemand || 0) > 0 ? 'DEMAND_OUTSTANDING' : record.taxComplianceStatus),
      confidence: 0.98,
      source: 'STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Simulated Government Gateway API (Production connects to authorized Income Tax e-filing API)',
      status: isCompliant ? 'VERIFIED' : 'DISCREPANCY_DETECTED',
      data: record,
      timestamp: new Date().toISOString(),
    };
  }

  async verifyEPFO(establishmentId) {
    const cleanId = (establishmentId || '').trim().toUpperCase();
    const res = await this.client.verifyEPFO(cleanId);

    if (!res.found || !res.data) {
      return {
        verificationType: 'EPFO',
        inputValue: cleanId,
        referenceValue: null,
        result: 'NOT_FOUND_IN_REGISTRY',
        confidence: 0.6,
        source: 'STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY',
        isSynthetic: true,
        status: 'UNVERIFIED',
        timestamp: new Date().toISOString(),
      };
    }

    const record = res.data;
    const isCompliant = record.complianceStatus === 'COMPLIANT' && (record.pendingContributions || 0) === 0;

    return {
      verificationType: 'EPFO',
      inputValue: cleanId,
      referenceValue: record.establishmentId,
      result: isCompliant ? 'COMPLIANT' : 'PENDING_STATUTORY_CONTRIBUTIONS',
      confidence: 0.95,
      source: 'STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Simulated Government Gateway API (Production connects to authorized Shram Suvidha EPFO API)',
      status: isCompliant ? 'VERIFIED' : 'DISCREPANCY_DETECTED',
      data: record,
      timestamp: new Date().toISOString(),
    };
  }

  async verifyESIC(employerId) {
    const cleanId = (employerId || '').trim().toUpperCase();
    const res = await this.client.verifyESIC(cleanId);

    if (!res.found || !res.data) {
      return {
        verificationType: 'ESIC',
        inputValue: cleanId,
        referenceValue: null,
        result: 'NOT_FOUND_IN_REGISTRY',
        confidence: 0.6,
        source: 'STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY',
        isSynthetic: true,
        status: 'UNVERIFIED',
        timestamp: new Date().toISOString(),
      };
    }

    const record = res.data;
    return {
      verificationType: 'ESIC',
      inputValue: cleanId,
      referenceValue: record.registrationNumber,
      result: record.complianceStatus === 'COMPLIANT' ? 'COMPLIANT' : 'PENDING_ARREARS',
      confidence: 0.95,
      source: 'STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Simulated Government Gateway API (Production connects to authorized ESIC API)',
      status: record.complianceStatus === 'COMPLIANT' ? 'VERIFIED' : 'DISCREPANCY_DETECTED',
      data: record,
      timestamp: new Date().toISOString(),
    };
  }

  async verifyStartup(recognitionNumber) {
    const cleanNo = (recognitionNumber || '').trim().toUpperCase();
    const res = await this.client.verifyStartup(cleanNo);

    if (!res.found || !res.data) {
      return {
        verificationType: 'STARTUP_INDIA',
        inputValue: cleanNo,
        referenceValue: null,
        result: 'NOT_RECOGNIZED_STARTUP',
        confidence: 0.7,
        source: 'STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY',
        isSynthetic: true,
        status: 'NOT_APPLICABLE',
        timestamp: new Date().toISOString(),
      };
    }

    const record = res.data;
    return {
      verificationType: 'STARTUP_INDIA',
      inputValue: cleanNo,
      referenceValue: record.recognitionNumber,
      result: record.recognitionStatus === 'ACTIVE' || record.startupStatus === 'RECOGNIZED_STARTUP' ? 'ACTIVE_DPIIT_STARTUP' : 'EXPIRED_OR_INACTIVE',
      confidence: 0.98,
      source: 'STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Simulated Government Gateway API (Production connects to authorized DPIIT Startup Portal API)',
      status: (record.recognitionStatus === 'ACTIVE' || record.startupStatus === 'RECOGNIZED_STARTUP') ? 'VERIFIED' : 'DISCREPANCY_DETECTED',
      data: record,
      timestamp: new Date().toISOString(),
    };
  }

  async verifyNSIC(registrationNumber) {
    const cleanNo = (registrationNumber || '').trim().toUpperCase();
    const res = await this.client.verifyNSIC(cleanNo);

    if (!res.found || !res.data) {
      return {
        verificationType: 'NSIC',
        inputValue: cleanNo,
        referenceValue: null,
        result: 'NOT_FOUND_IN_REGISTRY',
        confidence: 0.6,
        source: 'STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY',
        isSynthetic: true,
        status: 'UNVERIFIED',
        timestamp: new Date().toISOString(),
      };
    }

    const record = res.data;
    return {
      verificationType: 'NSIC',
      inputValue: cleanNo,
      referenceValue: record.nsicRegistrationNumber,
      result: record.certificateStatus === 'ACTIVE' ? 'ACTIVE_NSIC_REGISTRATION' : 'EXPIRED_REGISTRATION',
      confidence: 0.98,
      source: 'STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Simulated Government Gateway API (Production connects to authorized NSIC API)',
      status: record.certificateStatus === 'ACTIVE' ? 'VERIFIED' : 'DISCREPANCY_DETECTED',
      data: record,
      timestamp: new Date().toISOString(),
    };
  }

  async verifyGeM(sellerId) {
    const cleanId = (sellerId || '').trim().toUpperCase();
    const res = await this.client.verifyGeMSeller(cleanId);

    if (!res.found || !res.data) {
      return {
        verificationType: 'GEM_SELLER',
        inputValue: cleanId,
        referenceValue: null,
        result: 'NOT_REGISTERED_ON_GEM',
        confidence: 0.6,
        source: 'STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY',
        isSynthetic: true,
        status: 'UNVERIFIED',
        timestamp: new Date().toISOString(),
      };
    }

    const record = res.data;
    const isDebarred = record.blacklistingStatus === 'BLACKLISTED' || (record.debarmentStatus && record.debarmentStatus !== 'NONE');

    return {
      verificationType: 'GEM_SELLER',
      inputValue: cleanId,
      referenceValue: record.sellerId,
      result: isDebarred ? 'DEBARRED_SELLER' : (record.accountStatus === 'VERIFIED' ? 'ACTIVE_VERIFIED_SELLER' : 'ACCOUNT_SUSPENDED'),
      confidence: 0.98,
      source: 'STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Simulated Government Gateway API (Production connects to authorized GeM API)',
      status: !isDebarred && record.accountStatus === 'VERIFIED' ? 'VERIFIED' : 'HIGH_RISK_DEBARRED',
      data: record,
      timestamp: new Date().toISOString(),
    };
  }

  async verifyDigiLocker(documentId) {
    const cleanId = (documentId || '').trim().toUpperCase();
    const res = await this.client.verifyDigiLocker(cleanId);

    if (!res.found || !res.data) {
      return {
        verificationType: 'DIGILOCKER',
        inputValue: cleanId,
        referenceValue: null,
        result: 'DOCUMENT_NOT_FOUND',
        confidence: 0.5,
        source: 'STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY',
        isSynthetic: true,
        status: 'UNVERIFIED',
        timestamp: new Date().toISOString(),
      };
    }

    const record = res.data;
    const isSignatureValid = record.digitalSignatureStatus === 'CRYPTOGRAPHICALLY_VALID';

    return {
      verificationType: 'DIGILOCKER',
      inputValue: cleanId,
      referenceValue: record.documentId,
      result: isSignatureValid ? 'CRYPTOGRAPHICALLY_VERIFIED' : 'SIGNATURE_INVALID',
      confidence: 0.99,
      source: 'STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Simulated Government Gateway API (Production connects to authorized DigiLocker API)',
      status: isSignatureValid ? 'VERIFIED' : 'SECURITY_ALERT',
      data: record,
      timestamp: new Date().toISOString(),
    };
  }

  async verifyBIS(certificateNumber) {
    const cleanNo = (certificateNumber || '').trim().toUpperCase();
    const res = await this.client.verifyBIS(cleanNo);

    if (!res.found || !res.data) {
      return {
        verificationType: 'BIS_STANDARDS',
        inputValue: cleanNo,
        referenceValue: null,
        result: 'NOT_FOUND_IN_REGISTRY',
        confidence: 0.6,
        source: 'STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY',
        isSynthetic: true,
        status: 'UNVERIFIED',
        timestamp: new Date().toISOString(),
      };
    }

    const record = res.data;
    const isCompliant = record.certificateStatus === 'ACTIVE';

    return {
      verificationType: 'BIS_STANDARDS',
      inputValue: cleanNo,
      referenceValue: record.certificateNumber,
      result: isCompliant ? 'ACTIVE_ISI_CERTIFICATION' : 'EXPIRED_CERTIFICATION',
      confidence: 0.98,
      source: 'STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Simulated Government Gateway API (Production connects to authorized BIS Manak Online API)',
      status: isCompliant ? 'VERIFIED' : 'DISCREPANCY_DETECTED',
      data: record,
      timestamp: new Date().toISOString(),
    };
  }

  async verifyLocalContent(declarationId, minRequiredLocalContent = 50.0) {
    const cleanId = (declarationId || '').trim().toUpperCase();
    const res = await this.client.verifyLocalContent(cleanId);

    if (!res.found || !res.data) {
      return {
        verificationType: 'MAKE_IN_INDIA_LOCAL_CONTENT',
        inputValue: cleanId,
        referenceValue: null,
        result: 'NO_MII_DECLARATION_FOUND',
        confidence: 0.5,
        source: 'STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY',
        isSynthetic: true,
        status: 'UNVERIFIED',
        timestamp: new Date().toISOString(),
      };
    }

    const record = res.data;
    const isMeetsRequirement = (record.localContentPercentage || 0) >= minRequiredLocalContent;

    return {
      verificationType: 'MAKE_IN_INDIA_LOCAL_CONTENT',
      inputValue: cleanId,
      referenceValue: `${record.localContentPercentage}%`,
      result: isMeetsRequirement ? 'MEETS_LOCAL_CONTENT_REQUIREMENT' : 'DEFICIT_IN_LOCAL_CONTENT',
      confidence: 0.95,
      source: 'STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Simulated Government Gateway API',
      status: isMeetsRequirement ? 'VERIFIED' : 'DISCREPANCY_DETECTED',
      data: record,
      timestamp: new Date().toISOString(),
    };
  }

  async checkBlacklist(identifier) {
    const cleanId = (identifier || '').trim().toUpperCase();
    const res = await this.client.checkBlacklist(cleanId);

    return {
      verificationType: 'CENTRAL_BLACKLIST_AND_DEBARMENT',
      inputValue: cleanId,
      referenceValue: res.record ? res.record.entityId : null,
      result: res.is_debarred ? 'BLACKLISTED_OR_DEBARRED' : 'CLEAR_OF_DEBARMENT',
      confidence: 0.99,
      source: 'STANDALONE_GOVERNMENT_SIMULATOR_GATEWAY',
      isSynthetic: true,
      disclaimer: 'PROTOTYPE VERIFICATION: Simulated Government Gateway API (Production queries CVC, GeM & CPPP debarment registries)',
      status: res.is_debarred ? 'CRITICAL_RISK_DEBARRED' : 'VERIFIED_CLEAR',
      data: res.record || null,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = { MockVerificationProvider };
