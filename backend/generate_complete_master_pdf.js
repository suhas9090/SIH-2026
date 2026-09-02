const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const {
  SYNTHETIC_PAN_RECORDS,
  SYNTHETIC_GST_RECORDS,
  SYNTHETIC_MCA_RECORDS,
  SYNTHETIC_UDYAM_RECORDS,
  SYNTHETIC_INCOME_TAX_RECORDS,
  SYNTHETIC_EPFO_RECORDS,
  SYNTHETIC_ESIC_RECORDS,
  SYNTHETIC_STARTUP_RECORDS,
  SYNTHETIC_NSIC_RECORDS,
  SYNTHETIC_GEM_SELLER_RECORDS,
  SYNTHETIC_BIS_RECORDS,
  SYNTHETIC_LOCAL_CONTENT_RECORDS,
  SYNTHETIC_BLACKLIST_RECORDS
} = require('../Govt_Data');

const outputPath = path.resolve(__dirname, '../Govt_Data_Master_20_Companies_Directory.pdf');
const artifactPath = path.resolve('C:/Users/V R SUHAAS GOWDA/.gemini/antigravity-ide/brain/ae684536-666d-41a3-b67d-7ee695bdcb26/Govt_Data_Master_20_Companies_Directory.pdf');

// Map helpers
const gstMap = Object.fromEntries(SYNTHETIC_GST_RECORDS.map(r => [r.panNumber, r]));
const mcaMap = Object.fromEntries(SYNTHETIC_MCA_RECORDS.map(r => [r.cinOrLlpin.slice(0, 10), r]));
const udyamMap = Object.fromEntries(SYNTHETIC_UDYAM_RECORDS.map(r => [r.panNumber, r]));
const taxMap = Object.fromEntries(SYNTHETIC_INCOME_TAX_RECORDS.map(r => [r.panNumber, r]));
const epfoMap = Object.fromEntries(SYNTHETIC_EPFO_RECORDS.map(r => [r.panNumber, r]));
const esicMap = Object.fromEntries(SYNTHETIC_ESIC_RECORDS.map(r => [r.panNumber, r]));
const startupMap = Object.fromEntries(SYNTHETIC_STARTUP_RECORDS.map(r => [r.panNumber, r]));
const nsicMap = Object.fromEntries(SYNTHETIC_NSIC_RECORDS.map(r => [r.panNumber, r]));
const gemMap = Object.fromEntries(SYNTHETIC_GEM_SELLER_RECORDS.map(r => [r.panNumber, r]));
const bisMap = Object.fromEntries(SYNTHETIC_BIS_RECORDS.map(r => [r.panNumber, r]));
const liiMap = Object.fromEntries(SYNTHETIC_LOCAL_CONTENT_RECORDS.map(r => [r.panNumber, r]));
const blkMap = Object.fromEntries(SYNTHETIC_BLACKLIST_RECORDS.map(r => [r.panNumber, r]));

const doc = new PDFDocument({
  size: 'A4',
  layout: 'landscape',
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
  autoFirstPage: true
});

const writeStream1 = fs.createWriteStream(outputPath);
doc.pipe(writeStream1);

try {
  const writeStream2 = fs.createWriteStream(artifactPath);
  doc.pipe(writeStream2);
} catch (e) {}

function drawHeader(title, subtitle, pageNum) {
  doc.rect(0, 0, 842, 54).fill('#091322');
  doc.fillColor('#38bdf8').fontSize(12).font('Helvetica-Bold').text('COMPLYGeM-AI  |  SYNTHETIC GOVERNMENT VERIFICATION REPOSITORY', 30, 11, { lineBreak: false });
  doc.fillColor('#f0f4ff').fontSize(9.5).font('Helvetica-Bold').text(title, 30, 26, { lineBreak: false });
  doc.fillColor('#94a3b8').fontSize(7).font('Helvetica').text(subtitle, 30, 39, { lineBreak: false });

  // Badge
  doc.rect(640, 10, 172, 34).fill('#1e293b');
  doc.fillColor('#f59e0b').fontSize(7.5).font('Helvetica-Bold').text('20 VENDOR MASTER TEST DATASET', 650, 16, { lineBreak: false });
  doc.fillColor('#94a3b8').fontSize(6.5).font('Helvetica').text(`SIH 2026 Reference Guide  •  Page ${pageNum} of 2`, 650, 28, { lineBreak: false });
}

