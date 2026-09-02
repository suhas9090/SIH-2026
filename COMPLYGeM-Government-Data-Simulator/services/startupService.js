const express = require('express');
const router = express.Router();
const { findStartupRecord, findStartupByPan, SYNTHETIC_STARTUP_RECORDS } = require('../datasets/startupDataset');
const { formatSuccessResponse, formatNotFoundResponse, formatErrorResponse } = require('../shared/responseFormatter');

/**
 * GET /api/startup/:recognitionNumber
 */
router.get('/:recognitionNumber', (req, res) => {
  try {
    const { recognitionNumber } = req.params;
    const record = findStartupRecord(recognitionNumber);

    if (!record) {
      return res.status(404).json(
        formatNotFoundResponse({
          authority: 'Startup India / DPIIT',
          registryId: 'startup',
          identifier: recognitionNumber,
          message: `DPIIT Recognition Number "${recognitionNumber}" not found.`
        })
      );
    }

    return res.json(
      formatSuccessResponse({
        authority: 'Department for Promotion of Industry and Internal Trade (DPIIT)',
        source: 'SIMULATED_DPIIT_STARTUP_INDIA',
        registryId: 'startup',
        identifier: recognitionNumber.toUpperCase(),
        verificationStatus: record.startupStatus === 'RECOGNIZED_STARTUP' ? 'VERIFIED' : 'NOT_APPLICABLE',
        data: record
      })
    );
  } catch (err) {
    return res.status(500).json(formatErrorResponse({ error: err.message }));
  }
});

/**
 * GET /api/startup/by-pan/:pan
 */
router.get('/by-pan/:pan', (req, res) => {
  try {
    const { pan } = req.params;
    const record = findStartupByPan(pan);

    if (!record) {
      return res.status(404).json(
        formatNotFoundResponse({
          authority: 'Startup India / DPIIT',
          registryId: 'startup',
          identifier: pan,
          message: `No DPIIT Startup registration linked to PAN "${pan}".`
        })
      );
    }

    return res.json(
      formatSuccessResponse({
        authority: 'Department for Promotion of Industry and Internal Trade (DPIIT)',
        source: 'SIMULATED_DPIIT_STARTUP_INDIA',
        registryId: 'startup',
        identifier: record.recognitionNumber,
        data: record
      })
    );
  } catch (err) {
    return res.status(500).json(formatErrorResponse({ error: err.message }));
  }
});

/**
 * GET /api/startup
 */
router.get('/', (req, res) => {
  res.json({
    count: SYNTHETIC_STARTUP_RECORDS.length,
    authority: 'Startup India / DPIIT',
    is_simulated: true,
    data: SYNTHETIC_STARTUP_RECORDS
  });
});

module.exports = router;
