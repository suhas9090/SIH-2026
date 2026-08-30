import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
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

// Response interceptor — handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
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
  gst: (data) => api.post('/verify/gst', data),
  pan: (data) => api.post('/verify/pan', data),
  udyam: (data) => api.post('/verify/udyam', data),
  mca: (data) => api.post('/verify/mca', data),
  blacklist: (data) => api.post('/verify/blacklist', data),
  getBidderVerifications: (bidderId) => api.get(`/verify/bidder/${bidderId}`),
};

export const complianceAPI = {
  getBidderCompliance: (bidderId) => api.get(`/compliance/bidder/${bidderId}`),
  reviewItem: (itemId, data) => api.post(`/compliance/review/${itemId}`, data),
  getDashboardStats: () => api.get('/compliance/dashboard-stats'),
};

export const reportAPI = {
  getReport: (bidderId) => api.get(`/reports/${bidderId}`),
  listReports: () => api.get('/reports'),
};

export const auditAPI = {
  list: (params) => api.get('/audit', { params }),
};