function drawFooter(pageText) {
  doc.rect(0, 568, 842, 27).fill('#0f172a');
  doc.fillColor('#94a3b8').fontSize(7).font('Helvetica')
    .text('ComplyGeM AI Bid Compliance Verification Platform  •  SIH 2026  •  Government Regulatory Datasets', 30, 578, { lineBreak: false });
  doc.fillColor('#38bdf8').fontSize(7).font('Helvetica-Bold')
    .text(pageText, 520, 578, { width: 290, align: 'right', lineBreak: false });
}

// ══════════════════════════════════════════════════════════════════════
// PAGE 1: Master Statutory Identifiers (PAN, GSTIN, CIN, UDYAM, ITR)
// ══════════════════════════════════════════════════════════════════════
drawHeader(
  'Part 1: Master Corporate & Tax Registrations (PAN, GSTIN, MCA21, Udyam MSME, Income Tax)',
  'Complete synchronized profiles across CBDT, GSTN, MCA21, and Ministry of MSME databases',
  1
);

const colW1 = { num: 20, pan: 68, name: 175, type: 60, gstin: 110, cin: 120, udyam: 115, itr: 70, status: 44 };
const colX1 = {
  num: 30,
  pan: 50,
  name: 118,
  type: 293,
  gstin: 353,
  cin: 463,
  udyam: 583,
  itr: 698,
  status: 768
};

const startY1 = 60;
const rowH1 = 24.5;

// Header Row
doc.rect(30, startY1, 782, 18).fill('#1e3a5f');
doc.fillColor('#ffffff').fontSize(6.8).font('Helvetica-Bold');
doc.text('#', colX1.num, startY1 + 5, { width: colW1.num, align: 'center', lineBreak: false });
doc.text('PAN NUMBER', colX1.pan + 2, startY1 + 5, { width: colW1.pan, lineBreak: false });
doc.text('COMPANY / VENDOR LEGAL NAME', colX1.name + 2, startY1 + 5, { width: colW1.name, lineBreak: false });
doc.text('ENTITY TYPE', colX1.type + 2, startY1 + 5, { width: colW1.type, lineBreak: false });
doc.text('GSTIN (GSTN)', colX1.gstin + 2, startY1 + 5, { width: colW1.gstin, lineBreak: false });
doc.text('CIN / LLPIN (MCA)', colX1.cin + 2, startY1 + 5, { width: colW1.cin, lineBreak: false });
doc.text('UDYAM MSME NO.', colX1.udyam + 2, startY1 + 5, { width: colW1.udyam, lineBreak: false });
doc.text('ITR TURNOVER', colX1.itr + 2, startY1 + 5, { width: colW1.itr, lineBreak: false });
doc.text('STATUS', colX1.status + 2, startY1 + 5, { width: colW1.status, lineBreak: false });

let currentY1 = startY1 + 18;

