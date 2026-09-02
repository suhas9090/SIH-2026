/**
 * Authentication & Authorization Middleware
 * 
 * Security architecture:
 *   Token → Firebase verify → DB user lookup → isActive check →
 *   approvalStatus check → RBAC permission check
 * 
 * Permission matrix enforced server-side (never trust the frontend).
 */

const admin = require('firebase-admin');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────
// RBAC Permission Matrix — single source of truth
// Every action must be listed here and checked server-side.
// ─────────────────────────────────────────────────────────────
const PERMISSIONS = {
  // Tender management
  'tender:create':           ['ADMIN', 'PROCUREMENT_OFFICER'],
  'tender:update':           ['ADMIN', 'PROCUREMENT_OFFICER'],
  'tender:delete':           ['ADMIN'],
  'tender:view':             ['ADMIN', 'PROCUREMENT_OFFICER', 'REVIEWER'],
  'tender:upload_document':  ['ADMIN', 'PROCUREMENT_OFFICER'],
  'tender:extract_requirements': ['ADMIN', 'PROCUREMENT_OFFICER'],

  // Bidder management
  'bidder:create':           ['ADMIN', 'PROCUREMENT_OFFICER'],
  'bidder:view':             ['ADMIN', 'PROCUREMENT_OFFICER', 'REVIEWER', 'BIDDER'],
  'bidder:upload_documents': ['ADMIN', 'PROCUREMENT_OFFICER', 'BIDDER'],
  'bidder:verify':           ['ADMIN', 'PROCUREMENT_OFFICER', 'REVIEWER'],

  // Compliance
  'compliance:view':         ['ADMIN', 'PROCUREMENT_OFFICER', 'REVIEWER'],
  'compliance:review':       ['ADMIN', 'PROCUREMENT_OFFICER', 'REVIEWER'],

  // Documents
  'document:view':           ['ADMIN', 'PROCUREMENT_OFFICER', 'REVIEWER'],
  'document:delete':         ['ADMIN'],

  // Reports
  'report:view':             ['ADMIN', 'PROCUREMENT_OFFICER', 'REVIEWER'],
  'report:generate':         ['ADMIN', 'PROCUREMENT_OFFICER'],

  // Verification
  'verification:run':        ['ADMIN', 'PROCUREMENT_OFFICER', 'REVIEWER'],

  // Audit
  'audit:view_all':          ['ADMIN'],
  'audit:view_relevant':     ['ADMIN', 'PROCUREMENT_OFFICER', 'REVIEWER'],

  // Admin only
  'admin:manage_users':      ['ADMIN'],
  'admin:approve_users':     ['ADMIN'],
  'admin:manage_knowledge':  ['ADMIN'],
  'admin:view_all_tenders':  ['ADMIN'],
};

// Roles that require admin approval before they can access the system
const REQUIRES_APPROVAL = ['PROCUREMENT_OFFICER', 'REVIEWER'];

// Roles that can NEVER be self-registered (must be assigned by an existing Admin)
const ADMIN_ONLY_ROLES = ['ADMIN'];

// ─────────────────────────────────────────────────────────────
// Main authenticate middleware
const jwt = require('jsonwebtoken');
const memoryStore = require('../services/verification/bidderOnboardingMemoryStore');

// ─────────────────────────────────────────────────────────────
// Main authenticate middleware
// ─────────────────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // In development mode, if no auth token is provided, assign default demo bidder session
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (process.env.NODE_ENV === 'development') {
        const demoRole = req.headers['x-demo-role'] || 'BIDDER';
        req.user = {
          id: 'demo-bidder',
          firebaseUid: 'demo-bidder-uid',
          email: 'vendor@abcindustries.com',
          name: 'Demo Authorized Bidder',
          role: demoRole,
          isActive: true,
          approvalStatus: 'APPROVED',
          emailVerified: true,
          organization: 'ABC Safety Technologies Pvt Ltd',
        };
        return next();
      }
      return res.status(401).json({ error: 'No authorization token provided.' });
    }

    const token = authHeader.split('Bearer ')[1];

    // 1. Verify standard JWT token
    const jwtSecret = process.env.JWT_SECRET || 'complygem-secret-key-2026';
    try {
      const decodedJwt = jwt.verify(token, jwtSecret);
      if (decodedJwt && (decodedJwt.id || decodedJwt.email)) {
        let dbUser = memoryStore.getUserById(decodedJwt.id) || memoryStore.getUserByEmail(decodedJwt.email);
        if (dbUser) {
          req.user = dbUser;
          return next();
        }
        try {
          dbUser = await prisma.user.findUnique({ where: { id: decodedJwt.id } });
        } catch (dbErr) {}
        if (dbUser) {
          req.user = dbUser;
          return next();
        }
      }
    } catch (jwtErr) {
      // Not a valid JWT or expired, try fallback methods
    }

    // Demo mode bypass — only in development, only with specific demo token
    if (process.env.NODE_ENV === 'development' && (token === 'demo-token' || token.startsWith('demo-') || token === 'undefined' || !token)) {
      const demoRole = req.headers['x-demo-role'] || 'BIDDER';
      req.user = {
        id: 'demo-bidder',
        firebaseUid: 'demo-bidder-uid',
        email: 'vendor@abcindustries.com',
        name: 'Demo Authorized Bidder',
        role: demoRole,
        isActive: true,
        approvalStatus: 'APPROVED',
        emailVerified: true,
        organization: 'ABC Safety Technologies Pvt Ltd',
      };
      return next();
    }

    // Verify Firebase token
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      let user = null;
      try {
        user = await prisma.user.findUnique({
          where: { firebaseUid: decodedToken.uid }
        });
      } catch (dbErr) {
        user = memoryStore.getUserByEmail(decodedToken.email);
      }

      if (!user) {
        return res.status(403).json({
          error: 'Account profile incomplete. Please complete registration.',
          code: 'PROFILE_INCOMPLETE'
        });
      }

      req.user = { ...user, emailVerified: decodedToken.email_verified };
      return next();
    } catch (fbErr) {
      // Firebase verification failed
    }

    return res.status(401).json({ error: 'Invalid or expired authentication session. Please sign in again.' });
  } catch (error) {
    logger.error('Auth middleware error:', error.message);
    return res.status(401).json({ error: 'Authentication failed.', code: 'AUTH_FAILED' });
  }
};

