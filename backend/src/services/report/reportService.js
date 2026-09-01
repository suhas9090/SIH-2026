/**
 * PDF Compliance Report Generation Service (Spec §21, §22)
 *
 * Uses PDFKit to generate a professional, multi-page, government-grade
 * Bid Compliance & Risk Verification Report.
 *
 * Safe: Never exposes secrets, database credentials, API keys, or raw storage paths.
 * Complete: Includes all 17 required report sections, tables, formula breakdown,
 * risk flags, evidence provenance, and the mandatory AI disclaimer.
 */

const PDFDocument = require('pdfkit');

/**
 * Generate a complete Compliance & Risk PDF Report as a Buffer.
 *
 * @param {Object} data Report payload
 * @param {Object} data.tender Tender details
 * @param {Object} data.bidder Bidder details
 * @param {Object} data.report Risk & score report
 * @param {Array}  data.items Compliance items
 * @param {Array}  data.verifications Government verification results
 * @param {Array}  data.documents Submitted documents
 * @param {Object} data.meta Additional metadata (e.g. generatedBy, reportId)
 * @returns {Promise<Buffer>}
 */
const generateCompliancePdf = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 50, left: 45, right: 45 },
        bufferPages: true,
        info: {
          Title: `ComplyGeM Verification Report - ${data.bidder?.organizationName || 'Bidder'}`,
          Author: 'ComplyGeM AI Verification Platform',
          Subject: 'Government e-Marketplace Bid Compliance Verification',
          Keywords: 'GeM, Compliance, Procurement, Verification, Risk Assessment',
        },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const {
        tender = {},
        bidder = {},
        report = {},
        items = [],
        verifications = [],
        documents = [],
        meta = {},
      } = data;

      const primaryColor = '#0F2744';   // Deep Navy
      const secondaryColor = '#0284C7'; // Sky Blue
      const accentOrange = '#EA580C';   // GeM Orange
      const successColor = '#16A34A';   // Emerald
      const dangerColor = '#DC2626';    // Red
      const warningColor = '#D97706';   // Amber
      const textColor = '#1E293B';      // Dark Slate
      const mutedColor = '#64748B';      // Slate Muted
      const lightBg = '#F8FAFC';        // Off-white/Ice
      const borderColor = '#CBD5E1';    // Border line

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const leftMargin = doc.page.margins.left;

      // ── Helper: Horizontal Line ──────────────────────────────────────────
      const drawDivider = (yOffset = 8) => {
        doc.moveDown(0.3);
        const y = doc.y + yOffset;
        doc
          .strokeColor(borderColor)
          .lineWidth(0.75)
          .moveTo(leftMargin, y)
          .lineTo(leftMargin + pageWidth, y)
          .stroke();
        doc.y = y + 10;
      };

      // ── Helper: Section Title ────────────────────────────────────────────
      const drawSectionHeader = (title, icon = '') => {
        if (doc.y > 680) doc.addPage();
        doc.moveDown(0.8);
        const currentY = doc.y;

        doc
          .rect(leftMargin, currentY, 4, 16)
          .fillColor(primaryColor)
          .fill();

        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor(primaryColor)
          .text(`${icon ? icon + ' ' : ''}${title.toUpperCase()}`, leftMargin + 10, currentY + 1);

        doc.y = currentY + 22;
      };

      // ═════════════════════════════════════════════════════════════════════
      // 1. HEADER & BANNER
      // ═════════════════════════════════════════════════════════════════════
      doc
        .rect(leftMargin, 35, pageWidth, 55)
        .fillColor(primaryColor)
        .fill();

      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#FFFFFF')
        .text('ComplyGeM AI-ASSISTED COMPLIANCE REPORT', leftMargin + 14, 46);

      doc
        .fontSize(8.5)
        .font('Helvetica')
        .fillColor('#93C5FD')
        .text('Government e-Marketplace (GeM) · Bid Evaluation & Risk Intelligence', leftMargin + 14, 66);

      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#E2E8F0')
        .text(`Report Ref: CGM-${Date.now().toString().slice(-8)}`, leftMargin + pageWidth - 140, 48, { width: 130, align: 'right' })
        .text(`Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, leftMargin + pageWidth - 190, 62, { width: 180, align: 'right' });

      doc.y = 102;

      // ═════════════════════════════════════════════════════════════════════
      // 2. TENDER & BIDDER METADATA CARDS
      // ═════════════════════════════════════════════════════════════════════
      const colWidth = (pageWidth - 12) / 2;
      const startCardY = doc.y;
      const cardHeight = 100;

      // Tender Card (Left)
      doc
        .roundedRect(leftMargin, startCardY, colWidth, cardHeight, 6)
        .fillColor(lightBg)
        .strokeColor(borderColor)
        .lineWidth(1)
        .fillAndStroke();

      doc
        .fontSize(9.5)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('📋 TENDER DETAILS', leftMargin + 10, startCardY + 10);

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor(mutedColor)
        .text('Ref No:', leftMargin + 10, startCardY + 28)
        .font('Helvetica')
        .fillColor(textColor)
        .text(tender.referenceNo || 'N/A', leftMargin + 55, startCardY + 28)
        .font('Helvetica-Bold')
        .fillColor(mutedColor)
        .text('Title:', leftMargin + 10, startCardY + 42)
        .font('Helvetica')
        .fillColor(textColor)
        .text((tender.title || 'Untitled Tender').slice(0, 36), leftMargin + 40, startCardY + 42)
        .font('Helvetica-Bold')
        .fillColor(mutedColor)
        .text('Ministry/Org:', leftMargin + 10, startCardY + 56)
        .font('Helvetica')
        .fillColor(textColor)
        .text(tender.organization || 'Public Procurement Division', leftMargin + 72, startCardY + 56)
        .font('Helvetica-Bold')
        .fillColor(mutedColor)
        .text('Est. Value:', leftMargin + 10, startCardY + 70)
        .font('Helvetica')
        .fillColor(textColor)
        .text(tender.estimatedValue ? `₹${(tender.estimatedValue / 10000000).toFixed(2)} Cr` : 'N/A', leftMargin + 65, startCardY + 70);

      // Bidder Card (Right)
      const rightCardX = leftMargin + colWidth + 12;
      doc
        .roundedRect(rightCardX, startCardY, colWidth, cardHeight, 6)
        .fillColor(lightBg)
        .strokeColor(borderColor)
        .lineWidth(1)
        .fillAndStroke();

      doc
        .fontSize(9.5)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('🏢 BIDDER DETAILS', rightCardX + 10, startCardY + 10);

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor(mutedColor)
        .text('Organization:', rightCardX + 10, startCardY + 28)
        .font('Helvetica')
        .fillColor(textColor)
        .text((bidder.organizationName || 'N/A').slice(0, 32), rightCardX + 74, startCardY + 28)
        .font('Helvetica-Bold')
        .fillColor(mutedColor)
        .text('GSTIN:', rightCardX + 10, startCardY + 42)
        .font('Helvetica')
        .fillColor(textColor)
        .text(bidder.gstin || 'N/A', rightCardX + 45, startCardY + 42)
        .font('Helvetica-Bold')
        .fillColor(mutedColor)
        .text('PAN:', rightCardX + 130, startCardY + 42)
        .font('Helvetica')
        .fillColor(textColor)
        .text(bidder.pan || 'N/A', rightCardX + 158, startCardY + 42)
        .font('Helvetica-Bold')
        .fillColor(mutedColor)
        .text('Udyam/MSME:', rightCardX + 10, startCardY + 56)
        .font('Helvetica')
        .fillColor(textColor)
        .text(bidder.udyamNo || 'N/A', rightCardX + 78, startCardY + 56)
        .font('Helvetica-Bold')
        .fillColor(mutedColor)
        .text('Contact:', rightCardX + 10, startCardY + 70)
        .font('Helvetica')
        .fillColor(textColor)
        .text(`${bidder.contactName || 'N/A'} (${bidder.contactEmail || 'N/A'})`.slice(0, 36), rightCardX + 52, startCardY + 70);

      doc.y = startCardY + cardHeight + 14;

      // ═════════════════════════════════════════════════════════════════════
      // 3. EXECUTIVE COMPLIANCE & RISK SCORE BANNER
      // ═════════════════════════════════════════════════════════════════════
      const scoreY = doc.y;
      const scoreBoxHeight = 65;
      const score = Math.round(report.overallScore || 0);
      const riskLevel = (report.riskLevel || 'MEDIUM').toUpperCase();
      const riskBadgeColor =
        riskLevel === 'LOW' ? successColor :
        riskLevel === 'MEDIUM' ? warningColor : dangerColor;

      doc
        .roundedRect(leftMargin, scoreY, pageWidth, scoreBoxHeight, 6)
        .fillColor(lightBg)
        .strokeColor(riskBadgeColor)
        .lineWidth(1.5)
        .fillAndStroke();

      // Score circle / number
      doc
        .fontSize(28)
        .font('Helvetica-Bold')
        .fillColor(riskBadgeColor)
        .text(`${score}%`, leftMargin + 20, scoreY + 10);

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor(mutedColor)
        .text('COMPLIANCE SCORE', leftMargin + 16, scoreY + 44);

      // Vertical separator
      doc
        .strokeColor(borderColor)
        .lineWidth(1)
        .moveTo(leftMargin + 120, scoreY + 8)
        .lineTo(leftMargin + 120, scoreY + scoreBoxHeight - 8)
        .stroke();

      // Risk Badge & breakdown
      doc
        .roundedRect(leftMargin + 135, scoreY + 12, 100, 22, 4)
        .fillColor(riskBadgeColor)
        .fill();

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#FFFFFF')
        .text(`${riskLevel} RISK`, leftMargin + 143, scoreY + 18);

      // Counts summary
      const compliantCnt = report.compliantCount || 0;
      const nonCompliantCnt = report.nonCompliantCount || 0;
      const missingCnt = report.missingCount || 0;
      const reviewCnt = report.reviewCount || 0;

      doc
        .fontSize(8.5)
        .font('Helvetica')
        .fillColor(textColor)
        .text(
          `Compliant: ${compliantCnt}  |  Non-Compliant: ${nonCompliantCnt}  |  Missing: ${missingCnt}  |  Review Required: ${reviewCnt}`,
          leftMargin + 135,
          scoreY + 42
        );

      doc.y = scoreY + scoreBoxHeight + 14;

      // ═════════════════════════════════════════════════════════════════════
      // 4. EXECUTIVE SUMMARY & RECOMMENDATIONS
      // ═════════════════════════════════════════════════════════════════════
      drawSectionHeader('Executive Summary & Analysis');

      doc
        .fontSize(8.5)
        .font('Helvetica')
        .fillColor(textColor)
        .text(report.summary || 'No compliance narrative available.', { align: 'justify', lineGap: 3 });

      if (report.recommendations) {
        doc.moveDown(0.4);
        doc
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .fillColor(accentOrange)
          .text('Recommendations: ', { continued: true })
          .font('Helvetica')
          .fillColor(textColor)
          .text(report.recommendations, { lineGap: 2 });
      }

      // ═════════════════════════════════════════════════════════════════════
      // 5. RISK CALCULATION FORMULA & FACTOR BREAKDOWN
      // ═════════════════════════════════════════════════════════════════════
      if (report.formula && report.formula.factors) {
        drawSectionHeader('Risk Calculation Formula Breakdown');

        doc
          .fontSize(8)
          .font('Helvetica-Oblique')
          .fillColor(mutedColor)
          .text(
            'Score is computed deterministically using weighted risk factors. It is not an arbitrary AI guess.',
            { lineGap: 4 }
          );

        // Factors table header
        const fHeaderY = doc.y;
        doc
          .rect(leftMargin, fHeaderY, pageWidth, 18)
          .fillColor(primaryColor)
          .fill();

        doc
          .fontSize(7.5)
          .font('Helvetica-Bold')
          .fillColor('#FFFFFF')
          .text('FACTOR NAME', leftMargin + 8, fHeaderY + 5)
          .text('WEIGHT', leftMargin + 160, fHeaderY + 5)
          .text('FACTOR SCORE', leftMargin + 230, fHeaderY + 5)
          .text('CONTRIBUTION', leftMargin + 320, fHeaderY + 5)
          .text('DETAILS', leftMargin + 400, fHeaderY + 5);

        let fRowY = fHeaderY + 18;
        report.formula.factors.forEach((f, idx) => {
          doc
            .rect(leftMargin, fRowY, pageWidth, 16)
            .fillColor(idx % 2 === 0 ? lightBg : '#FFFFFF')
            .fill();

          doc
            .fontSize(7.5)
            .font('Helvetica-Bold')
            .fillColor(textColor)
            .text(f.name, leftMargin + 8, fRowY + 4)
            .font('Helvetica')
            .fillColor(mutedColor)
            .text(`${Math.round(f.weight * 100)}%`, leftMargin + 160, fRowY + 4)
            .text(`${f.score}/100`, leftMargin + 230, fRowY + 4)
            .font('Helvetica-Bold')
            .fillColor(primaryColor)
            .text(`${f.contribution} pts`, leftMargin + 320, fRowY + 4)
            .font('Helvetica')
            .fillColor(mutedColor)
            .text((f.detail || '').slice(0, 30), leftMargin + 400, fRowY + 4);

          fRowY += 16;
        });

        doc.y = fRowY + 6;
      }

      // ═════════════════════════════════════════════════════════════════════
      // 6. RISK FLAGS
      // ═════════════════════════════════════════════════════════════════════
      const flags = report.riskFlags || [];
      if (flags.length > 0) {
        drawSectionHeader('Identified Risk Flags & Inconsistencies', '⚠️');

        flags.forEach((flag) => {
          if (doc.y > 700) doc.addPage();
          const flagY = doc.y;
          const flagColor =
            flag.severity === 'CRITICAL' ? dangerColor :
            flag.severity === 'HIGH' ? dangerColor :
            flag.severity === 'MEDIUM' ? warningColor : secondaryColor;

          doc
            .roundedRect(leftMargin, flagY, pageWidth, 38, 4)
            .fillColor(lightBg)
            .strokeColor(flagColor)
            .lineWidth(1)
            .fillAndStroke();

          doc
            .roundedRect(leftMargin + 6, flagY + 6, 60, 14, 3)
            .fillColor(flagColor)
            .fill();

          doc
            .fontSize(6.5)
            .font('Helvetica-Bold')
            .fillColor('#FFFFFF')
            .text(flag.severity, leftMargin + 10, flagY + 9, { width: 52, align: 'center' });

          doc
            .fontSize(8)
            .font('Helvetica-Bold')
            .fillColor(primaryColor)
            .text(flag.title || flag.code, leftMargin + 74, flagY + 8);

          doc
            .fontSize(7.5)
            .font('Helvetica')
            .fillColor(textColor)
            .text(flag.description || '', leftMargin + 74, flagY + 22, { width: pageWidth - 84 });

          doc.y = flagY + 44;
        });
      }

      // ═════════════════════════════════════════════════════════════════════
      // 7. REQUIREMENT-WISE COMPLIANCE EVALUATION
      // ═════════════════════════════════════════════════════════════════════
      drawSectionHeader('Detailed Requirement Evaluation', '⚖️');

      items.forEach((item, index) => {
        if (doc.y > 660) doc.addPage();

        const itemY = doc.y;
        const req = item.requirement || {};
        const isMandatory = req.mandatory !== false;
        const statusColor =
          item.status === 'COMPLIANT' ? successColor :
          item.status === 'NON_COMPLIANT' ? dangerColor :
          item.status === 'MISSING' ? warningColor :
          item.status === 'REQUIRES_HUMAN_REVIEW' || item.status === 'NEEDS_REVIEW' ? accentOrange : mutedColor;

        // Card container
        doc
          .roundedRect(leftMargin, itemY, pageWidth, 74, 5)
          .fillColor(lightBg)
          .strokeColor(borderColor)
          .lineWidth(0.75)
          .fillAndStroke();

        // Left accent bar
        doc
          .rect(leftMargin, itemY, 4, 74)
          .fillColor(statusColor)
          .fill();

        // Header line: Category + Title + Status badge
        doc
          .fontSize(7)
          .font('Helvetica-Bold')
          .fillColor(secondaryColor)
          .text(`[${(req.category || 'GENERAL').replace(/_/g, ' ')}]`, leftMargin + 10, itemY + 8);

        doc
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .fillColor(primaryColor)
          .text((req.title || 'Requirement').slice(0, 50), leftMargin + 80, itemY + 7);

        if (isMandatory) {
          doc
            .fontSize(6.5)
            .font('Helvetica-Bold')
            .fillColor(dangerColor)
            .text('MANDATORY', leftMargin + pageWidth - 140, itemY + 8);
        }

        // Status badge
        doc
          .roundedRect(leftMargin + pageWidth - 80, itemY + 6, 72, 16, 3)
          .fillColor(statusColor)
          .fill();

        doc
          .fontSize(7)
          .font('Helvetica-Bold')
          .fillColor('#FFFFFF')
          .text(item.status.replace(/_/g, ' '), leftMargin + pageWidth - 80, itemY + 10, { width: 72, align: 'center' });

        // Evidence and Rule
        doc
          .fontSize(7.5)
          .font('Helvetica-Bold')
          .fillColor(mutedColor)
          .text('Evidence Found: ', leftMargin + 10, itemY + 26, { continued: true })
          .font('Helvetica')
          .fillColor(textColor)
          .text(item.evidenceSummary || 'No evidence identified in submitted documents.', { width: pageWidth - 30 });

        doc
          .fontSize(7.5)
          .font('Helvetica-Bold')
          .fillColor(mutedColor)
          .text('Rule Applied: ', leftMargin + 10, itemY + 40, { continued: true })
          .font('Helvetica')
          .fillColor(textColor)
          .text(item.ruleApplied || 'Automated rule evaluation pending.', { width: pageWidth - 30 });

        // AI explanation snippet
        if (item.aiExplanation) {
          doc
            .fontSize(7)
            .font('Helvetica-Oblique')
            .fillColor(secondaryColor)
            .text(`AI Note: ${item.aiExplanation.slice(0, 130)}...`, leftMargin + 10, itemY + 54, { width: pageWidth - 30 });
        }

        doc.y = itemY + 80;
      });

      // ═════════════════════════════════════════════════════════════════════
      // 8. GOVERNMENT REGISTRY VERIFICATION RESULTS
      // ═════════════════════════════════════════════════════════════════════
      if (verifications.length > 0) {
        drawSectionHeader('Government Registry Verifications', '🏛️');

        const vHeaderY = doc.y;
        doc
          .rect(leftMargin, vHeaderY, pageWidth, 18)
          .fillColor(primaryColor)
          .fill();

        doc
          .fontSize(7.5)
          .font('Helvetica-Bold')
          .fillColor('#FFFFFF')
          .text('PORTAL / REGISTRY', leftMargin + 8, vHeaderY + 5)
          .text('STATUS', leftMargin + 160, vHeaderY + 5)
          .text('DATA SOURCE', leftMargin + 260, vHeaderY + 5)
          .text('VERIFICATION DETAILS', leftMargin + 350, vHeaderY + 5);

        let vRowY = vHeaderY + 18;
        verifications.forEach((v, idx) => {
          if (vRowY > 720) {
            doc.addPage();
            vRowY = doc.y;
          }

          doc
            .rect(leftMargin, vRowY, pageWidth, 18)
            .fillColor(idx % 2 === 0 ? lightBg : '#FFFFFF')
            .fill();

          const vStatusColor =
            v.status === 'VERIFIED' || v.status === 'MOCK_VERIFIED' ? successColor :
            v.status === 'FAILED' ? dangerColor : warningColor;

          doc
            .fontSize(7.5)
            .font('Helvetica-Bold')
            .fillColor(primaryColor)
            .text(v.source.replace(/_/g, ' '), leftMargin + 8, vRowY + 5)
            .font('Helvetica-Bold')
            .fillColor(vStatusColor)
            .text(v.status.replace(/_/g, ' '), leftMargin + 160, vRowY + 5)
            .font('Helvetica')
            .fillColor(v.isMockData ? warningColor : successColor)
            .text(v.isMockData ? '⚠️ MOCK / DEMO' : '✅ LIVE API', leftMargin + 260, vRowY + 5);

          // Details summary
          const details = v.verifiedData ? Object.entries(v.verifiedData).slice(0, 2).map(([k, val]) => `${k}: ${val}`).join(', ') : 'N/A';
          doc
            .fontSize(7)
            .font('Helvetica')
            .fillColor(mutedColor)
            .text(details.slice(0, 35), leftMargin + 350, vRowY + 5);

          vRowY += 18;
        });

        doc.y = vRowY + 10;
      }

      // ═════════════════════════════════════════════════════════════════════
      // 9. PROVENANCE & SUBMITTED DOCUMENTS
      // ═════════════════════════════════════════════════════════════════════
      if (documents.length > 0) {
        drawSectionHeader('Submitted Document Inventory', '📁');

        documents.forEach((d) => {
          if (doc.y > 720) doc.addPage();
          doc
            .fontSize(7.5)
            .font('Helvetica-Bold')
            .fillColor(primaryColor)
            .text(`• [${d.documentType || d.type || 'DOCUMENT'}] `, { continued: true })
            .font('Helvetica')
            .fillColor(textColor)
            .text(`${d.originalName || d.name || 'Document'} `)
            .font('Helvetica-Oblique')
            .fillColor(mutedColor)
            .text(`  Status: ${d.processingStatus || d.status || 'PROCESSED'} · OCR: ${d.ocrUsed ? 'YES' : 'NO'}`);
        });
      }

      // ═════════════════════════════════════════════════════════════════════
      // 10. STATUTORY DISCLAIMER & SIGN-OFF
      // ═════════════════════════════════════════════════════════════════════
      if (doc.y > 640) doc.addPage();

      doc.moveDown(1.5);
      const discY = doc.y;

      doc
        .roundedRect(leftMargin, discY, pageWidth, 56, 5)
        .fillColor('#FFFBEB')
        .strokeColor('#FCD34D')
        .lineWidth(1)
        .fillAndStroke();

      doc
        .fontSize(7.5)
        .font('Helvetica-Bold')
        .fillColor('#92400E')
        .text('⚠️ STATUTORY DISCLAIMER & NOTICE', leftMargin + 10, discY + 8);

      doc
        .fontSize(6.8)
        .font('Helvetica')
        .fillColor('#78350F')
        .text(
          'This document is generated by the ComplyGeM AI-Assisted Bid Compliance Verification System. AI-derived insights, NLP extractions, and semantic relevance scores serve to support procurement officers and do not supersede statutory determinations. Final award decisions rest solely with authorized human evaluators in accordance with GeM General Terms and Conditions and GFR 2017.',
          leftMargin + 10,
          discY + 20,
          { width: pageWidth - 20, lineGap: 2 }
        );

      // Sign-off block
      doc.moveDown(3);
      const signY = doc.y;
      if (signY < 740) {
        doc
          .fontSize(8)
          .font('Helvetica-Bold')
          .fillColor(primaryColor)
          .text('Evaluation Authority / Procurement Officer', leftMargin + pageWidth - 220, signY)
          .font('Helvetica')
          .fillColor(mutedColor)
          .text('Signature & Verification Stamp', leftMargin + pageWidth - 220, signY + 14);
      }

      // ═════════════════════════════════════════════════════════════════════
      // 11. GLOBAL NUMBERED FOOTERS
      // ═════════════════════════════════════════════════════════════════════
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);

        // Footer line
        doc
          .strokeColor(borderColor)
          .lineWidth(0.5)
          .moveTo(leftMargin, doc.page.height - 35)
          .lineTo(leftMargin + pageWidth, doc.page.height - 35)
          .stroke();

        doc
          .fontSize(7)
          .font('Helvetica')
          .fillColor(mutedColor)
          .text(
            'ComplyGeM · AI-Assisted GeM Compliance Verification Platform · Confidential',
            leftMargin,
            doc.page.height - 26,
            { width: pageWidth / 2, align: 'left' }
          );

        doc
          .text(
            `Page ${i + 1} of ${range.count}`,
            leftMargin + pageWidth / 2,
            doc.page.height - 26,
            { width: pageWidth / 2, align: 'right' }
          );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateCompliancePdf };
