const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const axios = require('axios');

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ dest: 'uploads/tenders/', limits: { fileSize: 50 * 1024 * 1024 } });

// GET /api/tenders
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { referenceNo: { contains: search, mode: 'insensitive' } },
        { organization: { contains: search, mode: 'insensitive' } }
      ];
    }
    // Non-admin officers see their own tenders
    if (req.user.role === 'PROCUREMENT_OFFICER') {
      where.createdBy = req.user.id;
    }

    const [tenders, total] = await Promise.all([
      prisma.tender.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { bidders: true, requirements: true } },
          creator: { select: { name: true, email: true } }
        }
      }),
      prisma.tender.count({ where })
    ]);

    res.json({ tenders, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tenders
router.post('/', authenticate, authorize('ADMIN', 'PROCUREMENT_OFFICER'), async (req, res) => {
  try {
    const { title, organization, department, category, estimatedValue, publishedDate, closingDate, description } = req.body;

    const referenceNo = `TND-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const tender = await prisma.tender.create({
      data: {
        referenceNo,
        title,
        organization,
        department,
        category,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
        publishedDate: publishedDate ? new Date(publishedDate) : null,
        closingDate: closingDate ? new Date(closingDate) : null,
        description,
        createdBy: req.user.id,
        status: 'DRAFT'
      }
    });

    res.status(201).json(tender);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tenders/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const tender = await prisma.tender.findUnique({
      where: { id: req.params.id },
      include: {
        creator: { select: { name: true, email: true } },
        documents: true,
        requirements: { orderBy: { category: 'asc' } },
        bidders: {
          include: {
            complianceReport: true,
            _count: { select: { documents: true } }
          }
        }
      }
    });

    if (!tender) return res.status(404).json({ error: 'Tender not found.' });
    res.json(tender);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/tenders/:id
router.put('/:id', authenticate, authorize('ADMIN', 'PROCUREMENT_OFFICER'), async (req, res) => {
  try {
    const updated = await prisma.tender.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tenders/:id/upload
router.post('/:id/upload', authenticate, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const document = await prisma.document.create({
      data: {
        tenderId: req.params.id,
        documentType: 'TENDER_DOCUMENT',
        originalName: req.file.originalname,
        fileUrl: `/uploads/tenders/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: req.user.id,
        processingStatus: 'PENDING'
      }
    });

    await prisma.tender.update({
      where: { id: req.params.id },
      data: { status: 'PROCESSING' }
    });

    // Trigger async AI processing
    triggerDocumentProcessing(document.id, req.params.id, null).catch(console.error);

    res.status(201).json({ document, message: 'Document uploaded. Processing started.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tenders/:id/extract-requirements (manual trigger)
router.post('/:id/extract-requirements', authenticate, async (req, res) => {
  try {
    const tender = await prisma.tender.findUnique({
      where: { id: req.params.id },
      include: { documents: { where: { documentType: 'TENDER_DOCUMENT' } } }
    });

    if (!tender) return res.status(404).json({ error: 'Tender not found.' });
    if (!tender.documents.length) return res.status(400).json({ error: 'No tender document uploaded.' });

    const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/extract-requirements`, {
      documentId: tender.documents[0].id,
      tenderId: req.params.id,
      text: tender.documents[0].extractedText || ''
    });

    const requirements = aiResponse.data.requirements || [];

    // Save requirements to DB
    await prisma.requirement.deleteMany({ where: { tenderId: req.params.id } });
    const created = await Promise.all(
      requirements.map(r =>
        prisma.requirement.create({
          data: {
            tenderId: req.params.id,
            category: r.category || 'OTHER',
            title: r.requirement || r.title,
            description: r.description || r.requirement,
            operator: r.operator,
            minValue: r.minimumValue || r.minValue,
            textValue: r.textValue,
            unit: r.unit,
            currency: r.currency,
            period: r.period,
            mandatory: r.mandatory !== false,
            evidenceTypes: r.requiredEvidence || [],
            sourcePage: r.sourcePage
          }
        })
      )
    );

    await prisma.tender.update({ where: { id: req.params.id }, data: { status: 'ACTIVE' } });

    res.json({ requirements: created, count: created.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tenders/:id/requirements
router.get('/:id/requirements', authenticate, async (req, res) => {
  try {
    const requirements = await prisma.requirement.findMany({
      where: { tenderId: req.params.id },
      orderBy: [{ mandatory: 'desc' }, { category: 'asc' }]
    });
    res.json(requirements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tenders/stats/summary
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const where = req.user.role === 'PROCUREMENT_OFFICER' ? { createdBy: req.user.id } : {};
    const [total, active, processing, closed] = await Promise.all([
      prisma.tender.count({ where }),
      prisma.tender.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.tender.count({ where: { ...where, status: 'PROCESSING' } }),
      prisma.tender.count({ where: { ...where, status: 'CLOSED' } })
    ]);
    res.json({ total, active, processing, closed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function triggerDocumentProcessing(documentId, tenderId, bidderId) {
  try {
    await axios.post(`${process.env.AI_SERVICE_URL}/process-document`, {
      documentId, tenderId, bidderId
    });
  } catch (err) {
    console.error('AI service processing failed:', err.message);
  }
}

module.exports = router;
