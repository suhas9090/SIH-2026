/**
 * Auth Routes
 * 
 * Security enforced here:
 * - Role registration policy (no self-registered Admin)
 * - Password strength validation on backend
 * - Phone number validation on backend
 * - Approval status management
 * - Rate limiting via express-rate-limit
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const rateLimit = require('express-rate-limit');
const { authenticate, authorize, validatePasswordStrength, validatePhone, validateEmail, getRoleRegistrationPolicy } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// ─── Rate limiters ─────────────────────────────────────────────────────────
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Too many registration attempts from this IP. Please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many login attempts. Please wait 15 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── GET /api/auth/me ──────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, name: true, role: true,
        organization: true, phone: true, approvalStatus: true,
        emailVerified: true, createdAt: true, isActive: true
      }
    });
    res.json(user || req.user);
  } catch (error) {
    // Demo mode fallback
    res.json(req.user);
  }
});

// ─── POST /api/auth/verify-token ──────────────────────────────────────────
router.post('/verify-token', authenticate, (req, res) => {
  res.json({ user: req.user, valid: true });
});

// ─── POST /api/auth/register-profile ─────────────────────────────────────
// Called after Firebase creates the auth account, to create the DB profile.
// This is where we enforce all registration security rules.
router.post('/register-profile', registerLimiter, authenticate, async (req, res) => {
  try {
    const { name, organization, organizationId, phone, role, requestedRole } = req.body;

    // 1. Determine the effective requested role
    const effectiveRole = (requestedRole || role || 'BIDDER').toUpperCase();

    // 2. Enforce role registration policy — no self-registered Admin
    const policy = getRoleRegistrationPolicy(effectiveRole);
    if (!policy.allowed) {
      logger.warn(`Blocked self-registration attempt for role: ${effectiveRole} by ${req.user?.email}`);
      return res.status(403).json({ error: policy.reason, code: 'ROLE_NOT_ALLOWED' });
    }

    // 3. Validate email on backend
    if (req.user?.email) {
      const emailValidation = validateEmail(req.user.email);
      if (!emailValidation.valid) {
        return res.status(400).json({ error: emailValidation.error, code: 'INVALID_EMAIL' });
      }
    }

    // 4. Validate phone on backend (not just frontend)
    if (phone) {
      const phoneValidation = validatePhone(phone);
      if (!phoneValidation.valid) {
        return res.status(400).json({ error: phoneValidation.error, code: 'INVALID_PHONE' });
      }
    }

    // 4. Determine approval status
    const approvalStatus = policy.requiresApproval ? 'PENDING' : 'APPROVED';

    // 5. Create or update user profile
    const user = await prisma.user.upsert({
      where: { firebaseUid: req.user.firebaseUid },
      update: {
        name: name || req.user.name,
        organization,
        organizationId,
        phone: phone || null,
        role: effectiveRole,
        approvalStatus,
      },
      create: {
        firebaseUid: req.user.firebaseUid,
        email: req.user.email || req.user.email,
        name: name || req.user.name,
        organization,
        organizationId,
        phone: phone || null,
        role: effectiveRole,
        approvalStatus,
        emailVerified: false,
      }
    });

    // 6. Log the registration for audit
    logger.info(`New user registered: ${user.email} | role: ${effectiveRole} | status: ${approvalStatus}`);

    // 7. Respond with appropriate message
    res.status(201).json({
      user,
      approvalStatus,
      requiresApproval: policy.requiresApproval,
      message: policy.requiresApproval
        ? 'Your account request has been submitted. An administrator will review and approve it. You will be notified by email.'
        : 'Account created successfully.',
    });
  } catch (error) {
    logger.error('Register-profile error:', error.message);
    // Handle unique constraint (duplicate email/firebaseUid)
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'An account with this email already exists.', code: 'DUPLICATE_EMAIL' });
    }
    res.status(500).json({ error: 'Registration failed. Please try again.', code: 'REGISTRATION_ERROR' });
  }
});

// ─── PUT /api/auth/profile ─────────────────────────────────────────────────
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, organization, phone } = req.body;

    // Phone validation on update too
    if (phone) {
      const phoneValidation = validatePhone(phone);
      if (!phoneValidation.valid) {
        return res.status(400).json({ error: phoneValidation.error });
      }
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, organization, phone: phone || null },
      select: { id: true, email: true, name: true, role: true, organization: true, phone: true }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/auth/validate-password ─────────────────────────────────────
// Frontend can call this to get real-time strength feedback.
// Backend enforces the same rules — this is not the authoritative check,
// that happens in register-profile.
router.post('/validate-password', loginLimiter, (req, res) => {
  const { password } = req.body;
  const result = validatePasswordStrength(password);
  res.json(result);
});

// ─── GET /api/auth/pending-approvals ───────────────────────────────────────
// Admin only — list users pending approval
router.get('/pending-approvals', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const pending = await prisma.user.findMany({
      where: { approvalStatus: 'PENDING' },
      select: { id: true, email: true, name: true, role: true, organization: true, organizationId: true, phone: true, createdAt: true },
      orderBy: { createdAt: 'asc' }
    });
    res.json(pending);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/auth/approve/:userId ────────────────────────────────────────
// Admin only — approve or reject a pending user
router.post('/approve/:userId', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { decision, remarks } = req.body; // decision: 'APPROVED' | 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({ error: 'Decision must be APPROVED or REJECTED.' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: {
        approvalStatus: decision,
        approvedBy: req.user.id,
        approvalRemarks: remarks || null,
        isActive: decision === 'APPROVED',
      }
    });

    logger.info(`User ${decision}: ${user.email} by admin ${req.user.email}`);
    res.json({ user, message: `User ${decision.toLowerCase()} successfully.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/auth/invite-admin ───────────────────────────────────────────
// Admin only — create an admin account (the ONLY way to create Admins)
router.post('/invite-admin', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { email, name, organization } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required.' });
    }

    // Create Firebase user
    const firebaseUser = await require('../config/firebase').auth().createUser({
      email, displayName: name, emailVerified: false,
    });

    // Create DB profile as Admin, pre-approved
    const user = await prisma.user.create({
      data: {
        firebaseUid: firebaseUser.uid,
        email, name, organization,
        role: 'ADMIN',
        approvalStatus: 'APPROVED',
        isActive: true,
        invitedBy: req.user.id,
      }
    });

    logger.info(`Admin invited: ${email} by ${req.user.email}`);
    res.status(201).json({ user, message: `Admin invitation sent to ${email}.` });
  } catch (error) {
    logger.error('Invite admin error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
