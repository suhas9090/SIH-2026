const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Check if admin/demo user exists
  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        firebaseUid: 'demo-admin-uid-001',
        email: 'admin@complygem.gov.in',
        name: 'System Administrator',
        role: 'ADMIN',
        organization: 'GeM Administration',
        isActive: true,
        approvalStatus: 'APPROVED',
      },
    });
  }

  let officer = await prisma.user.findFirst({ where: { role: 'PROCUREMENT_OFFICER' } });
  if (!officer) {
    officer = await prisma.user.create({
      data: {
        firebaseUid: 'demo-officer-uid-001',
        email: 'officer@labour.gov.in',
        name: 'Rajesh Kumar',
        role: 'PROCUREMENT_OFFICER',
        organization: 'Ministry of Labour & Employment',
        isActive: true,
        approvalStatus: 'APPROVED',
      },
    });
  }

  // Check if tender exists
  let tender = await prisma.tender.findFirst({ where: { referenceNo: 'GEM-2026-001' } });
  if (!tender) {
    tender = await prisma.tender.create({
      data: {
        referenceNo: 'GEM-2026-001',
        title: 'Supply of Industrial Safety Equipment',
        description: 'Comprehensive procurement of industrial helmets, harnesses, and protective gear for central labour welfare works.',
        organization: 'Ministry of Labour & Employment',
        status: 'ACTIVE',
        estimatedValue: 50000000, // 5 Cr
        closingDate: new Date(Date.now() + 14 * 86400000),
        createdBy: officer.id,
        requirements: {
          create: [
            {
              category: 'REGISTRATION',
              title: 'Valid GST Registration',
              description: 'Bidder must possess a valid and active GST registration certificate in the state of operation.',
              mandatory: true,
              evidenceTypes: ['GST_CERTIFICATE'],
            },
            {
              category: 'TAX',
              title: 'Valid Permanent Account Number (PAN)',
              description: 'Bidder must possess a valid PAN card verified by the Income Tax Department.',
              mandatory: true,
              evidenceTypes: ['PAN_CARD'],
            },
            {
              category: 'FINANCIAL',
              title: 'Minimum Annual Turnover >= 5.00 Cr',
              description: 'Minimum average annual turnover of INR 5 crore over the preceding 3 audited financial years.',
              minValue: 50000000,
              mandatory: true,
              currency: 'INR',
              evidenceTypes: ['FINANCIAL_STATEMENT'],
            },
            {
              category: 'MSME_UDYAM',
              title: 'Udyam / MSME Registration (Optional Preference)',
              description: 'Valid Udyam certificate for MSME purchase preference under Public Procurement Policy 2012.',
              mandatory: false,
              evidenceTypes: ['UDYAM_CERTIFICATE'],
            },
            {
              category: 'OEM',
              title: 'Manufacturer OEM Authorization Certificate',
              description: 'Valid OEM authorization certificate specifying product scope, territory, and validity period.',
              mandatory: true,
              evidenceTypes: ['OEM_AUTHORIZATION'],
            },
            {
              category: 'EXPERIENCE',
              title: 'Minimum 3 Years Prior Supply Experience',
              description: 'Documentary proof of minimum 3 years experience executing similar government or PSU supply orders.',
              minValue: 3,
              mandatory: true,
              evidenceTypes: ['EXPERIENCE_CERTIFICATE'],
            },
            {
              category: 'BLACKLISTING',
              title: 'Non-Debarment & Non-Blacklisting Declaration',
              description: 'Self-declaration and clean record across GeM debarment and CVC central blacklist registries.',
              mandatory: true,
              evidenceTypes: ['OTHER'],
            },
          ],
        },
      },
      include: { requirements: true },
    });
    console.log('✅ Created Demo Tender GEM-2026-001 with requirements');
  }

  // Create Sample Bidders
  let bidder1 = await prisma.bidder.findFirst({ where: { organizationName: 'ABC Industries Pvt Ltd' } });
  if (!bidder1 && tender) {
    bidder1 = await prisma.bidder.create({
      data: {
        tenderId: tender.id,
        organizationName: 'ABC Industries Pvt Ltd',
        gstin: '29AABCA1234C1Z5',
        pan: 'AABCA1234C',
        udyamNo: 'UDYAM-KA-01-0000001',
        cinNo: 'U72200KA2015PTC081234',
        contactName: 'Suresh Patil',
        contactEmail: 'suresh@abcindustries.com',
        contactPhone: '+91 9876543210',
      },
    });

    // Add sample verifications
    await prisma.verificationResult.createMany({
      data: [
        {
          bidderId: bidder1.id,
          source: 'GST_PORTAL',
          entityId: '29AABCA1234C1Z5',
          status: 'MOCK_VERIFIED',
          isMockData: true,
          verifiedData: { gstin: '29AABCA1234C1Z5', status: 'ACTIVE', legalName: 'ABC Industries Pvt Ltd', state: 'Karnataka' },
        },
        {
          bidderId: bidder1.id,
          source: 'PAN_INCOME_TAX',
          entityId: 'AABCA1234C',
          status: 'MOCK_VERIFIED',
          isMockData: true,
          verifiedData: { pan: 'AABCA1234C', entityType: 'Company', status: 'ACTIVE', filingStatus: 'COMPLIANT' },
        },
        {
          bidderId: bidder1.id,
          source: 'UDYAM_PORTAL',
          entityId: 'UDYAM-KA-01-0000001',
          status: 'MOCK_VERIFIED',
          isMockData: true,
          verifiedData: { udyamNo: 'UDYAM-KA-01-0000001', category: 'Small', status: 'ACTIVE' },
        },
        {
          bidderId: bidder1.id,
          source: 'BLACKLIST_REGISTRY',
          entityId: 'ABC Industries Pvt Ltd',
          status: 'MOCK_VERIFIED',
          isMockData: true,
          verifiedData: { isBlacklisted: false, registry: 'GeM & CVC Registry', result: 'NO_ADVERSE_RECORD' },
        },
      ],
    });

    // Populate compliance items & report
    const reqs = await prisma.requirement.findMany({ where: { tenderId: tender.id } });
    for (const req of reqs) {
      let status = 'COMPLIANT';
      let rule = 'Requirement fully satisfied with verified documentation.';
      let evidence = 'Document verified in submission.';
      let aiExp = 'AI analysis extracted matching entity records conforming to tender criteria.';
      let conf = 0.95;

      if (req.category === 'FINANCIAL') {
        status = 'NON_COMPLIANT';
        rule = 'Actual Turnover INR 3.20 Cr < Required INR 5.00 Cr';
        evidence = 'FY 2025-26 Statement: INR 3.20 Cr';
        aiExp = 'The audited statement shows average turnover below the required threshold of INR 5 Cr.';
        conf = 0.92;
      } else if (req.category === 'OEM') {
        status = 'REQUIRES_HUMAN_REVIEW';
        rule = 'Partial evidence found. Validity duration not explicitly defined.';
        evidence = 'Manufacturer authorization letter from XYZ Corp';
        aiExp = 'OEM authorization letter found on Page 7. Human reviewer confirmation advised for validity dates.';
        conf = 0.68;
      }

      await prisma.complianceItem.create({
        data: {
          bidderId: bidder1.id,
          requirementId: req.id,
          status,
          ruleApplied: rule,
          evidenceSummary: evidence,
          aiExplanation: aiExp,
          confidence: conf,
        },
      });
    }

    // Risk Engine calculation
    const riskEngine = require('../services/compliance/riskEngine');
    const items = await prisma.complianceItem.findMany({ where: { bidderId: bidder1.id }, include: { requirement: true } });
    const vers = await prisma.verificationResult.findMany({ where: { bidderId: bidder1.id } });
    const scoreResult = riskEngine.calculateScore(items, vers);

    await prisma.complianceReport.create({
      data: {
        bidderId: bidder1.id,
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
      },
    });

    console.log('✅ Seeded Bidder ABC Industries with Compliance Items & Report');
  }

  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
