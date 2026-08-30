const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/reports/:bidderId
router.get('/:bidderId', authenticate, async (req, res) => {
  try {
    const bidder = await prisma.bidder.findUnique({
      where: { id: req.params.bidderId },
      include: {
        tender: { include: { requirements: true } },
        documents: true,
        verifications: true,
        complianceReport: true,
        complianceItems: {
          include: {
            requirement: true,
            reviews: { include: { reviewer: { select: { name: true } } } }
          }
        }
      }
    });

    if (!bidder) return res.status(404).json({ error: 'Bidder not found.' });

    // Generate structured report
    const report = {
      generatedAt: new Date().toISOString(),
      tender: {
        referenceNo: bidder.tender.referenceNo,
        title: bidder.tender.title,
        organization: bidder.tender.organization,
        closingDate: bidder.tender.closingDate
      },
      bidder: {
        organizationName: bidder.organizationName,
        gstin: bidder.gstin,
        pan: bidder.pan,
        udyamNo: bidder.udyamNo,
        contactName: bidder.contactName,
        contactEmail: bidder.contactEmail
      },
      summary: bidder.complianceReport,
      requirements: bidder.complianceItems.map(item => ({
        category: item.requirement.category,
        requirement: item.requirement.title,
        description: item.requirement.description,
        mandatory: item.requirement.mandatory,
        status: item.status,
        evidence: item.evidenceSummary,
        verification: item.ruleApplied,
        aiExplanation: item.aiExplanation,
        confidence: item.confidence,
        reviews: item.reviews
      })),
      verifications: bidder.verifications,
      documents: bidder.documents.map(d => ({
        type: d.documentType,
        name: d.originalName,
        status: d.processingStatus
      }))
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports  (list all reports)
router.get('/', authenticate, async (req, res) => {
  try {
    const reports = await prisma.complianceReport.findMany({
      include: {
        bidder: {
          include: { tender: { select: { title: true, referenceNo: true } } }
        }
      },
      orderBy: { generatedAt: 'desc' },
      take: 50
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
