/**
 * Verification Provider Base Interface (Contract)
 * 
 * Future production integration point: Any authorized Government API integration
 * must implement this contract to seamlessly substitute the mock verification provider.
 */

class BaseVerificationProvider {
  constructor(providerName, isSynthetic = true) {
    this.providerName = providerName;
    this.isSynthetic = isSynthetic;
  }

  async verifyPAN(pan, expectedLegalName) {
    throw new Error('verifyPAN() must be implemented by concrete verification provider');
  }

  async verifyGST(gstin, expectedLegalName, expectedPan) {
    throw new Error('verifyGST() must be implemented by concrete verification provider');
  }

  async verifyUdyam(udyamNumber, expectedLegalName, expectedPan) {
    throw new Error('verifyUdyam() must be implemented by concrete verification provider');
  }

  async verifyMCA(cinOrLlpin, expectedLegalName) {
    throw new Error('verifyMCA() must be implemented by concrete verification provider');
  }

  async verifyIncomeTax(pan) {
    throw new Error('verifyIncomeTax() must be implemented by concrete verification provider');
  }

  async verifyEPFO(establishmentId, expectedPan) {
    throw new Error('verifyEPFO() must be implemented by concrete verification provider');
  }

  async verifyESIC(employerId) {
    throw new Error('verifyESIC() must be implemented by concrete verification provider');
  }

  async verifyStartup(recognitionNumber, expectedPan) {
    throw new Error('verifyStartup() must be implemented by concrete verification provider');
  }

  async verifyNSIC(registrationNumber) {
    throw new Error('verifyNSIC() must be implemented by concrete verification provider');
  }

  async verifyGeM(sellerId, expectedPan) {
    throw new Error('verifyGeM() must be implemented by concrete verification provider');
  }

  async verifyDigiLocker(documentId) {
    throw new Error('verifyDigiLocker() must be implemented by concrete verification provider');
  }

  async verifyBIS(certificateNumber) {
    throw new Error('verifyBIS() must be implemented by concrete verification provider');
  }

  async verifyLocalContent(declarationId, minRequiredLocalContent) {
    throw new Error('verifyLocalContent() must be implemented by concrete verification provider');
  }

  async checkBlacklist(identifier) {
    throw new Error('checkBlacklist() must be implemented by concrete verification provider');
  }
}

module.exports = { BaseVerificationProvider };
