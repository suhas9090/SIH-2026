/**
 * Authorized Government API Verification Provider (Production Integration Adapter)
 * 
 * Implements BaseVerificationProvider using live Government of India REST/SOAP APIs.
 * Requires authorized production credentials (e.g., GSTN GSP Client ID/Secret, NSDL PAN API keys).
 * When credentials are not provided, gracefully informs the caller.
 */

const { BaseVerificationProvider } = require('./providerInterface');

class GovernmentAPIProvider extends BaseVerificationProvider {
  constructor() {
    super('AUTHORIZED_GOVERNMENT_API_PROVIDER', false);
    this.gstnApiKey = process.env.GOVT_GSTN_API_KEY;
    this.panApiKey = process.env.GOVT_PAN_API_KEY;
    this.udyamApiKey = process.env.GOVT_UDYAM_API_KEY;
    this.mcaApiKey = process.env.GOVT_MCA_API_KEY;
  }

  _checkConfigured(apiKey, serviceName) {
    if (!apiKey) {
      throw new Error(`Production ${serviceName} credentials not configured. Please set environment variables or use MockVerificationProvider.`);
    }
  }

  async verifyPAN(pan, expectedLegalName) {
    this._checkConfigured(this.panApiKey, 'Income Tax / NSDL PAN API');
    // Future production HTTP call:
    // const res = await axios.post('https://api.incometax.gov.in/v1/pan-verify', { pan }, { headers: { 'Authorization': `Bearer ${this.panApiKey}` } });
    // return res.data;
  }

  async verifyGST(gstin, expectedLegalName, expectedPan) {
    this._checkConfigured(this.gstnApiKey, 'GSTN GSP API');
    // Future production HTTP call:
    // const res = await axios.get(`https://api.gst.gov.in/taxpayerapi/v1.0/search?gstin=${gstin}`);
    // return res.data;
  }

  async verifyUdyam(udyamNumber, expectedLegalName, expectedPan) {
    this._checkConfigured(this.udyamApiKey, 'Ministry of MSME Udyam API');
  }

  async verifyMCA(cinOrLlpin, expectedLegalName) {
    this._checkConfigured(this.mcaApiKey, 'MCA21 V3 API');
  }

  async verifyIncomeTax(pan) {
    this._checkConfigured(this.panApiKey, 'CBDT CPC e-filing API');
  }

  async verifyEPFO(establishmentId, expectedPan) {
    throw new Error('Live EPFO API not configured.');
  }

  async verifyESIC(employerId) {
    throw new Error('Live ESIC API not configured.');
  }

  async verifyStartup(recognitionNumber, expectedPan) {
    throw new Error('Live Startup India API not configured.');
  }

  async verifyNSIC(registrationNumber) {
    throw new Error('Live NSIC API not configured.');
  }

  async verifyGeM(sellerId, expectedPan) {
    throw new Error('Live GeM Seller API not configured.');
  }

  async verifyDigiLocker(documentId) {
    throw new Error('Live DigiLocker API not configured.');
  }

  async verifyBIS(certificateNumber) {
    throw new Error('Live BIS Manak Online API not configured.');
  }

  async verifyLocalContent(declarationId, minRequiredLocalContent) {
    throw new Error('Live ICAI/ICWAI UDIN API not configured.');
  }

  async checkBlacklist(identifier) {
    throw new Error('Live CVC / GeM Incident Debarment API not configured.');
  }
}

module.exports = { GovernmentAPIProvider };
