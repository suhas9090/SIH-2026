const express = require('express');
const router = express.Router();
const { findUdyamRecord, findUdyamByPan, SYNTHETIC_UDYAM_RECORDS } = require('../datasets/udyamDataset');
const { formatSuccessResponse, formatNotFoundResponse, formatErrorResponse } = require('../shared/responseFormatter');

/**
 * GET /api/udyam/:udyamNumber
 */
router.get('/:udyamNumber', (req, res) => {
  try {
    const { udyamNumber } = req.params;
    const record = findUdyamRecord(udyamNumber);

    if (!record) {
      return res.status(404).json(
        formatNotFoundResponse({
          authority: 'Ministry of Micro, Small and Medium Enterprises',
          registryId: 'udyam',
          identifier: udyamNumber,
          message: `Udyam Registration "${udyamNumber}" not found in simulated MSME registry.`
        })
      );
    }

    return res.json(
      formatSuccessResponse({
        authority: 'Ministry of Micro, Small and Medium Enterprises',
        source: 'SIMULATED_UDYAM_PORTAL',
        registryId: 'udyam',
        identifier: udyamNumber.toUpperCase(),
        verificationStatus: record.certificateStatus === 'ACTIVE' ? 'VERIFIED' : record.certificateStatus,
        data: record
      })
    );
  } catch (err) {
    return res.status(500).json(formatErrorResponse({ error: err.message }));
  }
});

/**
 * GET /api/udyam/by-pan/:pan
 */
router.get('/by-pan/:pan', (req, res) => {
  try {
    const { pan } = req.params;
    const record = findUdyamByPan(pan);

    if (!record) {
      return res.status(404).json(
        formatNotFoundResponse({
          authority: 'Ministry of Micro, Small and Medium Enterprises',
          registryId: 'udyam',
          identifier: pan,
          message: `No Udyam MSME certificate linked to PAN "${pan}".`
        })
      );
    }

    return res.json(
      formatSuccessResponse({
        authority: 'Ministry of Micro, Small and Medium Enterprises',
        source: 'SIMULATED_UDYAM_PORTAL',
        registryId: 'udyam',
        identifier: record.udyamRegistrationNumber,
        data: record
      })
    );
  } catch (err) {
    return res.status(500).json(formatErrorResponse({ error: err.message }));
  }
});

/**
 * GET /api/udyam
 */
router.get('/', (req, res) => {
  res.json({
    count: SYNTHETIC_UDYAM_RECORDS.length,
    authority: 'Ministry of Micro, Small and Medium Enterprises',
    is_simulated: true,
    data: SYNTHETIC_UDYAM_RECORDS
  });
});

module.exports = router;
