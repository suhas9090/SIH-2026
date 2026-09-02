/**
 * =============================================================================
 * COMPLYGeM-AI: GOVERNMENT DATA CLIENT (REST API ABSTRACTION LAYER)
 * =============================================================================
 * 
 * Central API Client for communicating with the standalone Government Data Simulator
 * (or official Production Government APIs in future deployments).
 * 
 * IMPORTANT ARCHITECTURAL PRINCIPLE:
 * The COMPLYGeM-AI application does NOT import simulated datasets directly.
 * All verification queries pass through this client abstraction via standard HTTP requests.
 */

const axios = require('axios');

class GovernmentDataClient {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl || process.env.GOV_DATA_API_BASE_URL || 'http://127.0.0.1:8001/api';
    this.apiKey = apiKey || process.env.SIMULATOR_API_KEY || '';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 8000,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { 'X-Gov-Simulator-Key': this.apiKey } : {})
      }
    });
  }

  // 1. PAN & Aadhaar OTP Verification (CBDT)
  async verifyPAN(panNumber) {
    if (!panNumber) return { found: false, error: 'PAN number is required' };
    try {
      const res = await this.client.get(`/pan/${encodeURIComponent(panNumber.trim().toUpperCase())}`);
      return res.data;
    } catch (err) {
      if (err.response?.data) return err.response.data;
      return { found: false, verification_status: 'NOT_FOUND', error: err.message, is_simulated: true };
    }
  }

  async fetchPanBundle(panNumber) {
    if (!panNumber) return { found: false, error: 'PAN number is required' };
    try {
      const res = await this.client.get(`/pan/lookup-bundle/${encodeURIComponent(panNumber.trim().toUpperCase())}`);
      return res.data;
    } catch (err) {
      if (err.response?.data) return err.response.data;
      return { found: false, error: err.message };
    }
  }

  async verifyPANOTP(panNumber, otp, aadhaarLast4) {
    try {
      const res = await this.client.post('/pan/verify-otp', { panNumber, otp, aadhaarLast4 });
      return res.data;
    } catch (err) {
      if (err.response?.data) return err.response.data;
      return { found: false, verification_status: 'ERROR', error: err.message };
    }
  }

  // 2. GSTIN Verification (GSTN)
  async verifyGST(gstin) {
    if (!gstin) return { found: false, error: 'GSTIN is required' };
    try {
      const res = await this.client.get(`/gst/${encodeURIComponent(gstin.trim().toUpperCase())}`);
      return res.data;
    } catch (err) {
      if (err.response?.data) return err.response.data;
      return { found: false, verification_status: 'NOT_FOUND', error: err.message };
    }
  }

  // 3. Udyam MSME Registry (Ministry of MSME)
  async verifyUdyam(udyamNumber) {
    if (!udyamNumber) return { found: false, error: 'Udyam number is required' };
    try {
      const res = await this.client.get(`/udyam/${encodeURIComponent(udyamNumber.trim().toUpperCase())}`);
      return res.data;
    } catch (err) {
      if (err.response?.data) return err.response.data;
      return { found: false, verification_status: 'NOT_FOUND', error: err.message };
    }
  }

  // 4. Corporate Affairs (MCA21 / ROC)
  async verifyMCA(cin) {
    if (!cin) return { found: false, error: 'CIN / LLPIN is required' };
    try {
      const res = await this.client.get(`/mca/${encodeURIComponent(cin.trim().toUpperCase())}`);
      return res.data;
    } catch (err) {
      if (err.response?.data) return err.response.data;
      return { found: false, verification_status: 'NOT_FOUND', error: err.message };
    }
  }

  // 5. Income Tax Return ITR (CPC)
  async verifyITR(pan) {
    if (!pan) return { found: false, error: 'PAN is required' };
    try {
      const res = await this.client.get(`/income-tax/${encodeURIComponent(pan.trim().toUpperCase())}`);
      return res.data;
    } catch (err) {
      if (err.response?.data) return err.response.data;
      return { found: false, verification_status: 'NOT_FOUND', error: err.message };
    }
  }

  // 6. EPFO Labour Social Security (Shram Suvidha)
  async verifyEPFO(establishmentId) {
    if (!establishmentId) return { found: false, error: 'Establishment ID is required' };
    try {
      const res = await this.client.get(`/epfo/${encodeURIComponent(establishmentId.trim().toUpperCase())}`);
      return res.data;
    } catch (err) {
      if (err.response?.data) return err.response.data;
      return { found: false, verification_status: 'NOT_FOUND', error: err.message };
    }
  }

  // 7. ESIC Labour Insurance (ESIC)
  async verifyESIC(employerCode) {
    if (!employerCode) return { found: false, error: 'Employer code is required' };
    try {
      const res = await this.client.get(`/esic/${encodeURIComponent(employerCode.trim().toUpperCase())}`);
      return res.data;
    } catch (err) {
      if (err.response?.data) return err.response.data;
      return { found: false, verification_status: 'NOT_FOUND', error: err.message };
    }
  }

  // 8. NSIC Single Point Registration (NSIC)
  async verifyNSIC(registrationNumber) {
    if (!registrationNumber) return { found: false, error: 'NSIC number is required' };
    try {
      const res = await this.client.get(`/nsic/${encodeURIComponent(registrationNumber.trim().toUpperCase())}`);
      return res.data;
    } catch (err) {
      if (err.response?.data) return err.response.data;
      return { found: false, verification_status: 'NOT_FOUND', error: err.message };
    }
  }

  // 9. Startup India (DPIIT)
  async verifyStartup(recognitionNumber) {
    if (!recognitionNumber) return { found: false, error: 'Startup DIPP number is required' };
    try {
      const res = await this.client.get(`/startup/${encodeURIComponent(recognitionNumber.trim().toUpperCase())}`);
      return res.data;
    } catch (err) {
      if (err.response?.data) return err.response.data;
      return { found: false, verification_status: 'NOT_FOUND', error: err.message };
    }
  }

  // 10. DigiLocker Document Signature & Integrity (NeGD / MeitY)
  async verifyDigiLocker(docId) {
    if (!docId) return { found: false, error: 'Document ID is required' };
    try {
      const res = await this.client.get(`/digilocker/${encodeURIComponent(docId.trim().toUpperCase())}`);
      return res.data;
    } catch (err) {
      if (err.response?.data) return err.response.data;
      return { found: false, verification_status: 'NOT_FOUND', error: err.message };
    }
  }

  // 11. Bureau of Indian Standards (BIS)
  async verifyBIS(certNo) {
    if (!certNo) return { found: false, error: 'Certificate number is required' };
    try {
      const res = await this.client.get(`/bis/${encodeURIComponent(certNo.trim().toUpperCase())}`);
      return res.data;
    } catch (err) {
      if (err.response?.data) return err.response.data;
      return { found: false, verification_status: 'NOT_FOUND', error: err.message };
    }
  }

  // 12. GeM Seller Registry (GeM SPV)
  async verifyGeMSeller(sellerId) {
    if (!sellerId) return { found: false, error: 'Seller ID is required' };
    try {
      const res = await this.client.get(`/gem-seller/${encodeURIComponent(sellerId.trim().toUpperCase())}`);
      return res.data;
    } catch (err) {
      if (err.response?.data) return err.response.data;
      return { found: false, verification_status: 'NOT_FOUND', error: err.message };
    }
  }

  // 13. Make in India Local Content (DPIIT)
  async verifyLocalContent(declId) {
    if (!declId) return { found: false, error: 'Declaration ID is required' };
    try {
      const res = await this.client.get(`/local-content/${encodeURIComponent(declId.trim().toUpperCase())}`);
      return res.data;
    } catch (err) {
      if (err.response?.data) return err.response.data;
      return { found: false, verification_status: 'NOT_FOUND', error: err.message };
    }
  }

  // 14. Central Debarment & Blacklist (CVC)
  async checkBlacklist(identifier) {
    if (!identifier) return { is_debarred: false, blacklist_status: 'NOT_BLACKLISTED' };
    try {
      const res = await this.client.get(`/blacklist/${encodeURIComponent(identifier.trim().toUpperCase())}`);
      return res.data;
    } catch (err) {
      if (err.response?.data) return err.response.data;
      return { is_debarred: false, blacklist_status: 'NOT_BLACKLISTED', error: err.message };
    }
  }

  async checkVendorVigilance(pan, gstin, cin, organizationName) {
    try {
      const res = await this.client.post('/blacklist/check-vendor', { pan, gstin, cin, organizationName });
      return res.data;
    } catch (err) {
      if (err.response?.data) return err.response.data;
      return { is_debarred: false, blacklist_status: 'NOT_BLACKLISTED', error: err.message };
    }
  }

  // Comprehensive Multi-Registry Aggregation
  async verifyAllRegistries(profile = {}) {
    const { pan, gstin, udyamNo, cinNo, epfoId, esicCode, startupNo, nsicNo, bisCertNo, organizationName } = profile;

    const results = {};
    const promises = [];

    if (pan) promises.push(this.verifyPAN(pan).then(r => results.pan = r));
    if (gstin) promises.push(this.verifyGST(gstin).then(r => results.gst = r));
    if (udyamNo) promises.push(this.verifyUdyam(udyamNo).then(r => results.udyam = r));
    if (cinNo) promises.push(this.verifyMCA(cinNo).then(r => results.mca = r));
    if (epfoId) promises.push(this.verifyEPFO(epfoId).then(r => results.epfo = r));
    if (esicCode) promises.push(this.verifyESIC(esicCode).then(r => results.esic = r));
    if (startupNo) promises.push(this.verifyStartup(startupNo).then(r => results.startup = r));
    if (nsicNo) promises.push(this.verifyNSIC(nsicNo).then(r => results.nsic = r));
    if (bisCertNo) promises.push(this.verifyBIS(bisCertNo).then(r => results.bis = r));

    // Blacklist check
    promises.push(this.checkVendorVigilance(pan, gstin, cinNo, organizationName).then(r => results.vigilance = r));

    await Promise.allSettled(promises);

    let totalChecked = Object.keys(results).length;
    let verifiedCount = Object.values(results).filter(r => r.found && r.verification_status === 'VERIFIED').length;
    let isDebarred = results.vigilance?.is_debarred || false;

    return {
      organizationName: organizationName || 'Unknown Entity',
      totalChecked,
      verifiedCount,
      isDebarred,
      presenceScore: totalChecked > 0 ? Math.round((verifiedCount / totalChecked) * 100) : 0,
      registries: results,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export Singleton Instance
const govDataClient = new GovernmentDataClient();

module.exports = {
  GovernmentDataClient,
  govDataClient,
};
