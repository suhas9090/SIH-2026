const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ dest: 'uploads/documents/', limits: { fileSize: 50 * 1024 * 1024 } });

// GET /api/documents/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: { chunks: { orderBy: { chunkIndex: 'asc' } } }
    });
    if (!doc) return res.status(404).json({ error: 'Document not found.' });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.document.delete({ where: { id: req.params.id } });
    res.json({ message: 'Document deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
