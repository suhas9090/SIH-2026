const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const axios = require('axios');
const path = require('path');

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ dest: 'uploads/bidders/', limits: { fileSize: 50 * 1024 * 1024 } });

// POST /api/bidders (add bidder to tender)
router.post('/', authenticate, async (req, res) => {
  try {
    const { tenderId, organizationName, gstin, pan, udyamNo, cinNo, contactName, contactEmail, contactPhone } = req.body;

    const bidder = await prisma.bidder.create({
      data: { tenderId, organizationName, gstin, pan, udyamNo, cinNo, contactName, contactEmail, contactPhone }
    });

    res.status(201).json(bidder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/bidders?tenderId=xxx
router.get('/', authenticate, async (req, res) => {
  try {
    const { tenderId } = req.query;
    const where = tenderId ? { tenderId } : {};

    const bidders = await prisma.bidder.findMany({
      where,
      include: {
        complianceReport: true,
        _count: { select: { documents: true, verifications: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bidders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/bidders/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const bidder = await prisma.bidder.findUnique({
      where: { id: req.params.id },
      include: {
        tender: true,
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
    res.json(bidder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/bidders/:id/upload-documents
router.post('/:id/upload-documents', authenticate, upload.array('documents', 20), async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded.' });

    const documentTypes = JSON.parse(req.body.documentTypes || '[]');
    const documents = await Promise.all(
      req.files.map((file, i) =>
        prisma.document.create({
          data: {
            bidderId: req.params.id,
            documentType: documentTypes[i] || 'OTHER',
            originalName: file.originalname,
            fileUrl: `/uploads/bidders/${file.filename}`,
            fileSize: file.size,
            mimeType: file.mimetype,
            uploadedBy: req.user.id,
            processingStatus: 'PENDING'
          }
        })
      )
    );

    // Trigger async AI processing for each document
    documents.forEach(doc => {
      axios.post(`${process.env.AI_SERVICE_URL}/process-document`, {
        documentId: doc.id, bidderId: req.params.id
      }).catch(console.error);
    });

    res.status(201).json({ documents, message: `${documents.length} document(s) uploaded. Processing started.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/bidders/:id/verify — Full compliance check
router.post('/:id/verify', authenticate, async (req, res) => {
  try {
    const bidder = await prisma.bidder.findUnique({
      where: { id: req.params.id },
      include: { tender: { include: { requirements: true } }, documents: true }
    });

    if (!bidder) return res.status(404).json({ error: 'Bidder not found.' });

    // Step 1: Run government verifications
    const verificationService = require('../services/verification/governmentVerification');
    const verifications = await verificationService.verifyAll(bidder);

    // Save verifications
    await prisma.verificationResult.deleteMany({ where: { bidderId: req.params.id } });
    await Promise.all(verifications.map(v =>
      prisma.verificationResult.create({ data: { bidderId: req.params.id, ...v } })
    ));

    // Step 2: Run AI analysis via FastAPI
    let aiResults = null;
    try {
      const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/analyze-bidder`, {
        bidderId: req.params.id,
        tenderId: bidder.tenderId,
        requirements: bidder.tender.requirements,
        documents: bidder.documents,
        verifications
      });
      aiResults = aiResponse.data;
    } catch (aiErr) {
      console.error('AI analysis failed, using rule engine only:', aiErr.message);
    }

    // Step 3: Run compliance engine
    const complianceEngine = require('../services/compliance/complianceEngine');
    const complianceItems = await complianceEngine.evaluate(bidder, verifications, aiResults);

    // Save compliance items
    await prisma.complianceItem.deleteMany({ where: { bidderId: req.params.id } });
    await Promise.all(complianceItems.map(item =>
      prisma.complianceItem.create({ data: { bidderId: req.params.id, ...item } })
    ));

    // Step 4: Calculate overall score
    const riskEngine = require('../services/compliance/riskEngine');
    const report = riskEngine.calculateScore(complianceItems);

    // Save/update compliance report
    await prisma.complianceReport.upsert({
      where: { bidderId: req.params.id },
      create: { bidderId: req.params.id, ...report },
      update: report
    });

    res.json({
      message: 'Compliance verification complete.',
      verifications: verifications.length,
      complianceItems: complianceItems.length,
      report
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/bidders/:id/compliance
router.get('/:id/compliance', authenticate, async (req, res) => {
  try {
    const [report, items, verifications] = await Promise.all([
      prisma.complianceReport.findUnique({ where: { bidderId: req.params.id } }),
      prisma.complianceItem.findMany({
        where: { bidderId: req.params.id },
        include: { requirement: true, reviews: { include: { reviewer: { select: { name: true } } } } },
        orderBy: [{ status: 'asc' }]
      }),
      prisma.verificationResult.findMany({ where: { bidderId: req.params.id } })
    ]);

    res.json({ report, items, verifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/bidders/:id/compliance/:itemId/review
router.post('/:id/compliance/:itemId/review', authenticate, authorize('ADMIN', 'PROCUREMENT_OFFICER', 'REVIEWER'), async (req, res) => {
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

module.exports = router;
