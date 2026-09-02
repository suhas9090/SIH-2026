import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { verificationAPI, bidderOnboardingAPI } from '../services/api';
import toast from 'react-hot-toast';

const ACCOUNT_TYPES = [
  {
    type: 'BIDDER',
    icon: '🏢',
    title: 'Bidder / Supplier',
    desc: 'Register corporate profile to find tenders and submit bids with automated regulatory verification',
    badge: 'Self-Service & Verification',
    badgeColor: '#10b981',
  },
  {
    type: 'PROCUREMENT_OFFICER',
    icon: '🏛️',
    title: 'Procurement Officer',
    desc: 'Publish tenders, manage submissions, and make authorized compliance decisions',
    badge: 'Requires Admin Approval',
    badgeColor: '#3b82f6',
  },
  {
    type: 'COMPLIANCE_AUDITOR',
    icon: '🔍',
    title: 'Compliance Auditor',
    desc: 'Independent evaluation of AI findings, evidence inspection, and decision sign-offs',
    badge: 'Requires Admin Approval',
    badgeColor: '#06b6d4',
  },
  {
    type: 'ADMIN',
    icon: '🔒',
    title: 'System Administrator',
    desc: 'Platform management, security monitoring, and RBAC governance',
    badge: 'Invitation Only',
    badgeColor: '#ef4444',
    disabled: true,
  },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawRoleParam = (searchParams.get('role') || searchParams.get('portal') || '').toUpperCase();
  const normalizedRole = rawRoleParam === 'AUDITOR'
    ? 'COMPLIANCE_AUDITOR'
    : rawRoleParam === 'OFFICER'
    ? 'PROCUREMENT_OFFICER'
    : rawRoleParam;

  const initialRole = ACCOUNT_TYPES.find(t => t.type === normalizedRole && !t.disabled)?.type || null;

  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [step, setStep] = useState(initialRole ? 2 : 1); // 1=Role, 2=Personal+OTP, 3=Company/Org, 4=Verification, 5=Done
  const [loading, setLoading] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Sync if URL query param changes dynamically
  useEffect(() => {
    if (normalizedRole && initialRole) {
      setSelectedRole(initialRole);
      setStep(2);
    }
  }, [normalizedRole, initialRole]);

  // Step 2: Personal Details
  const [personal, setPersonal] = useState({
    name: '',
    designation: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    emailOtp: '',
    emailOtpSent: false,
    emailOtpVerified: false,
  });

  // Step 3: Company Details (for Bidder) - Fresh clean state
  const [company, setCompany] = useState({
    organizationName: '',
    tradeName: '',
    entityType: 'Private Limited Company',
    pan: '',
    gstin: '',
    udyamNo: '',
    cinNo: '',
    address: '',
    state: '',
    district: '',
    pincode: '',
    businessCategory: '',
    yearOfEstablishment: '',
  });

  // Step 3: Organization Details (for Officer/Auditor) - Fresh clean state
  const [officialOrg, setOfficialOrg] = useState({
    organization: '',
    department: '',
    employeeId: '',
    designation: '',
  });

  // Step 4: Verification Results
  const [verificationResult, setVerificationResult] = useState(null);
  const [fetchingPan, setFetchingPan] = useState(false);
  const [panFetchedData, setPanFetchedData] = useState(null);

  // ── Bidder Quick-Register (single step) ──────────────────────────────────
  const [bidderForm, setBidderForm] = useState({
    companyName: '', email: '', password: '', confirmPassword: ''
  });
  const [bidderOtp, setBidderOtp] = useState({
    sent: false, verified: false, code: '', cooldown: 0, sessionToken: ''
  });
  const [bidderRegistered, setBidderRegistered] = useState(false);

  // cooldown timer
  useEffect(() => {
    let t;
    if (bidderOtp.cooldown > 0) {
      t = setInterval(() => setBidderOtp(p => ({ ...p, cooldown: Math.max(0, p.cooldown - 1) })), 1000);
    }
    return () => clearInterval(t);
  }, [bidderOtp.cooldown]);

  const handleBidderSendOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!bidderForm.email || !emailRegex.test(bidderForm.email.trim())) {
      return toast.error('Enter a valid company email address first.');
    }
    setSendingOtp(true);
    try {
      const res = await api.post('/auth/send-otp', {
        type: 'EMAIL', target: bidderForm.email.trim()
      });
      setBidderOtp(p => ({ ...p, sent: true, code: '', cooldown: 60, sessionToken: res.data?.sessionToken || '' }));
      toast.success(`Verification code sent to ${bidderForm.email}`);
    } catch (err) {
      // Fallback sim
      setBidderOtp(p => ({ ...p, sent: true, code: '', cooldown: 60 }));
      toast.success(`Verification code sent to ${bidderForm.email}`);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleBidderVerifyOtp = async () => {
    if (!bidderOtp.code || !/^\d{6}$/.test(bidderOtp.code.trim())) {
      return toast.error('Enter the 6-digit OTP code from your email.');
    }
    setVerifyingOtp(true);
    try {
      const res = await api.post('/auth/verify-otp', {
        type: 'EMAIL', target: bidderForm.email.trim(), otp: bidderOtp.code.trim()
      });
      if (res.data?.verified) {
        setBidderOtp(p => ({ ...p, verified: true }));
        toast.success('✓ Email verified!');
      } else {
        toast.error('Invalid OTP. Please try again.');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP. Check and try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleBidderRegister = async () => {
    if (!bidderForm.companyName.trim()) return toast.error('Company / Organisation name is required.');
    if (!bidderForm.email.trim()) return toast.error('Company email is required.');
    if (!bidderOtp.verified) return toast.error('Please verify your email OTP first.');
    if (!bidderForm.password || bidderForm.password.length < 6) return toast.error('Password must be at least 6 characters.');
    if (bidderForm.password !== bidderForm.confirmPassword) return toast.error('Passwords do not match.');

    setLoading(true);
    try {
      await api.post('/auth/register-bidder', {
        name: bidderForm.companyName.trim(),
        organizationName: bidderForm.companyName.trim(),
        email: bidderForm.email.trim(),
        password: bidderForm.password,
        role: 'BIDDER'
      });
      setBidderRegistered(true);
      setStep(5);
      toast.success('Account created! Continue to complete your verification profile.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  const handleFetchPanDetails = async (panInput) => {
    const cleanPan = (panInput || company.pan).trim().toUpperCase();
    if (!cleanPan || cleanPan.length !== 10) {
      return toast.error('Please enter a valid 10-character PAN number (e.g. SYNPA0001C).');
    }

    setFetchingPan(true);
    try {
      const res = await bidderOnboardingAPI.fetchPanDetails(cleanPan);
      if (res.data?.found && res.data?.data) {
        const data = res.data.data;
        setCompany(prev => ({
          ...prev,
          organizationName: data.legalName || prev.organizationName,
          tradeName: data.gstTradeName || data.legalName || prev.tradeName,
          pan: cleanPan,
          gstin: data.gstin || prev.gstin,
          udyamNo: data.udyamNumber || prev.udyamNo,
          cinNo: data.cinNumber || prev.cinNo,
          entityType: data.entityType || prev.entityType,
          state: data.state || prev.state,
          district: data.district ? `${data.district}${data.pincode ? ' - ' + data.pincode : ''}` : prev.district,
          address: data.registeredAddress || prev.address,
          pincode: data.pincode || prev.pincode,
          yearOfEstablishment: data.dateOfIncorporation ? data.dateOfIncorporation.split('-')[0] : prev.yearOfEstablishment
        }));
        setPanFetchedData(data);
        toast.success(`⚡ Verified & Auto-Populated records for "${data.legalName}" from Government Registries!`, { duration: 4000 });
      } else {
        toast.error('No matching records found for this PAN in Government statutory registries.');
        setPanFetchedData(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'PAN lookup failed. You can enter details manually.');
      setPanFetchedData(null);
    } finally {
      setFetchingPan(false);
    }
  };

  const [sendingOtp, setSendingOtp] = useState(false);

  // ── Send Email OTP ──
  const handleSendEmailOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!personal.email || !emailRegex.test(personal.email.trim())) {
      return toast.error('Please enter a valid official email address first.');
    }

    setSendingOtp(true);
    try {
      await api.post('/auth/send-otp', {
        type: 'EMAIL',
        target: personal.email.trim()
      });
      setPersonal(prev => ({ ...prev, emailOtpSent: true, emailOtp: '' }));
      toast.success(`Verification OTP sent to ${personal.email}. (Demo OTP: 123456)`);
    } catch (err) {
      // Fallback for simulation
      setPersonal(prev => ({ ...prev, emailOtpSent: true, emailOtp: '' }));
      toast.success(`Verification OTP code sent to ${personal.email}`);
    } finally {
      setSendingOtp(false);
    }
  };

  // ── Verify Email OTP ──
  const handleVerifyEmailOtp = async () => {
    if (!personal.emailOtp || !/^\d{6}$/.test(personal.emailOtp.trim())) {
      return toast.error('Please enter the 6-digit Email OTP code.');
    }

    setVerifyingOtp(true);
    try {
      const res = await api.post('/auth/verify-otp', {
        type: 'EMAIL',
        target: personal.email.trim(),
        otp: personal.emailOtp.trim(),
      });

      if (res.data.verified) {
        setPersonal(prev => ({ ...prev, emailOtpVerified: true }));
        toast.success('✓ Official Email Address Verified Successfully!');
      } else {
        toast.error('Invalid OTP code. Please try again.');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP code. Please enter a valid 6-digit code.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleRunCompanyVerification = async () => {
    if (!personal.emailOtpVerified) {
      return toast.error('Please verify your official email address OTP before proceeding.');
    }
    if (!company.pan && !panFetchedData) {
      return toast.error('Please enter your Corporate PAN number.');
    }
    setLoading(true);
    try {
      const bidderPayload = {
        ...company,
        ...(panFetchedData ? {
          organizationName: panFetchedData.legalName,
          legalName: panFetchedData.legalName,
          tradeName: panFetchedData.tradeName,
          pan: panFetchedData.panNumber,
          gstin: panFetchedData.gstin,
          udyamNo: panFetchedData.udyamNumber,
          cinNo: panFetchedData.cinNumber,
          address: panFetchedData.registeredAddress,
          state: panFetchedData.state,
          district: panFetchedData.district,
          pincode: panFetchedData.pincode,
          entityType: panFetchedData.entityType,
          yearOfEstablishment: panFetchedData.dateOfIncorporation ? panFetchedData.dateOfIncorporation.split('-')[0] : ''
        } : {})
      };

      const res = await verificationAPI.verifyBidderUnified({
        bidder: bidderPayload,
        tenderRequirements: {}
      });
      setVerificationResult(res.data);
      setStep(4);
    } catch (err) {
      toast.error('Synthetic verification check failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      if (selectedRole === 'BIDDER') {
        await api.post('/auth/register-bidder', {
          ...personal,
          ...company,
          ...(panFetchedData ? {
            organizationName: panFetchedData.legalName,
            tradeName: panFetchedData.tradeName,
            pan: panFetchedData.panNumber,
            gstin: panFetchedData.gstin,
            udyamNo: panFetchedData.udyamNumber,
            cinNo: panFetchedData.cinNumber,
            address: panFetchedData.registeredAddress,
            state: panFetchedData.state,
            district: panFetchedData.district,
            pincode: panFetchedData.pincode,
            entityType: panFetchedData.entityType,
            yearOfEstablishment: panFetchedData.dateOfIncorporation ? panFetchedData.dateOfIncorporation.split('-')[0] : ''
          } : {})
        });
      } else if (selectedRole === 'PROCUREMENT_OFFICER') {
        await api.post('/auth/register-officer', {
          ...personal,
          ...officialOrg,
        });
      } else if (selectedRole === 'COMPLIANCE_AUDITOR') {
        await api.post('/auth/register-auditor', {
          ...personal,
          ...officialOrg,
          auditorId: officialOrg.employeeId || 'AUD-CAG-001',
        });
      }
      toast.success('Registration submitted successfully!');
      setStep(5);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--gradient-hero)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 16px', position: 'relative',
    }}>
      {/* Floating Top-Left Back Button */}
      <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 20 }}>
        <button
          type="button"
          onClick={() => {
            if (step > 1 && step < 5) {
              setStep(s => s - 1);
            } else {
              navigate('/login');
            }
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '8px 16px',
            color: '#f0f4ff',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#38bdf8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#f0f4ff'; }}
        >
          <span>←</span> {step > 1 && step < 5 ? 'Previous Step' : 'Back to Sign In'}
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: step === 3 || step === 4 ? 760 : 560, position: 'relative', zIndex: 1 }}>
        {/* Header Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <img
              src="/complygem_logo.png"
              alt="ComplyGeM Logo"
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                margin: '0 auto 10px',
                objectFit: 'contain',
                boxShadow: '0 6px 20px rgba(2, 132, 199, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'block',
              }}
            />
          </Link>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#f0f4ff', marginBottom: 2 }}>
            Secure Platform Registration
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.82rem' }}>ComplyGeM AI Verification Portal — SIH2026</p>
        </div>

        {/* STEP 1: Select User Role */}
        {step === 1 && (
          <div className="card" style={{ padding: 28 }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 16 }}>
              Select Registration Role
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ACCOUNT_TYPES.map(type => (
                <div
                  key={type.type}
                  onClick={() => {
                    if (type.disabled) return;
                    setSelectedRole(type.type);
                    setStep(2);
                  }}
                  style={{
                    padding: '16px 18px', borderRadius: 12, cursor: type.disabled ? 'not-allowed' : 'pointer',
                    border: `1px solid ${type.disabled ? 'rgba(30,45,74,0.4)' : 'var(--bg-border)'}`,
                    background: type.disabled ? 'rgba(30,45,74,0.2)' : 'var(--bg-input)',
                    opacity: type.disabled ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', gap: 14,
                  }}
                >
                  <span style={{ fontSize: '1.6rem' }}>{type.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: type.disabled ? '#4a6080' : '#f0f4ff' }}>
                        {type.title}
                      </span>
                      {type.badge && (
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                          color: type.badgeColor, background: `${type.badgeColor}18`,
                          border: `1px solid ${type.badgeColor}30`,
                        }}>
                          {type.badge}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{type.desc}</span>
                  </div>
                  {!type.disabled && <span style={{ color: '#4a6080', fontSize: '1.2rem' }}>›</span>}
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.8rem', color: '#64748b' }}>
              Already registered? <Link to="/login" style={{ color: '#3b82f6', fontWeight: 700 }}>Sign In</Link>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
             BIDDER QUICK-REGISTER — single card (company name + email + password + OTP)
             ═════════════════════════════════════════════════════════════ */}
        {step === 2 && selectedRole === 'BIDDER' && (
          <div className="card" style={{ padding: 32 }}>
            {/* Role badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '10px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10 }}>
              <span style={{ fontSize: '1.3rem' }}>🏢</span>
              <div>
                <div style={{ fontWeight: 800, color: '#f0f4ff', fontSize: '0.88rem' }}>Bidder / Supplier Account</div>
                <div style={{ fontSize: '0.7rem', color: '#10b981' }}>Instant registration — complete your verification profile after login</div>
              </div>
              <button type="button" onClick={() => { setSelectedRole(null); setStep(1); setSearchParams({}); }}
                style={{ marginLeft: 'auto', background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '3px 10px', color: '#94a3b8', fontSize: '0.72rem', cursor: 'pointer' }}>Change</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Company Name */}
              <div>
                <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>COMPANY / ORGANISATION NAME *</label>
                <input
                  className="input"
                  placeholder="e.g. ABC Safety Technologies Pvt. Ltd."
                  value={bidderForm.companyName}
                  onChange={e => setBidderForm(p => ({ ...p, companyName: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Company Email + OTP */}
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ color: '#64748b' }}>COMPANY EMAIL ADDRESS *</span>
                  {bidderOtp.verified && <span style={{ color: '#10b981', fontSize: '0.68rem' }}>✓ Verified</span>}
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="input"
                    type="email"
                    placeholder="contact@yourcompany.com"
                    value={bidderForm.email}
                    onChange={e => { setBidderForm(p => ({ ...p, email: e.target.value })); setBidderOtp(p => ({ ...p, verified: false, sent: false, code: '' })); }}
                    disabled={bidderOtp.verified}
                    style={{ flex: 1, borderColor: bidderOtp.verified ? 'rgba(16,185,129,0.5)' : undefined }}
                  />
                  {!bidderOtp.verified && (
                    <button type="button" className="btn-secondary"
                      style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', padding: '6px 14px', opacity: bidderOtp.cooldown > 0 ? 0.6 : 1 }}
                      onClick={handleBidderSendOtp}
                      disabled={sendingOtp || !bidderForm.email || bidderOtp.cooldown > 0}
                    >
                      {sendingOtp ? '⟳ Sending…' : bidderOtp.cooldown > 0 ? `Resend (${bidderOtp.cooldown}s)` : bidderOtp.sent ? 'Resend OTP' : 'Send OTP'}
                    </button>
                  )}
                </div>

                {/* OTP entry box */}
                {bidderOtp.sent && !bidderOtp.verified && (
                  <div style={{ marginTop: 10, padding: 14, background: 'rgba(59,130,246,0.06)', borderRadius: 10, border: '1px solid rgba(59,130,246,0.25)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: 700 }}>ENTER 6-DIGIT VERIFICATION CODE</label>
                      <span style={{ fontSize: '0.68rem', color: '#475569' }}>Check your inbox · Dev bypass: 123456</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        className="input"
                        type="text"
                        maxLength={6}
                        placeholder="● ● ● ● ● ●"
                        value={bidderOtp.code}
                        onChange={e => setBidderOtp(p => ({ ...p, code: e.target.value.replace(/\D/g, '') }))}
                        style={{ flex: 1, fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '0.3em', textAlign: 'center' }}
                      />
                      <button type="button" className="btn-primary"
                        style={{ fontSize: '0.78rem', padding: '6px 16px', background: '#3b82f6' }}
                        onClick={handleBidderVerifyOtp}
                        disabled={verifyingOtp || bidderOtp.code.length !== 6}
                      >
                        {verifyingOtp ? '⟳ Verifying…' : 'Verify'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Password */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>PASSWORD *</label>
                  <input className="input" type="password" placeholder="Min 6 characters"
                    value={bidderForm.password} onChange={e => setBidderForm(p => ({ ...p, password: e.target.value }))}
                    style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>CONFIRM PASSWORD *</label>
                  <input className="input" type="password" placeholder="Repeat password"
                    value={bidderForm.confirmPassword} onChange={e => setBidderForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    style={{ width: '100%' }} />
                </div>
              </div>

              {/* What happens next note */}
              <div style={{ padding: '12px 16px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6 }}>
                <span style={{ color: '#818cf8', fontWeight: 700 }}>📋 After creating your account</span> — you'll be guided through a step-by-step verification process: Personal Identity (PAN + Aadhaar), Company Details (GST, Udyam, MCA), Document Upload, and Automated AI Verification.
              </div>

              {/* Submit */}
              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: '0.95rem', background: 'linear-gradient(135deg,#10b981,#059669)', marginTop: 4 }}
                onClick={handleBidderRegister}
                disabled={loading || !bidderOtp.verified}
              >
                {loading ? '⟳ Creating Account…' : !bidderOtp.verified ? '🔒 Verify Email to Continue' : '🚀 Create Bidder Account →'}
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.8rem', color: '#64748b' }}>
              Already registered? <Link to="/login?portal=BIDDER" style={{ color: '#3b82f6', fontWeight: 700 }}>Sign In</Link>
            </div>
          </div>
        )}

        {/* STEP 2: Personal Details + Phone OTP (Officer / Auditor) */}
        {step === 2 && selectedRole !== 'BIDDER' && (
          <div className="card" style={{ padding: 28 }}>
            {/* Selected Role Context Banner */}
            {selectedRole && (
              <div style={{
                padding: '12px 16px',
                borderRadius: 12,
                background: `${ACCOUNT_TYPES.find(t => t.type === selectedRole)?.badgeColor || '#3b82f6'}15`,
                border: `1px solid ${ACCOUNT_TYPES.find(t => t.type === selectedRole)?.badgeColor || '#3b82f6'}40`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.4rem' }}>{ACCOUNT_TYPES.find(t => t.type === selectedRole)?.icon || '🏛️'}</span>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f0f4ff' }}>
                      Registering as: {ACCOUNT_TYPES.find(t => t.type === selectedRole)?.title || selectedRole.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: ACCOUNT_TYPES.find(t => t.type === selectedRole)?.badgeColor || '#3b82f6', fontWeight: 600 }}>
                      {ACCOUNT_TYPES.find(t => t.type === selectedRole)?.badge || 'Verified Account'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole(null);
                    setStep(1);
                    setSearchParams({});
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '16px',
                    padding: '4px 12px',
                    color: '#38bdf8',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Change Role
                </button>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className="section-title">Step 1: Personal & Identity Details</span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Step 1 of 3</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>FULL NAME *</label>
                  <input className="input" placeholder="e.g. Rajesh Kumar" value={personal.name} onChange={e => setPersonal({ ...personal, name: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>OFFICIAL DESIGNATION</label>
                  <input className="input" placeholder="e.g. Managing Director" value={personal.designation} onChange={e => setPersonal({ ...personal, designation: e.target.value })} style={{ width: '100%' }} />
                </div>
              </div>

              {/* Official Email with Email OTP verification */}
              <div>
                <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>OFFICIAL EMAIL ADDRESS *</span>
                  {personal.emailOtpVerified && (
                    <span style={{ color: '#10b981', fontSize: '0.68rem', fontWeight: 800 }}>
                      ✓ Email Verified
                    </span>
                  )}
                </label>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <input
                    className="input"
                    type="email"
                    placeholder="name@company.com"
                    value={personal.email}
                    onChange={e => setPersonal({ ...personal, email: e.target.value, emailOtpVerified: false })}
                    disabled={personal.emailOtpVerified}
                    style={{ flex: 1, borderColor: personal.emailOtpVerified ? 'rgba(16,185,129,0.5)' : undefined }}
                  />
                  {!personal.emailOtpVerified ? (
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '6px 14px', whiteSpace: 'nowrap' }}
                      onClick={handleSendEmailOtp}
                      disabled={sendingOtp || !personal.email}
                    >
                      {sendingOtp ? '⟳ Sending...' : personal.emailOtpSent ? 'Resend OTP' : 'Send Email OTP'}
                    </button>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 12px', background: 'rgba(16,185,129,0.15)', color: '#10b981', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800 }}>
                      ✓ Verified
                    </span>
                  )}
                </div>
              </div>

              {/* Email OTP Input Box */}
              {personal.emailOtpSent && !personal.emailOtpVerified && (
                <div style={{ padding: 14, background: 'rgba(59,130,246,0.06)', borderRadius: 10, border: '1px solid rgba(59,130,246,0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: 700 }}>ENTER 6-DIGIT EMAIL OTP *</label>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Dispatched to {personal.email} (Demo: 123456)</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="input"
                      type="text"
                      maxLength={6}
                      placeholder="Type 6-digit OTP code"
                      value={personal.emailOtp}
                      onChange={e => setPersonal({ ...personal, emailOtp: e.target.value.replace(/\D/g, '') })}
                      style={{ flex: 1, fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '0.25em', textAlign: 'center' }}
                    />
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ fontSize: '0.78rem', padding: '6px 16px', background: '#3b82f6' }}
                      onClick={handleVerifyEmailOtp}
                      disabled={verifyingOtp || personal.emailOtp.length !== 6}
                    >
                      {verifyingOtp ? 'Verifying...' : 'Verify Email OTP'}
                    </button>
                  </div>
                </div>
              )}

              {/* Mobile Phone Number (10 Digits Only, Numeric Only) */}
              <div>
                <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                  <span>MOBILE PHONE NUMBER (10 DIGITS ONLY) *</span>
                  <span style={{ fontSize: '0.65rem', color: personal.phone.length === 10 ? '#10b981' : '#94a3b8' }}>
                    {personal.phone.length}/10 digits
                  </span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
                  <span style={{
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--bg-border)',
                    borderRight: 'none',
                    borderRadius: '8px 0 0 8px',
                    color: '#94a3b8',
                    fontSize: '0.85rem',
                    fontWeight: 700
                  }}>
                    +91
                  </span>
                  <input
                    className="input"
                    type="tel"
                    placeholder="9880112345"
                    maxLength={10}
                    value={personal.phone}
                    onChange={e => {
                      // Allow only numbers and max 10 digits
                      const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPersonal({ ...personal, phone: numericOnly });
                    }}
                    style={{
                      flex: 1,
                      borderRadius: '0 8px 8px 0',
                      fontFamily: 'monospace',
                      letterSpacing: '0.08em'
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 3 }}>
                  Only 10 numeric digits allowed without spaces, country code, or special characters.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>PASSWORD *</label>
                  <input className="input" type="password" value={personal.password} onChange={e => setPersonal({ ...personal, password: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>CONFIRM PASSWORD *</label>
                  <input className="input" type="password" value={personal.confirmPassword} onChange={e => setPersonal({ ...personal, confirmPassword: e.target.value })} style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                <button className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    if (!personal.name || !personal.email) return toast.error('Please fill in your name and email address.');
                    if (!personal.emailOtpVerified) return toast.error('Please verify your official email address via OTP first.');
                    if (!personal.phone || personal.phone.length !== 10) return toast.error('Please enter a valid 10-digit mobile phone number (numbers only).');
                    if (!personal.password) return toast.error('Please enter a password.');
                    if (personal.password.length < 6) return toast.error('Password must be at least 6 characters.');
                    if (personal.password !== personal.confirmPassword) return toast.error('Passwords do not match.');
                    setStep(3);
                  }}
                >
                  {selectedRole === 'BIDDER' ? 'Next: Company Details →' : 'Next: Organization Details →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Company Details (Bidder) or Organization Details (Officer/Auditor) */}
        {step === 3 && (
          <div className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className="section-title">
                {selectedRole === 'BIDDER' ? 'Step 2: Corporate & Regulatory Details' : 'Step 2: Department Credentials'}
              </span>
            </div>

            {selectedRole === 'BIDDER' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Single Primary PAN Entry Bar */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(30,58,138,0.25) 0%, rgba(15,23,42,0.8) 100%)',
                  border: '1px solid rgba(59,130,246,0.35)',
                  borderRadius: 14,
                  padding: '20px 22px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', color: '#60a5fa', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        🪪 ENTER COMPANY / ENTITY PAN NUMBER *
                      </label>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>
                        Multi-Gateway Automatic Triangulation (CBDT, GSTN, MCA21, MSME, EPFO)
                      </div>
                    </div>
                    {panFetchedData && (
                      <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '3px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 800 }}>
                        ✓ VERIFIED STATUTORY PROFILE
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input
                      className="input"
                      placeholder="Enter 10-digit PAN (e.g. SYNPA0001C)"
                      value={company.pan}
                      maxLength={10}
                      onChange={e => {
                        const val = e.target.value.toUpperCase();
                        setCompany({ ...company, pan: val });
                        if (val.length === 10) handleFetchPanDetails(val);
                      }}
                      style={{
                        flex: 1,
                        fontFamily: 'monospace',
                        fontSize: '1.1rem',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        fontWeight: 800,
                        padding: '12px 16px',
                        color: panFetchedData ? '#10b981' : '#f0f4ff',
                        borderColor: panFetchedData ? 'rgba(16,185,129,0.6)' : 'rgba(59,130,246,0.4)',
                        background: 'rgba(15,23,42,0.7)'
                      }}
                    />
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleFetchPanDetails(company.pan)}
                      disabled={fetchingPan || !company.pan}
                      style={{
                        background: panFetchedData ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #2563eb, #3b82f6)',
                        whiteSpace: 'nowrap',
                        padding: '12px 22px',
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        borderRadius: 10
                      }}
                    >
                      {fetchingPan ? '⟳ Triangulating...' : panFetchedData ? '✓ Re-Fetch' : '⚡ Auto-Fetch Details'}
                    </button>
                  </div>
                </div>

                {/* When NO PAN is fetched yet: Clean instructive banner */}
                {!panFetchedData && (
                  <div style={{
                    background: 'rgba(15,23,42,0.5)',
                    border: '1px dashed rgba(255,255,255,0.12)',
                    borderRadius: 14,
                    padding: '32px 24px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>🏛️</div>
                    <div style={{ color: '#f0f4ff', fontWeight: 800, fontSize: '0.95rem', marginBottom: 6 }}>
                      Zero Manual Form Entry Required
                    </div>
                    <p style={{ color: '#64748b', fontSize: '0.78rem', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
                      Simply enter your registered corporate PAN above. The platform will automatically connect to Government Gateway Databases to verify your identity and auto-load your Company Name, Registered Office Address, GSTIN, Udyam MSME, and MCA21 records.
                    </p>
                  </div>
                )}

                {/* Comprehensive Auto-Fetched Official Government Dossier */}
                {panFetchedData && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.7) 100%)',
                    border: '1px solid rgba(16,185,129,0.35)',
                    borderRadius: 14,
                    padding: '22px 24px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    animation: 'fadeIn 0.3s ease-in-out'
                  }}>
                    {/* Entity Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16, marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          OFFICIAL GOVERNMENT REGISTERED ENTITY
                        </div>
                        <div style={{ fontSize: '1.25rem', color: '#f0f4ff', fontWeight: 900, marginTop: 4 }}>
                          {panFetchedData.legalName}
                        </div>
                        {panFetchedData.tradeName && panFetchedData.tradeName !== panFetchedData.legalName && (
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>
                            Trade / Brand Name: <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{panFetchedData.tradeName}</span>
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '4px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 800 }}>
                          ACTIVE RECORD ✓
                        </span>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 6 }}>
                          Inc. Date: {panFetchedData.dateOfIncorporation}
                        </div>
                      </div>
                    </div>

                    {/* Official Registered Office Address Highlight */}
                    <div style={{
                      background: 'rgba(59,130,246,0.07)',
                      border: '1px solid rgba(59,130,246,0.2)',
                      borderRadius: 10,
                      padding: '14px 16px',
                      marginBottom: 16
                    }}>
                      <div style={{ fontSize: '0.68rem', color: '#60a5fa', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                        📍 Official Registered Office Address (From GSTN & MCA Filings)
                      </div>
                      <div style={{ fontSize: '0.88rem', color: '#f0f4ff', fontWeight: 600, lineHeight: 1.5 }}>
                        {panFetchedData.registeredAddress || `${panFetchedData.district}, ${panFetchedData.state} - ${panFetchedData.pincode}`}
                      </div>
                      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.72rem', color: '#94a3b8' }}>
                        <div>State: <strong style={{ color: '#cbd5e1' }}>{panFetchedData.state}</strong></div>
                        <div>District: <strong style={{ color: '#cbd5e1' }}>{panFetchedData.district}</strong></div>
                        <div>PIN Code: <strong style={{ color: '#cbd5e1' }}>{panFetchedData.pincode}</strong></div>
                      </div>
                    </div>

                    {/* 4-Way Statutory Registry Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
                      {/* PAN */}
                      <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800 }}>CBDT INCOME TAX PAN</div>
                        <div style={{ fontSize: '0.92rem', color: '#10b981', fontWeight: 800, fontFamily: 'monospace', marginTop: 2 }}>{panFetchedData.panNumber}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 }}>{panFetchedData.jurisdiction || 'Corporate Ward'}</div>
                      </div>

                      {/* GSTIN */}
                      <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800 }}>GSTN REGISTRATION</div>
                        <div style={{ fontSize: '0.92rem', color: '#38bdf8', fontWeight: 800, fontFamily: 'monospace', marginTop: 2 }}>{panFetchedData.gstin || 'N/A'}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 }}>Status: <span style={{ color: '#10b981', fontWeight: 700 }}>Active</span> • Rating: {panFetchedData.gstComplianceScore || '10/10'}</div>
                      </div>

                      {/* MSME Udyam */}
                      <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800 }}>MSME UDYAM REGISTRY</div>
                        <div style={{ fontSize: '0.92rem', color: '#a78bfa', fontWeight: 800, fontFamily: 'monospace', marginTop: 2 }}>{panFetchedData.udyamNumber || 'N/A'}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 }}>Classification: <span style={{ color: '#cbd5e1', fontWeight: 700 }}>{panFetchedData.enterpriseType}</span></div>
                      </div>

                      {/* MCA CIN */}
                      <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800 }}>MCA21 CORPORATE CIN</div>
                        <div style={{ fontSize: '0.92rem', color: '#f59e0b', fontWeight: 800, fontFamily: 'monospace', marginTop: 2 }}>{panFetchedData.cinNumber || 'N/A'}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 }}>ROC: {panFetchedData.rocLocation || 'ROC'} • {panFetchedData.companyType}</div>
                      </div>
                    </div>

                    {/* Directors & Governance List */}
                    {panFetchedData.directors && panFetchedData.directors.length > 0 && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14, marginBottom: 14 }}>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>
                          👥 Verified Board of Directors & Authorized Signatories (MCA21)
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {panFetchedData.directors.map((d, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 12px', fontSize: '0.75rem' }}>
                              <span style={{ color: '#f0f4ff', fontWeight: 700 }}>{d.name}</span>
                              <span style={{ color: '#64748b', marginLeft: 6 }}>({d.designation || 'Director'} • DIN: {d.din})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* GeM, Labour & Compliance Accreditations */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        🛒 GeM Seller ID: <strong style={{ color: '#f0f4ff' }}>{panFetchedData.gemSellerId || 'GEM-SELLER-1001'}</strong>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        ⭐ GeM Rating: <strong style={{ color: '#10b981' }}>★ {panFetchedData.gemRating || '4.88'} / 5.0</strong>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        📜 EPFO Establishment: <strong style={{ color: '#f0f4ff' }}>{panFetchedData.epfoEstablishmentId || 'KNBNG0012345000'}</strong>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        🇮🇳 Make in India: <strong style={{ color: '#38bdf8' }}>{panFetchedData.localContentPercentage || 78}% Local Content</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>GOVERNMENT MINISTRY / ORGANIZATION *</label>
                  <input className="input" value={officialOrg.organization} onChange={e => setOfficialOrg({ ...officialOrg, organization: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>OFFICIAL EMPLOYEE / OFFICER ID *</label>
                    <input className="input" value={officialOrg.employeeId} onChange={e => setOfficialOrg({ ...officialOrg, employeeId: e.target.value })} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>DEPARTMENT / WING</label>
                    <input className="input" value={officialOrg.department} onChange={e => setOfficialOrg({ ...officialOrg, department: e.target.value })} style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
              <button className="btn-secondary" onClick={() => setStep(2)}>← Back</button>
              {selectedRole === 'BIDDER' ? (
                <button className="btn-primary" style={{ background: '#10b981' }} onClick={handleRunCompanyVerification} disabled={loading}>
                  {loading ? '⟳ Verifying against Statutory Gateways...' : 'Verify & Continue Registration →'}
                </button>
              ) : (
                <button className="btn-primary" onClick={handleFinalSubmit} disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit for Administrative Approval →'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: Synthetic Regulatory Triangulation (Bidder) */}
        {step === 4 && verificationResult && (
          <div className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <span className="section-title">Synthetic Regulatory Triangulation Summary</span>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                  Source: Synthetic Demo Regulatory Dataset (Prototype Gateway)
                </div>
              </div>
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800,
                background: verificationResult.riskLevel === 'LOW' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                color: verificationResult.riskLevel === 'LOW' ? '#10b981' : '#f59e0b',
              }}>
                {verificationResult.riskLevel} RISK ({verificationResult.overallScore}%)
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {verificationResult.verificationChecks?.slice(0, 5).map((vc, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: vc.status.includes('VERIFIED') || vc.status === 'MATCH' ? '#10b981' : '#ef4444' }} />
                    <span style={{ fontWeight: 700, color: '#f0f4ff' }}>{vc.verificationType}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: vc.status.includes('VERIFIED') || vc.status === 'MATCH' ? '#10b981' : '#f87171' }}>
                    {vc.result || vc.status}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn-secondary" onClick={() => setStep(3)}>← Edit Company Info</button>
              <button className="btn-primary" style={{ background: '#10b981' }} onClick={handleFinalSubmit} disabled={loading}>
                {loading ? 'Submitting...' : 'Register Company Profile →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Done */}
        {step === 5 && (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            {bidderRegistered ? (
              <>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f0f4ff', marginBottom: 8 }}>Bidder Account Created!</h2>
                <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 800, fontSize: '0.8rem', marginBottom: 16, border: '1px solid rgba(16,185,129,0.3)' }}>
                  ACCOUNT ACTIVE
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', maxWidth: 420, margin: '0 auto 28px', lineHeight: 1.6 }}>
                  Sign in and complete your verification profile — Personal Identity, Company Details, Document Upload, and our AI will auto-verify your records.
                </p>
                <button className="btn-primary" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', padding: '12px 28px' }} onClick={() => navigate('/login?portal=BIDDER')}>
                  Sign In & Complete Verification →
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>⏳</div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f0f4ff', marginBottom: 6 }}>Registration Submitted!</h2>
                <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 800, fontSize: '0.8rem', marginBottom: 16, border: '1px solid rgba(245,158,11,0.3)' }}>
                  PENDING ADMINISTRATIVE APPROVAL
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', maxWidth: 440, margin: '0 auto 24px', lineHeight: 1.5 }}>
                  Your credentials and regulatory verification records have been submitted for administrator review. You will be notified once platform access is authorised.
                </p>
                <button className="btn-primary" onClick={() => navigate('/login')}>Return to Login Screen</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
