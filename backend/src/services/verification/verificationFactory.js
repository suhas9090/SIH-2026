/**
 * Verification Provider Factory
 * 
 * Central factory that returns the active verification provider based on configuration.
 * Allows instant, zero-downtime switching between Synthetic Mock Data (prototype)
 * and Production Authorized Government APIs.
 */

const { MockVerificationProvider } = require('./mockVerificationProvider');
const { GovernmentAPIProvider } = require('./governmentApiProvider');

class VerificationFactory {
  constructor() {
    this.providerType = process.env.VERIFICATION_PROVIDER || 'MOCK';
    this.mockProvider = new MockVerificationProvider();
    this.governmentProvider = new GovernmentAPIProvider();
  }

  getProvider() {
    if (this.providerType === 'GOVERNMENT_API') {
      return this.governmentProvider;
    }
    return this.mockProvider;
  }

  setProviderType(type) {
    if (type === 'MOCK' || type === 'GOVERNMENT_API') {
      this.providerType = type;
    }
  }

  getProviderMetadata() {
    const active = this.getProvider();
    return {
      activeProvider: active.providerName,
      isSynthetic: active.isSynthetic,
      sourceLabel: active.isSynthetic ? 'Synthetic Regulatory Dataset (Demo Gateway)' : 'Authorized Production Government API',
      productionReady: true,
      supportedServices: [
        'CBDT PAN Verification',
        'GSTN Returns & Active Status',
        'Ministry of MSME Udyam Registry',
        'MCA21 Company & Director Filings',
        'CBDT Income Tax e-Filing & Demands',
        'EPFO Shram Suvidha Compliance',
        'ESIC Employer Arrears & Active Records',
        'DPIIT Startup India Recognition & PPP Exemptions',
        'NSIC Single Point Registration',
        'GeM Seller Registry & Incident Debarment',
        'DigiLocker Cryptographic Document Verification',
        'BIS Manak Online ISI Standards',
        'Make in India Local Content Auditing',
        'Central Vigilance Debarment Database',
      ]
    };
  }
}

const verificationFactory = new VerificationFactory();

module.exports = {
  verificationFactory,
  getVerificationProvider: () => verificationFactory.getProvider(),
};
