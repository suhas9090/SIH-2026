const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { SYNTHETIC_PAN_RECORDS } = require('../Govt_Data/panDataset');
const { SYNTHETIC_GST_RECORDS } = require('../Govt_Data/gstDataset');

const outputPath = path.resolve(__dirname, '../Govt_PAN_Dataset_20_Records.pdf');

// Create matching map from PAN to GSTIN
const panToGstMap = {};
SYNTHETIC_GST_RECORDS.forEach(g => {
  if (g.panNumber) panToGstMap[g.panNumber] = g.gstin;
});

// Setup Landscape A4 document with no auto-pagination margin issues
const doc = new PDFDocument({
  size: 'A4',
  layout: 'landscape',
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
  autoFirstPage: true
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// ── Header Background ──────────────────────────────────────────────
doc.rect(0, 0, 842, 58).fill('#091322');

// Header Text
doc.fillColor('#38bdf8').fontSize(13).font('Helvetica-Bold').text('COMPLYGeM-AI  |  GOVERNMENT DATASET DIRECTORY', 30, 12, { lineBreak: false });
doc.fillColor('#f0f4ff').fontSize(10).font('Helvetica-Bold').text('Synthetic Regulatory PAN Records (CBDT / Income Tax Dataset)', 30, 28, { lineBreak: false });
doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica').text('Prototype Testing Dataset  •  20 Pre-Configured Commercial & Industrial Identities  •  v2.0', 30, 42, { lineBreak: false });

// Disclaimer tag on top right
doc.rect(630, 10, 182, 36).fill('#1e293b');
doc.fillColor('#f59e0b').fontSize(7.5).font('Helvetica-Bold').text('⚠ PROTOTYPE DATASET', 640, 16, { lineBreak: false });
doc.fillColor('#94a3b8').fontSize(6.5).font('Helvetica').text('Fictional test records for GeM bid compliance', 640, 29, { lineBreak: false });

// ── Table Geometry ──────────────────────────────────────────────────
const startY = 66;
const rowHeight = 22;
const colWidths = {
  num: 25,
  pan: 74,
  legalName: 195,
  entityType: 80,
  incDate: 62,
  status: 68,
  jurisdiction: 140,
  gstin: 138
};

const colX = {
  num: 30,
  pan: 30 + colWidths.num,
  legalName: 30 + colWidths.num + colWidths.pan,
  entityType: 30 + colWidths.num + colWidths.pan + colWidths.legalName,
  incDate: 30 + colWidths.num + colWidths.pan + colWidths.legalName + colWidths.entityType,
  status: 30 + colWidths.num + colWidths.pan + colWidths.legalName + colWidths.entityType + colWidths.incDate,
  jurisdiction: 30 + colWidths.num + colWidths.pan + colWidths.legalName + colWidths.entityType + colWidths.incDate + colWidths.status,
  gstin: 30 + colWidths.num + colWidths.pan + colWidths.legalName + colWidths.entityType + colWidths.incDate + colWidths.status + colWidths.jurisdiction
};

// ── Table Header ───────────────────────────────────────────────────
doc.rect(30, startY, 782, 20).fill('#1e3a5f');

doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
doc.text('#', colX.num, startY + 5, { width: colWidths.num, align: 'center', lineBreak: false });
doc.text('PAN NUMBER', colX.pan + 4, startY + 5, { width: colWidths.pan, lineBreak: false });
doc.text('LEGAL ENTITY NAME', colX.legalName + 4, startY + 5, { width: colWidths.legalName, lineBreak: false });
doc.text('ENTITY TYPE', colX.entityType + 4, startY + 5, { width: colWidths.entityType, lineBreak: false });
doc.text('INC. DATE', colX.incDate + 4, startY + 5, { width: colWidths.incDate, lineBreak: false });
doc.text('STATUS', colX.status + 4, startY + 5, { width: colWidths.status, lineBreak: false });
doc.text('JURISDICTION', colX.jurisdiction + 4, startY + 5, { width: colWidths.jurisdiction, lineBreak: false });
doc.text('MATCHING GSTIN (TESTING)', colX.gstin + 4, startY + 5, { width: colWidths.gstin, lineBreak: false });

// ── Table Rows ─────────────────────────────────────────────────────
let currentY = startY + 20;

SYNTHETIC_PAN_RECORDS.forEach((rec, index) => {
  const isEven = index % 2 === 0;
  const rowBg = isEven ? '#f8fafc' : '#ffffff';
  
  // Row background
  doc.rect(30, currentY, 782, rowHeight).fill(rowBg);
  doc.rect(30, currentY, 782, rowHeight).lineWidth(0.5).strokeColor('#e2e8f0').stroke();

  // Index
  doc.fillColor('#64748b').fontSize(7).font('Helvetica').text((index + 1).toString(), colX.num, currentY + 6, { width: colWidths.num, align: 'center', lineBreak: false });

  // PAN
  doc.fillColor('#0369a1').fontSize(7.5).font('Helvetica-Bold').text(rec.panNumber, colX.pan + 4, currentY + 6, { width: colWidths.pan, lineBreak: false });

  // Legal Name
  doc.fillColor('#0f172a').fontSize(7).font('Helvetica-Bold').text(rec.legalName, colX.legalName + 4, currentY + 6, { width: colWidths.legalName - 8, height: 14, ellipsis: true, lineBreak: false });

  // Entity Type
  doc.fillColor('#475569').fontSize(7).font('Helvetica').text(rec.entityType, colX.entityType + 4, currentY + 6, { width: colWidths.entityType, lineBreak: false });

  // Incorporation Date
  doc.fillColor('#475569').fontSize(7).font('Helvetica').text(rec.dateOfIncorporation || '—', colX.incDate + 4, currentY + 6, { width: colWidths.incDate, lineBreak: false });

  // Status Badge
  const isSurrendered = rec.status === 'SURRENDERED';
  const isInactive = rec.status === 'INACTIVE' || rec.panActive === false;
  const statusBg = isSurrendered ? '#fef2f2' : isInactive ? '#fffbeb' : '#ecfdf5';
  const statusColor = isSurrendered ? '#dc2626' : isInactive ? '#d97706' : '#16a34a';
  const statusText = rec.status === 'ACTIVE' ? 'Active ✓' : rec.status;

  doc.rect(colX.status + 2, currentY + 3, colWidths.status - 6, 16).fill(statusBg);
  doc.fillColor(statusColor).fontSize(6.5).font('Helvetica-Bold').text(statusText, colX.status + 4, currentY + 7, { width: colWidths.status - 10, align: 'center', lineBreak: false });

  // Jurisdiction
  doc.fillColor('#475569').fontSize(6.5).font('Helvetica').text(rec.jurisdiction || '—', colX.jurisdiction + 4, currentY + 6, { width: colWidths.jurisdiction - 6, height: 14, ellipsis: true, lineBreak: false });

  // GSTIN
  const gstin = panToGstMap[rec.panNumber] || '—';
  doc.fillColor('#7c3aed').fontSize(7).font('Helvetica-Bold').text(gstin, colX.gstin + 4, currentY + 6, { width: colWidths.gstin, lineBreak: false });

  currentY += rowHeight;
});

// ── Footer ─────────────────────────────────────────────────────────
doc.rect(0, 568, 842, 27).fill('#0f172a');
doc.fillColor('#94a3b8').fontSize(7).font('Helvetica')
  .text('ComplyGeM AI Bid Compliance Verification Platform  •  SIH 2026  •  Generated for Vendor & Officer Testing', 30, 578, { lineBreak: false });
doc.fillColor('#38bdf8').fontSize(7).font('Helvetica-Bold')
  .text('Page 1 of 1  •  Confidential Prototype Testing Dataset', 540, 578, { width: 270, align: 'right', lineBreak: false });

doc.end();

console.log('Single page PDF generated successfully at:', outputPath);
