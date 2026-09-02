/**
 * Generates the Complete 14-Page All-In-One Government Datasets Handbook PDF
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const govtData = require('../Govt_Data');

const outputPath = path.resolve(__dirname, '../Govt_Data_PDFs/00_COMPLYGEM_ALL_14_GOVT_DATASETS_COMPLETE_HANDBOOK.pdf');
const artifactPath = path.resolve('C:/Users/V R SUHAAS GOWDA/.gemini/antigravity-ide/brain/ae684536-666d-41a3-b67d-7ee695bdcb26/Govt_Data_PDFs/00_COMPLYGEM_ALL_14_GOVT_DATASETS_COMPLETE_HANDBOOK.pdf');

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

const pagesConfig = [
  {
    title: 'Dataset 1: Income Tax Department (CBDT) — Permanent Account Number (PAN) Registry',
    authority: 'Central Board of Direct Taxes (CBDT)',
    identifierLabel: 'panNumber',
    dataset: govtData.SYNTHETIC_PAN_RECORDS,
    columns: [
      { label: '#', accessor: (r, i) => i + 1, align: 'center', bold: true },
      { label: 'PAN NUMBER', accessor: r => r.panNumber, color: () => '#0284c7', bold: true },
      { label: 'LEGAL ENTITY NAME', accessor: r => r.legalName, bold: true },
      { label: 'ENTITY TYPE', accessor: r => r.entityType },
      { label: 'INCORP. DATE', accessor: r => r.dateOfIncorporation },
      { label: 'STATUS', accessor: r => r.status, color: v => v === 'ACTIVE' ? '#16a34a' : '#dc2626', bold: true },
      { label: 'JURISDICTION WARD', accessor: r => r.jurisdiction },
      { label: 'AY', accessor: r => r.assessmentYear },
    ],
    colWidths: [25, 80, 240, 85, 75, 75, 142, 60]
  },
  {
    title: 'Dataset 2: Goods & Services Tax Network (GSTN) — Taxpayer & Filing Regularity Registry',
    authority: 'GST Council / Central Board of Indirect Taxes & Customs',
    identifierLabel: 'gstin',
    dataset: govtData.SYNTHETIC_GST_RECORDS,
    columns: [
      { label: '#', accessor: (r, i) => i + 1, align: 'center', bold: true },
      { label: 'GSTIN', accessor: r => r.gstin, color: () => '#7c3aed', bold: true },
      { label: 'LEGAL NAME', accessor: r => r.legalName, bold: true },
      { label: 'PAN NUMBER', accessor: r => r.panNumber, color: () => '#0284c7' },
      { label: 'STATE', accessor: r => r.state },
      { label: 'REG. STATUS', accessor: r => r.registrationStatus, color: v => v === 'ACTIVE' ? '#16a34a' : '#dc2626', bold: true },
      { label: 'FILING STATUS', accessor: r => r.filingStatus, color: v => v === 'COMPLIANT' ? '#16a34a' : '#d97706', bold: true },
      { label: 'LAST RETURN', accessor: r => r.lastReturnFiled },
    ],
    colWidths: [25, 115, 210, 80, 75, 85, 92, 100]
  },
  {
    title: 'Dataset 3: Ministry of Corporate Affairs (MCA21) — Corporate Identity (CIN/LLPIN) Registry',
    authority: 'Ministry of Corporate Affairs / Registrar of Companies',
    identifierLabel: 'cinOrLlpin',
    dataset: govtData.SYNTHETIC_MCA_RECORDS,
    columns: [
      { label: '#', accessor: (r, i) => i + 1, align: 'center', bold: true },
      { label: 'CIN / LLPIN', accessor: r => r.cinOrLlpin, color: () => '#059669', bold: true },
      { label: 'COMPANY LEGAL NAME', accessor: r => r.legalName, bold: true },
      { label: 'TYPE', accessor: r => r.companyType },
      { label: 'INC. DATE', accessor: r => r.incorporationDate },
      { label: 'STATUS', accessor: r => r.companyStatus, color: v => v === 'ACTIVE' ? '#16a34a' : '#dc2626', bold: true },
      { label: 'ROC', accessor: r => r.rocLocation },
      { label: 'DIRECTOR / PARTNER', accessor: r => r.directors?.[0]?.name },
    ],
    colWidths: [25, 135, 205, 95, 65, 75, 82, 100]
  },
  {
    title: 'Dataset 4: Ministry of MSME — Udyam Registration & Enterprise Classification Registry',
    authority: 'Ministry of Micro, Small and Medium Enterprises',
    identifierLabel: 'udyamRegistrationNumber',
    dataset: govtData.SYNTHETIC_UDYAM_RECORDS,
    columns: [
      { label: '#', accessor: (r, i) => i + 1, align: 'center', bold: true },
      { label: 'UDYAM REG. NUMBER', accessor: r => r.udyamRegistrationNumber, color: () => '#d97706', bold: true },
      { label: 'ENTERPRISE NAME', accessor: r => r.enterpriseName, bold: true },
      { label: 'PAN', accessor: r => r.panNumber, color: () => '#0284c7' },
      { label: 'CLASS', accessor: r => r.classification, color: () => '#7c3aed', bold: true },
      { label: 'ACTIVITY', accessor: r => r.majorActivity },
      { label: 'ANNUAL TURNOVER', accessor: r => `Rs ${(r.annualTurnover / 10000000).toFixed(1)} Cr` },
      { label: 'STATE', accessor: r => r.state },
    ],
    colWidths: [25, 125, 215, 75, 60, 95, 95, 92]
  },
  {
    title: 'Dataset 5: Income Tax Return (ITR) Compliance & CPC e-Filing Gateway',
    authority: 'Centralized Processing Center (CPC), Bengaluru',
    identifierLabel: 'panNumber',
    dataset: govtData.SYNTHETIC_INCOME_TAX_RECORDS,
    columns: [
      { label: '#', accessor: (r, i) => i + 1, align: 'center', bold: true },
      { label: 'PAN NUMBER', accessor: r => r.panNumber, color: () => '#0284c7', bold: true },
      { label: 'LEGAL ENTITY NAME', accessor: r => r.legalName, bold: true },
      { label: 'AY', accessor: r => r.assessmentYear },
      { label: 'ITR FORM', accessor: r => r.itrType },
      { label: 'GROSS TURNOVER', accessor: r => r.turnover ? `Rs ${(r.turnover / 10000000).toFixed(1)} Cr` : '—' },
      { label: 'FILING STATUS', accessor: r => r.filingStatus, color: v => v === 'FILED_VERIFIED' ? '#16a34a' : '#dc2626', bold: true },
      { label: 'TAX COMPLIANCE', accessor: r => r.taxComplianceStatus, color: v => v.includes('COMPLIANT') ? '#16a34a' : '#dc2626' },
    ],
    colWidths: [25, 80, 230, 55, 60, 95, 105, 132]
  },
  {
    title: "Dataset 6: Employees' Provident Fund Organisation (EPFO) — Shram Suvidha Portal",
    authority: 'Ministry of Labour and Employment',
    identifierLabel: 'establishmentId',
    dataset: govtData.SYNTHETIC_EPFO_RECORDS,
    columns: [
      { label: '#', accessor: (r, i) => i + 1, align: 'center', bold: true },
      { label: 'ESTABLISHMENT ID', accessor: r => r.establishmentId, color: () => '#059669', bold: true },
      { label: 'EMPLOYER NAME', accessor: r => r.employerName, bold: true },
      { label: 'PAN NUMBER', accessor: r => r.panNumber, color: () => '#0284c7' },
      { label: 'EMPLOYEES', accessor: r => r.employeeCount, align: 'center', bold: true },
      { label: 'CONTRIB. STATUS', accessor: r => r.contributionStatus, color: v => v === 'UP_TO_DATE' ? '#16a34a' : '#dc2626' },
      { label: 'LAST DEPOSIT', accessor: r => r.lastContributionDate },
      { label: 'COMPLIANCE', accessor: r => r.complianceStatus, color: v => v === 'COMPLIANT' ? '#16a34a' : '#dc2626', bold: true },
    ],
    colWidths: [25, 120, 220, 80, 65, 95, 85, 92]
  },
  {
    title: "Dataset 7: Employees' State Insurance Corporation (ESIC) — Statutory Insurance Registry",
    authority: 'Ministry of Labour and Employment',
    identifierLabel: 'registrationNumber',
    dataset: govtData.SYNTHETIC_ESIC_RECORDS,
    columns: [
      { label: '#', accessor: (r, i) => i + 1, align: 'center', bold: true },
      { label: 'ESIC REG. NUMBER', accessor: r => r.registrationNumber, color: () => '#059669', bold: true },
      { label: 'EMPLOYER NAME', accessor: r => r.employerName, bold: true },
      { label: 'PAN NUMBER', accessor: r => r.panNumber, color: () => '#0284c7' },
      { label: 'EMPLOYER ID', accessor: r => r.employerId },
      { label: 'INSURED COUNT', accessor: r => r.employeeCount, align: 'center', bold: true },
      { label: 'STATUS', accessor: r => r.contributionStatus, color: v => v === 'PAID' ? '#16a34a' : '#dc2626' },
      { label: 'COMPLIANCE', accessor: r => r.complianceStatus, color: v => v === 'COMPLIANT' ? '#16a34a' : '#dc2626', bold: true },
    ],
    colWidths: [25, 125, 215, 80, 115, 75, 75, 72]
  },
  {
    title: 'Dataset 8: DigiLocker Gateway — Cryptographically Signed Verified Credentials Repository',
    authority: 'National e-Governance Division (NeGD) / MeitY',
    identifierLabel: 'documentId',
    dataset: govtData.SYNTHETIC_DIGILOCKER_RECORDS,
    columns: [
      { label: '#', accessor: (r, i) => i + 1, align: 'center', bold: true },
      { label: 'DIGILOCKER DOC ID', accessor: r => r.documentId, color: () => '#0284c7', bold: true },
      { label: 'HOLDER NAME', accessor: r => r.holderName, bold: true },
      { label: 'PAN NUMBER', accessor: r => r.panNumber },
      { label: 'DOC STATUS', accessor: r => r.documentStatus, color: v => v === 'VALID' ? '#16a34a' : '#dc2626', bold: true },
      { label: 'SIGNATURE STATUS', accessor: r => r.digitalSignatureStatus, color: v => v.includes('VALID') ? '#16a34a' : '#dc2626' },
      { label: 'SHA-256 HASH (SNIPPET)', accessor: r => r.sha256Hash?.slice(0, 16) + '...', color: () => '#64748b' },
    ],
    colWidths: [25, 135, 215, 75, 95, 125, 112]
  },
  {
    title: 'Dataset 9: Startup India — DPIIT Recognition, Tax & Tender Relaxation Registry',
    authority: 'Department for Promotion of Industry and Internal Trade (DPIIT)',
    identifierLabel: 'recognitionNumber',
    dataset: govtData.SYNTHETIC_STARTUP_RECORDS,
    columns: [
      { label: '#', accessor: (r, i) => i + 1, align: 'center', bold: true },
      { label: 'DIPP NUMBER', accessor: r => r.recognitionNumber, color: () => '#d97706', bold: true },
      { label: 'STARTUP / COMPANY NAME', accessor: r => r.startupName, bold: true },
      { label: 'PAN NUMBER', accessor: r => r.panNumber, color: () => '#0284c7' },
      { label: 'SECTOR', accessor: r => r.sector },
      { label: 'STARTUP STATUS', accessor: r => r.startupStatus, color: v => v === 'RECOGNIZED_STARTUP' ? '#16a34a' : '#64748b', bold: true },
      { label: 'EXEMPTIONS ELIGIBLE', accessor: r => r.exemptionsEligible?.length ? r.exemptionsEligible.join(', ') : 'None' },
    ],
    colWidths: [25, 95, 215, 75, 150, 115, 107]
  },
  {
    title: 'Dataset 10: National Small Industries Corporation (NSIC) — Single Point Registration Registry',
    authority: 'Ministry of Micro, Small and Medium Enterprises',
    identifierLabel: 'nsicRegistrationNumber',
    dataset: govtData.SYNTHETIC_NSIC_RECORDS,
    columns: [
      { label: '#', accessor: (r, i) => i + 1, align: 'center', bold: true },
      { label: 'NSIC SPR REG. NO.', accessor: r => r.nsicRegistrationNumber, color: () => '#7c3aed', bold: true },
      { label: 'ENTERPRISE NAME', accessor: r => r.enterpriseName, bold: true },
      { label: 'PAN', accessor: r => r.panNumber, color: () => '#0284c7' },
      { label: 'VALIDITY', accessor: r => r.validityDate },
      { label: 'STATUS', accessor: r => r.certificateStatus, color: v => v === 'ACTIVE' ? '#16a34a' : '#dc2626', bold: true },
      { label: 'MONETARY LIMIT', accessor: r => `Rs ${(r.monetaryLimit / 10000000).toFixed(1)} Cr` },
      { label: 'PRODUCT CATEGORY', accessor: r => r.productOrServiceCategory },
    ],
    colWidths: [25, 125, 205, 75, 75, 65, 80, 132]
  },
  {
    title: 'Dataset 11: Government e-Marketplace (GeM) — Seller Account & Performance Registry',
    authority: 'GeM SPV, Ministry of Commerce & Industry',
    identifierLabel: 'sellerId',
    dataset: govtData.SYNTHETIC_GEM_SELLER_RECORDS,
    columns: [
      { label: '#', accessor: (r, i) => i + 1, align: 'center', bold: true },
      { label: 'GEM SELLER ID', accessor: r => r.sellerId, color: () => '#0284c7', bold: true },
      { label: 'SELLER NAME', accessor: r => r.sellerName, bold: true },
      { label: 'PAN NUMBER', accessor: r => r.panNumber },
      { label: 'CATEGORY', accessor: r => r.businessCategory },
      { label: 'RATING', accessor: r => `${r.sellerRating} ★`, color: () => '#d97706', bold: true, align: 'center' },
      { label: 'ORDERS', accessor: r => r.totalOrdersCompleted, align: 'center' },
      { label: 'SELLER STATUS', accessor: r => r.sellerStatus, color: v => v === 'ACTIVE' ? '#16a34a' : '#dc2626', bold: true },
    ],
    colWidths: [25, 105, 215, 80, 125, 65, 65, 102]
  },
  {
    title: 'Dataset 12: Bureau of Indian Standards (BIS Manak Online) — Quality & Conformity Certifications',
    authority: 'Ministry of Consumer Affairs, Food and Public Distribution',
    identifierLabel: 'certificateNumber',
    dataset: govtData.SYNTHETIC_BIS_RECORDS,
    columns: [
      { label: '#', accessor: (r, i) => i + 1, align: 'center', bold: true },
      { label: 'BIS LICENSE NO.', accessor: r => r.certificateNumber, color: () => '#0284c7', bold: true },
      { label: 'ORGANISATION NAME', accessor: r => r.organisationName, bold: true },
      { label: 'PAN NUMBER', accessor: r => r.panNumber },
      { label: 'STANDARD (IS CODE)', accessor: r => r.standardCode, bold: true, color: () => '#7c3aed' },
      { label: 'STATUS', accessor: r => r.certificateStatus, color: v => v === 'ACTIVE' ? '#16a34a' : '#dc2626', bold: true },
      { label: 'EXPIRY DATE', accessor: r => r.expiryDate },
      { label: 'PRODUCT CATEGORY', accessor: r => r.productCategory },
    ],
    colWidths: [25, 105, 205, 75, 110, 65, 75, 122]
  },
  {
    title: 'Dataset 13: Make in India (MII) & Public Procurement Preference — Local Content % Declarations',
    authority: 'DPIIT, Ministry of Commerce and Industry',
    identifierLabel: 'declarationId',
    dataset: govtData.SYNTHETIC_LOCAL_CONTENT_RECORDS,
    columns: [
      { label: '#', accessor: (r, i) => i + 1, align: 'center', bold: true },
      { label: 'MII DECL. ID', accessor: r => r.declarationId, color: () => '#0284c7', bold: true },
      { label: 'BIDDER / VENDOR NAME', accessor: r => r.bidderName, bold: true },
      { label: 'PAN NUMBER', accessor: r => r.panNumber },
      { label: 'LOCAL CONTENT %', accessor: r => `${r.localContentPercentage}%`, color: (v, r) => r.localContentPercentage >= 50 ? '#16a34a' : r.localContentPercentage >= 20 ? '#d97706' : '#dc2626', bold: true, align: 'center' },
      { label: 'CLASSIFICATION', accessor: r => r.declaredClassification, color: () => '#7c3aed' },
      { label: 'AUDITOR CERT.', accessor: r => r.statutoryAuditorCertAttached ? 'Attached ✓' : 'Self Decl.', align: 'center' },
      { label: 'PRODUCT NAME', accessor: r => r.productName },
    ],
    colWidths: [25, 95, 205, 75, 90, 115, 75, 102]
  },
  {
    title: 'Dataset 14: Central Vigilance Commission & National Debarment / Blacklist Registry',
    authority: 'Central Vigilance Commission (CVC) / Procurement Oversight Board',
    identifierLabel: 'entityId',
    dataset: govtData.SYNTHETIC_BLACKLIST_RECORDS,
    columns: [
      { label: '#', accessor: (r, i) => i + 1, align: 'center', bold: true },
      { label: 'CASE / CLEAR ID', accessor: r => r.entityId, color: () => '#7c3aed', bold: true },
      { label: 'ENTITY NAME', accessor: r => r.entityName, bold: true },
      { label: 'PAN NUMBER', accessor: r => r.panNumber, color: () => '#0284c7' },
      { label: 'VIGILANCE STATUS', accessor: r => r.blacklistStatus, color: v => v === 'NOT_BLACKLISTED' ? '#16a34a' : '#dc2626', bold: true },
      { label: 'DEBARRED?', accessor: r => r.isDebarred ? 'YES ✗' : 'NO ✓', color: v => v.includes('YES') ? '#dc2626' : '#16a34a', bold: true, align: 'center' },
      { label: 'ISSUING AUTHORITY', accessor: r => r.issuingAuthority },
      { label: 'REMARKS / CASE DETAILS', accessor: r => r.reason },
    ],
    colWidths: [25, 100, 200, 75, 90, 65, 115, 112]
  }
];

pagesConfig.forEach((page, pageIndex) => {
  if (pageIndex > 0) {
    doc.addPage({ size: 'A4', layout: 'landscape', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  }

  // Header Banner
  doc.rect(0, 0, 842, 54).fill('#091322');
  doc.fillColor('#38bdf8').fontSize(11).font('Helvetica-Bold').text('COMPLYGeM-AI  |  OFFICIAL REGULATORY VERIFICATION REPOSITORY', 30, 10, { lineBreak: false });
  doc.fillColor('#f0f4ff').fontSize(10).font('Helvetica-Bold').text(page.title, 30, 24, { lineBreak: false });
  doc.fillColor('#94a3b8').fontSize(7).font('Helvetica').text(`Authority: ${page.authority}  •  Primary Key: ${page.identifierLabel}  •  20 Synchronized Records`, 30, 38, { lineBreak: false });

  // Badge
  doc.rect(640, 10, 172, 34).fill('#1e293b');
  doc.fillColor('#10b981').fontSize(7.5).font('Helvetica-Bold').text(`✓ SECTION ${pageIndex + 1} OF 14`, 650, 16, { lineBreak: false });
  doc.fillColor('#94a3b8').fontSize(6.5).font('Helvetica').text(`Dataset Handbook • Page ${pageIndex + 1} of 14`, 650, 28, { lineBreak: false });

  // Table Geometry
  const startY = 62;
  const rowHeight = 24.5;
  let totalW = page.colWidths.reduce((a, b) => a + b, 0);

  let currentX = 30;
  const colXs = page.colWidths.map(w => {
    const x = currentX;
    currentX += w;
    return x;
  });

  // Table Header
  doc.rect(30, startY, totalW, 18).fill('#1e3a5f');
  doc.fillColor('#ffffff').fontSize(6.8).font('Helvetica-Bold');
  page.columns.forEach((col, i) => {
    doc.text(col.label, colXs[i] + 3, startY + 5, { width: page.colWidths[i] - 6, align: col.align || 'left', lineBreak: false });
  });

  // Table Rows (20 Records)
  let currentY = startY + 18;
  page.dataset.forEach((row, idx) => {
    const isEven = idx % 2 === 0;
    doc.rect(30, currentY, totalW, rowHeight).fill(isEven ? '#f8fafc' : '#ffffff');
    doc.rect(30, currentY, totalW, rowHeight).lineWidth(0.5).strokeColor('#e2e8f0').stroke();

    page.columns.forEach((col, i) => {
      let val = col.accessor(row, idx);
      if (val === undefined || val === null || val === '') val = '—';

      let fontColor = col.color ? col.color(val, row) : '#0f172a';
      let fontType = col.bold ? 'Helvetica-Bold' : 'Helvetica';
      let fontSize = col.fontSize || 6.5;

      doc.fillColor(fontColor).fontSize(fontSize).font(fontType);
      doc.text(String(val), colXs[i] + 3, currentY + 7, {
        width: page.colWidths[i] - 6,
        height: 14,
        align: col.align || 'left',
        ellipsis: true,
        lineBreak: false
      });
    });

    currentY += rowHeight;
  });

  // Footer
  doc.rect(0, 568, 842, 27).fill('#0f172a');
  doc.fillColor('#94a3b8').fontSize(7).font('Helvetica')
    .text(`ComplyGeM AI Verification Platform  •  SIH 2026  •  Complete Regulatory Dataset Handbook`, 30, 578, { lineBreak: false });
  doc.fillColor('#38bdf8').fontSize(7).font('Helvetica-Bold')
    .text(`Page ${pageIndex + 1} of 14  •  Master Handbook`, 570, 578, { width: 240, align: 'right', lineBreak: false });
});

doc.end();
console.log('Master 14-Page Complete Datasets Handbook generated successfully!');
