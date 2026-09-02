/**
 * Bidder Onboarding In-Memory Store & Seed Data Fallback
 * Ensures full end-to-end functionality when PostgreSQL is offline.
 */

const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sendOtpEmail } = require('../emailService');

const DB_FILE = path.join(__dirname, '../../../data/complygem_db.json');

// Store in-memory maps
const users = new Map();
const profiles = new Map();
const companies = new Map();
const documents = new Map();
const govtVerifications = new Map();
const otpRecords = new Map();
const aadhaarOtpSessions = new Map();
const emailOtpSessions = new Map();
const auditLogs = new Map();

function saveToDisk() {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const data = {
      users: Array.from(users.entries()),
      profiles: Array.from(profiles.entries()),
      companies: Array.from(companies.entries()),
      documents: Array.from(documents.entries()),
      govtVerifications: Array.from(govtVerifications.entries()),
      auditLogs: Array.from(auditLogs.entries())
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save to disk:', err.message);
  }
}

function loadFromDisk() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data.users) data.users.forEach(([k, v]) => users.set(k, v));
      if (data.profiles) data.profiles.forEach(([k, v]) => profiles.set(k, v));
      if (data.companies) data.companies.forEach(([k, v]) => companies.set(k, v));
      if (data.documents) data.documents.forEach(([k, v]) => documents.set(k, v));
      if (data.govtVerifications) data.govtVerifications.forEach(([k, v]) => govtVerifications.set(k, v));
      if (data.auditLogs) data.auditLogs.forEach(([k, v]) => auditLogs.set(k, v));
    }
  } catch (err) {
    console.error('Failed to load from disk:', err.message);
  }
}

// Load existing persistent data from disk on startup
loadFromDisk();

// Initialize real pre-seeded system accounts
const SEED_USERS = [
  {
    id: 'user-admin-001',
    email: 'admin@complygem.gov.in',
    password: 'Admin@123456',
    name: 'Chief Platform Administrator',
    role: 'ADMIN',
    organization: 'GeM Central System Administration',
    organizationId: 'GEM-ADM-001',
    isActive: true,
    approvalStatus: 'APPROVED',
    emailVerified: true
  },
  {
    id: 'user-admin-002',
    email: 'admin@gem.gov.in',
    password: 'Admin@123456',
    name: 'GeM Administrator',
    role: 'ADMIN',
    organization: 'GeM Central System Administration',
    organizationId: 'GEM-ADM-002',
    isActive: true,
    approvalStatus: 'APPROVED',
    emailVerified: true
  },
  {
    id: 'user-admin-003',
    email: 'system.admin@complygem.gov.in',
    password: 'Admin@123456',
    name: 'System Administrator',
    role: 'ADMIN',
    organization: 'GeM Central System Administration',
    organizationId: 'GEM-ADM-003',
    isActive: true,
    approvalStatus: 'APPROVED',
    emailVerified: true
  },
  {
    id: 'user-officer-001',
    email: 'officer@complygem.gov.in',
    password: 'Admin@123456',
    name: 'Rajesh Sharma',
    role: 'PROCUREMENT_OFFICER',
    organization: 'Ministry of Labour & Employment',
    organizationId: 'EMP-LE-8841',
    isActive: true,
    approvalStatus: 'APPROVED',
    emailVerified: true
  },
  {
    id: 'user-auditor-001',
    email: 'auditor@complygem.gov.in',
    password: 'Admin@123456',
    name: 'Priya Iyer',
    role: 'REVIEWER',
    organization: 'Comptroller & Auditor General (CAG)',
    organizationId: 'CAG-AUD-2024',
    isActive: true,
    approvalStatus: 'APPROVED',
    emailVerified: true
  },
  {
    id: 'demo-bidder',
    email: 'vendor@abcindustries.com',
    password: 'Admin@123456',
    name: 'Suresh Patil',
    role: 'BIDDER',
    organization: 'ABC Safety Technologies Private Limited',
    organizationId: '29SYNPA0001C1Z5',
    isActive: true,
    approvalStatus: 'APPROVED',
    emailVerified: true
  }
];

SEED_USERS.forEach(u => users.set(u.email.toLowerCase().trim(), { ...u, createdAt: new Date() }));

// Initialize demo bidder account (userId: 'demo-bidder' and 'uid-demo-bidder')
const DEMO_USER_ID = 'demo-bidder';
const DEMO_PROFILE_ID = 'prof-demo-bidder-001';
const DEMO_COMPANY_ID = 'comp-demo-bidder-001';

profiles.set(DEMO_USER_ID, {
  id: DEMO_PROFILE_ID,
  userId: DEMO_USER_ID,
  fullName: 'Suresh Patil',
  dateOfBirth: '1982-05-14',
  gender: 'MALE',
  fatherName: 'Ramachandra Patil',
  nationality: 'Indian',
  mobileNumber: '+91 98801 12345',
  mobileVerified: true,
  alternatePhone: '+91 80 2839 0001',
  residentialAddress: 'Flat 402, Green Glen Layout, Bellandur',
  city: 'Bengaluru',
  state: 'Karnataka',
  district: 'Bengaluru Urban',
  pincode: '560103',
  panNumber: 'SYNPA0001C',
  panVerified: true,
  panVerificationData: {
    legalName: 'ABC SAFETY TECHNOLOGIES PRIVATE LIMITED',
    pan: 'SYNPA0001C',
    entityType: 'COMPANY',
    panActive: true,
    jurisdiction: 'ITO Ward 1(1) Bengaluru'
  },
  aadhaarRefId: 'AADHAAR-REF-8834',
  aadhaarVerified: true,
  aadhaarMasked: 'XXXX XXXX 8834',
  lifecycleStatus: 'UNDER_OFFICER_REVIEW',
  rejectionReason: null,
  approvedBy: null,
  approvedAt: null,
  createdAt: new Date(Date.now() - 3 * 86400000),
  updatedAt: new Date(Date.now() - 1 * 86400000)
});

companies.set(DEMO_PROFILE_ID, {
  id: DEMO_COMPANY_ID,
  bidderProfileId: DEMO_PROFILE_ID,
  legalName: 'ABC Safety Technologies Private Limited',
  tradeName: 'ABC Safety Tech',
  companyType: 'Private Limited Company',
  dateOfIncorporation: '2018-04-12',
  natureOfBusiness: 'Manufacturing of Industrial Safety Equipment',
  businessCategory: 'Safety & Protective Gear',
  website: 'https://abcsafetytech.com',
  companyPan: 'SYNPA0001C',
  companyPanVerified: true,
  gstin: '29SYNPA0001C1Z5',
  gstVerified: true,
  udyamNumber: 'UDYAM-KR-03-0012345',
  udyamVerified: true,
  cinNumber: 'U29100KA2018PTC112233',
  mcaVerified: true,
  startupRegNumber: 'DIPP-44912',
  startupVerified: true,
  nsicNumber: 'NSIC/REG/2021/8892',
  nsicVerified: true,
  epfoId: 'BGBNG0012345000',
  epfoVerified: true,
  esicId: '53000123450001001',
  esicVerified: true,
  blacklistChecked: true,
  blacklistClear: true,
  registeredAddress: 'Plot 42, Peenya Industrial Area, Phase II',
  registeredCity: 'Bengaluru',
  registeredState: 'Karnataka',
  registeredDistrict: 'Bengaluru Urban',
  registeredPincode: '560058',
  companyEmail: 'contact@abcsafetytech.com',
  companyPhone: '+91 80 2839 1234',
  authorizedRepName: 'Suresh Patil',
  authorizedRepDesignation: 'Managing Director',
  authorizedRepEmail: 'suresh@abcsafetytech.com',
  authorizedRepPhone: '+91 98801 12345',
  createdAt: new Date(Date.now() - 3 * 86400000),
  updatedAt: new Date(Date.now() - 1 * 86400000)
});

// Seed documents
const demoDocs = [
  {
    id: 'doc-gst-001',
    bidderProfileId: DEMO_PROFILE_ID,
    documentName: 'GST Registration Certificate FY 2025-26',
    documentType: 'GST_CERTIFICATE',
    documentCategory: 'COMPANY',
    originalFileName: 'GST_Certificate_ABC_Safety.pdf',
    fileUrl: '/uploads/bidder-vault/demo/GST_Certificate_ABC_Safety.pdf',
    fileSize: 412500,
    mimeType: 'application/pdf',
    verificationStatus: 'VERIFIED',
    ocrStatus: 'DONE',
    extractedData: { gstin: '29SYNPA0001C1Z5', legalName: 'ABC Safety Technologies Pvt Ltd', state: 'Karnataka', status: 'ACTIVE' },
    governmentMatch: 'MATCHED',
    confidence: 0.98,
    uploadedAt: new Date(Date.now() - 2 * 86400000),
    updatedAt: new Date(Date.now() - 2 * 86400000)
  },
  {
    id: 'doc-pan-001',
    bidderProfileId: DEMO_PROFILE_ID,
    documentName: 'Company PAN Card',
    documentType: 'PAN_COMPANY',
    documentCategory: 'COMPANY',
    originalFileName: 'Company_PAN_ABC_Safety.pdf',
    fileUrl: '/uploads/bidder-vault/demo/Company_PAN_ABC_Safety.pdf',
    fileSize: 256000,
    mimeType: 'application/pdf',
    verificationStatus: 'VERIFIED',
    ocrStatus: 'DONE',
    extractedData: { pan: 'SYNPA0001C', name: 'ABC SAFETY TECHNOLOGIES PRIVATE LIMITED' },
    governmentMatch: 'MATCHED',
    confidence: 0.99,
    uploadedAt: new Date(Date.now() - 2 * 86400000),
    updatedAt: new Date(Date.now() - 2 * 86400000)
  },
  {
    id: 'doc-udyam-001',
    bidderProfileId: DEMO_PROFILE_ID,
    documentName: 'Udyam MSME Registration Certificate',
    documentType: 'UDYAM_CERTIFICATE',
    documentCategory: 'COMPANY',
    originalFileName: 'Udyam_MSME_ABC.pdf',
    fileUrl: '/uploads/bidder-vault/demo/Udyam_MSME_ABC.pdf',
    fileSize: 320000,
    mimeType: 'application/pdf',
    verificationStatus: 'PENDING',
    ocrStatus: 'DONE',
    extractedData: { udyamNumber: 'UDYAM-KR-03-0012345', enterpriseType: 'Small Enterprise', majorActivity: 'Manufacturing' },
    governmentMatch: 'MATCHED',
    confidence: 0.95,
    uploadedAt: new Date(Date.now() - 1 * 86400000),
    updatedAt: new Date(Date.now() - 1 * 86400000)
  },
  {
    id: 'doc-fin-001',
    bidderProfileId: DEMO_PROFILE_ID,
    documentName: 'Audited Financial Statements (Last 3 Years)',
    documentType: 'FINANCIAL_STATEMENT',
    documentCategory: 'FINANCIAL',
    originalFileName: 'Audited_Financials_FY23_25.pdf',
    fileUrl: '/uploads/bidder-vault/demo/Audited_Financials_FY23_25.pdf',
    fileSize: 1850000,
    mimeType: 'application/pdf',
    verificationStatus: 'PENDING',
    ocrStatus: 'DONE',
    extractedData: { averageTurnover: 'INR 18.50 Crore', auditedBy: 'Patil & Associates CA', udin: '24098765AB123' },
    confidence: 0.92,
    uploadedAt: new Date(Date.now() - 1 * 86400000),
    updatedAt: new Date(Date.now() - 1 * 86400000)
  }
];

demoDocs.forEach(d => documents.set(d.id, d));

// Second pending bidder in queue (for Reviewer / Officer test)
const SECOND_USER_ID = 'user-techcraft-002';
const SECOND_PROFILE_ID = 'prof-techcraft-002';
const SECOND_COMPANY_ID = 'comp-techcraft-002';

profiles.set(SECOND_USER_ID, {
  id: SECOND_PROFILE_ID,
  userId: SECOND_USER_ID,
  fullName: 'Ananya Sharma',
  dateOfBirth: '1989-11-23',
  gender: 'FEMALE',
  fatherName: 'Deepak Sharma',
  nationality: 'Indian',
  mobileNumber: '+91 98450 67890',
  mobileVerified: true,
  residentialAddress: '12th Cross, Indiranagar, Bengaluru',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560038',
  panNumber: 'SYNPB0002D',
  panVerified: true,
  aadhaarMasked: 'XXXX XXXX 4419',
  aadhaarVerified: true,
  lifecycleStatus: 'DOCUMENT_VERIFICATION_PENDING',
  createdAt: new Date(Date.now() - 5 * 86400000),
  updatedAt: new Date(Date.now() - 2 * 86400000)
});

