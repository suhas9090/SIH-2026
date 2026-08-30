const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/audit
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50, tenderId, bidderId, userId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (tenderId) where.tenderId = tenderId;
    if (bidderId) where.bidderId = bidderId;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { timestamp: 'desc' },
        include: { user: { select: { name: true, email: true, role: true } } }
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({ logs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
