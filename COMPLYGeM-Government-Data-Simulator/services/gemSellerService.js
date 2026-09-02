const express = require('express');
const router = express.Router();
const { findGemSellerRecord, SYNTHETIC_GEM_SELLER_RECORDS } = require('../datasets/gemDataset');
const { formatSuccessResponse, formatNotFoundResponse, formatErrorResponse } = require('../shared/responseFormatter');

/**
 * GET /api/gem-seller/:sellerId
 */
router.get('/:sellerId', (req, res) => {
  try {
    const { sellerId } = req.params;
    const record = findGemSellerRecord(sellerId);

    if (!record) {
      return res.status(404).json(
        formatNotFoundResponse({
          authority: 'Government e-Marketplace (GeM SPV)',
          registryId: 'gem',
          identifier: sellerId,
          message: `GeM Seller ID "${sellerId}" not found in GeM seller directory.`
        })
      );
    }

    return res.json(
      formatSuccessResponse({
        authority: 'GeM SPV, Ministry of Commerce & Industry',
        source: 'SIMULATED_GEM_SELLER_REGISTRY',
        registryId: 'gem',
        identifier: sellerId.toUpperCase(),
        verificationStatus: record.sellerStatus === 'ACTIVE' ? 'VERIFIED' : record.sellerStatus,
        data: record
      })
    );
  } catch (err) {
    return res.status(500).json(formatErrorResponse({ error: err.message }));
  }
});

/**
 * GET /api/gem-seller
 */
router.get('/', (req, res) => {
  res.json({
    count: SYNTHETIC_GEM_SELLER_RECORDS.length,
    authority: 'Government e-Marketplace (GeM SPV)',
    is_simulated: true,
    data: SYNTHETIC_GEM_SELLER_RECORDS
  });
});

module.exports = router;
