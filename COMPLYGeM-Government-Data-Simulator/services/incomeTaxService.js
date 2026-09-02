const express = require('express');
const router = express.Router();
const { findTaxRecord, SYNTHETIC_INCOME_TAX_RECORDS } = require('../datasets/incomeTaxDataset');
const { formatSuccessResponse, formatNotFoundResponse, formatErrorResponse } = require('../shared/responseFormatter');

/**
 * GET /api/income-tax/:pan
 */
router.get('/:pan', (req, res) => {
  try {
    const { pan } = req.params;
    const record = findTaxRecord(pan);

    if (!record) {
      return res.status(404).json(
        formatNotFoundResponse({
          authority: 'Income Tax Department (ITR & CPC)',
          registryId: 'income_tax',
          identifier: pan,
          message: `ITR filing history for PAN "${pan}" not found.`
        })
      );
    }

    return res.json(
      formatSuccessResponse({
        authority: 'Income Tax Centralized Processing Center (CPC)',
        source: 'SIMULATED_ITR_CPC_GATEWAY',
        registryId: 'income_tax',
        identifier: pan.toUpperCase(),
        verificationStatus: record.filingStatus === 'FILED_VERIFIED' ? 'VERIFIED' : record.filingStatus,
        data: record
      })
    );
  } catch (err) {
    return res.status(500).json(formatErrorResponse({ error: err.message }));
  }
});

/**
 * GET /api/income-tax
 */
router.get('/', (req, res) => {
  res.json({
    count: SYNTHETIC_INCOME_TAX_RECORDS.length,
    authority: 'Income Tax Centralized Processing Center (CPC)',
    is_simulated: true,
    data: SYNTHETIC_INCOME_TAX_RECORDS
  });
});

module.exports = router;
