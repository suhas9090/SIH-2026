const express = require('express');
const router = express.Router();
const { findEpfoRecord, findEpfoByPan, SYNTHETIC_EPFO_RECORDS } = require('../datasets/epfoDataset');
const { formatSuccessResponse, formatNotFoundResponse, formatErrorResponse } = require('../shared/responseFormatter');

/**
 * GET /api/epfo/:establishmentId
 */
router.get('/:establishmentId', (req, res) => {
  try {
    const { establishmentId } = req.params;
    const record = findEpfoRecord(establishmentId);

    if (!record) {
      return res.status(404).json(
        formatNotFoundResponse({
          authority: "Employees' Provident Fund Organisation (EPFO)",
          registryId: 'epfo',
          identifier: establishmentId,
          message: `EPFO Establishment ID / PAN "${establishmentId}" not found in Shram Suvidha simulated portal.`
        })
      );
    }

    return res.json(
      formatSuccessResponse({
        authority: "Employees' Provident Fund Organisation (EPFO)",
        source: 'SIMULATED_EPFO_SHRAM_SUVIDHA',
        registryId: 'epfo',
        identifier: establishmentId.toUpperCase(),
        verificationStatus: record.complianceStatus === 'COMPLIANT' ? 'VERIFIED' : 'NON_COMPLIANT',
        data: record
      })
    );
  } catch (err) {
    return res.status(500).json(formatErrorResponse({ error: err.message }));
  }
});

/**
 * GET /api/epfo/by-pan/:pan
 */
router.get('/by-pan/:pan', (req, res) => {
  try {
    const { pan } = req.params;
    const record = findEpfoByPan(pan);

    if (!record) {
      return res.status(404).json(
        formatNotFoundResponse({
          authority: "Employees' Provident Fund Organisation (EPFO)",
          registryId: 'epfo',
          identifier: pan,
          message: `No EPFO establishment linked to PAN "${pan}".`
        })
      );
    }

    return res.json(
      formatSuccessResponse({
        authority: "Employees' Provident Fund Organisation (EPFO)",
        source: 'SIMULATED_EPFO_SHRAM_SUVIDHA',
        registryId: 'epfo',
        identifier: record.establishmentId,
        data: record
      })
    );
  } catch (err) {
    return res.status(500).json(formatErrorResponse({ error: err.message }));
  }
});

/**
 * GET /api/epfo
 */
router.get('/', (req, res) => {
  res.json({
    count: SYNTHETIC_EPFO_RECORDS.length,
    authority: "Employees' Provident Fund Organisation (EPFO)",
    is_simulated: true,
    data: SYNTHETIC_EPFO_RECORDS
  });
});

module.exports = router;
