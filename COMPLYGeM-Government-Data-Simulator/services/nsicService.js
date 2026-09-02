const express = require('express');
const router = express.Router();
const { findNsicRecord, SYNTHETIC_NSIC_RECORDS } = require('../datasets/nsicDataset');
const { formatSuccessResponse, formatNotFoundResponse, formatErrorResponse } = require('../shared/responseFormatter');

/**
 * GET /api/nsic
 * Also supports ?registrationNumber=... or ?pan=...
 */
router.get('/', (req, res) => {
  const { registrationNumber, pan } = req.query;
  const queryParam = registrationNumber || pan;
  if (queryParam) {
    const record = findNsicRecord(queryParam);
    if (!record) {
      return res.status(404).json(
        formatNotFoundResponse({
          authority: 'National Small Industries Corporation (NSIC)',
          registryId: 'nsic',
          identifier: queryParam,
          message: `NSIC Single Point Registration Number "${queryParam}" not found.`
        })
      );
    }
    return res.json(
      formatSuccessResponse({
        authority: 'National Small Industries Corporation (NSIC SPR)',
        source: 'SIMULATED_NSIC_SPR_PORTAL',
        registryId: 'nsic',
        identifier: queryParam.toUpperCase(),
        verificationStatus: record.certificateStatus === 'ACTIVE' ? 'VERIFIED' : record.certificateStatus,
        data: record
      })
    );
  }

  res.json({
    count: SYNTHETIC_NSIC_RECORDS.length,
    authority: 'National Small Industries Corporation (NSIC)',
    is_simulated: true,
    data: SYNTHETIC_NSIC_RECORDS
  });
});

/**
 * GET /api/nsic/:registrationNumber(*)
 * Wildcard route to handle registration numbers with slashes like NSIC/REG/2021/8892
 */
router.get('/:registrationNumber(*)', (req, res) => {
  try {
    const registrationNumber = req.params.registrationNumber || req.params[0];
    const record = findNsicRecord(registrationNumber);

    if (!record) {
      return res.status(404).json(
        formatNotFoundResponse({
          authority: 'National Small Industries Corporation (NSIC)',
          registryId: 'nsic',
          identifier: registrationNumber,
          message: `NSIC Single Point Registration Number "${registrationNumber}" not found.`
        })
      );
    }

    return res.json(
      formatSuccessResponse({
        authority: 'National Small Industries Corporation (NSIC SPR)',
        source: 'SIMULATED_NSIC_SPR_PORTAL',
        registryId: 'nsic',
        identifier: registrationNumber.toUpperCase(),
        verificationStatus: record.certificateStatus === 'ACTIVE' ? 'VERIFIED' : record.certificateStatus,
        data: record
      })
    );
  } catch (err) {
    return res.status(500).json(formatErrorResponse({ error: err.message }));
  }
});

module.exports = router;
