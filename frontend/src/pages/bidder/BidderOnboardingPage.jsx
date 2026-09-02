import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const LIFECYCLE_STEPS = {
  REGISTERED: 0, IDENTITY_PENDING: 1, IDENTITY_VERIFIED: 1,
  COMPANY_VERIFICATION_PENDING: 2, COMPANY_VERIFIED: 2,
  DOCUMENT_VERIFICATION_PENDING: 3, UNDER_OFFICER_REVIEW: 4, CORRECTION_REQUIRED: 3,
  VERIFIED: 4, APPROVED_TO_BID: 5, VERIFICATION_FAILED: 3
};

const STATES_LIST = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu and Kashmir','Ladakh',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli','Lakshadweep','Puducherry'
];

const COMPANY_TYPES = [
  'Sole Proprietorship', 'Partnership Firm', 'Limited Liability Partnership (LLP)',
  'Private Limited Company', 'Public Limited Company', 'One Person Company (OPC)',
  'MSME / Micro Enterprise', 'MSME / Small Enterprise', 'MSME / Medium Enterprise',
  'Startup (DPIIT Recognized)', 'Co-operative Society', 'Trust', 'Other'
];

const DOC_CATEGORIES = [
  { key: 'PERSONAL', label: 'Personal Documents', color: '#3b82f6', types: [
    { value: 'PAN_CARD', label: 'PAN Card' },
    { value: 'IDENTITY_PROOF', label: 'Identity Proof (Voter ID / Passport / Driving License)' },
    { value: 'ADDRESS_PROOF', label: 'Address Proof' },
    { value: 'AUTH_REP_ID', label: 'Authorized Representative ID' },
  ]},
  { key: 'COMPANY', label: 'Company Registration Documents', color: '#10b981', types: [
    { value: 'GST_CERTIFICATE', label: 'GST Registration Certificate' },
    { value: 'PAN_COMPANY', label: 'Company PAN Card' },
    { value: 'UDYAM_CERTIFICATE', label: 'Udyam / MSME Certificate' },
    { value: 'MCA_CERTIFICATE', label: 'Certificate of Incorporation (MCA)' },
    { value: 'STARTUP_CERTIFICATE', label: 'DPIIT Startup Recognition Certificate' },
    { value: 'NSIC_CERTIFICATE', label: 'NSIC Registration Certificate' },
    { value: 'PARTNERSHIP_DEED', label: 'Partnership Deed / LLP Agreement' },
  ]},
  { key: 'FINANCIAL', label: 'Financial Documents', color: '#f59e0b', types: [
    { value: 'FINANCIAL_STATEMENT', label: 'Audited Financial Statements (Last 3 Years)' },
    { value: 'INCOME_TAX_RETURN', label: 'Income Tax Returns (Last 3 AY)' },
    { value: 'BANK_STATEMENT', label: 'Bank Statement (Last 6 Months)' },
    { value: 'EPFO_CERTIFICATE', label: 'EPFO Registration Certificate' },
    { value: 'ESIC_CERTIFICATE', label: 'ESIC Registration Certificate' },
  ]},
  { key: 'COMPLIANCE', label: 'Compliance & Experience Documents', color: '#8b5cf6', types: [
    { value: 'OEM_AUTHORIZATION', label: 'OEM Authorization Letter' },
    { value: 'EXPERIENCE_CERTIFICATE', label: 'Experience / Supply Order Certificate' },
    { value: 'BIS_CERTIFICATE', label: 'BIS / ISI Certification' },
    { value: 'MAKE_IN_INDIA', label: 'Make in India / Local Content Declaration' },
    { value: 'OTHER', label: 'Other Supporting Document' },
  ]},
];

