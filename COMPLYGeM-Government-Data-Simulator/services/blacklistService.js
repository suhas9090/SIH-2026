const express = require('express');
const router = express.Router();
const { checkBlacklistStatus, SYNTHETIC_BLACKLIST_RECORDS } = require('../datasets/blacklistDataset');
const { formatSuccessResponse, formatNotFoundResponse, formatErrorResponse } = require('../shared/responseFormatter');

/**
 * GET /api/blacklist/:identifier
 * Checks PAN, GSTIN, CIN or Entity Name against simulated Central Debarment / Blacklist.
 */
router.get('/:identifier', (req, res) => {
  try {
    const { identifier } = req.params;
    const result = checkBlacklistStatus(identifier);

    return res.json({
      found: true,
      identifier: identifier.toUpperCase(),
      is_debarred: result.isBlacklisted,
      blacklist_status: result.status,
      verification_status: result.isBlacklisted ? 'DEBARRED_DISQUALIFIED' : result.status === 'UNDER_NOTICE' ? 'FLAGGED_NOTICE' : 'VERIFIED_CLEAN',
      authority: 'Central Vigilance Commission (CVC) / Debarment Committee',
      source: 'SIMULATED_CENTRAL_DEBARMENT_REGISTRY',
      is_simulated: true,
      record: result.record,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json(formatErrorResponse({ error: err.message }));
  }
});

/**
 * POST /api/blacklist/check-vendor
 * Multi-field vigilance verification (checks PAN, GSTIN, CIN, and Legal Name simultaneously).
 */
router.post('/check-vendor', (req, res) => {
  try {
    const { pan, gstin, cin, organizationName } = req.body;
    
    const queries = [pan, gstin, cin, organizationName].filter(Boolean);
    let matchedRecord = null;
    let isDebarred = false;
    let status = 'NOT_BLACKLISTED';

    for (const q of queries) {
      const res = checkBlacklistStatus(q);
      if (res.isBlacklisted) {
        matchedRecord = res.record;
        isDebarred = true;
        status = res.status;
        break;
      } else if (res.status === 'UNDER_NOTICE' && status !== 'DEBARRED') {
        matchedRecord = res.record;
        status = 'UNDER_NOTICE';
      }
    }

    return res.json({
      is_debarred: isDebarred,
      blacklist_status: status,
      verification_status: isDebarred ? 'DEBARRED_DISQUALIFIED' : status === 'UNDER_NOTICE' ? 'FLAGGED_NOTICE' : 'VERIFIED_CLEAN',
      authority: 'Central Vigilance Commission (CVC) / Debarment Committee',
      source: 'SIMULATED_CENTRAL_DEBARMENT_REGISTRY',
      is_simulated: true,
      matched_record: matchedRecord,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json(formatErrorResponse({ error: err.message }));
  }
});

/**
 * GET /api/blacklist
 */
router.get('/', (req, res) => {
  res.json({
    count: SYNTHETIC_BLACKLIST_RECORDS.length,
    authority: 'Central Vigilance Commission (CVC)',
    is_simulated: true,
    data: SYNTHETIC_BLACKLIST_RECORDS
  });
});

module.exports = router;
