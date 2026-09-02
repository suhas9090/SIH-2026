const express = require('express');
const router = express.Router();
const { findMcaRecord, SYNTHETIC_MCA_RECORDS } = require('../datasets/mcaDataset');
const { formatSuccessResponse, formatNotFoundResponse, formatErrorResponse } = require('../shared/responseFormatter');

/**
 * GET /api/mca/:cin
 */
router.get('/:cin', (req, res) => {
  try {
    const { cin } = req.params;
    const record = findMcaRecord(cin);

    if (!record) {
      return res.status(404).json(
        formatNotFoundResponse({
          authority: 'Ministry of Corporate Affairs (MCA21)',
          registryId: 'mca',
          identifier: cin,
          message: `CIN / LLPIN "${cin}" not found in simulated MCA21 registry.`
        })
      );
    }

    return res.json(
      formatSuccessResponse({
        authority: 'Ministry of Corporate Affairs (MCA21 / ROC)',
        source: 'SIMULATED_MCA21_PORTAL',
        registryId: 'mca',
        identifier: cin.toUpperCase(),
        verificationStatus: record.companyStatus === 'ACTIVE' ? 'VERIFIED' : record.companyStatus,
        data: record
      })
    );
  } catch (err) {
    return res.status(500).json(formatErrorResponse({ error: err.message }));
  }
});

/**
 * GET /api/mca
 */
router.get('/', (req, res) => {
  res.json({
    count: SYNTHETIC_MCA_RECORDS.length,
    authority: 'Ministry of Corporate Affairs (MCA21)',
    is_simulated: true,
    data: SYNTHETIC_MCA_RECORDS
  });
});

module.exports = router;
