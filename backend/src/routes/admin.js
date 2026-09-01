const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/admin/users
router.get('/users', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organization: true,
        organizationId: true,
        phone: true,
        isActive: true,
        approvalStatus: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/users/:id/approve
router.post('/users/:id/approve', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { remarks } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        approvalStatus: 'APPROVED',
        approvedBy: req.user.id,
        approvalRemarks: remarks || 'Approved by administrator',
        isActive: true,
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'ADMIN_APPROVED_USER',
        entityType: 'USER',
        entityId: user.id,
        details: { targetEmail: user.email, role: user.role, remarks }
      }
    }).catch(() => {});

    logger.info(`Admin approved user: ${user.email} (${user.role})`);
    res.json({ user, message: `Account for ${user.name} approved successfully.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/users/:id/reject
router.post('/users/:id/reject', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { remarks } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        approvalStatus: 'REJECTED',
        approvedBy: req.user.id,
        approvalRemarks: remarks || 'Rejected by administrator',
        isActive: false,
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'ADMIN_REJECTED_USER',
        entityType: 'USER',
        entityId: user.id,
        details: { targetEmail: user.email, role: user.role, remarks }
      }
    }).catch(() => {});

    logger.info(`Admin rejected user: ${user.email}`);
    res.json({ user, message: `Registration for ${user.name} rejected.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/users/:id/suspend
router.post('/users/:id/suspend', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { remarks } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        isActive: false,
        approvalRemarks: remarks || 'Suspended by administrator',
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'ADMIN_SUSPENDED_USER',
        entityType: 'USER',
        entityId: user.id,
        details: { targetEmail: user.email, remarks }
      }
    }).catch(() => {});

    logger.info(`Admin suspended user: ${user.email}`);
    res.json({ user, message: `Account for ${user.name} suspended.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/users/:id/reactivate
router.post('/users/:id/reactivate', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        isActive: true,
        approvalStatus: 'APPROVED',
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'ADMIN_REACTIVATED_USER',
        entityType: 'USER',
        entityId: user.id,
        details: { targetEmail: user.email }
      }
    }).catch(() => {});

    res.json({ user, message: `Account for ${user.name} reactivated.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { role } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { role }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
