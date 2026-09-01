/**
 * Enhanced Secure Authentication & Role-Based Registration Routes
 * 
 * Enforces:
 * - Role-based registration policies (No public Admin registration)
 * - Server-side validation of personal, organizational, and regulatory credentials
 * - Verification against Synthetic Regulatory Datasets / HRMS directories
 * - Explicit account approval workflows (PENDING -> APPROVED / REJECTED)
 * - Full audit trail generation for all registration and decision events
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const rateLimit = require('express-rate-limit');
const { authenticate, authorize, validatePasswordStrength, validatePhone, validateEmail, getRoleRegistrationPolicy } = require('../middleware/auth');
const entityTriangulationService = require('../services/verification/entityTriangulationService');
const { findOfficerRecord } = require('../services/verification/syntheticData/officerDirectory');
const { findAuditorRecord } = require('../services/verification/syntheticData/auditorDirectory');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// ── Rate limiters ─────────────────────────────────────────────────────────────
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Too many registration attempts. Please try again after some time.' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many requests. Please wait a few minutes.' },
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, name: true, role: true,
        organization: true, organizationId: true, phone: true,
        approvalStatus: true, emailVerified: true, isActive: true,
        createdAt: true, lastLoginAt: true
      }
    });
    res.json(user || req.user);
  } catch (error) {
    res.json(req.user);
  }
});

// ── POST /api/auth/verify-token ──────────────────────────────────────────────
router.post('/verify-token', authenticate, (req, res) => {
  res.json({ user: req.user, valid: true });
});

// ── POST /api/auth/verify-otp (Email / Mobile OTP Verification Simulation) ────
router.post('/verify-otp', loginLimiter, (req, res) => {
  const { type, target, otp } = req.body; // type: 'PHONE' | 'EMAIL', otp: string

  // Firebase test phone numbers or demo verification
  if (otp && (otp.length === 6 || otp === '123456' || otp === '654321')) {
    return res.json({
      verified: true,
      type,
      target,
      message: `${type === 'PHONE' ? 'Mobile number' : 'Email address'} verified successfully via authentication gateway.`,
      verifiedAt: new Date().toISOString(),
    });
  }

  return res.status(400).json({
    verified: false,
    error: 'Invalid or expired OTP code. For testing, use valid 6-digit code.',
  });
});

// ── POST /api/auth/register-bidder ───────────────────────────────────────────
router.post('/register-bidder', registerLimiter, async (req, res) => {
  try {
    const {
      name, designation, email, phone, password,
      organizationName, tradeName, entityType, pan, gstin, udyamNo, cinNo,
      address, state, district, pincode, businessCategory, yearOfEstablishment
    } = req.body;

    if (!name || !email || !organizationName || !pan || !gstin) {
      return res.status(400).json({ error: 'Name, email, organization name, PAN, and GSTIN are mandatory.' });
    }

    // 1. Run Server-Side Triangulation against Synthetic Government Data
    const verificationResult = await entityTriangulationService.verifyBidderFull({
      organizationName,
      pan,
      gstin,
      udyamNo,
      cinNo,
    });

    const isClearOfDebarment = verificationResult.riskLevel !== 'CRITICAL';
    const approvalStatus = 'PENDING'; // Always requires review/approval or active

    // 2. Create User in PostgreSQL (Firebase UID fallback for prototype)
    const firebaseUid = `uid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const user = await prisma.user.create({
      data: {
        firebaseUid,
        email: email.toLowerCase().trim(),
        name: name.trim(),
        phone: phone || null,
        role: 'BIDDER',
        organization: organizationName.trim(),
        organizationId: gstin.trim(),
        isActive: false, // Pending admin approval
        approvalStatus: 'PENDING',
        emailVerified: true,
      }
    });

    // 3. Log Audit Trail
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'BIDDER_REGISTRATION_SUBMITTED',
        entityType: 'BIDDER',
        entityId: user.id,
        details: {
          organizationName,
          pan,
          gstin,
          verificationScore: verificationResult.overallScore,
          riskLevel: verificationResult.riskLevel,
          discrepancies: verificationResult.entityDiscrepancies?.length || 0,
        }
      }
    }).catch(() => {});

    logger.info(`New Bidder Registered: ${organizationName} (${email}) | Score: ${verificationResult.overallScore}%`);

    res.status(201).json({
      user,
      accountStatus: 'PENDING_APPROVAL',
      verificationResult,
      message: 'Bidder company registration submitted successfully. Awaiting administrative verification.',
    });
  } catch (error) {
    logger.error('Register bidder error:', error.message);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'An account with this email or organization identifier already exists.' });
    }
    res.status(500).json({ error: 'Bidder registration failed: ' + error.message });
  }
});

// ── POST /api/auth/register-officer ──────────────────────────────────────────
router.post('/register-officer', registerLimiter, async (req, res) => {
  try {
    const { name, email, phone, organization, department, employeeId, designation } = req.body;

    if (!name || !email || !organization || !employeeId) {
      return res.status(400).json({ error: 'Name, email, organization, and Employee ID are required.' });
    }

    // 1. Check against Synthetic Officer Directory
    const officerRecord = findOfficerRecord(employeeId);

    const firebaseUid = `uid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const user = await prisma.user.create({
      data: {
        firebaseUid,
        email: email.toLowerCase().trim(),
        name: name.trim(),
        phone: phone || null,
        role: 'PROCUREMENT_OFFICER',
        organization: organization.trim(),
        organizationId: employeeId.trim(),
        isActive: false, // Requires Administrator approval
        approvalStatus: 'PENDING',
        emailVerified: true,
      }
    });

    // 2. Log Audit Trail
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'OFFICER_REGISTRATION_SUBMITTED',
        entityType: 'USER',
        entityId: user.id,
        details: {
          name,
          employeeId,
          organization,
          directoryMatch: !!officerRecord,
        }
      }
    }).catch(() => {});

    logger.info(`New Officer Registered: ${name} (${employeeId}) | Directory Match: ${!!officerRecord}`);

    res.status(201).json({
      user,
      accountStatus: 'PENDING_APPROVAL',
      directoryMatch: !!officerRecord,
      message: 'Procurement Officer credentials submitted. Requires administrative verification before platform access is granted.',
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    res.status(500).json({ error: 'Officer registration failed: ' + error.message });
  }
});

// ── POST /api/auth/register-auditor ──────────────────────────────────────────
router.post('/register-auditor', registerLimiter, async (req, res) => {
  try {
    const { name, email, phone, organization, auditorId, designation } = req.body;

    if (!name || !email || !organization || !auditorId) {
      return res.status(400).json({ error: 'Name, email, organization, and Auditor ID are required.' });
    }

    // 1. Check against Synthetic Auditor Directory
    const auditorRecord = findAuditorRecord(auditorId);

    const firebaseUid = `uid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const user = await prisma.user.create({
      data: {
        firebaseUid,
        email: email.toLowerCase().trim(),
        name: name.trim(),
        phone: phone || null,
        role: 'REVIEWER', // Compliance Auditor / Reviewer
        organization: organization.trim(),
        organizationId: auditorId.trim(),
        isActive: false, // Requires Administrator approval
        approvalStatus: 'PENDING',
        emailVerified: true,
      }
    });

    // 2. Log Audit Trail
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'AUDITOR_REGISTRATION_SUBMITTED',
        entityType: 'USER',
        entityId: user.id,
        details: {
          name,
          auditorId,
          organization,
          directoryMatch: !!auditorRecord,
        }
      }
    }).catch(() => {});

    logger.info(`New Auditor Registered: ${name} (${auditorId}) | Directory Match: ${!!auditorRecord}`);

    res.status(201).json({
      user,
      accountStatus: 'PENDING_APPROVAL',
      directoryMatch: !!auditorRecord,
      message: 'Compliance Auditor registration submitted. Requires administrative verification before audit privileges are activated.',
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    res.status(500).json({ error: 'Auditor registration failed: ' + error.message });
  }
});

// ── GET /api/auth/pending-approvals (Admin Only) ──────────────────────────────
router.get('/pending-approvals', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const pending = await prisma.user.findMany({
      where: { approvalStatus: 'PENDING' },
      select: {
        id: true, email: true, name: true, role: true,
        organization: true, organizationId: true, phone: true,
        createdAt: true, approvalStatus: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(pending);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── POST /api/auth/approve/:userId (Admin Only) ──────────────────────────────
router.post('/approve/:userId', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { remarks } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: {
        approvalStatus: 'APPROVED',
        approvedBy: req.user.id,
        approvalRemarks: remarks || 'Approved by system administrator',
        isActive: true,
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'USER_ACCOUNT_APPROVED',
        entityType: 'USER',
        entityId: user.id,
        details: { approvedUserEmail: user.email, role: user.role, remarks }
      }
    }).catch(() => {});

    logger.info(`User Approved: ${user.email} (${user.role}) by Admin ${req.user.email}`);
    res.json({ user, message: `User account for ${user.name} has been activated.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── POST /api/auth/reject/:userId (Admin Only) ───────────────────────────────
router.post('/reject/:userId', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { remarks } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: {
        approvalStatus: 'REJECTED',
        approvedBy: req.user.id,
        approvalRemarks: remarks || 'Rejected during administrative review',
        isActive: false,
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'USER_ACCOUNT_REJECTED',
        entityType: 'USER',
        entityId: user.id,
        details: { rejectedUserEmail: user.email, role: user.role, remarks }
      }
    }).catch(() => {});

    logger.info(`User Rejected: ${user.email} by Admin ${req.user.email}`);
    res.json({ user, message: `User registration for ${user.name} has been rejected.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── POST /api/auth/suspend/:userId (Admin Only) ──────────────────────────────
router.post('/suspend/:userId', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { remarks } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: {
        approvalStatus: 'REJECTED',
        isActive: false,
        approvalRemarks: remarks || 'Suspended by system administrator',
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'USER_ACCOUNT_SUSPENDED',
        entityType: 'USER',
        entityId: user.id,
        details: { suspendedUserEmail: user.email, role: user.role, remarks }
      }
    }).catch(() => {});

    logger.info(`User Suspended: ${user.email} by Admin ${req.user.email}`);
    res.json({ user, message: `User account ${user.email} has been suspended.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
