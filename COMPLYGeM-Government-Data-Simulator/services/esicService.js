const express = require('express');
const router = express.Router();
const { findEsicRecord, SYNTHETIC_ESIC_RECORDS } = require('../datasets/esicDataset');
const { formatSuccessResponse, formatNotFoundResponse, formatErrorResponse } = require('../shared/responseFormatter');

/**
 * GET /api/esic/:employerId
 */
router.get('/:employerId', (req, res) => {
  try {
    const { employerId } = req.params;
    const record = findEsicRecord(employerId);

    if (!record) {
      return res.status(404).json(
        formatNotFoundResponse({
          authority: "Employees' State Insurance Corporation (ESIC)",
          registryId: 'esic',
          identifier: employerId,
          message: `ESIC Registration Number / Code "${employerId}" not found in simulated ESIC registry.`
        })
      );
    }

    return res.json(
      formatSuccessResponse({
        authority: "Employees' State Insurance Corporation (ESIC)",
        source: 'SIMULATED_ESIC_PORTAL',
        registryId: 'esic',
        identifier: employerId.toUpperCase(),
        verificationStatus: record.complianceStatus === 'COMPLIANT' ? 'VERIFIED' : 'NON_COMPLIANT',
        data: record
      })
    );
  } catch (err) {
    return res.status(500).json(formatErrorResponse({ error: err.message }));
  }
});

/**
 * GET /api/esic
 */
router.get('/', (req, res) => {
  res.json({
    count: SYNTHETIC_ESIC_RECORDS.length,
    authority: "Employees' State Insurance Corporation (ESIC)",
    is_simulated: true,
    data: SYNTHETIC_ESIC_RECORDS
  });
});

module.exports = router;
