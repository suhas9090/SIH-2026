import axios from 'axios';

const backendHost = window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:5000' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');

const api = axios.create({
  baseURL: `${backendHost}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle errors cleanly without aborting auth flows
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = error.config?.url?.includes('/auth/');
    const isLoginPage = typeof window !== 'undefined' && (window.location.pathname.includes('/login') || window.location.pathname.includes('/register'));

    if (error.response?.status === 401 && !isAuthRequest && !isLoginPage) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API service modules
export const tenderAPI = {
  list: (params) => api.get('/tenders', { params }),
  create: (data) => api.post('/tenders', data),
  get: (id) => api.get(`/tenders/${id}`),
  update: (id, data) => api.put(`/tenders/${id}`, data),
  upload: (id, formData) => api.post(`/tenders/${id}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  extractRequirements: (id) => api.post(`/tenders/${id}/extract-requirements`),
  getRequirements: (id) => api.get(`/tenders/${id}/requirements`),
  getStats: () => api.get('/tenders/stats/summary'),
};

export const documentAPI = {
  upload: (formData) => api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getStatus: (id) => api.get(`/documents/${id}/status`),
  get: (id) => api.get(`/documents/${id}`),
};

export const bidderAPI = {
  create: (data) => api.post('/bidders', data),
  list: (tenderId) => api.get('/bidders', { params: { tenderId } }),
  get: (id) => api.get(`/bidders/${id}`),
  uploadDocuments: (id, formData) => api.post(`/bidders/${id}/upload-documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  verify: (id) => api.post(`/bidders/${id}/verify`),
  getCompliance: (id) => api.get(`/bidders/${id}/compliance`),
  reviewItem: (bidderId, itemId, data) => api.post(`/bidders/${bidderId}/compliance/${itemId}/review`, data),
};

export const verificationAPI = {
  getMetadata: () => api.get('/mock/metadata'),
  getScenarios: () => api.get('/mock/scenarios'),
  getScenario: (id) => api.get(`/mock/scenarios/${id}`),
  verifyBidderUnified: (data) => api.post('/verification/verify-bidder', data),
  gst: (data) => api.post('/verify/gst', data),
  pan: (data) => api.post('/verify/pan', data),
  udyam: (data) => api.post('/verify/udyam', data),
  mca: (data) => api.post('/verify/mca', data),
  blacklist: (data) => api.post('/verify/blacklist', data),
  getBidderVerifications: (bidderId) => api.get(`/verify/bidder/${bidderId}`),
  checkPAN: (pan, legalName) => api.get(`/mock/pan/${pan}`, { params: { legalName } }),
  checkGST: (gstin, legalName, pan) => api.get(`/mock/gst/${gstin}`, { params: { legalName, pan } }),
  checkUdyam: (udyam, legalName, pan) => api.get(`/mock/udyam/${udyam}`, { params: { legalName, pan } }),
  checkMCA: (cin, legalName) => api.get(`/mock/mca/${cin}`, { params: { legalName } }),
  checkIncomeTax: (pan) => api.get(`/mock/income-tax/${pan}`),
  checkEPFO: (id, pan) => api.get(`/mock/epfo/${id}`, { params: { pan } }),
  checkESIC: (id) => api.get(`/mock/esic/${id}`),
  checkStartup: (id, pan) => api.get(`/mock/startup/${id}`, { params: { pan } }),
  checkNSIC: (id) => api.get(`/mock/nsic/${id}`),
  checkGeM: (id, pan) => api.get(`/mock/gem/${id}`, { params: { pan } }),
  checkDigiLocker: (id) => api.get(`/mock/digilocker/${id}`),
  checkBIS: (id) => api.get(`/mock/bis/${id}`),
  checkLocalContent: (id, minRequired) => api.get(`/mock/make-in-india/${id}`, { params: { minRequired } }),
  checkBlacklist: (identifier) => api.get(`/mock/blacklist/${identifier}`),
};

export const complianceAPI = {
  getBidderCompliance: (bidderId) => api.get(`/compliance/bidder/${bidderId}`),
  reviewItem: (itemId, data) => api.post(`/compliance/review/${itemId}`, data),
  getDashboardStats: () => api.get('/compliance/dashboard-stats'),
  verifySession: (bidderId) => api.post(`/compliance/verify-session/${bidderId}`),
  getSession: (bidderId) => api.get(`/compliance/verify-session/${bidderId}`),
};

export const reportAPI = {
  getReport: (bidderId) => api.get(`/reports/${bidderId}`),
  generate: (bidderId) => api.post(`/reports/${bidderId}/generate`),
  download: (bidderId) => api.get(`/reports/${bidderId}/download`, { responseType: 'blob' }),
  listReports: () => api.get('/reports'),
};

export const auditAPI = {
  list: (params) => api.get('/audit', { params }),
};

export const govtDataAPI = {
  getSummary: () => api.get('/govt-data/summary'),
  getRegistries: () => api.get('/govt-data/registries'),
  checkPresence: (registry, identifier, params) => api.get(`/govt-data/check/${registry}/${identifier}`, { params }),
  checkBatchPresence: (bidderData) => api.post('/govt-data/check-presence', bidderData),
  getRegistryRecords: (registry) => api.get(`/govt-data/registry/${registry}`),
  search: (q) => api.get('/govt-data/search', { params: { q } }),
  getScenarios: () => api.get('/govt-data/scenarios'),
  getScenario: (id) => api.get(`/govt-data/scenarios/${id}`),
};

// ── Bidder Onboarding API ──────────────────────────────────────────────────
export const bidderOnboardingAPI = {
  // Personal Profile
  getProfile: () => api.get('/bidder-onboarding/profile'),
  saveProfile: (data) => api.post('/bidder-onboarding/profile', data),

  // Identity Verification & Auto-Fill from Govt Gateway
  fetchPanDetails: (pan) => api.post('/bidder-onboarding/fetch-pan-details', { pan }),
  verifyPAN: (pan, expectedName) => api.post('/bidder-onboarding/verify-pan', { pan, expectedName }),
  sendAadhaarOTP: (aadhaarRef) => api.post('/bidder-onboarding/verify-aadhaar', { aadhaarRef }),
  verifyOTP: (otp) => api.post('/bidder-onboarding/verify-otp', { otp }),

  // Company
  getCompany: () => api.get('/bidder-onboarding/company'),
  saveCompany: (data) => api.post('/bidder-onboarding/company', data),

  // Company Government Verifications
  verifyGST: (gstin, expectedName, expectedPan) => api.post('/bidder-onboarding/verify-gst', { gstin, expectedName, expectedPan }),
  verifyUdyam: (udyamNumber, expectedName, expectedPan) => api.post('/bidder-onboarding/verify-udyam', { udyamNumber, expectedName, expectedPan }),
  verifyMCA: (cinOrLlpin, expectedName) => api.post('/bidder-onboarding/verify-mca', { cinOrLlpin, expectedName }),
  verifyStartup: (recognitionNumber, expectedPan) => api.post('/bidder-onboarding/verify-startup', { recognitionNumber, expectedPan }),
  verifyNSIC: (registrationNumber) => api.post('/bidder-onboarding/verify-nsic', { registrationNumber }),
  verifyBlacklist: (identifier) => api.post('/bidder-onboarding/verify-blacklist', { identifier }),

  // Document Vault
  uploadDocument: (formData) => api.post('/bidder-onboarding/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getDocuments: () => api.get('/bidder-onboarding/documents'),
  deleteDocument: (id) => api.delete(`/bidder-onboarding/documents/${id}`),

  // Status & Eligibility
  getVerificationStatus: () => api.get('/bidder-onboarding/verification-status'),
  getTenderEligibility: (tenderId) => api.get(`/bidder-onboarding/eligibility/${tenderId}`),
  getAuditLog: () => api.get('/bidder-onboarding/audit-log'),
};

// ── Verification Officer API ───────────────────────────────────────────────
export const verificationOfficerAPI = {
  getQueue: () => api.get('/verification-officer/queue'),
  getBidderDossier: (profileId) => api.get(`/verification-officer/bidder/${profileId}`),
  reviewDocument: (docId, action, remarks) => api.post(`/verification-officer/document/${docId}/review`, { action, remarks }),
  approveBidder: (profileId, remarks) => api.post(`/verification-officer/bidder/${profileId}/approve`, { remarks }),
  rejectBidder: (profileId, reason) => api.post(`/verification-officer/bidder/${profileId}/reject`, { reason }),
};