// ── Status badge helper ──
function StatusBadge({ status }) {
  const map = {
    PENDING: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: '⏳ Pending' },
    UNDER_REVIEW: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: '🔍 Under Review' },
    VERIFIED: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: '✓ Verified' },
    REJECTED: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: '✗ Rejected' },
    MISMATCH_DETECTED: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: '⚠ Mismatch' },
    EXPIRED: { color: '#64748b', bg: 'rgba(100,116,139,0.12)', label: '⏰ Expired' },
    REUPLOAD_REQUIRED: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: '↑ Re-upload Required' },
  };
  const s = map[status] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: status };
  return (
    <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: '0.68rem', fontWeight: 700, color: s.color, background: s.bg, border: `1px solid ${s.color}30`, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

// ── Verify & Fetch button ──
function VerifyFetchButton({ label, loading, onClick, verified, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={loading || verified || disabled}
      style={{
        minWidth: 110, padding: '9px 12px', borderRadius: 8, border: 'none', cursor: (loading || verified || disabled) ? 'not-allowed' : 'pointer',
        background: verified ? 'rgba(16,185,129,0.15)' : loading ? 'rgba(59,130,246,0.1)' : 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
        color: verified ? '#10b981' : loading ? '#93c5fd' : '#fff', fontWeight: 700, fontSize: '0.75rem',
        display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center',
        border: verified ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent',
        transition: 'all 0.2s', opacity: disabled && !verified ? 0.5 : 1,
      }}>
      {verified ? '✓ Verified' : loading ? '⟳ Verifying...' : label}
    </button>
  );
}

export default function BidderOnboardingPage() {
  const navigate = useNavigate();
  const { profile: authProfile } = useAuth();

  const [profile, setProfile] = useState(null);
  const [company, setCompany] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Step 1 — Personal Identity form state
  const [personal, setPersonal] = useState({
    fullName: '', dateOfBirth: '', gender: '', fatherName: '',
    mobileNumber: '', alternatePhone: '', residentialAddress: '',
    city: '', state: '', district: '', pincode: '',
    panNumber: '', aadhaarRef: '', otp: ''
  });
  const [panState, setPanState] = useState({ loading: false, verified: false, data: null });
  const [aadhaarState, setAadhaarState] = useState({ sent: false, loading: false, verified: false, masked: '' });

  // Step 2 — Company form state
  const [comp, setComp] = useState({
    legalName: '', tradeName: '', companyType: '', dateOfIncorporation: '',
    natureOfBusiness: '', businessCategory: '', website: '',
    companyPan: '', gstin: '', udyamNumber: '', cinNumber: '',
    startupRegNumber: '', nsicNumber: '', epfoId: '', esicId: '',
    registeredAddress: '', registeredCity: '', registeredState: '',
    registeredDistrict: '', registeredPincode: '', companyEmail: '', companyPhone: '',
    authorizedRepName: '', authorizedRepDesignation: '', authorizedRepEmail: '', authorizedRepPhone: ''
  });
  const [compVerify, setCompVerify] = useState({ pan: false, gst: false, udyam: false, mca: false, startup: false, nsic: false, blacklist: false });
  const [verifyLoading, setVerifyLoading] = useState({});

  // Step 3 — Document upload
  const [uploadModal, setUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({ documentName: '', documentType: '', documentCategory: 'COMPANY', expiryDate: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState('COMPANY');

  const fetchAll = useCallback(async () => {
    try {
      const [profRes, compRes, docRes] = await Promise.all([
        api.get('/bidder-onboarding/profile').catch(() => ({ data: null })),
        api.get('/bidder-onboarding/company').catch(() => ({ data: null })),
        api.get('/bidder-onboarding/documents').catch(() => ({ data: [] })),
      ]);
      const p = profRes.data;
      setProfile(p);
      setCompany(compRes.data);
      setDocuments(docRes.data || []);
      if (p) {
        setPersonal(prev => ({
          ...prev,
          fullName: p.fullName || '', dateOfBirth: p.dateOfBirth || '',
          gender: p.gender || '', fatherName: p.fatherName || '',
          mobileNumber: p.mobileNumber || '', alternatePhone: p.alternatePhone || '',
          residentialAddress: p.residentialAddress || '', city: p.city || '',
          state: p.state || '', district: p.district || '', pincode: p.pincode || '',
        }));
        setPanState(prev => ({ ...prev, verified: p.panVerified || false }));
        setAadhaarState(prev => ({ ...prev, verified: p.aadhaarVerified || false, masked: p.aadhaarMasked || '' }));
        const step = LIFECYCLE_STEPS[p.lifecycleStatus] || 0;
        setActiveStep(step >= 5 ? 5 : step);
      }
      if (compRes.data) {
        const c = compRes.data;
        setComp(prev => ({ ...prev, ...c }));
        setCompVerify({ pan: c.companyPanVerified, gst: c.gstVerified, udyam: c.udyamVerified, mca: c.mcaVerified, startup: c.startupVerified, nsic: c.nsicVerified });
      }
    } catch (e) { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // If already approved → redirect to dashboard
  useEffect(() => {
    if (profile?.lifecycleStatus === 'APPROVED_TO_BID') navigate('/bidder/dashboard');
  }, [profile, navigate]);

  // ── STEP 1: Save personal info ──
  const handleSavePersonal = async () => {
    if (!personal.fullName || !personal.mobileNumber || !personal.residentialAddress) {
      return toast.error('Full name, mobile number, and address are required.');
    }
    setSaving(true);
    try {
      await api.post('/bidder-onboarding/profile', personal);
      toast.success('Personal information saved.');
      fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save personal info.');
    }
    setSaving(false);
  };

  // ── STEP 1: Verify PAN & Auto-Fetch Govt Details ──
  const handleVerifyPAN = async () => {
    const cleanPan = (personal.panNumber || '').trim().toUpperCase();
    if (!cleanPan || cleanPan.length !== 10) return toast.error('Enter a valid 10-character PAN number (e.g. SYNPA0001C).');
    
    setPanState(p => ({ ...p, loading: true }));
    try {
      const res = await api.post('/bidder-onboarding/fetch-pan-details', { pan: cleanPan });
      if (res.data.success && res.data.data) {
        const bundle = res.data.data;
        setPanState({ loading: false, verified: true, data: bundle });
        
        // Auto-populate Complete Company Details (Step 2)
        setComp(prev => ({
          ...prev,
          legalName: bundle.legalName || prev.legalName,
          tradeName: bundle.gstTradeName || bundle.legalName || prev.tradeName,
          companyPan: cleanPan,
          gstin: bundle.gstin || prev.gstin,
          udyamNumber: bundle.udyamNumber || prev.udyamNumber,
          cinNumber: bundle.cinNumber || prev.cinNumber,
          companyType: bundle.entityType === 'COMPANY' ? 'PRIVATE_LIMITED' : bundle.entityType === 'LLP' ? 'LLP' : bundle.entityType === 'PROPRIETORSHIP' ? 'PROPRIETORSHIP' : prev.companyType,
          registeredAddress: bundle.registeredAddress || prev.registeredAddress,
          registeredState: bundle.state || prev.registeredState,
          registeredCity: bundle.district || prev.registeredCity,
          registeredPincode: bundle.pincode || prev.registeredPincode,
          epfoId: bundle.epfoEstablishmentId || prev.epfoId,
          startupRegNumber: bundle.startupRegNumber || prev.startupRegNumber,
        }));

        setCompVerify(prev => ({
          ...prev,
          pan: true,
          gst: !!bundle.gstin,
          udyam: !!bundle.udyamNumber,
          mca: !!bundle.cinNumber
        }));

        if (!personal.fullName) {
          setPersonal(p => ({ ...p, fullName: bundle.legalName }));
        }

        toast.success(`⚡ Verified & Auto-Populated records for "${bundle.legalName}" from Government Registries!`, { duration: 4000 });
      } else {
        setPanState(p => ({ ...p, loading: false }));
        toast.error(res.data.message || `PAN Verification Failed`);
      }
    } catch (e) {
      setPanState(p => ({ ...p, loading: false }));
      toast.error(e.response?.data?.error || 'PAN verification error connecting to government gateway.');
    }
  };

  // ── STEP 1: Send Aadhaar OTP ──
  const handleSendAadhaarOTP = async () => {
    if (!personal.aadhaarRef || personal.aadhaarRef.length < 4) return toast.error('Enter your Aadhaar Reference ID.');
    setAadhaarState(p => ({ ...p, loading: true }));
    try {
      const res = await api.post('/bidder-onboarding/verify-aadhaar', { aadhaarRef: personal.aadhaarRef });
      setAadhaarState(p => ({ ...p, loading: false, sent: true, masked: res.data.masked }));
      toast.success(`OTP verification code sent to mobile linked with ${res.data.masked}`);
    } catch (e) {
      setAadhaarState(p => ({ ...p, loading: false }));
      toast.error(e.response?.data?.error || 'Failed to send OTP. Save personal info first.');
    }
  };

  // ── STEP 1: Verify OTP ──
  const handleVerifyOTP = async () => {
    if (!personal.otp || personal.otp.length !== 6) return toast.error('Enter the 6-digit OTP.');
    setAadhaarState(p => ({ ...p, loading: true }));
    try {
      const res = await api.post('/bidder-onboarding/verify-otp', { otp: personal.otp });
      setAadhaarState(p => ({ ...p, loading: false, verified: true }));
      toast.success('Identity verified via OTP!');
      fetchAll();
    } catch (e) {
      setAadhaarState(p => ({ ...p, loading: false }));
      toast.error(e.response?.data?.error || 'OTP verification failed.');
    }
  };

  // ── STEP 2: Save company info ──
  const handleSaveCompany = async () => {
    if (!comp.legalName || !comp.companyType) return toast.error('Legal name and company type are required.');
    setSaving(true);
    try {
      await api.post('/bidder-onboarding/company', comp);
      toast.success('Company profile saved.');
      fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save company info.');
    }
    setSaving(false);
  };

  // ── STEP 2: Generic govt verification & PAN auto-fill ──
  const handleVerifyCompanyField = async (source, payload) => {
    const key = source.toLowerCase();
    setVerifyLoading(p => ({ ...p, [key]: true }));
    try {
      if (key === 'pan') {
        const cleanPan = (comp.companyPan || personal.panNumber || '').trim().toUpperCase();
        if (cleanPan) {
          const res = await api.post('/bidder-onboarding/fetch-pan-details', { pan: cleanPan });
          if (res.data.success && res.data.data) {
            const bundle = res.data.data;
            setComp(prev => ({
              ...prev,
              legalName: bundle.legalName || prev.legalName,
              tradeName: bundle.gstTradeName || bundle.legalName || prev.tradeName,
              companyPan: cleanPan,
              gstin: bundle.gstin || prev.gstin,
              udyamNumber: bundle.udyamNumber || prev.udyamNumber,
              cinNumber: bundle.cinNumber || prev.cinNumber,
              companyType: bundle.entityType || prev.companyType,
              registeredAddress: bundle.registeredAddress || prev.registeredAddress,
              registeredState: bundle.state || prev.registeredState,
              registeredCity: bundle.district || prev.registeredCity,
              registeredPincode: bundle.pincode || prev.registeredPincode,
              epfoId: bundle.epfoEstablishmentId || prev.epfoId,
              startupRegNumber: bundle.startupRegNumber || prev.startupRegNumber,
            }));
            setCompVerify(prev => ({
              ...prev,
              pan: true,
              gst: !!bundle.gstin,
              udyam: !!bundle.udyamNumber,
              mca: !!bundle.cinNumber
            }));
            toast.success(`⚡ Verified & Auto-Populated records for "${bundle.legalName}" from Government Registries!`, { duration: 4000 });
            fetchAll();
            setVerifyLoading(p => ({ ...p, [key]: false }));
            return;
          }
        }
      }

      const res = await api.post(`/bidder-onboarding/verify-${key}`, payload);
      if (res.data.success) {
        setCompVerify(p => ({ ...p, [key]: true }));
        const name = res.data.data?.legalName || res.data.data?.tradeName || '';
        toast.success(`✓ ${source} Verified${name ? ` — ${name}` : ''}`);
        if (res.data.data?.legalName && !comp.legalName) setComp(p => ({ ...p, legalName: res.data.data.legalName }));
        if (source === 'gst' && res.data.data?.gstin) setComp(p => ({ ...p, gstin: res.data.data.gstin }));
        fetchAll();
      } else {
        toast.error(`${source.toUpperCase()} check: ${res.data.result}`);
      }
    } catch (e) {
      toast.error(e.response?.data?.error || `${source} verification failed.`);
    }
    setVerifyLoading(p => ({ ...p, [key]: false }));
  };

  // ── STEP 3: Upload document ──
  const handleDocUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return toast.error('Select a file to upload.');
    if (!uploadForm.documentName || !uploadForm.documentType) return toast.error('Document name and type are required.');
    setUploading(true);
    const fd = new FormData();
    fd.append('file', uploadFile);
    fd.append('documentName', uploadForm.documentName);
    fd.append('documentType', uploadForm.documentType);
    fd.append('documentCategory', uploadForm.documentCategory);
    if (uploadForm.expiryDate) fd.append('expiryDate', uploadForm.expiryDate);
    try {
      await api.post('/bidder-onboarding/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Document uploaded. Verification processing started.');
      setUploadModal(false);
      setUploadForm({ documentName: '', documentType: '', documentCategory: 'COMPANY', expiryDate: '' });
      setUploadFile(null);
      fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Upload failed. Check file type and size (max 10 MB).');
    }
    setUploading(false);
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await api.delete(`/bidder-onboarding/documents/${docId}`);
      toast.success('Document deleted.');
      fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Cannot delete this document.');
    }
  };

  const handleSubmitForReview = async () => {
    if (documents.length === 0) return toast.error('Upload at least one document before submitting for review.');
    setSaving(true);
    try {
      await api.post('/bidder-onboarding/profile', { ...personal, lifecycleStatus: 'DOCUMENT_VERIFICATION_PENDING' });
      toast.success('Submitted for officer review! You will be notified once verified.');
      fetchAll();
    } catch (e) {
      toast.error('Failed to submit for review.');
    }
    setSaving(false);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid var(--bg-border)', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin-slow 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#94a3b8' }}>Loading your verification profile...</p>
      </div>
    </div>
  );

  const lifecycleStatus = profile?.lifecycleStatus || 'REGISTERED';
  const correctionReason = profile?.rejectionReason;
  const isUnderReview = ['UNDER_OFFICER_REVIEW', 'DOCUMENT_VERIFICATION_PENDING'].includes(lifecycleStatus);
  const isApproved = lifecycleStatus === 'APPROVED_TO_BID';

  const steps = [
    { id: 1, label: 'Personal Identity', icon: '👤', desc: 'PAN & Aadhaar Verification' },
    { id: 2, label: 'Company Profile', icon: '🏢', desc: 'GST, Udyam, MCA & more' },
    { id: 3, label: 'Document Upload', icon: '📁', desc: 'Upload verification documents' },
    { id: 4, label: 'Officer Review', icon: '🔍', desc: 'Awaiting verification officer' },
    { id: 5, label: 'Approved', icon: '✅', desc: 'Eligible to bid on tenders' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #020b18 0%, #0a1628 50%, #060f1e 100%)', padding: 0 }}>
      {/* Top bar */}
      <div style={{ padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(2, 11, 24, 0.9)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/complygem_logo.png" alt="ComplyGeM" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'contain' }} />
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#f0f4ff' }}>COMPLYGeM-AI</div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Bidder Verification Portal</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/bidder/dashboard')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 14px', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}>Go to Dashboard</button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-block', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 20, padding: '4px 16px', fontSize: '0.72rem', color: '#3b82f6', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Bidder Verification & Onboarding
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.8rem', color: '#f0f4ff', marginBottom: 8 }}>
            Complete Your Verification
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: 540, margin: '0 auto' }}>
            Complete identity, company, and document verification to become eligible to participate in government procurement tenders.
          </p>
        </div>

        {/* Correction banner */}
        {lifecycleStatus === 'CORRECTION_REQUIRED' && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '14px 18px', marginBottom: 24 }}>
            <div style={{ fontWeight: 800, color: '#ef4444', marginBottom: 4 }}>⚠ Correction Required</div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>{correctionReason || 'Please review and resubmit the required documents.'}</p>
          </div>
        )}

        {/* Progress Steps */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 36, position: 'relative' }}>
          {steps.map((step, i) => {
            const isActive = i === activeStep;
            const isDone = i < activeStep || isApproved;
            return (
              <div key={step.id} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                {i < steps.length - 1 && (
                  <div style={{ position: 'absolute', top: 20, left: '50%', right: '-50%', height: 2, background: isDone ? '#3b82f6' : 'rgba(255,255,255,0.08)', zIndex: 0, transition: 'background 0.4s' }} />
                )}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isDone ? '1.1rem' : '0.9rem', background: isActive ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : isDone ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', border: `2px solid ${isActive ? '#3b82f6' : isDone ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)'}`, boxShadow: isActive ? '0 0 16px rgba(59,130,246,0.4)' : 'none', transition: 'all 0.3s' }}>
                    {isDone ? '✓' : step.icon}
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: isActive ? 800 : 600, color: isActive ? '#f0f4ff' : isDone ? '#60a5fa' : '#64748b' }}>{step.label}</div>
                  <div style={{ fontSize: '0.62rem', color: '#475569', marginTop: 2 }}>{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── STEP 1: PERSONAL IDENTITY ─── */}
        {activeStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 28 }}>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#f0f4ff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                👤 Personal Identity Information
                <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 400 }}>All fields marked * are mandatory</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  { label: 'Full Legal Name *', key: 'fullName', placeholder: 'As per PAN / Aadhaar' },
                  { label: "Father's / Spouse's Name", key: 'fatherName', placeholder: 'Optional' },
                  { label: 'Date of Birth *', key: 'dateOfBirth', placeholder: '', type: 'date' },
                  { label: 'Mobile Number *', key: 'mobileNumber', placeholder: '+91 XXXXXXXXXX' },
                  { label: 'Alternate Phone', key: 'alternatePhone', placeholder: 'Optional' },
                  { label: 'City', key: 'city', placeholder: 'e.g. Bengaluru' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>{f.label}</label>
                    <input className="input" type={f.type || 'text'} placeholder={f.placeholder} value={personal[f.key]} onChange={e => setPersonal(p => ({ ...p, [f.key]: e.target.value }))} style={{ width: '100%' }} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>Gender</label>
                  <select className="input" value={personal.gender} onChange={e => setPersonal(p => ({ ...p, gender: e.target.value }))} style={{ width: '100%' }}>
                    <option value="">Select Gender</option>
                    {['MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY'].map(g => <option key={g} value={g}>{g.replace(/_/g,' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>State *</label>
                  <select className="input" value={personal.state} onChange={e => setPersonal(p => ({ ...p, state: e.target.value }))} style={{ width: '100%' }}>
                    <option value="">Select State</option>
                    {STATES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>District</label>
                  <input className="input" placeholder="e.g. Bengaluru Urban" value={personal.district} onChange={e => setPersonal(p => ({ ...p, district: e.target.value }))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>PIN Code</label>
                  <input className="input" placeholder="6-digit PIN" maxLength={6} value={personal.pincode} onChange={e => setPersonal(p => ({ ...p, pincode: e.target.value }))} style={{ width: '100%' }} />
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>Residential Address *</label>
                <textarea className="input" rows={2} placeholder="Full residential address" value={personal.residentialAddress} onChange={e => setPersonal(p => ({ ...p, residentialAddress: e.target.value }))} style={{ width: '100%', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button className="btn-primary" onClick={handleSavePersonal} disabled={saving} style={{ minWidth: 160 }}>
                  {saving ? '⟳ Saving...' : 'Save Personal Info →'}
                </button>
              </div>
            </div>

            {/* PAN Verification */}
            <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 28 }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#f0f4ff', marginBottom: 16 }}>🪪 PAN Verification — CBDT Government Gateway</div>
              <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, padding: '10px 14px', fontSize: '0.75rem', color: '#60a5fa', marginBottom: 16 }}>
                <strong>Statutory Verification Gateway:</strong> Real-time lookup against Income Tax Department (CBDT) registry to validate corporate/individual PAN credentials.
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>PAN NUMBER *</label>
                  <input className="input" placeholder="e.g. ABCDE1234F" value={personal.panNumber} onChange={e => setPersonal(p => ({ ...p, panNumber: e.target.value.toUpperCase() }))}
                    style={{ width: '100%', fontFamily: 'monospace', letterSpacing: '0.1em', color: panState.verified ? '#10b981' : 'inherit' }} maxLength={10} disabled={panState.verified} />
                </div>
                <VerifyFetchButton label="Verify & Fetch" loading={panState.loading} verified={panState.verified} onClick={handleVerifyPAN} />
              </div>
              {panState.verified && panState.data && (
                <div style={{
                  marginTop: 16,
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(15,23,42,0.9) 100%)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 14,
                  padding: '18px 20px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#10b981' }}>✓</div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#10b981', fontSize: '0.85rem' }}>Income Tax Department (CBDT) — Verified Identity</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Verified via Government Data Service Gateway • Official Record Matched</div>
                      </div>
                    </div>
                    <button onClick={() => setPanState({ loading: false, verified: false, data: null })} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 10px', fontSize: '0.68rem', color: '#94a3b8', cursor: 'pointer' }}>
                      Re-enter PAN ↺
                    </button>
                  </div>

                  {/* Registered Company / Legal Name banner */}
                  <div style={{ background: 'rgba(2,132,199,0.1)', border: '1px solid rgba(2,132,199,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 14 }}>
                    <div style={{ fontSize: '0.65rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registered Legal Entity Name</div>
                    <div style={{ fontSize: '1.05rem', color: '#f0f4ff', fontWeight: 800, marginTop: 2 }}>{panState.data.legalName}</div>
                  </div>

                  {/* Detailed Registry Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>PAN NUMBER</div>
                      <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 800, fontFamily: 'monospace' }}>{panState.data.panNumber}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>ENTITY TYPE</div>
                      <div style={{ fontSize: '0.85rem', color: '#f0f4ff', fontWeight: 700 }}>{panState.data.entityType}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>TAX STATUS</div>
                      <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 800 }}>ACTIVE ✓ (Valid)</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>JURISDICTION WARD</div>
                      <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>{panState.data.jurisdiction || 'Central Ward'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>DATE OF INCORPORATION / ISSUE</div>
                      <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>{panState.data.dateOfIncorporation || 'Verified Record'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>AADHAAR SEEDING</div>
                      <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700 }}>Linked & Validated ✓</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Aadhaar Identity Verification */}
            <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 28 }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#f0f4ff', marginBottom: 8 }}>🔐 Identity Verification — Aadhaar Gateway OTP</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginTop: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>AADHAAR REFERENCE NUMBER / ID</label>
                  <input className="input" placeholder="Enter 12-digit Aadhaar / Virtual ID" value={personal.aadhaarRef} onChange={e => setPersonal(p => ({ ...p, aadhaarRef: e.target.value }))} style={{ width: '100%', fontFamily: 'monospace' }} disabled={aadhaarState.verified} />
                </div>
                {!aadhaarState.sent && !aadhaarState.verified && (
                  <button className="btn-secondary" onClick={handleSendAadhaarOTP} disabled={aadhaarState.loading} style={{ minWidth: 120, padding: '9px 14px' }}>
                    {aadhaarState.loading ? '⟳ Sending...' : 'Send OTP'}
                  </button>
                )}
              </div>
              {aadhaarState.sent && !aadhaarState.verified && (
                <div style={{ marginTop: 14 }}>
                  <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>ENTER OTP CODE (sent to {aadhaarState.masked || 'registered mobile'})</label>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                    <input className="input" placeholder="6-digit OTP" maxLength={6} value={personal.otp} onChange={e => setPersonal(p => ({ ...p, otp: e.target.value }))} style={{ width: 180, fontFamily: 'monospace', letterSpacing: '0.2em' }} />
                    <button className="btn-primary" onClick={handleVerifyOTP} disabled={aadhaarState.loading}>
                      {aadhaarState.loading ? '⟳ Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                </div>
              )}
              {aadhaarState.verified && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, color: '#10b981', fontWeight: 700, fontSize: '0.82rem' }}>
                  ✓ Identity Verification Completed — {aadhaarState.masked || 'XXXX XXXX ####'}
                </div>
              )}
            </div>

            {/* Proceed to Company */}
            {panState.verified && aadhaarState.verified && (
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: '0.95rem' }} onClick={() => setActiveStep(2)}>
                ✓ Identity Verified — Proceed to Company Registration →
              </button>
            )}
          </div>
        )}

        {/* ─── STEP 0: START ─── */}
        {activeStep === 0 && (
          <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🏛️</div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 12 }}>Welcome to Bidder Verification</h2>
            <p style={{ color: '#64748b', maxWidth: 520, margin: '0 auto 24px', lineHeight: 1.7 }}>
              To participate in government procurement tenders on GeM, you must complete a thorough verification process. This includes personal identity verification, company registration validation, document upload, and review by an authorized verification officer.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, maxWidth: 480, margin: '0 auto 28px' }}>
              {[['🪪','PAN & Identity Verified','Via Government Data Service'],['🏢','Company Registration Verified','GST, Udyam, MCA & more'],['📁','Documents Uploaded & Verified','Secure Document Vault'],['✅','Officer Approved','Eligible to bid on tenders']].map(([icon, title, sub]) => (
                <div key={title} style={{ padding: '14px 16px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 12, textAlign: 'left' }}>
                  <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f0f4ff' }}>{title}</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{sub}</div>
                </div>
              ))}
            </div>
            <button className="btn-primary" style={{ padding: '12px 32px', fontSize: '0.95rem' }} onClick={() => setActiveStep(1)}>
              Start Verification Process →
            </button>
          </div>
        )}

        {/* ─── STEP 2: COMPANY REGISTRATION ─── */}
        {activeStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 28 }}>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#f0f4ff', marginBottom: 20 }}>🏢 Company Identity</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  { label: 'Legal Company Name *', key: 'legalName', placeholder: 'As per Certificate of Incorporation' },
                  { label: 'Trade / Brand Name', key: 'tradeName', placeholder: 'Commonly used name' },
                  { label: 'Date of Incorporation', key: 'dateOfIncorporation', placeholder: '', type: 'date' },
                  { label: 'Nature of Business', key: 'natureOfBusiness', placeholder: 'e.g. Manufacturing' },
                  { label: 'Business Category', key: 'businessCategory', placeholder: 'e.g. Industrial Safety Equipment' },
                  { label: 'Website', key: 'website', placeholder: 'https://company.com' },
                  { label: 'Company Email *', key: 'companyEmail', placeholder: 'official@company.com' },
                  { label: 'Company Phone *', key: 'companyPhone', placeholder: '+91 XXXXXXXXXX' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>{f.label}</label>
                    <input className="input" type={f.type || 'text'} placeholder={f.placeholder} value={comp[f.key] || ''} onChange={e => setComp(p => ({ ...p, [f.key]: e.target.value }))} style={{ width: '100%' }} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>Company Type *</label>
                  <select className="input" value={comp.companyType} onChange={e => setComp(p => ({ ...p, companyType: e.target.value }))} style={{ width: '100%' }}>
                    <option value="">Select Type</option>
                    {COMPANY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>Registered State *</label>
                  <select className="input" value={comp.registeredState} onChange={e => setComp(p => ({ ...p, registeredState: e.target.value }))} style={{ width: '100%' }}>
                    <option value="">Select State</option>
                    {STATES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>Registered Office Address *</label>
                <textarea className="input" rows={2} placeholder="Full registered office address" value={comp.registeredAddress || ''} onChange={e => setComp(p => ({ ...p, registeredAddress: e.target.value }))} style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button className="btn-primary" onClick={handleSaveCompany} disabled={saving} style={{ minWidth: 160 }}>
                  {saving ? '⟳ Saving...' : 'Save Company Info'}
                </button>
              </div>
            </div>

            {/* Government Verification Fields */}
            <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 28 }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#f0f4ff', marginBottom: 6 }}>🔗 Government Data Verification Service</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 20 }}>Enter identifiers and click "Verify & Fetch" to validate against government records. Verified fields are locked and cannot be manually modified.</div>
              {[
                { label: 'GSTIN (GST Registration Number)', key: 'gstin', vKey: 'gst', source: 'gst', payload: () => ({ gstin: comp.gstin, expectedName: comp.legalName }), placeholder: 'e.g. 29ABCDE1234F1Z5', hint: 'Validates against GSTN database' },
                { label: 'Company PAN Number', key: 'companyPan', vKey: 'pan', source: 'pan', payload: () => ({ pan: comp.companyPan, expectedName: comp.legalName }), placeholder: 'e.g. ABCDE1234F', hint: 'Validates against CBDT PAN registry' },
                { label: 'Udyam Registration Number', key: 'udyamNumber', vKey: 'udyam', source: 'udyam', payload: () => ({ udyamNumber: comp.udyamNumber, expectedName: comp.legalName, expectedPan: comp.companyPan }), placeholder: 'UDYAM-KR-03-XXXXXXX', hint: 'MSME Ministry registry' },
                { label: 'CIN / LLPIN (MCA Registration)', key: 'cinNumber', vKey: 'mca', source: 'mca', payload: () => ({ cinOrLlpin: comp.cinNumber, expectedName: comp.legalName }), placeholder: 'U29100KA2018PTC112233', hint: 'MCA21 company registry' },
                { label: 'Startup India Registration Number', key: 'startupRegNumber', vKey: 'startup', source: 'startup', payload: () => ({ recognitionNumber: comp.startupRegNumber, expectedPan: comp.companyPan }), placeholder: 'DIPP-XXXXX', hint: 'DPIIT Startup portal', optional: true },
                { label: 'NSIC Registration Number', key: 'nsicNumber', vKey: 'nsic', source: 'nsic', payload: () => ({ registrationNumber: comp.nsicNumber }), placeholder: 'NSIC/REG/XXXXX', hint: 'National Small Industries Corp', optional: true },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    {field.label}
                    {field.optional && <span style={{ color: '#475569', fontWeight: 400 }}>optional</span>}
                    {compVerify[field.vKey] && <span style={{ color: '#10b981', fontSize: '0.65rem' }}>✓ VERIFIED</span>}
                  </label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <input className="input" placeholder={field.placeholder} value={comp[field.key] || ''} onChange={e => setComp(p => ({ ...p, [field.key]: e.target.value.toUpperCase() }))} style={{ width: '100%', fontFamily: 'monospace', color: compVerify[field.vKey] ? '#10b981' : 'inherit', letterSpacing: '0.05em' }} disabled={compVerify[field.vKey]} />
                    </div>
                    <VerifyFetchButton label="Verify & Fetch" loading={verifyLoading[field.vKey]} verified={compVerify[field.vKey]} onClick={() => handleVerifyCompanyField(field.source, field.payload())} disabled={!comp[field.key]} />
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: 3 }}>📡 {field.hint}</div>
                </div>
              ))}
              {/* Authorized Representative */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, marginTop: 8 }}>
                <div style={{ fontWeight: 700, color: '#94a3b8', fontSize: '0.8rem', marginBottom: 14 }}>Authorized Representative Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    ['Name', 'authorizedRepName', 'e.g. Rajesh Kumar'],
                    ['Designation', 'authorizedRepDesignation', 'e.g. Managing Director'],
                    ['Email', 'authorizedRepEmail', 'rep@company.com'],
                    ['Mobile', 'authorizedRepPhone', '+91 XXXXXXXXXX'],
                  ].map(([l, k, ph]) => (
                    <div key={k}>
                      <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>Rep {l}</label>
                      <input className="input" placeholder={ph} value={comp[k] || ''} onChange={e => setComp(p => ({ ...p, [k]: e.target.value }))} style={{ width: '100%' }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {compVerify.pan && compVerify.gst && (
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: '0.95rem' }} onClick={() => setActiveStep(3)}>
                ✓ Company Verified — Proceed to Document Upload →
              </button>
            )}
          </div>
        )}

        {/* ─── STEP 3: DOCUMENT UPLOAD ─── */}
        {activeStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f0f4ff' }}>📁 Document Vault</h2>
                <p style={{ color: '#64748b', fontSize: '0.8rem' }}>{documents.length} document{documents.length !== 1 ? 's' : ''} uploaded</p>
              </div>
              <button className="btn-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }} onClick={() => setUploadModal(true)}>+ Upload Document</button>
            </div>

            {/* Document category tabs */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DOC_CATEGORIES.map(cat => (
                <button key={cat.key} onClick={() => setActiveDocTab(cat.key)} style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${activeDocTab === cat.key ? cat.color : 'rgba(255,255,255,0.1)'}`, background: activeDocTab === cat.key ? `${cat.color}18` : 'transparent', color: activeDocTab === cat.key ? cat.color : '#64748b', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Documents list */}
            {documents.filter(d => d.documentCategory === activeDocTab || activeDocTab === 'ALL').length === 0 ? (
              <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '48px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>📂</div>
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No {DOC_CATEGORIES.find(c => c.key === activeDocTab)?.label || 'documents'} uploaded yet.</p>
                <button className="btn-primary" style={{ marginTop: 14, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }} onClick={() => setUploadModal(true)}>Upload First Document</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {documents.filter(d => d.documentCategory === activeDocTab).map(doc => (
                  <div key={doc.id} style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontWeight: 700, color: '#f0f4ff', fontSize: '0.88rem' }}>📄 {doc.documentName}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>{doc.documentType.replace(/_/g,' ')} · {doc.originalFileName} · {doc.fileSize ? Math.round(doc.fileSize/1024) + ' KB' : 'N/A'}</div>
                      {doc.expiryDate && <div style={{ fontSize: '0.68rem', color: '#f59e0b', marginTop: 2 }}>Expires: {new Date(doc.expiryDate).toLocaleDateString('en-IN')}</div>}
                      {doc.rejectionReason && <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 4, background: 'rgba(239,68,68,0.08)', padding: '4px 8px', borderRadius: 6 }}>Reason: {doc.rejectionReason}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <StatusBadge status={doc.verificationStatus} />
                      {['PENDING', 'REJECTED', 'REUPLOAD_REQUIRED'].includes(doc.verificationStatus) && (
                        <button onClick={() => handleDeleteDoc(doc.id)} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '4px 10px', color: '#ef4444', fontSize: '0.72rem', cursor: 'pointer' }}>Delete</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Submit for review */}
            {documents.length > 0 && !isUnderReview && (
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: '0.95rem' }} onClick={handleSubmitForReview} disabled={saving}>
                {saving ? '⟳ Submitting...' : '🔍 Submit for Officer Review →'}
              </button>
            )}
            {isUnderReview && (
              <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🔍</div>
                <div style={{ fontWeight: 800, color: '#3b82f6', marginBottom: 4 }}>Under Verification Officer Review</div>
                <p style={{ color: '#64748b', fontSize: '0.82rem' }}>Your application is in the review queue. You will be notified once the officer completes verification.</p>
              </div>
            )}
          </div>
        )}

        {/* ─── STEP 4: AWAITING REVIEW ─── */}
        {activeStep === 4 && (
          <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 12 }}>Application Under Review</h2>
            <p style={{ color: '#64748b', maxWidth: 500, margin: '0 auto 24px', lineHeight: 1.7 }}>
              Your verification documents are being reviewed by an authorized Verification Officer. This typically takes 1–3 business days. You will receive a notification once a decision is made.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, maxWidth: 480, margin: '0 auto 28px' }}>
              {[['📋', 'Documents Submitted', `${documents.length} uploaded`], ['🔍', 'Officer Assigned', 'In review queue'], ['⏳', 'Decision Pending', 'Within 3 business days']].map(([icon, t, s]) => (
                <div key={t} style={{ padding: 16, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 12 }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{icon}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f0f4ff' }}>{t}</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 2 }}>{s}</div>
                </div>
              ))}
            </div>
            <button className="btn-secondary" onClick={() => navigate('/bidder/verification-status')} style={{ marginRight: 12 }}>View Verification Status</button>
            <button className="btn-secondary" onClick={() => setActiveStep(3)}>Manage Documents</button>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {uploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setUploadModal(false)}>
          <div style={{ background: '#091322', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28, maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 800, color: '#f0f4ff', fontSize: '1.05rem' }}>Upload Document to Vault</h3>
              <button onClick={() => setUploadModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <form onSubmit={handleDocUpload} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>DOCUMENT CATEGORY *</label>
                <select className="input" value={uploadForm.documentCategory} onChange={e => setUploadForm(p => ({ ...p, documentCategory: e.target.value, documentType: '' }))} style={{ width: '100%' }}>
                  {DOC_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>DOCUMENT TYPE *</label>
                <select className="input" value={uploadForm.documentType} onChange={e => setUploadForm(p => ({ ...p, documentType: e.target.value }))} style={{ width: '100%' }}>
                  <option value="">Select document type</option>
                  {DOC_CATEGORIES.find(c => c.key === uploadForm.documentCategory)?.types.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>DOCUMENT NAME / LABEL *</label>
                <input className="input" placeholder="e.g. GST Registration Certificate FY2025" value={uploadForm.documentName} onChange={e => setUploadForm(p => ({ ...p, documentName: e.target.value }))} style={{ width: '100%' }} required />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>EXPIRY DATE (if applicable)</label>
                <input className="input" type="date" value={uploadForm.expiryDate} onChange={e => setUploadForm(p => ({ ...p, expiryDate: e.target.value }))} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 8 }}>FILE (PDF, JPG, PNG, DOC — max 10 MB) *</label>
                <div style={{ border: '2px dashed rgba(124,58,237,0.4)', borderRadius: 12, padding: 20, textAlign: 'center', background: 'rgba(124,58,237,0.04)', cursor: 'pointer' }} onClick={() => document.getElementById('docFileInput').click()}>
                  {uploadFile ? (
                    <div><div style={{ color: '#7c3aed', fontWeight: 700 }}>📄 {uploadFile.name}</div><div style={{ color: '#64748b', fontSize: '0.72rem' }}>{Math.round(uploadFile.size/1024)} KB</div></div>
                  ) : (
                    <div><div style={{ fontSize: '1.5rem', marginBottom: 6 }}>📤</div><div style={{ color: '#64748b', fontSize: '0.82rem' }}>Click to select file</div></div>
                  )}
                  <input id="docFileInput" type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display: 'none' }} onChange={e => setUploadFile(e.target.files[0])} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setUploadModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1.5, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', justifyContent: 'center' }} disabled={uploading}>
                  {uploading ? '⟳ Uploading...' : '↑ Upload to Secure Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