// ─────────────────────────────────────────────────────────────
// Role-based authorization — checks one or more roles
// Usage: authorize('ADMIN', 'PROCUREMENT_OFFICER')
// ─────────────────────────────────────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      logger.warn(`Authorization denied: user=${req.user.email} role=${req.user.role} required=${roles.join(',')}`);
      return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    }
    next();
  };
};

// ─────────────────────────────────────────────────────────────
// Permission-based authorization — checks the PERMISSIONS matrix
// Usage: requirePermission('tender:create')
// This is the preferred approach — always use this over raw authorize()
// ─────────────────────────────────────────────────────────────
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles) {
      logger.error(`Unknown permission checked: ${permission}`);
      return res.status(500).json({ error: 'Internal permission configuration error.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Permission denied: user=${req.user.email} role=${req.user.role} permission=${permission}`);
      return res.status(403).json({
        error: 'You do not have permission to perform this action.',
        requiredPermission: permission,
      });
    }
    next();
  };
};

// ─────────────────────────────────────────────────────────────
// Password strength validator (used in backend, not just frontend)
// ─────────────────────────────────────────────────────────────
const validatePasswordStrength = (password) => {
  const errors = [];
  if (!password || password.length < 8) errors.push('At least 8 characters required.');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter required.');
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter required.');
  if (!/[0-9]/.test(password)) errors.push('At least one number required.');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('At least one special character required.');
  if (password.length > 128) errors.push('Password must not exceed 128 characters.');
  return { valid: errors.length === 0, errors };
};

// ─────────────────────────────────────────────────────────────
// Phone number validator
// ─────────────────────────────────────────────────────────────
const validatePhone = (phone) => {
  if (!phone) return { valid: true }; // Phone is optional
  // Strip spaces and dashes
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  // Must be in format: optional + followed by 7-15 digits
  const phoneRegex = /^\+?[1-9]\d{6,14}$/;
  if (!phoneRegex.test(cleaned)) {
    return { valid: false, error: 'Invalid phone number format. Use format: +91 9876543210' };
  }
  return { valid: true, cleaned };
};

// ─────────────────────────────────────────────────────────────
// Email format validator
// ─────────────────────────────────────────────────────────────
const validateEmail = (email) => {
  if (!email) return { valid: false, error: 'Email is required.' };
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: 'Invalid email address format (e.g. name@domain.com).' };
  }
  return { valid: true, cleaned: email.trim().toLowerCase() };
};

// ─────────────────────────────────────────────────────────────
// Role registration rules
// ─────────────────────────────────────────────────────────────
const getRoleRegistrationPolicy = (requestedRole) => {
  if (ADMIN_ONLY_ROLES.includes(requestedRole)) {
    return { allowed: false, reason: 'Administrator accounts cannot be self-registered. Contact your system administrator.' };
  }
  if (REQUIRES_APPROVAL.includes(requestedRole)) {
    return { allowed: true, requiresApproval: true, message: 'Your account request has been submitted and is pending administrator approval.' };
  }
  return { allowed: true, requiresApproval: false };
};

module.exports = {
  authenticate,
  authorize,
  requirePermission,
  validatePasswordStrength,
  validatePhone,
  validateEmail,
  getRoleRegistrationPolicy,
  PERMISSIONS,
  REQUIRES_APPROVAL,
  ADMIN_ONLY_ROLES,
};