SYNTHETIC_PAN_RECORDS.forEach((panRec, idx) => {
  const isEven = idx % 2 === 0;
  doc.rect(30, currentY1, 782, rowH1).fill(isEven ? '#f8fafc' : '#ffffff');
  doc.rect(30, currentY1, 782, rowH1).lineWidth(0.5).strokeColor('#e2e8f0').stroke();

  const gst = gstMap[panRec.panNumber] || {};
  const udyam = udyamMap[panRec.panNumber] || {};
  const tax = taxMap[panRec.panNumber] || {};
  const mca = SYNTHETIC_MCA_RECORDS.find(m => m.legalName === panRec.legalName) || {};

  // Index
  doc.fillColor('#64748b').fontSize(6.5).font('Helvetica').text((idx + 1).toString(), colX1.num, currentY1 + 7, { width: colW1.num, align: 'center', lineBreak: false });

  // PAN
  doc.fillColor('#0284c7').fontSize(7).font('Helvetica-Bold').text(panRec.panNumber, colX1.pan + 2, currentY1 + 7, { width: colW1.pan, lineBreak: false });

  // Name
  doc.fillColor('#0f172a').fontSize(6.5).font('Helvetica-Bold').text(panRec.legalName, colX1.name + 2, currentY1 + 4, { width: colW1.name - 6, height: 16, ellipsis: true, lineBreak: false });

  // Type
  doc.fillColor('#475569').fontSize(6.5).font('Helvetica').text(panRec.entityType, colX1.type + 2, currentY1 + 7, { width: colW1.type, lineBreak: false });

  // GSTIN
  doc.fillColor('#7c3aed').fontSize(6.5).font('Helvetica-Bold').text(gst.gstin || '—', colX1.gstin + 2, currentY1 + 7, { width: colW1.gstin, lineBreak: false });

  // CIN
  doc.fillColor('#059669').fontSize(6.2).font('Helvetica').text(mca.cinOrLlpin || 'Proprietorship (N/A)', colX1.cin + 2, currentY1 + 7, { width: colW1.cin, lineBreak: false });

  // Udyam
  doc.fillColor('#d97706').fontSize(6.2).font('Helvetica').text(udyam.udyamRegistrationNumber || '—', colX1.udyam + 2, currentY1 + 7, { width: colW1.udyam, lineBreak: false });

  // ITR Turnover
  const turnoverText = tax.turnover ? `Rs ${(tax.turnover / 10000000).toFixed(1)} Cr` : (tax.filingStatus || '—');
  doc.fillColor(tax.taxComplianceStatus === 'COMPLIANT' ? '#16a34a' : '#dc2626').fontSize(6.5).font('Helvetica-Bold')
    .text(turnoverText, colX1.itr + 2, currentY1 + 7, { width: colW1.itr, lineBreak: false });

  // Status
  const isSurr = panRec.status === 'SURRENDERED';
  const isSusp = panRec.status === 'INACTIVE' || panRec.panActive === false;
  const badgeColor = isSurr ? '#dc2626' : isSusp ? '#d97706' : '#16a34a';
  const badgeText = isSurr ? 'Surr.' : isSusp ? 'Inact.' : 'Active';
  doc.fillColor(badgeColor).fontSize(6.5).font('Helvetica-Bold').text(badgeText, colX1.status + 2, currentY1 + 7, { width: colW1.status, lineBreak: false });

  currentY1 += rowH1;
});

drawFooter('Page 1 of 2  •  Statutory & Corporate Registry');

// ══════════════════════════════════════════════════════════════════════
// PAGE 2: Labour, Certifications & Procurement Status
// ══════════════════════════════════════════════════════════════════════
doc.addPage({ size: 'A4', layout: 'landscape', margins: { top: 0, bottom: 0, left: 0, right: 0 } });

drawHeader(
  'Part 2: Labour Welfare, Statutory Certifications & Procurement Eligibility Matrix',
  'EPFO, ESIC, NSIC SPR, Startup India, Bureau of Indian Standards (BIS), Make in India & Central Debarment',
  2
);

const colW2 = { num: 20, pan: 68, name: 165, epfo: 90, esic: 95, nsic: 95, startup: 70, bis: 75, mii: 45, blk: 59 };
const colX2 = {
  num: 30,
  pan: 50,
  name: 118,
  epfo: 283,
  esic: 373,
  nsic: 468,
  startup: 563,
  bis: 633,
  mii: 708,
  blk: 753
};

const startY2 = 60;
const rowH2 = 24.5;

// Header Row
doc.rect(30, startY2, 782, 18).fill('#1e3a5f');
doc.fillColor('#ffffff').fontSize(6.8).font('Helvetica-Bold');
doc.text('#', colX2.num, startY2 + 5, { width: colW2.num, align: 'center', lineBreak: false });
doc.text('PAN NUMBER', colX2.pan + 2, startY2 + 5, { width: colW2.pan, lineBreak: false });
doc.text('COMPANY / VENDOR NAME', colX2.name + 2, startY2 + 5, { width: colW2.name, lineBreak: false });
doc.text('EPFO ESTABLISHMENT ID', colX2.epfo + 2, startY2 + 5, { width: colW2.epfo, lineBreak: false });
doc.text('ESIC EMPLOYER CODE', colX2.esic + 2, startY2 + 5, { width: colW2.esic, lineBreak: false });
doc.text('NSIC SPR NUMBER', colX2.nsic + 2, startY2 + 5, { width: colW2.nsic, lineBreak: false });
doc.text('STARTUP DIPP', colX2.startup + 2, startY2 + 5, { width: colW2.startup, lineBreak: false });
doc.text('BIS CERT / IS CODE', colX2.bis + 2, startY2 + 5, { width: colW2.bis, lineBreak: false });
doc.text('MII %', colX2.mii + 2, startY2 + 5, { width: colW2.mii, lineBreak: false });
doc.text('BLACKLIST', colX2.blk + 2, startY2 + 5, { width: colW2.blk, lineBreak: false });

let currentY2 = startY2 + 18;

