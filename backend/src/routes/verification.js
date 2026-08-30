const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const governmentVerification = require('../services/verification/governmentVerification');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/verify/gst
router.post('/gst', authenticate, async (req, res) => {
  try {
    const { gstin, bidderId, orgName } = req.body;
    const result = await governmentVerification.verifyGST(gstin, orgName);
    if (bidderId) {
      await prisma.verificationResult.upsert({
        where: { bidderId_source: { bidderId, source: 'GST_PORTAL' } },
        create: { bidderId, ...result },
        update: result
      }).catch(() => prisma.verificationResult.create({ data: { bidderId, ...result } }));
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/verify/pan
router.post('/pan', authenticate, async (req, res) => {
  try {
    const { pan, bidderId, orgName } = req.body;
    const result = await governmentVerification.verifyPAN(pan, orgName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/verify/udyam
router.post('/udyam', authenticate, async (req, res) => {
  try {
    const { udyamNo, bidderId, orgName } = req.body;
    const result = await governmentVerification.verifyUdyam(udyamNo, orgName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/verify/mca
router.post('/mca', authenticate, async (req, res) => {
  try {
    const { cinNo, bidderId, orgName } = req.body;
    const result = await governmentVerification.verifyMCA(cinNo, orgName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/verify/blacklist
router.post('/blacklist', authenticate, async (req, res) => {
  try {
    const { orgName, pan } = req.body;
    const result = await governmentVerification.verifyBlacklist(orgName, pan);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
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

module.exports = router;
