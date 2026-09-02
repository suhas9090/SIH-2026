/**
 * Synthetic DigiLocker Document Verification & Digital Signature Dataset
 * Synchronized with 20 master corporate identities.
 * DISCLAIMER: Purely SYNTHETIC / FICTIONAL data for prototype demonstration.
 */

const { SYNTHETIC_PAN_RECORDS } = require('./panDataset');
const crypto = require('crypto');

const SYNTHETIC_DIGILOCKER_RECORDS = SYNTHETIC_PAN_RECORDS.map((rec, i) => {
  const isInvalid = rec.panNumber === 'SYNPA0003P' || rec.panNumber === 'SYNPA0006C';
  const docHash = crypto.createHash('sha256').update(`DIGILOCKER-${rec.panNumber}-${rec.legalName}`).digest('hex');

  return {
    documentId: `DL-DOC-${String(i + 1).padStart(3, '0')}-${rec.panNumber}`,
    documentType: 'INCORPORATION_AND_TAX_CERTIFICATE',
    holderName: rec.legalName,
    panNumber: rec.panNumber,
    issuer: 'DigiLocker National Gateway / Ministry of Electronics & IT',
    issueDate: rec.dateOfIncorporation || '2020-01-01',
    expiryDate: null,
    documentStatus: isInvalid ? 'FLAGGED_DISCREPANCY' : 'VALID',
    verificationStatus: isInvalid ? 'SIGNATURE_INVALID' : 'VERIFIED',
    digitalSignatureStatus: isInvalid ? 'UNTRUSTED_ROOT_CA' : 'CRYPTOGRAPHICALLY_VALID',
    signerName: isInvalid ? 'Untrusted External Authority' : 'DigiLocker Digital Signature Authority (CCA India)',
    sha256Hash: docHash,
    verificationSource: 'SYNTHETIC_DIGILOCKER_GATEWAY',
    lastVerifiedAt: new Date().toISOString(),
  };
});

module.exports = {
  SYNTHETIC_DIGILOCKER_RECORDS,
  findDigilockerRecord: (docId) => {
    if (!docId) return null;
    const clean = docId.trim().toUpperCase();
    return SYNTHETIC_DIGILOCKER_RECORDS.find(r => r.documentId === clean || r.panNumber === clean) || null;
  }
};
