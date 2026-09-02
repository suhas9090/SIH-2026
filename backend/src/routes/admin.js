const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const memoryStore = require('../services/verification/bidderOnboardingMemoryStore');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Helper: Get users from memoryStore
function getMemoryUsers() {
  const users = Array.from(memoryStore.users.values()).map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    organization: u.organization,
    organizationId: u.organizationId,
    phone: u.phone,
    isActive: u.isActive !== false,
    approvalStatus: u.approvalStatus || 'APPROVED',
    emailVerified: u.emailVerified ?? true,
    createdAt: u.createdAt || new Date(),
    lastLoginAt: u.lastLoginAt || null,
  }));
  users.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return users;
}

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
    // Fallback to memoryStore when Prisma is offline
    const memoryUsers = getMemoryUsers();
    res.json(memoryUsers);
  }
});

// POST /api/admin/users/:id/approve
router.post('/users/:id/approve', authenticate, authorize('ADMIN'), async (req, res) => {
  const { remarks } = req.body;
  try {
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
    return res.json({ user, message: `Account for ${user.name} approved successfully.` });
  } catch (error) {
    // Fallback memoryStore update
    const memUser = memoryStore.getUserById(req.params.id);
    if (memUser) {
      memUser.approvalStatus = 'APPROVED';
      memUser.isActive = true;
      memUser.approvedBy = req.user.id;
      memUser.approvalRemarks = remarks || 'Approved by administrator';
      return res.json({ user: memUser, message: `Account for ${memUser.name} approved successfully.` });
    }
    res.status(404).json({ error: 'User not found in store.' });
  }
});

// POST /api/admin/users/:id/reject
router.post('/users/:id/reject', authenticate, authorize('ADMIN'), async (req, res) => {
  const { remarks } = req.body;
  try {
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
    return res.json({ user, message: `Registration for ${user.name} rejected.` });
  } catch (error) {
    const memUser = memoryStore.getUserById(req.params.id);
    if (memUser) {
      memUser.approvalStatus = 'REJECTED';
      memUser.isActive = false;
      memUser.approvalRemarks = remarks || 'Rejected by administrator';
      return res.json({ user: memUser, message: `Registration for ${memUser.name} rejected.` });
    }
    res.status(404).json({ error: 'User not found.' });
  }
});

// POST /api/admin/users/:id/suspend
router.post('/users/:id/suspend', authenticate, authorize('ADMIN'), async (req, res) => {
  const { remarks } = req.body;
  try {
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
    return res.json({ user, message: `Account for ${user.name} suspended.` });
  } catch (error) {
    const memUser = memoryStore.getUserById(req.params.id);
    if (memUser) {
      memUser.isActive = false;
      memUser.approvalRemarks = remarks || 'Suspended by administrator';
      return res.json({ user: memUser, message: `Account for ${memUser.name} suspended.` });
    }
    res.status(404).json({ error: 'User not found.' });
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

    return res.json({ user, message: `Account for ${user.name} reactivated.` });
  } catch (error) {
    const memUser = memoryStore.getUserById(req.params.id);
    if (memUser) {
      memUser.isActive = true;
      memUser.approvalStatus = 'APPROVED';
      return res.json({ user: memUser, message: `Account for ${memUser.name} reactivated.` });
    }
    res.status(404).json({ error: 'User not found.' });
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
    const memUser = memoryStore.getUserById(req.params.id);
    if (memUser) {
      memUser.role = req.body.role;
      return res.json(memUser);
    }
    res.status(404).json({ error: 'User not found.' });
  }
});

module.exports = router;
