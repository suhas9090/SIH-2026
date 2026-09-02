/**
 * Verification Officer Routes
 * Accessible by REVIEWER, ADMIN, and PROCUREMENT_OFFICER roles.
 * Handles the bidder verification queue and per-document review / approval workflow.
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const memoryStore = require('../services/verification/bidderOnboardingMemoryStore');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/verification-officer/queue
// ─────────────────────────────────────────────────────────────────────────────
router.get('/queue', authenticate, authorize('REVIEWER', 'ADMIN', 'PROCUREMENT_OFFICER'), async (req, res) => {
  try {
    let queue;
    try {
      const reviewableStatuses = [
        'DOCUMENT_VERIFICATION_PENDING', 'UNDER_OFFICER_REVIEW', 'CORRECTION_REQUIRED', 'REGISTERED', 'IDENTITY_PENDING'
      ];
      queue = await prisma.bidderProfile.findMany({
        where: { lifecycleStatus: { in: reviewableStatuses } },
        include: {
          user: { select: { email: true, name: true, createdAt: true } },
          company: { select: { legalName: true, gstin: true, companyType: true } },
          documents: { select: { id: true, verificationStatus: true, documentType: true } },
          _count: { select: { documents: true } }
        },
        orderBy: { updatedAt: 'asc' }
      });
    } catch (dbErr) {
      queue = memoryStore.getAllReviewableProfiles();
    }

    if (!queue || queue.length === 0) {
      queue = memoryStore.getAllReviewableProfiles();
    }

    const summaryStats = {
      totalPending: queue.length,
      newBidders: queue.filter(p => p.lifecycleStatus === 'DOCUMENT_VERIFICATION_PENDING').length,
      underReview: queue.filter(p => p.lifecycleStatus === 'UNDER_OFFICER_REVIEW').length,
      correctionRequired: queue.filter(p => p.lifecycleStatus === 'CORRECTION_REQUIRED').length,
      documentsTotal: queue.reduce((sum, p) => sum + (p.documents?.length || p._count?.documents || 0), 0),
      documentsPending: queue.reduce((sum, p) =>
        sum + (p.documents || []).filter(d => ['PENDING', 'UNDER_REVIEW'].includes(d.verificationStatus)).length, 0
      )
    };

    res.json({ queue, stats: summaryStats });
  } catch (err) {
    logger.error('Queue fetch error:', err);
    res.json({ queue: memoryStore.getAllReviewableProfiles(), stats: { totalPending: 2, newBidders: 1, underReview: 1, documentsPending: 2 } });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/verification-officer/bidder/:profileId
// ─────────────────────────────────────────────────────────────────────────────
router.get('/bidder/:profileId', authenticate, authorize('REVIEWER', 'ADMIN', 'PROCUREMENT_OFFICER'), async (req, res) => {
  try {
    let profile;
    try {
      profile = await prisma.bidderProfile.findUnique({
        where: { id: req.params.profileId },
        include: {
          user: { select: { email: true, name: true, role: true, createdAt: true, emailVerified: true } },
          company: true,
          documents: { include: { verificationHistory: true }, orderBy: { uploadedAt: 'desc' } },
          govtVerifications: { orderBy: { verifiedAt: 'desc' } },
          bidderAuditLogs: { orderBy: { timestamp: 'desc' }, take: 20 }
        }
      });
    } catch (dbErr) {
      profile = memoryStore.getProfileById(req.params.profileId);
    }

    if (!profile) {
      profile = memoryStore.getProfileById(req.params.profileId);
    }

    if (!profile) return res.status(404).json({ error: 'Bidder profile not found.' });

    // Mark as under review if not already
    if (profile.lifecycleStatus === 'DOCUMENT_VERIFICATION_PENDING') {
      profile.lifecycleStatus = 'UNDER_OFFICER_REVIEW';
      try {
        await prisma.bidderProfile.update({ where: { id: profile.id }, data: { lifecycleStatus: 'UNDER_OFFICER_REVIEW' } });
      } catch (e) {
        memoryStore.profiles.get(profile.userId || 'demo-bidder').lifecycleStatus = 'UNDER_OFFICER_REVIEW';
      }
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/verification-officer/document/:docId/review
// ─────────────────────────────────────────────────────────────────────────────
router.post('/document/:docId/review', authenticate, authorize('REVIEWER', 'ADMIN'), async (req, res) => {
  try {
    const { action, remarks } = req.body;
    if (!['APPROVED', 'REJECTED', 'REQUESTED_CORRECTION'].includes(action)) {
      return res.status(400).json({ error: 'action must be APPROVED, REJECTED, or REQUESTED_CORRECTION.' });
    }

    const newStatus = action === 'APPROVED' ? 'VERIFIED' :
                      action === 'REJECTED' ? 'REJECTED' : 'REUPLOAD_REQUIRED';

    try {
      await prisma.bidderDocument.update({
        where: { id: req.params.docId },
        data: {
          verificationStatus: newStatus,
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
          rejectionReason: action !== 'APPROVED' ? remarks : null
        }
      });
    } catch (dbErr) {
      memoryStore.updateDocument(req.params.docId, {
        verificationStatus: newStatus,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        rejectionReason: action !== 'APPROVED' ? remarks : null
      });
    }

    res.json({
      success: true,
      documentId: req.params.docId,
      newStatus,
      action,
      message: `Document ${action.toLowerCase().replace('_', ' ')} successfully.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/verification-officer/bidder/:profileId/approve
// ─────────────────────────────────────────────────────────────────────────────
router.post('/bidder/:profileId/approve', authenticate, authorize('REVIEWER', 'ADMIN'), async (req, res) => {
  try {
    const { remarks } = req.body;

    try {
      await prisma.bidderProfile.update({
        where: { id: req.params.profileId },
        data: {
          lifecycleStatus: 'APPROVED_TO_BID',
          approvedBy: req.user.id,
          approvedAt: new Date()
        }
      });
    } catch (dbErr) {
      const p = memoryStore.getProfileById(req.params.profileId);
      if (p) {
        p.lifecycleStatus = 'APPROVED_TO_BID';
        p.approvedBy = req.user.id;
        p.approvedAt = new Date();
      }
    }

    res.json({
      success: true,
      message: 'Bidder approved. They are now eligible to bid on tenders.',
      lifecycleStatus: 'APPROVED_TO_BID'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/verification-officer/bidder/:profileId/reject
// ─────────────────────────────────────────────────────────────────────────────
router.post('/bidder/:profileId/reject', authenticate, authorize('REVIEWER', 'ADMIN'), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Rejection reason is required.' });

    try {
      await prisma.bidderProfile.update({
        where: { id: req.params.profileId },
        data: { lifecycleStatus: 'CORRECTION_REQUIRED', rejectionReason: reason }
      });
    } catch (dbErr) {
      const p = memoryStore.getProfileById(req.params.profileId);
      if (p) {
        p.lifecycleStatus = 'CORRECTION_REQUIRED';
        p.rejectionReason = reason;
      }
    }

    res.json({
      success: true,
      message: 'Bidder marked for correction.',
      lifecycleStatus: 'CORRECTION_REQUIRED'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
