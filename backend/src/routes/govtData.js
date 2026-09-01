const express = require('express');
const router = express.Router();
const path = require('path');
const govtData = require('../../../Govt_Data');

/**
 * GET /api/govt-data/summary
 * Returns overall statistics and count of all mock government registries.
 */
router.get('/summary', (req, res) => {
  try {
    const summary = govtData.getSummary();
    res.json({
      success: true,
      ...summary,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/govt-data/registries
 * Returns metadata of all supported government verification registries.
 */
router.get('/registries', (req, res) => {
  try {
    const registries = Object.values(govtData.REGISTRIES).map(r => ({
      id: r.id,
      name: r.name,
      authority: r.authority,
      identifierType: r.identifierType,
      recordCount: r.count,
    }));

    res.json({
      success: true,
      totalRegistries: registries.length,
      registries,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/govt-data/check/:registry/:identifier
 * Check whether a specific record (PAN, GSTIN, Udyam, CIN, etc.) is present in the Govt_Data repository.
 * 
 * Example: GET /api/govt-data/check/pan/SYNPA0001C
 * Example: GET /api/govt-data/check/udyam/UDYAM-KR-03-0012345
 * Example: GET /api/govt-data/check/gst/29SYNPA0001C1Z5
 */
router.get('/check/:registry/:identifier', (req, res) => {
  try {
    const { registry, identifier } = req.params;
    const { pan, legalName } = req.query;

    const result = govtData.checkPresence(registry, identifier, { pan, legalName });
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/govt-data/check-presence
 * Batch check if bidder documents/IDs exist across all government statutory registries.
 * 
 * Body: {
 *   pan: "SYNPA0001C",
 *   gstin: "29SYNPA0001C1Z5",
 *   udyamNo: "UDYAM-KR-03-0012345",
 *   cinNo: "U29100KA2018PTC112233",
 *   ...
 * }
 */
router.post('/check-presence', (req, res) => {
  try {
    const bidderData = req.body.bidder || req.body;
    const result = govtData.checkAllRegistriesForBidder(bidderData);
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/govt-data/registry/:registry
 * Fetch all records stored in a specific mock government registry.
 */
router.get('/registry/:registry', (req, res) => {
  try {
    const normKey = (req.params.registry || '').toLowerCase().trim().replace(/[-\s]/g, '_');
    const registry = govtData.REGISTRIES[normKey];

    if (!registry) {
      return res.status(404).json({
        success: false,
        error: `Registry "${req.params.registry}" not found. Available: ${Object.keys(govtData.REGISTRIES).join(', ')}`,
      });
    }

    res.json({
      success: true,
      registry: registry.id,
      name: registry.name,
      authority: registry.authority,
      count: registry.count,
      records: registry.dataset,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/govt-data/search?q=XYZ
 * Cross-search across all datasets for keywords, numbers, names, or IDs.
 */
router.get('/search', (req, res) => {
  try {
    const query = req.query.q || req.query.query || '';
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query parameter "q" is required' });
    }

    const matches = govtData.searchAllRegistries(query);
    res.json({
      success: true,
      query,
      totalMatchedRegistries: matches.length,
      totalMatchedRecords: matches.reduce((acc, m) => acc + m.matchCount, 0),
      results: matches,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/govt-data/scenarios
 * Returns the 10 linked evaluation test scenarios.
 */
router.get('/scenarios', (req, res) => {
  try {
    res.json({
      success: true,
      totalScenarios: govtData.BIDDER_SCENARIOS.length,
      scenarios: govtData.BIDDER_SCENARIOS,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/govt-data/scenarios/:id
 * Get a specific scenario by ID.
 */
router.get('/scenarios/:id', (req, res) => {
  try {
    const scenario = govtData.findScenarioById(req.params.id);
    if (!scenario) {
      return res.status(404).json({ success: false, error: 'Scenario not found' });
    }
    res.json({
      success: true,
      scenario,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
