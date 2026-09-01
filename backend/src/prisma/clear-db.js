const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function clearAndInitialize() {
  console.log('--- RESETTING COMPLYGEM DATABASE TO ZERO OPERATIONAL DATA ---');

  try {
    console.log('Clearing compliance reviews, items & reports...');
    await prisma.complianceReview.deleteMany({});
    await prisma.complianceItem.deleteMany({});
    await prisma.complianceReport.deleteMany({});

    console.log('Clearing verification results, document chunks & documents...');
    await prisma.verificationResult.deleteMany({});
    await prisma.documentChunk.deleteMany({});
    await prisma.document.deleteMany({});

    console.log('Clearing requirements, audit logs, bidders & tenders...');
    await prisma.requirement.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.bidder.deleteMany({});
    await prisma.tender.deleteMany({});
    await prisma.knowledgeDocument.deleteMany({});

    console.log('Clearing old users...');
    await prisma.user.deleteMany({});

    console.log('Creating standard system user accounts (Admin, Procurement Officer, Compliance Auditor, Bidder)...');
    const passwordHash = await bcrypt.hash('Admin@123456', 10);

    await prisma.user.createMany({
      data: [
        {
          id: 'user-admin-01',
          firebaseUid: 'firebase-admin-01',
          email: 'admin@complygem.gov.in',
          name: 'GeM System Administrator',
          role: 'ADMIN',
          organization: 'Government e-Marketplace (GeM)',
          approvalStatus: 'APPROVED',
          isActive: true,
        },
        {
          id: 'user-officer-01',
          firebaseUid: 'firebase-officer-01',
          email: 'officer@complygem.gov.in',
          name: 'Rajesh Kumar',
          role: 'PROCUREMENT_OFFICER',
          organization: 'Ministry of Labour & Employment',
          approvalStatus: 'APPROVED',
          isActive: true,
        },
        {
          id: 'user-reviewer-01',
          firebaseUid: 'firebase-reviewer-01',
          email: 'auditor@complygem.gov.in',
          name: 'Dr. Anita Desai',
          role: 'REVIEWER',
          organization: 'Central Vigilance & Compliance Audit',
          approvalStatus: 'APPROVED',
          isActive: true,
        },
        {
          id: 'user-bidder-01',
          firebaseUid: 'firebase-bidder-01',
          email: 'vendor@abcindustries.com',
          name: 'Vikram Mehta',
          role: 'BIDDER',
          organization: 'ABC Industries Pvt Ltd',
          approvalStatus: 'APPROVED',
          isActive: true,
        }
      ]
    });

    console.log('\n========================================');
    console.log('✅ DATABASE COMPLETELY CLEANED TO 0 DATA');
    console.log(' - Tenders: 0');
    console.log(' - Bidders: 0');
    console.log(' - Documents: 0');
    console.log(' - Compliance Items: 0');
    console.log(' - Reports: 0');
    console.log(' - Audit Logs: 0');
    console.log('========================================\n');

  } catch (error) {
    console.error('Database reset failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearAndInitialize();
