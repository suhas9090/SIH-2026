const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { getVerificationProvider, verificationFactory } = require('../services/verification/verificationFactory');
const entityTriangulationService = require('../services/verification/entityTriangulationService');
const { BIDDER_SCENARIOS, findScenarioById } = require('../services/verification/syntheticData/bidderScenarios');

const router = express.Router();
const prisma = new PrismaClient();

// Telemetry & Metadata
router.get('/metadata', (req, res) => {
  res.json(verificationFactory.getProviderMetadata());
});

// Judge / Tester Scenarios
router.get('/scenarios', (req, res) => {
  res.json({
    totalScenarios: BIDDER_SCENARIOS.length,
    disclaimer: 'SYNTHETIC_REGULATORY_DATASET: 10 pre-configured bidder test cases for live evaluation and automated testing.',
    scenarios: BIDDER_SCENARIOS,
  });
});

router.get('/scenarios/:id', (req, res) => {
  const scenario = findScenarioById(req.params.id);
  if (!scenario) return res.status(404).json({ error: 'Scenario not found' });
  res.json(scenario);
});

// Unified Bidder Verification & Triangulation
router.post('/bidder', async (req, res) => {
  try {
    const bidderData = req.body.bidder || req.body;
    const tenderReqs = req.body.tenderRequirements || {};

    const fullResult = await entityTriangulationService.verifyBidderFull(bidderData, tenderReqs);

    if (bidderData.id) {
      // Save individual verification results to DB
      for (const check of fullResult.verificationChecks) {
        await prisma.verificationResult.upsert({
          where: { bidderId_source: { bidderId: bidderData.id, source: check.verificationType } },
          create: {
            bidderId: bidderData.id,
            source: check.verificationType,
            entityId: check.inputValue || 'UNKNOWN',
            status: check.status || 'VERIFIED',
            isMockData: check.isSynthetic || true,
            verifiedData: check.data || check,
          },
          update: {
            entityId: check.inputValue || 'UNKNOWN',
            status: check.status || 'VERIFIED',
            isMockData: check.isSynthetic || true,
            verifiedData: check.data || check,
          }
        }).catch(() => {});
      }
    }

    res.json(fullResult);
  } catch (error) {
    res.status(500).json({ error: 'Verification failed: ' + error.message });
  }
});

// GET /api/verify/bidder/:bidderId
router.get('/bidder/:bidderId', authenticate, async (req, res) => {
  try {
    const verifications = await prisma.verificationResult.findMany({
      where: { bidderId: req.params.bidderId },
      orderBy: { verifiedAt: 'desc' }
    });
    res.json(verifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Individual statutory endpoints
router.post('/gst', async (req, res) => {
  try {
    const { gstin, orgName, pan } = req.body;
    const provider = getVerificationProvider();
    res.json(await provider.verifyGST(gstin, orgName, pan));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/pan', async (req, res) => {
  try {
    const { pan, orgName } = req.body;
    const provider = getVerificationProvider();
    res.json(await provider.verifyPAN(pan, orgName));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/udyam', async (req, res) => {
  try {
    const { udyamNo, orgName, pan } = req.body;
    const provider = getVerificationProvider();
    res.json(await provider.verifyUdyam(udyamNo, orgName, pan));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/mca', async (req, res) => {
  try {
    const { cinNo, orgName } = req.body;
    const provider = getVerificationProvider();
    res.json(await provider.verifyMCA(cinNo, orgName));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/blacklist', async (req, res) => {
  try {
    const { identifier, orgName, pan } = req.body;
    const provider = getVerificationProvider();
    res.json(await provider.checkBlacklist(identifier || pan || orgName));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
