require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./routes/auth');
const tenderRoutes = require('./routes/tenders');
const bidderRoutes = require('./routes/bidders');
const documentRoutes = require('./routes/documents');
const verificationRoutes = require('./routes/verification');
const complianceRoutes = require('./routes/compliance');
const reportRoutes = require('./routes/reports');
const auditRoutes = require('./routes/audit');
const adminRoutes = require('./routes/admin');
const mockVerificationRoutes = require('./routes/mockVerificationRoutes');
const govtDataRoutes = require('./routes/govtData');
const bidderOnboardingRoutes = require('./routes/bidderOnboarding');
const verificationOfficerRoutes = require('./routes/verificationOfficer');

const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');
const logger = require('./utils/logger');
const { verifySmtpConnection } = require('./services/emailService');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploaded documents
// Files served at /uploads/* — access controlled by routes
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Logging
app.use(morgan('combined'));
app.use(requestLogger);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      service: 'ComplyGeM Backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenders', tenderRoutes);
app.use('/api/bidders', bidderRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/verify', verificationRoutes);
app.use('/api/verification', mockVerificationRoutes);
app.use('/api/mock', mockVerificationRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/govt-data', govtDataRoutes);
app.use('/api/bidder-onboarding', bidderOnboardingRoutes);
app.use('/api/verification-officer', verificationOfficerRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  logger.info('Server shutting down...');
  process.exit(0);
});

app.listen(PORT, async () => {
  logger.info(`ComplyGeM Backend running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  // Verify SMTP on startup — logs warning if not configured
  await verifySmtpConnection();
});

module.exports = app;
