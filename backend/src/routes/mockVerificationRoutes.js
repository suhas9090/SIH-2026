const express = require('express');
const router = express.Router();
const { getVerificationProvider, verificationFactory } = require('../services/verification/verificationFactory');
const entityTriangulationService = require('../services/verification/entityTriangulationService');
const { BIDDER_SCENARIOS, findScenarioById } = require('../services/verification/syntheticData/bidderScenarios');

// Telemetry & Metadata
router.get('/metadata', (req, res) => {
  res.json(verificationFactory.getProviderMetadata());
});

// List all 10 Judge / Tester Scenarios
router.get('/scenarios', (req, res) => {
  res.json({
    totalScenarios: BIDDER_SCENARIOS.length,
    disclaimer: 'SYNTHETIC_REGULATORY_DATASET: 10 pre-configured bidder test cases for live evaluation and automated testing.',
    scenarios: BIDDER_SCENARIOS,
  });
});

// Get specific scenario by ID
router.get('/scenarios/:id', (req, res) => {
  const scenario = findScenarioById(req.params.id);
  if (!scenario) return res.status(404).json({ error: 'Scenario not found' });
  res.json(scenario);
});

// 1. PAN Verification
router.get('/pan/:pan', async (req, res) => {
  try {
    const provider = getVerificationProvider();
    const result = await provider.verifyPAN(req.params.pan, req.query.legalName);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GST Verification
router.get('/gst/:gstin', async (req, res) => {
  try {
    const provider = getVerificationProvider();
    const result = await provider.verifyGST(req.params.gstin, req.query.legalName, req.query.pan);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Udyam / MSME Verification
router.get('/udyam/:udyam', async (req, res) => {
  try {
    const provider = getVerificationProvider();
    const result = await provider.verifyUdyam(req.params.udyam, req.query.legalName, req.query.pan);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. MCA Company / CIN Verification
router.get('/mca/:cin', async (req, res) => {
  try {
    const provider = getVerificationProvider();
    const result = await provider.verifyMCA(req.params.cin, req.query.legalName);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Income Tax Compliance
router.get('/income-tax/:pan', async (req, res) => {
  try {
    const provider = getVerificationProvider();
    const result = await provider.verifyIncomeTax(req.params.pan);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. EPFO Shram Suvidha
router.get('/epfo/:id', async (req, res) => {
  try {
    const provider = getVerificationProvider();
    const result = await provider.verifyEPFO(req.params.id, req.query.pan);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. ESIC Compliance
router.get('/esic/:id', async (req, res) => {
  try {
    const provider = getVerificationProvider();
    const result = await provider.verifyESIC(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Startup India DPIIT
router.get('/startup/:id', async (req, res) => {
  try {
    const provider = getVerificationProvider();
    const result = await provider.verifyStartup(req.params.id, req.query.pan);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. NSIC Single Point Registration
router.get('/nsic/:id', async (req, res) => {
  try {
    const provider = getVerificationProvider();
    const result = await provider.verifyNSIC(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. GeM Seller Registry & Debarment
router.get('/gem/:id', async (req, res) => {
  try {
    const provider = getVerificationProvider();
    const result = await provider.verifyGeM(req.params.id, req.query.pan);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. DigiLocker Document Signature
router.get('/digilocker/:id', async (req, res) => {
  try {
    const provider = getVerificationProvider();
    const result = await provider.verifyDigiLocker(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12. BIS Standards Quality
router.get('/bis/:id', async (req, res) => {
  try {
    const provider = getVerificationProvider();
    const result = await provider.verifyBIS(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Make in India Local Content
router.get('/make-in-india/:id', async (req, res) => {
  try {
    const provider = getVerificationProvider();
    const minRequired = parseFloat(req.query.minRequired) || 50.0;
    const result = await provider.verifyLocalContent(req.params.id, minRequired);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 14. Central Blacklist & Debarment
router.get('/blacklist/:identifier', async (req, res) => {
  try {
    const provider = getVerificationProvider();
    const result = await provider.checkBlacklist(req.params.identifier);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// UNIFIED VERIFICATION ENDPOINT: POST /api/verification/bidder
// Runs full cross-portal triangulation across all 14 statutory registries
// =============================================================================
router.post('/verify-bidder', async (req, res) => {
  try {
    const bidderData = req.body.bidder || req.body;
    const tenderReqs = req.body.tenderRequirements || {};

    const fullResult = await entityTriangulationService.verifyBidderFull(bidderData, tenderReqs);
    res.json(fullResult);
  } catch (err) {
    console.error('Error during unified bidder verification:', err);
    res.status(500).json({ error: 'Unified verification failed: ' + err.message });
  }
});

module.exports = router;