SYNTHETIC_PAN_RECORDS.forEach((panRec, idx) => {
  const isEven = idx % 2 === 0;
  doc.rect(30, currentY2, 782, rowH2).fill(isEven ? '#f8fafc' : '#ffffff');
  doc.rect(30, currentY2, 782, rowH2).lineWidth(0.5).strokeColor('#e2e8f0').stroke();

  const epfo = epfoMap[panRec.panNumber] || {};
  const esic = esicMap[panRec.panNumber] || {};
  const nsic = nsicMap[panRec.panNumber] || {};
  const startup = startupMap[panRec.panNumber] || {};
  const bis = bisMap[panRec.panNumber] || {};
  const lii = liiMap[panRec.panNumber] || {};
  const blk = blkMap[panRec.panNumber] || {};

  // Index
  doc.fillColor('#64748b').fontSize(6.5).font('Helvetica').text((idx + 1).toString(), colX2.num, currentY2 + 7, { width: colW2.num, align: 'center', lineBreak: false });

  // PAN
  doc.fillColor('#0284c7').fontSize(7).font('Helvetica-Bold').text(panRec.panNumber, colX2.pan + 2, currentY2 + 7, { width: colW2.pan, lineBreak: false });

  // Name
  doc.fillColor('#0f172a').fontSize(6.5).font('Helvetica-Bold').text(panRec.legalName, colX2.name + 2, currentY2 + 4, { width: colW2.name - 6, height: 16, ellipsis: true, lineBreak: false });

  // EPFO
  doc.fillColor(epfo.complianceStatus === 'COMPLIANT' ? '#059669' : epfo.establishmentId ? '#dc2626' : '#64748b').fontSize(6.2).font('Helvetica')
    .text(epfo.establishmentId ? `${epfo.establishmentId} (${epfo.employeeCount || 0})` : '—', colX2.epfo + 2, currentY2 + 7, { width: colW2.epfo, lineBreak: false });

  // ESIC
  doc.fillColor(esic.complianceStatus === 'COMPLIANT' ? '#059669' : esic.registrationNumber ? '#dc2626' : '#64748b').fontSize(6.2).font('Helvetica')
    .text(esic.registrationNumber || '—', colX2.esic + 2, currentY2 + 7, { width: colW2.esic, lineBreak: false });

  // NSIC
  doc.fillColor('#7c3aed').fontSize(6).font('Helvetica').text(nsic.nsicRegistrationNumber || '—', colX2.nsic + 2, currentY2 + 7, { width: colW2.nsic, lineBreak: false });

  // Startup
  doc.fillColor(startup.recognitionNumber ? '#d97706' : '#64748b').fontSize(6.5).font(startup.recognitionNumber ? 'Helvetica-Bold' : 'Helvetica')
    .text(startup.recognitionNumber || '—', colX2.startup + 2, currentY2 + 7, { width: colW2.startup, lineBreak: false });

  // BIS
  doc.fillColor('#0284c7').fontSize(6.2).font('Helvetica').text(bis.certificateNumber || 'N/A (Services/IT)', colX2.bis + 2, currentY2 + 7, { width: colW2.bis, lineBreak: false });

  // MII %
  const miiPct = lii.localContentPercentage !== undefined ? `${lii.localContentPercentage}%` : '—';
  const miiColor = (lii.localContentPercentage >= 50) ? '#16a34a' : (lii.localContentPercentage >= 20) ? '#d97706' : '#dc2626';
  doc.fillColor(miiColor).fontSize(6.8).font('Helvetica-Bold').text(miiPct, colX2.mii + 2, currentY2 + 7, { width: colW2.mii, lineBreak: false });

  // Blacklist / Debarment
  const isDebarred = blk.isDebarred;
  const isUnderNotice = blk.blacklistStatus === 'UNDER_NOTICE';
  const blkText = isDebarred ? 'DEBARRED ✗' : isUnderNotice ? 'Notice ⚠' : 'Clean ✓';
  const blkColor = isDebarred ? '#dc2626' : isUnderNotice ? '#d97706' : '#16a34a';

  doc.fillColor(blkColor).fontSize(6.5).font('Helvetica-Bold').text(blkText, colX2.blk + 2, currentY2 + 7, { width: colW2.blk, lineBreak: false });

  currentY2 += rowH2;
});

drawFooter('Page 2 of 2  •  Labour Welfare, BIS, Startup & Vigilance Integrity Matrix');

doc.end();

console.log('Multi-Page Master Directory PDF generated successfully at:', outputPath);
