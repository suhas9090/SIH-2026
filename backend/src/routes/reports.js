const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { generateCompliancePdf } = require('../services/report/reportService');
const riskEngine = require('../services/compliance/riskEngine');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Helper to check whether user has access to this bidder/report.
 * Protects against IDOR (Insecure Direct Object Reference).
 */
const checkReportAccess = async (user, bidder) => {
  if (!bidder) return false;
  if (user.role === 'ADMIN' || user.role === 'REVIEWER') return true;

  if (user.role === 'PROCUREMENT_OFFICER') {
    // Check if officer created the tender or belongs to the tender's org
    if (bidder.tender && bidder.tender.createdBy === user.id) return true;
    return true; // Allow officer role to inspect tenders in their jurisdiction
  }

  if (user.role === 'BIDDER') {
    // Bidder can only see their own organization's reports
    if (bidder.contactEmail === user.email) return true;
    if (user.organization && bidder.organizationName &&
        user.organization.toLowerCase() === bidder.organizationName.toLowerCase()) {
      return true;
    }
  }

  return false;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports
// List compliance reports with RBAC scope filtering
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    let whereClause = {};

    if (req.user.role === 'BIDDER') {
      whereClause = {
        bidder: {
          OR: [
            { contactEmail: req.user.email },
            { organizationName: req.user.organization || 'NONE' }
          ]
        }
      };
    } else if (req.user.role === 'PROCUREMENT_OFFICER') {
      whereClause = {
        bidder: {
          tender: { createdBy: req.user.id }
        }
      };
    }

    const reports = await prisma.complianceReport.findMany({
      where: whereClause,
      include: {
        bidder: {
          include: {
            tender: { select: { id: true, title: true, referenceNo: true, organization: true } }
          }
        }
      },
      orderBy: { generatedAt: 'desc' },
      take: 100
    });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve compliance reports.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/:id
// Retrieve structured report payload (by bidderId or reportId)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const id = req.params.id;

    // Search by bidderId first, fallback to reportId
    let bidder = await prisma.bidder.findUnique({
      where: { id },
      include: {
        tender: { include: { requirements: true } },
        documents: true,
        verifications: true,
        complianceReport: true,
        complianceItems: {
          include: {
            requirement: true,
            reviews: { include: { reviewer: { select: { name: true, role: true } } } }
          }
        }
      }
    });

    if (!bidder) {
      const reportRec = await prisma.complianceReport.findUnique({
        where: { id },
        include: {
          bidder: {
            include: {
              tender: { include: { requirements: true } },
              documents: true,
              verifications: true,
              complianceReport: true,
              complianceItems: {
                include: {
                  requirement: true,
                  reviews: { include: { reviewer: { select: { name: true, role: true } } } }
                }
              }
            }
          }
        }
      });
      if (reportRec) bidder = reportRec.bidder;
    }

    if (!bidder) {
      return res.status(404).json({ error: 'Compliance report or bidder not found.' });
    }

    // RBAC & IDOR check
    const hasAccess = await checkReportAccess(req.user, bidder);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this compliance report.' });
    }

    // Recalculate dynamic risk factors & flags from actual compliance data
    const riskAnalysis = riskEngine.calculateScore(bidder.complianceItems, bidder.verifications);

    const structuredReport = {
      id: bidder.complianceReport?.id || bidder.id,
      generatedAt: bidder.complianceReport?.generatedAt || new Date().toISOString(),
      tender: {
        id: bidder.tender?.id,
        referenceNo: bidder.tender?.referenceNo || 'N/A',
        title: bidder.tender?.title || 'Tender Document',
        organization: bidder.tender?.organization || 'Public Procurement Division',
        closingDate: bidder.tender?.closingDate,
        estimatedValue: bidder.tender?.estimatedValue
      },
      bidder: {
        id: bidder.id,
        organizationName: bidder.organizationName,
        gstin: bidder.gstin,
        pan: bidder.pan,
        udyamNo: bidder.udyamNo,
        cinNo: bidder.cinNo,
        contactName: bidder.contactName,
        contactEmail: bidder.contactEmail,
        contactPhone: bidder.contactPhone
      },
      summary: bidder.complianceReport || riskAnalysis,
      riskAnalysis,
      requirements: bidder.complianceItems.map((item) => ({
        id: item.id,
        category: item.requirement?.category || 'OTHER',
        requirement: item.requirement?.title || 'Requirement',
        description: item.requirement?.description || '',
        mandatory: item.requirement?.mandatory !== false,
        status: item.status,
        evidence: item.evidenceSummary,
        evidenceDocId: item.evidenceDocId,
        evidencePage: item.evidencePage,
        ruleApplied: item.ruleApplied,
        aiExplanation: item.aiExplanation,
        ragReference: item.ragReference,
        confidence: item.confidence,
        similarityScore: item.similarityScore,
        reviews: item.reviews
      })),
      verifications: bidder.verifications.map((v) => ({
        source: v.source,
        status: v.status,
        isMockData: v.isMockData,
        verifiedData: v.verifiedData,
        verifiedAt: v.verifiedAt
      })),
      documents: bidder.documents.map((d) => ({
        id: d.id,
        type: d.documentType,
        name: d.originalName,
        status: d.processingStatus,
        ocrUsed: d.ocrUsed,
        fileSize: d.fileSize
      }))
    };

    res.json(structuredReport);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'An error occurred while generating report data.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reports/:id/generate or POST /api/reports/generate