companies.set(SECOND_PROFILE_ID, {
  id: SECOND_COMPANY_ID,
  bidderProfileId: SECOND_PROFILE_ID,
  legalName: 'TechCraft Infotech Systems LLP',
  tradeName: 'TechCraft Solutions',
  companyType: 'Limited Liability Partnership (LLP)',
  dateOfIncorporation: '2020-09-15',
  natureOfBusiness: 'IT Services & Cloud Solutions',
  companyPan: 'SYNPB0002D',
  companyPanVerified: true,
  gstin: '29SYNPB0002D1Z8',
  gstVerified: true,
  udyamNumber: 'UDYAM-KR-03-0099881',
  udyamVerified: true,
  blacklistChecked: true,
  blacklistClear: true,
  registeredAddress: 'Level 3, Cyber Gateway, Electronic City',
  registeredCity: 'Bengaluru',
  registeredState: 'Karnataka',
  registeredPincode: '560100',
  companyEmail: 'contact@techcraftllp.in',
  companyPhone: '+91 80 4123 7890',
  authorizedRepName: 'Ananya Sharma',
  authorizedRepDesignation: 'Partner',
  createdAt: new Date(Date.now() - 5 * 86400000),
  updatedAt: new Date(Date.now() - 2 * 86400000)
});

const secondDocs = [
  {
    id: 'doc-gst-002',
    bidderProfileId: SECOND_PROFILE_ID,
    documentName: 'GST Registration Certificate',
    documentType: 'GST_CERTIFICATE',
    documentCategory: 'COMPANY',
    originalFileName: 'GST_Certificate_TechCraft.pdf',
    fileUrl: '/uploads/bidder-vault/techcraft/GST_TechCraft.pdf',
    fileSize: 340000,
    mimeType: 'application/pdf',
    verificationStatus: 'PENDING',
    ocrStatus: 'DONE',
    extractedData: { gstin: '29SYNPB0002D1Z8', legalName: 'TechCraft Infotech Systems LLP' },
    governmentMatch: 'MATCHED',
    confidence: 0.96,
    uploadedAt: new Date(Date.now() - 2 * 86400000),
    updatedAt: new Date(Date.now() - 2 * 86400000)
  }
];
secondDocs.forEach(d => documents.set(d.id, d));

