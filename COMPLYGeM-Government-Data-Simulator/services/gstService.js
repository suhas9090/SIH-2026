const express = require('express');
const router = express.Router();
const { findGstRecord, findGstByPan, SYNTHETIC_GST_RECORDS } = require('../datasets/gstDataset');
const { formatSuccessResponse, formatNotFoundResponse, formatErrorResponse } = require('../shared/responseFormatter');

/**
 * GET /api/gst/:gstin
 */
router.get('/:gstin', (req, res) => {
  try {
    const { gstin } = req.params;
    const record = findGstRecord(gstin);

    if (!record) {
      return res.status(404).json(
        formatNotFoundResponse({
          authority: 'Goods and Services Tax Network (GSTN)',
          registryId: 'gst',
          identifier: gstin,
          message: `GSTIN "${gstin}" not found in simulated GSTN registry.`
        })
      );
    }

    const verificationStatus = (record.registrationStatus === 'ACTIVE' && record.filingStatus === 'COMPLIANT')
      ? 'VERIFIED'
      : record.registrationStatus !== 'ACTIVE' ? 'INACTIVE' : 'FLAGGED_DISCREPANCY';

    return res.json(
      formatSuccessResponse({
        authority: 'Goods and Services Tax Network (GSTN)',
        source: 'SIMULATED_GSTN_GATEWAY',
        registryId: 'gst',
        identifier: gstin.toUpperCase(),
        verificationStatus,
        data: record
      })
    );
  } catch (err) {
    return res.status(500).json(formatErrorResponse({ error: err.message }));
  }
});

/**
 * GET /api/gst/by-pan/:pan
 */
router.get('/by-pan/:pan', (req, res) => {
  try {
    const { pan } = req.params;
    const record = findGstByPan(pan);

    if (!record) {
      return res.status(404).json(
        formatNotFoundResponse({
          authority: 'Goods and Services Tax Network (GSTN)',
          registryId: 'gst',
          identifier: pan,
          message: `No GSTIN linked to PAN "${pan}" in simulated GSTN.`
        })
      );
    }

    return res.json(
      formatSuccessResponse({
        authority: 'Goods and Services Tax Network (GSTN)',
        source: 'SIMULATED_GSTN_GATEWAY',
        registryId: 'gst',
        identifier: record.gstin,
        data: record
      })
    );
  } catch (err) {
    return res.status(500).json(formatErrorResponse({ error: err.message }));
  }
});

/**
 * GET /api/gst
 */
router.get('/', (req, res) => {
  res.json({
    count: SYNTHETIC_GST_RECORDS.length,
    authority: 'Goods and Services Tax Network (GSTN)',
    is_simulated: true,
    data: SYNTHETIC_GST_RECORDS
  });
});

module.exports = router;
