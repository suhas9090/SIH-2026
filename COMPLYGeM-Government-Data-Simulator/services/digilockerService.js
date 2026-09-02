const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { findDigilockerRecord, SYNTHETIC_DIGILOCKER_RECORDS } = require('../datasets/digilockerDataset');
const { formatSuccessResponse, formatNotFoundResponse, formatErrorResponse } = require('../shared/responseFormatter');

/**
 * GET /api/digilocker/:docId
 */
router.get('/:docId', (req, res) => {
  try {
    const { docId } = req.params;
    const record = findDigilockerRecord(docId);

    if (!record) {
      return res.status(404).json(
        formatNotFoundResponse({
          authority: 'DigiLocker Gateway (NeGD / MeitY)',
          registryId: 'digilocker',
          identifier: docId,
          message: `Document URI / ID "${docId}" not found in DigiLocker repository.`
        })
      );
    }

    return res.json(
      formatSuccessResponse({
        authority: 'National e-Governance Division (NeGD) / MeitY',
        source: 'SIMULATED_DIGILOCKER_GATEWAY',
        registryId: 'digilocker',
        identifier: docId,
        verificationStatus: record.documentStatus === 'VALID' ? 'VERIFIED' : 'FLAGGED_DISCREPANCY',
        data: record
      })
    );
  } catch (err) {
    return res.status(500).json(formatErrorResponse({ error: err.message }));
  }
});

/**
 * POST /api/digilocker/verify-hash
 * Verifies document hash integrity against simulated DigiLocker registry
 */
router.post('/verify-hash', (req, res) => {
  try {
    const { documentId, calculatedHash } = req.body;
    const record = findDigilockerRecord(documentId);

    if (!record) {
      return res.status(404).json(
        formatNotFoundResponse({
          authority: 'DigiLocker Gateway',
          registryId: 'digilocker',
          identifier: documentId,
        })
      );
    }

    const isMatch = (record.sha256Hash === calculatedHash);

    return res.json({
      found: true,
      documentId: record.documentId,
      holderName: record.holderName,
      isHashMatch: isMatch,
      verification_status: isMatch ? 'INTEGRITY_CONFIRMED' : 'TAMPER_DETECTED',
      digitalSignatureStatus: record.digitalSignatureStatus,
      is_simulated: true,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json(formatErrorResponse({ error: err.message }));
  }
});

/**
 * GET /api/digilocker
 */
router.get('/', (req, res) => {
  res.json({
    count: SYNTHETIC_DIGILOCKER_RECORDS.length,
    authority: 'DigiLocker Gateway (NeGD / MeitY)',
    is_simulated: true,
    data: SYNTHETIC_DIGILOCKER_RECORDS
  });
});

module.exports = router;
