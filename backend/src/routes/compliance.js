const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/compliance/bidder/:bidderId
router.get('/bidder/:bidderId', authenticate, async (req, res) => {
  try {
    const [report, items, verifications, bidder] = await Promise.all([
      prisma.complianceReport.findUnique({ where: { bidderId: req.params.bidderId } }),
      prisma.complianceItem.findMany({
        where: { bidderId: req.params.bidderId },
        include: { requirement: true, reviews: { include: { reviewer: { select: { name: true } } } } }
      }),
      prisma.verificationResult.findMany({ where: { bidderId: req.params.bidderId } }),
      prisma.bidder.findUnique({ where: { id: req.params.bidderId }, include: { tender: true } })
    ]);

    res.json({ report, items, verifications, bidder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/compliance/review/:itemId
router.post('/review/:itemId', authenticate, async (req, res) => {
  try {
    const { action, remarks, overrideStatus } = req.body;

    const review = await prisma.complianceReview.create({
      data: {
        complianceItemId: req.params.itemId,
        reviewerId: req.user.id,
        action,
        remarks
      }
    });

    if (overrideStatus) {
      await prisma.complianceItem.update({
        where: { id: req.params.itemId },
        data: { status: overrideStatus, overriddenBy: req.user.id, overrideReason: remarks }
      });
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/compliance/dashboard-stats
router.get('/dashboard-stats', authenticate, async (req, res) => {
  try {
    const where = req.user.role === 'PROCUREMENT_OFFICER' ? { tender: { createdBy: req.user.id } } : {};

    const [totalTenders, totalBidders, highRisk, pendingReview, processed] = await Promise.all([
      prisma.tender.count({ where: req.user.role === 'PROCUREMENT_OFFICER' ? { createdBy: req.user.id } : {} }),
      prisma.bidder.count({ where }),
      prisma.complianceReport.count({ where: { riskLevel: { in: ['HIGH', 'CRITICAL'] }, bidder: where } }),
      prisma.complianceItem.count({ where: { status: 'REQUIRES_HUMAN_REVIEW', bidder: where } }),
      prisma.complianceReport.count({ where: { bidder: where } })
    ]);

    res.json({ totalTenders, totalBidders, highRisk, pendingReview, processed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
