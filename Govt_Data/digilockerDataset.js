/**
 * Synthetic DigiLocker Document Verification & Digital Signature Dataset
 * DISCLAIMER: Purely SYNTHETIC / FICTIONAL data for prototype demonstration.
 */

const SYNTHETIC_DIGILOCKER_RECORDS = [
  {
    documentId: 'DL-DOC-001-GST',
    documentType: 'GST_REGISTRATION_CERTIFICATE',
    holderName: 'ABC Safety Technologies Private Limited',
    panNumber: 'SYNPA0001C',
    issuer: 'Goods and Services Tax Network (GSTN)',
    issueDate: '2018-07-01',
    expiryDate: null,
    documentStatus: 'VALID',
    verificationStatus: 'VERIFIED',
    digitalSignatureStatus: 'CRYPTOGRAPHICALLY_VALID',
    signerName: 'GSTN Digital Signing Authority (Synthetic)',
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    verificationSource: 'SYNTHETIC_DIGILOCKER_GATEWAY',
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    documentId: 'DL-DOC-001-PAN',
    documentType: 'PAN_VERIFICATION_RECORD',
    holderName: 'ABC Safety Technologies Private Limited',
    panNumber: 'SYNPA0001C',
    issuer: 'Income Tax Department (CBDT)',
    issueDate: '2018-06-15',
    expiryDate: null,
    documentStatus: 'VALID',
    verificationStatus: 'VERIFIED',
    digitalSignatureStatus: 'CRYPTOGRAPHICALLY_VALID',
    signerName: 'CBDT e-Governance Authority (Synthetic)',
    sha256Hash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    verificationSource: 'SYNTHETIC_DIGILOCKER_GATEWAY',
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    documentId: 'DL-DOC-003-SIGN-INVALID',
    documentType: 'MANUFACTURER_AUTHORIZATION_LETTER',
    holderName: 'Zenith Protection Gear & Safety Works',
    panNumber: 'SYNPA0003P',
    issuer: 'XYZ Safety Global Corp',
    issueDate: '2023-01-10',
    expiryDate: '2024-01-09',
    documentStatus: 'EXPIRED',
    verificationStatus: 'SIGNATURE_INVALID', // Invalid digital signature test case
    digitalSignatureStatus: 'UNTRUSTED_ROOT_CA',
    signerName: 'Unknown Certificate Authority',
    sha256Hash: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    verificationSource: 'SYNTHETIC_DIGILOCKER_GATEWAY',
    lastVerifiedAt: new Date().toISOString(),
  },
];

module.exports = {
  SYNTHETIC_DIGILOCKER_RECORDS,
  findDigilockerRecord: (docId) => {
    if (!docId) return null;
    const clean = docId.trim().toUpperCase();
    return SYNTHETIC_DIGILOCKER_RECORDS.find(r => r.documentId === clean || r.panNumber === clean) || null;
  }
};