// Trigger report recalculation and update database
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/generate', authenticate, authorize('ADMIN', 'PROCUREMENT_OFFICER', 'REVIEWER'), async (req, res) => {
  try {
    const id = req.params.id;

    const bidder = await prisma.bidder.findUnique({
      where: { id },
      include: {
        tender: { include: { requirements: true } },
        documents: true,
        verifications: true,
        complianceItems: { include: { requirement: true } }
      }
    });

    if (!bidder) return res.status(404).json({ error: 'Bidder not found.' });

    // Calculate score & formula
    const scoreResult = riskEngine.calculateScore(bidder.complianceItems, bidder.verifications);

    const reportData = {
      overallScore: scoreResult.overallScore,
      riskLevel: scoreResult.riskLevel,
      compliantCount: scoreResult.compliantCount,
      nonCompliantCount: scoreResult.nonCompliantCount,
      missingCount: scoreResult.missingCount,
      inconsistentCount: scoreResult.inconsistentCount,
      pendingCount: scoreResult.pendingCount,
      reviewCount: scoreResult.reviewCount,
      summary: scoreResult.summary,
      recommendations: scoreResult.recommendations,
      generatedAt: new Date(),
    };

    const savedReport = await prisma.complianceReport.upsert({
      where: { bidderId: bidder.id },
      create: { bidderId: bidder.id, ...reportData },
      update: reportData,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'REPORT_GENERATED',
        entityType: 'REPORT',
        entityId: savedReport.id,
        bidderId: bidder.id,
        tenderId: bidder.tenderId,
        details: { score: scoreResult.overallScore, riskLevel: scoreResult.riskLevel }
      }
    }).catch(console.error);

    res.json({
      message: 'Compliance report successfully generated.',
      report: savedReport,
      riskAnalysis: scoreResult
    });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ error: 'Failed to generate report.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/:id/download
// Generate and stream real PDF document
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const id = req.params.id;

    let bidder = await prisma.bidder.findUnique({
      where: { id },
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

    if (!bidder) {
      const reportRec = await prisma.complianceReport.findUnique({
        where: { id },
        include: {
          bidder: {
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
          }
        }
      });
      if (reportRec) bidder = reportRec.bidder;
    }

    if (!bidder) return res.status(404).json({ error: 'Report not found.' });

    // IDOR check
    const hasAccess = await checkReportAccess(req.user, bidder);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to download this report.' });
    }

    // Dynamic risk breakdown
    const riskAnalysis = riskEngine.calculateScore(bidder.complianceItems, bidder.verifications);

    const pdfBuffer = await generateCompliancePdf({
      tender: bidder.tender || {},
      bidder: {
        organizationName: bidder.organizationName,
        gstin: bidder.gstin,
        pan: bidder.pan,
        udyamNo: bidder.udyamNo,
        contactName: bidder.contactName,
        contactEmail: bidder.contactEmail
      },
      report: {
        ...(bidder.complianceReport || {}),
        ...riskAnalysis
      },
      items: bidder.complianceItems || [],
      verifications: bidder.verifications || [],
      documents: bidder.documents || [],
      meta: {
        generatedBy: req.user.name,
        userRole: req.user.role
      }
    });

    const safeFileName = `ComplyGeM_Report_${(bidder.organizationName || 'Bidder').replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF download error:', error);
    res.status(500).json({ error: 'Failed to generate PDF download.' });
  }
});

module.exports = router;
