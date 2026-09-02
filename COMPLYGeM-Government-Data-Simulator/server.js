/**
 * =============================================================================
 * COMPLYGeM GOVERNMENT DATA SIMULATOR (STANDALONE MICROSERVICE SERVER)
 * =============================================================================
 * 
 * DISCLAIMER:
 * This server provides simulated, high-fidelity mock APIs representing official
 * Indian Government verification gateways for the Smart India Hackathon (SIH 2026) prototype.
 * 
 * Simulated Gateways:
 * - CBDT (PAN, ITR Returns)
 * - GSTN (GSTIN, Tax Filing Regularity)
 * - MCA21 / ROC (CIN, DIN Director Registry)
 * - Ministry of MSME (Udyam Enterprise Registry)
 * - EPFO (Shram Suvidha Social Security)
 * - ESIC (Employee State Insurance)
 * - NSIC (Single Point Registration SPR)
 * - DPIIT (Startup India Recognitions & Tender Exemptions)
 * - MeitY / NeGD (DigiLocker Cryptographic Credential Verification)
 * - BIS (Bureau of Indian Standards / ISI Quality Marks)
 * - GeM (Government e-Marketplace Seller Registry & Ratings)
 * - DPIIT (Make in India Local Content Percentage Declarations)
 * - CVC / Central Debarment (Debarment, Blacklist & Vigilance Registry)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { apiKeyAuth } = require('./shared/apiKeyAuth');

// Import Microservice Routers
const panService = require('./services/panService');
const gstService = require('./services/gstService');
const udyamService = require('./services/udyamService');
const mcaService = require('./services/mcaService');
const incomeTaxService = require('./services/incomeTaxService');
const epfoService = require('./services/epfoService');
const esicService = require('./services/esicService');
const nsicService = require('./services/nsicService');
const startupService = require('./services/startupService');
const digilockerService = require('./services/digilockerService');
const bisService = require('./services/bisService');
const gemSellerService = require('./services/gemSellerService');
const localContentService = require('./services/localContentService');
const blacklistService = require('./services/blacklistService');

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Gov-Simulator-Key', 'X-API-Key']
}));
app.use(express.json());
app.use(morgan('dev'));

// Optional API Key Protection
app.use('/api', apiKeyAuth);

// Mount Microservice Endpoints
app.use('/api/pan', panService);
app.use('/api/gst', gstService);
app.use('/api/udyam', udyamService);
app.use('/api/mca', mcaService);
app.use('/api/income-tax', incomeTaxService);
app.use('/api/epfo', epfoService);
app.use('/api/esic', esicService);
app.use('/api/nsic', nsicService);
app.use('/api/startup', startupService);
app.use('/api/digilocker', digilockerService);
app.use('/api/bis', bisService);
app.use('/api/gem-seller', gemSellerService);
app.use('/api/local-content', localContentService);
app.use('/api/blacklist', blacklistService);

// Health Check & Service Registry Catalog
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'COMPLYGeM-Government-Data-Simulator',
    version: '1.0.0',
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    is_simulated: true,
    authoritiesSimulated: 14,
    totalMasterCompanies: 20,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/catalog', (req, res) => {
  res.json({
    repository: 'COMPLYGeM-Government-Data-Simulator',
    description: 'Autonomous mock government data verification service for ComplyGeM AI',
    endpoints: {
      pan: { url: '/api/pan/:panNumber', example: '/api/pan/SYNPA0001C' },
      gst: { url: '/api/gst/:gstin', example: '/api/gst/29SYNPA0001C1Z5' },
      udyam: { url: '/api/udyam/:udyamNumber', example: '/api/udyam/UDYAM-KR-03-0012345' },
      mca: { url: '/api/mca/:cin', example: '/api/mca/U29100KA2018PTC112233' },
      incomeTax: { url: '/api/income-tax/:pan', example: '/api/income-tax/SYNPA0001C' },
      epfo: { url: '/api/epfo/:establishmentId', example: '/api/epfo/KNBNG0012345000' },
      esic: { url: '/api/esic/:employerCode', example: '/api/esic/53000123450001001' },
      nsic: { url: '/api/nsic/:registrationNumber', example: '/api/nsic/NSIC/REG/2021/8892' },
      startup: { url: '/api/startup/:recognitionNumber', example: '/api/startup/DIPP-44912' },
      digilocker: { url: '/api/digilocker/:docId', example: '/api/digilocker/DL-DOC-001-SYNPA0001C' },
      bis: { url: '/api/bis/:certNo', example: '/api/bis/CM/L-8899001' },
      gemSeller: { url: '/api/gem-seller/:sellerId', example: '/api/gem-seller/GEM-SELLER-1001' },
      localContent: { url: '/api/local-content/:declId', example: '/api/local-content/MII-DECL-001' },
      blacklist: { url: '/api/blacklist/:identifier', example: '/api/blacklist/SYNPA0006C' }
    }
  });
});

// Root Welcome Banner
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to COMPLYGeM Government Data Simulator API Gateway',
    documentation: '/api/catalog',
    health: '/health',
    mode: 'STANDALONE_SIMULATOR',
    disclaimer: 'Purely synthetic simulated datasets for SIH 2026 prototype evaluation.'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'ENDPOINT_NOT_FOUND',
    message: `Simulated gateway does not support endpoint "${req.originalUrl}". Check /api/catalog for available endpoints.`,
    is_simulated: true,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`=======================================================`);
  console.log(`🏛️  COMPLYGeM Government Data Simulator Running`);
  console.log(`🌐  URL: http://127.0.0.1:${PORT}`);
  console.log(`📋  Catalog: http://127.0.0.1:${PORT}/api/catalog`);
  console.log(`💚  Health: http://127.0.0.1:${PORT}/health`);
  console.log(`=======================================================`);
});

module.exports = app;