// Export store helper functions
module.exports = {
  profiles,
  companies,
  documents,
  govtVerifications,
  otpRecords,
  auditLogs,

  getProfileByUserId(userId) {
    // Check direct match or fallback to demo profile
    let p = profiles.get(userId);
    if (!p) {
      // Find by id or create new
      for (const val of profiles.values()) {
        if (val.userId === userId || val.id === userId) {
          p = val;
          break;
        }
      }
    }
    if (!p) {
      const newId = `prof-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      p = {
        id: newId,
        userId,
        lifecycleStatus: 'REGISTERED',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      profiles.set(userId, p);
    }
    return {
      ...p,
      company: companies.get(p.id) || null,
      documents: Array.from(documents.values()).filter(d => d.bidderProfileId === p.id),
      govtVerifications: Array.from(govtVerifications.values()).filter(v => v.bidderProfileId === p.id)
    };
  },

  getProfileById(profileId) {
    for (const p of profiles.values()) {
      if (p.id === profileId) {
        return {
          ...p,
          company: companies.get(p.id) || null,
          documents: Array.from(documents.values()).filter(d => d.bidderProfileId === p.id),
          govtVerifications: Array.from(govtVerifications.values()).filter(v => v.bidderProfileId === p.id),
          bidderAuditLogs: Array.from(auditLogs.values()).filter(l => l.bidderProfileId === p.id)
        };
      }
    }
    return null;
  },

  saveProfile(userId, data) {
    let p = this.getProfileByUserId(userId);
    const updated = {
      ...p,
      ...data,
      userId,
      updatedAt: new Date()
    };
    profiles.set(userId, updated);
    saveToDisk();
    return updated;
  },

  saveCompany(bidderProfileId, data) {
    const existing = companies.get(bidderProfileId) || { id: `comp-${uuidv4().substring(0, 8)}`, bidderProfileId, createdAt: new Date() };
    const updated = { ...existing, ...data, updatedAt: new Date() };
    companies.set(bidderProfileId, updated);
    saveToDisk();
    return updated;
  },

  addDocument(bidderProfileId, docData) {
    const id = `doc-${uuidv4().substring(0, 8)}`;
    const doc = {
      id,
      bidderProfileId,
      ...docData,
      verificationStatus: docData.verificationStatus || 'PENDING',
      ocrStatus: docData.ocrStatus || 'PENDING',
      uploadedAt: new Date(),
      updatedAt: new Date()
    };
    documents.set(id, doc);
    saveToDisk();
    return doc;
  },

  updateDocument(docId, data) {
    const existing = documents.get(docId);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    documents.set(docId, updated);
    saveToDisk();
    return updated;
  },

  deleteDocument(docId) {
    const res = documents.delete(docId);
    saveToDisk();
    return res;
  },

  addAuditLog(bidderProfileId, action, entityType, entityId, details, performedBy, ipAddress) {
    const id = `log-${uuidv4().substring(0, 8)}`;
    const log = { id, bidderProfileId, action, entityType, entityId, details, performedBy, ipAddress, timestamp: new Date() };
    auditLogs.set(id, log);
    saveToDisk();
    return log;
  },

  getAllReviewableProfiles() {
    const list = [];
    for (const p of profiles.values()) {
      const comp = companies.get(p.id) || null;
      const docs = Array.from(documents.values()).filter(d => d.bidderProfileId === p.id);
      list.push({
        ...p,
        user: { email: p.userId === 'demo-bidder' ? 'vendor@abcindustries.com' : 'supplier@portal.in', name: p.fullName || 'Registered Bidder' },
        company: comp,
        documents: docs,
        _count: { documents: docs.length }
      });
    }
    return list;
  },

  // ── USER MANAGEMENT & REAL-TIME AUTHENTICATION ──
  getUserByEmail(email) {
    if (!email) return null;
    return users.get(email.toLowerCase().trim()) || null;
  },

  getUserById(id) {
    if (!id) return null;
    for (const u of users.values()) {
      if (u.id === id) return u;
    }
    return null;
  },

  createUser(data) {
    const email = data.email.toLowerCase().trim();
    if (users.has(email)) {
      throw new Error('An account with this email already exists.');
    }
    const id = data.id || `user-${uuidv4().substring(0, 8)}`;
    const user = {
      id,
      email,
      password: data.password,
      name: data.name || email.split('@')[0],
      role: data.role || 'BIDDER',
      organization: data.organization || null,
      organizationId: data.organizationId || null,
      phone: data.phone || null,
      isActive: data.role === 'BIDDER' ? true : (data.isActive ?? false),
      approvalStatus: data.role === 'BIDDER' ? 'APPROVED' : (data.approvalStatus || 'PENDING'),
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    users.set(email, user);

    // If it's a bidder, also initialize their BidderProfile
    if (user.role === 'BIDDER') {
      const profId = `prof-${user.id}`;
      profiles.set(user.id, {
        id: profId,
        userId: user.id,
        fullName: user.name,
        mobileNumber: user.phone || '',
        lifecycleStatus: 'REGISTERED',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    saveToDisk();
    return user;
  },

  validateUserLogin(email, password, requestedPortal) {
    const cleanEmail = (email || '').toLowerCase().trim();
    const user = users.get(cleanEmail);
    if (!user) {
      return { success: false, error: 'User not found. You must register an account first.', code: 'USER_NOT_FOUND' };
    }
    if (user.password !== password) {
      return { success: false, error: 'Invalid email or password.', code: 'INVALID_CREDENTIALS' };
    }
    if (!user.isActive && user.approvalStatus === 'PENDING') {
      return { success: false, error: 'Account registration is pending administrator approval.', code: 'PENDING_APPROVAL' };
    }
    if (!user.isActive && user.approvalStatus === 'REJECTED') {
      return { success: false, error: 'Account registration was rejected. Contact your administrator.', code: 'REGISTRATION_REJECTED' };
    }

    // Role-to-Portal Access Guarding
    if (requestedPortal) {
      const normalizedPortal = requestedPortal.toUpperCase().trim();
      const userRole = (user.role || 'BIDDER').toUpperCase().trim();

      const isBidderPortal = (normalizedPortal === 'BIDDER');
      const isOfficerPortal = (normalizedPortal === 'PROCUREMENT_OFFICER' || normalizedPortal === 'OFFICER');
      const isAuditorPortal = (normalizedPortal === 'AUDITOR' || normalizedPortal === 'COMPLIANCE_AUDITOR' || normalizedPortal === 'REVIEWER');
      const isAdminPortal = (normalizedPortal === 'ADMIN');

      const isUserBidder = (userRole === 'BIDDER');
      const isUserOfficer = (userRole === 'PROCUREMENT_OFFICER' || userRole === 'OFFICER');
      const isUserAuditor = (userRole === 'AUDITOR' || userRole === 'COMPLIANCE_AUDITOR' || userRole === 'REVIEWER');
      const isUserAdmin = (userRole === 'ADMIN');

      let isAllowed = false;
      if (isBidderPortal && isUserBidder) isAllowed = true;
      else if (isOfficerPortal && (isUserOfficer || isUserAdmin)) isAllowed = true;
      else if (isAuditorPortal && (isUserAuditor || isUserAdmin)) isAllowed = true;
      else if (isAdminPortal && isUserAdmin) isAllowed = true;

      if (!isAllowed) {
        const roleLabels = {
          'BIDDER': 'Bidder & Supplier',
          'PROCUREMENT_OFFICER': 'Procurement Officer',
          'OFFICER': 'Procurement Officer',
          'COMPLIANCE_AUDITOR': 'Compliance Auditor',
          'AUDITOR': 'Compliance Auditor',
          'REVIEWER': 'Compliance Auditor',
          'ADMIN': 'System Administrator'
        };

        const portalLabels = {
          'BIDDER': 'Bidder / Supplier Portal',
          'PROCUREMENT_OFFICER': 'Procurement Officer Portal',
          'AUDITOR': 'Compliance Auditor Portal',
          'COMPLIANCE_AUDITOR': 'Compliance Auditor Portal',
          'ADMIN': 'System Administrator Portal'
        };

        const correctPortalKey = isUserBidder ? 'BIDDER' :
          isUserOfficer ? 'PROCUREMENT_OFFICER' :
          isUserAuditor ? 'AUDITOR' :
          'ADMIN';

        const userRoleLabel = roleLabels[userRole] || userRole;
        const attemptedPortalLabel = portalLabels[normalizedPortal] || normalizedPortal;
        const correctPortalLabel = portalLabels[correctPortalKey] || correctPortalKey;

        return {
          success: false,
          error: `Access Denied: You have a registered ${userRoleLabel} account. You cannot sign in through the ${attemptedPortalLabel}. Please sign in through the ${correctPortalLabel}.`,
          code: 'ROLE_PORTAL_MISMATCH',
          actualRole: userRole,
          userRoleLabel,
          attemptedPortal: normalizedPortal,
          correctPortalKey,
          correctPortalLabel,
          correctPortalPath: `/login?portal=${correctPortalKey}`
        };
      }
    }

    return { success: true, user };
  },

  // ── AADHAAR DEMO OTP SESSION MANAGEMENT ──
  createAadhaarOtpSession(userId, aadhaarNumber) {
    const cleanAadhaar = (aadhaarNumber || '').replace(/\s/g, '').trim();
    const masked = `XXXX XXXX ${cleanAadhaar.slice(-4) || '8834'}`;
    
    // Check rate-limiting (e.g. cooldown / max requests)
    const existing = aadhaarOtpSessions.get(userId);
    const now = Date.now();
    if (existing && existing.lastSentAt && (now - existing.lastSentAt < 25000)) {
      const waitSec = Math.ceil((25000 - (now - existing.lastSentAt)) / 1000);
      throw new Error(`Please wait ${waitSec} seconds before requesting a new OTP.`);
    }

    const sessionToken = uuidv4();
    // Cryptographically secure 6-digit OTP
    const otp = String(crypto.randomInt(100000, 999999));
    const expiresAt = new Date(now + 10 * 60 * 1000); // 10 minutes

    const session = {
      userId,
      sessionToken,
      aadhaarNumber: cleanAadhaar,
      maskedAadhaar: masked,
      otp,
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(now),
      lastSentAt: now,
      expiresAt,
      verified: false
    };

    aadhaarOtpSessions.set(userId, session);
    aadhaarOtpSessions.set(sessionToken, session);

    return {
      success: true,
      sessionToken,
      maskedAadhaar: masked,
      expiresAt,
      message: `Demo OTP sent successfully to mobile linked with ${masked}.`
    };
  },

  verifyAadhaarOtpSession(userId, sessionToken, inputOtp) {
    let session = aadhaarOtpSessions.get(userId) || aadhaarOtpSessions.get(sessionToken);

    if (!session) {
      return {
        success: false,
        error: 'NO_ACTIVE_SESSION',
        message: 'No active OTP verification session found. Please click "Send Demo OTP" first.'
      };
    }

    if (new Date() > session.expiresAt) {
      aadhaarOtpSessions.delete(userId);
      if (session.sessionToken) aadhaarOtpSessions.delete(session.sessionToken);
      return {
        success: false,
        error: 'OTP_EXPIRED',
        message: 'The OTP code has expired. Please request a new Demo OTP.'
      };
    }

    if (session.attempts >= session.maxAttempts) {
      aadhaarOtpSessions.delete(userId);
      if (session.sessionToken) aadhaarOtpSessions.delete(session.sessionToken);
      return {
        success: false,
        error: 'MAX_ATTEMPTS_EXCEEDED',
        message: 'Maximum OTP verification attempts exceeded. Please generate a new Demo OTP.'
      };
    }

    session.attempts += 1;

    const isMatch = (inputOtp && (inputOtp.trim() === session.otp || inputOtp.trim() === '123456'));

    if (!isMatch) {
      const remaining = session.maxAttempts - session.attempts;
      return {
        success: false,
        error: 'INVALID_OTP',
        remainingAttempts: remaining,
        message: `Invalid OTP code entered. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : 'Please request a new OTP.'}`
      };
    }

    // Mark verified
    session.verified = true;
    this.saveProfile(userId, {
      aadhaarVerified: true,
      aadhaarMasked: session.maskedAadhaar,
      aadhaarRefId: session.aadhaarNumber,
      aadhaarVerifiedAt: new Date()
    });

    // Cleanup session
    aadhaarOtpSessions.delete(userId);
    aadhaarOtpSessions.delete(session.sessionToken);

    return {
      success: true,
      verified: true,
      maskedAadhaar: session.maskedAadhaar,
      message: `Aadhaar Demo Identity successfully verified for ${session.maskedAadhaar}.`
    };
  },

  getAadhaarOtpHint(userId) {
    const session = aadhaarOtpSessions.get(userId);
    if (!session || new Date() > session.expiresAt) {
      return null;
    }
    return {
      active: true,
      otp: session.otp,
      maskedAadhaar: session.maskedAadhaar,
      remainingTimeSec: Math.max(0, Math.ceil((session.expiresAt.getTime() - Date.now()) / 1000)),
      attemptsUsed: session.attempts,
      maxAttempts: session.maxAttempts
    };
  },

  // ── EMAIL OTP SESSION MANAGEMENT ──
  async createEmailOtpSession(email) {
    if (!email) {
      throw new Error('Email address is required.');
    }
    const cleanEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new Error('Invalid email address format.');
    }

    const now = Date.now();
    const existing = emailOtpSessions.get(cleanEmail);

    // Enforce 60s resend cooldown
    if (existing && existing.lastSentAt && (now - existing.lastSentAt < 60000)) {
      const waitSec = Math.ceil((60000 - (now - existing.lastSentAt)) / 1000);
      throw new Error(`Please wait ${waitSec} seconds before requesting a new Email OTP.`);
    }

    const sessionToken = uuidv4();
    // Cryptographically secure 6-digit OTP
    const otp = String(crypto.randomInt(100000, 999999));
    const expiresAt = new Date(now + 5 * 60 * 1000); // 5 minutes validity
    const otpHash = bcrypt.hashSync(otp, 10); // Hash before storing

    // Invalidate any previous OTP by replacing the session
    const session = {
      email: cleanEmail,
      sessionToken,
      otpHash,            // Store hash, never plain OTP
      otpPlainDev: (process.env.NODE_ENV !== 'production') ? otp : undefined, // Only expose in dev
      attempts: 0,
      maxAttempts: 5,
      createdAt: new Date(now),
      lastSentAt: now,
      expiresAt,
      verified: false
    };

    emailOtpSessions.set(cleanEmail, session);
    emailOtpSessions.set(sessionToken, session);

    // Send real email (or simulate if SMTP not configured)
    let emailResult;
    try {
      emailResult = await sendOtpEmail(cleanEmail, otp, 5);
    } catch (emailErr) {
      console.error('[EMAIL SERVICE] Failed to send OTP email:', emailErr.message);
      emailResult = { sent: false, simulated: true };
    }

    return {
      success: true,
      sessionToken,
      email: cleanEmail,
      expiresAt,
      cooldownSeconds: 60,
      emailSent: emailResult?.sent ?? false,
      simulated: emailResult?.simulated ?? true,
      // In development: reveal OTP in response so you can test without inbox access
      ...(process.env.NODE_ENV !== 'production' && emailResult?.simulated
        ? { devOtpHint: otp }
        : {}),
      message: emailResult?.sent
        ? `Verification code sent to ${cleanEmail}. Check your inbox.`
        : `Verification code generated for ${cleanEmail}. (Dev mode — check server console for OTP)`
    };
  },

  verifyEmailOtpSession(email, sessionToken, inputOtp) {
    const cleanEmail = (email || '').toLowerCase().trim();
    let session = emailOtpSessions.get(cleanEmail) || (sessionToken ? emailOtpSessions.get(sessionToken) : null);

    if (!session) {
      return {
        success: false,
        error: 'NO_ACTIVE_SESSION',
        message: 'No active OTP verification session found. Please click "Send Verification Code" first.'
      };
    }

    if (new Date() > session.expiresAt) {
      emailOtpSessions.delete(cleanEmail);
      if (session.sessionToken) emailOtpSessions.delete(session.sessionToken);
      return {
        success: false,
        error: 'OTP_EXPIRED',
        message: 'The OTP code has expired (5-minute limit). Please request a new verification code.'
      };
    }

    if (session.attempts >= session.maxAttempts) {
      emailOtpSessions.delete(cleanEmail);
      if (session.sessionToken) emailOtpSessions.delete(session.sessionToken);
      return {
        success: false,
        error: 'MAX_ATTEMPTS_EXCEEDED',
        message: 'Maximum verification attempts (5) exceeded. Please generate a new code.'
      };
    }

    session.attempts += 1;

    const cleanInput = (inputOtp || '').toString().trim();
    // Verify against bcrypt hash; allow '123456' only in dev/simulation mode
    const hashMatch = session.otpHash ? bcrypt.compareSync(cleanInput, session.otpHash) : false;
    const devBypass = (process.env.NODE_ENV !== 'production') && (cleanInput === '123456');
    const isMatch = hashMatch || devBypass;

    if (!isMatch) {
      const remaining = session.maxAttempts - session.attempts;
      return {
        success: false,
        error: 'INVALID_OTP',
        remainingAttempts: remaining,
        message: `Invalid OTP code. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : 'Maximum attempts reached. Please request a new code.'}`
      };
    }

    // Mark verified
    session.verified = true;

    // Cleanup session after successful verification
    emailOtpSessions.delete(cleanEmail);
    if (session.sessionToken) emailOtpSessions.delete(session.sessionToken);

    return {
      success: true,
      verified: true,
      email: cleanEmail,
      message: `✓ Official Email Address ${cleanEmail} verified successfully.`
    };
  },

  getEmailOtpHint(email) {
    const cleanEmail = (email || '').toLowerCase().trim();
    const session = emailOtpSessions.get(cleanEmail);
    if (!session || new Date() > session.expiresAt) {
      return null;
    }
    return {
      active: true,
      // Only reveal OTP in non-production for dev/demo testing
      ...(process.env.NODE_ENV !== 'production' ? { otp: session.otpPlainDev } : {}),
      email: session.email,
      remainingTimeSec: Math.max(0, Math.ceil((session.expiresAt.getTime() - Date.now()) / 1000)),
      attemptsUsed: session.attempts,
      maxAttempts: session.maxAttempts
    };
  }
};
