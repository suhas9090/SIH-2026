const express = require('express');
const router = express.Router();
const { findBisRecord, SYNTHETIC_BIS_RECORDS } = require('../datasets/bisDataset');
const { formatSuccessResponse, formatNotFoundResponse, formatErrorResponse } = require('../shared/responseFormatter');

/**
 * GET /api/bis
 * Also supports ?certNo=... or ?pan=...
 */
router.get('/', (req, res) => {
  const { certNo, pan } = req.query;
  const queryParam = certNo || pan;
  if (queryParam) {
    const record = findBisRecord(queryParam);
    if (!record) {
      return res.status(404).json(
        formatNotFoundResponse({
          authority: 'Bureau of Indian Standards (BIS Manak Online)',
          registryId: 'bis',
          identifier: queryParam,
          message: `BIS Certificate / License "${queryParam}" not found.`
        })
      );
    }
    return res.json(
      formatSuccessResponse({
        authority: 'Bureau of Indian Standards (BIS)',
        source: 'SIMULATED_BIS_MANAK_ONLINE',
        registryId: 'bis',
        identifier: queryParam.toUpperCase(),
        verificationStatus: record.certificateStatus === 'ACTIVE' ? 'VERIFIED' : record.certificateStatus,
        data: record
      })
    );
  }

  res.json({
    count: SYNTHETIC_BIS_RECORDS.length,
    authority: 'Bureau of Indian Standards (BIS)',
    is_simulated: true,
    data: SYNTHETIC_BIS_RECORDS
  });
});

/**
 * GET /api/bis/:certNo(*)
 * Wildcard route to handle license numbers with slashes like CM/L-8899001
 */
router.get('/:certNo(*)', (req, res) => {
  try {
    const certNo = req.params.certNo || req.params[0];
    const record = findBisRecord(certNo);

    if (!record) {
      return res.status(404).json(
        formatNotFoundResponse({
          authority: 'Bureau of Indian Standards (BIS Manak Online)',
          registryId: 'bis',
          identifier: certNo,
          message: `BIS Certificate / License "${certNo}" not found.`
        })
      );
    }

    return res.json(
      formatSuccessResponse({
        authority: 'Bureau of Indian Standards (BIS)',
        source: 'SIMULATED_BIS_MANAK_ONLINE',
        registryId: 'bis',
        identifier: certNo.toUpperCase(),
        verificationStatus: record.certificateStatus === 'ACTIVE' ? 'VERIFIED' : record.certificateStatus,
        data: record
      })
    );
  } catch (err) {
    return res.status(500).json(formatErrorResponse({ error: err.message }));
  }
});

module.exports = router;
