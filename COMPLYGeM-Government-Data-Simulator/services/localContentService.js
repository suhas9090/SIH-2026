const express = require('express');
const router = express.Router();
const { findLocalContentRecord, SYNTHETIC_LOCAL_CONTENT_RECORDS } = require('../datasets/localContentDataset');
const { formatSuccessResponse, formatNotFoundResponse, formatErrorResponse } = require('../shared/responseFormatter');

/**
 * GET /api/local-content/:declId
 */
router.get('/:declId', (req, res) => {
  try {
    const { declId } = req.params;
    const record = findLocalContentRecord(declId);

    if (!record) {
      return res.status(404).json(
        formatNotFoundResponse({
          authority: 'Make in India (DPIIT)',
          registryId: 'local_content',
          identifier: declId,
          message: `MII Declaration ID / PAN "${declId}" not found.`
        })
      );
    }

    return res.json(
      formatSuccessResponse({
        authority: 'Department for Promotion of Industry and Internal Trade (DPIIT)',
        source: 'SIMULATED_MII_DECLARATION_REGISTRY',
        registryId: 'local_content',
        identifier: declId.toUpperCase(),
        verificationStatus: record.verificationStatus === 'COMPLIANT' ? 'VERIFIED' : record.verificationStatus,
        data: record
      })
    );
  } catch (err) {
    return res.status(500).json(formatErrorResponse({ error: err.message }));
  }
});

/**
 * GET /api/local-content
 */
router.get('/', (req, res) => {
  res.json({
    count: SYNTHETIC_LOCAL_CONTENT_RECORDS.length,
    authority: 'Make in India (DPIIT)',
    is_simulated: true,
    data: SYNTHETIC_LOCAL_CONTENT_RECORDS
  });
});

module.exports = router;
