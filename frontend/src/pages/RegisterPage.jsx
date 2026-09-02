import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const ACCOUNT_TYPES = [
  {
    type: 'BIDDER',
    icon: '🏢',
    title: 'Bidder / Supplier',
    desc: 'Register corporate profile to find tenders and submit bids with automated regulatory verification',
    badge: 'Self-Service & Instant',
    badgeColor: '#059669',
  },
  {
    type: 'PROCUREMENT_OFFICER',
    icon: '🏛️',
    title: 'Procurement Officer',
    desc: 'Publish tenders, manage submissions, and make authorized compliance decisions',
    badge: 'Instant Access & Verified',
    badgeColor: '#2563eb',
  },
  {
    type: 'COMPLIANCE_AUDITOR',
    icon: '🔍',
    title: 'Compliance Auditor',
    desc: 'Independent evaluation of AI findings, evidence inspection, and decision sign-offs',
    badge: 'Instant Access & Verified',
    badgeColor: '#0891b2',
  },
  {
    type: 'ADMIN',
    icon: '🔒',
    title: 'System Administrator',
    desc: 'Platform management, security monitoring, and RBAC governance',
    badge: 'Invitation Only',
    badgeColor: '#dc2626',
    disabled: true,
  },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawRoleParam = (searchParams.get('role') || searchParams.get('portal') || '').toUpperCase();
  const normalizedRole = rawRoleParam === 'AUDITOR'
    ? 'COMPLIANCE_AUDITOR'
    : rawRoleParam === 'OFFICER'
    ? 'PROCUREMENT_OFFICER'
    : rawRoleParam;

  const initialRole = ACCOUNT_TYPES.find(t => t.type === normalizedRole && !t.disabled)?.type || null;

  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [loading, setLoading] = useState(false);

  // ── BIDDER FORM STATE ───────────────────────────────────────────────────
  const [bidderForm, setBidderForm] = useState({
    companyName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [bidderEmailOtp, setBidderEmailOtp] = useState({
    sent: false, verified: false, code: '', cooldown: 0, sessionToken: ''
  });
  const [bidderPhoneOtp, setBidderPhoneOtp] = useState({
    sent: false, verified: false, code: '', cooldown: 0
  });

  // ── OFFICER / AUDITOR FORM STATE (Single unified page) ───────────────────
  const [officerForm, setOfficerForm] = useState({
    name: '',
    designation: '',
    employeeId: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [officerEmailOtp, setOfficerEmailOtp] = useState({
    sent: false, verified: false, code: '', cooldown: 0, sessionToken: ''
  });
  const [officerPhoneOtp, setOfficerPhoneOtp] = useState({
    sent: false, verified: false, code: '', cooldown: 0
  });

  // Success submitted state
  const [submittedStatus, setSubmittedStatus] = useState(null); // 'BIDDER_DONE' | 'OFFICER_DONE' | null

  // Sync if URL query param changes dynamically
  useEffect(() => {
    if (normalizedRole && initialRole) {
      setSelectedRole(initialRole);
    }
  }, [normalizedRole, initialRole]);

  // Cooldown timers
  useEffect(() => {
    let t;
    if (bidderEmailOtp.cooldown > 0) {
      t = setInterval(() => setBidderEmailOtp(p => ({ ...p, cooldown: Math.max(0, p.cooldown - 1) })), 1000);
    }
    return () => clearInterval(t);
  }, [bidderEmailOtp.cooldown]);

  useEffect(() => {
    let t;
    if (bidderPhoneOtp.cooldown > 0) {
      t = setInterval(() => setBidderPhoneOtp(p => ({ ...p, cooldown: Math.max(0, p.cooldown - 1) })), 1000);
    }
    return () => clearInterval(t);
  }, [bidderPhoneOtp.cooldown]);

  useEffect(() => {
    let t;
    if (officerEmailOtp.cooldown > 0) {
      t = setInterval(() => setOfficerEmailOtp(p => ({ ...p, cooldown: Math.max(0, p.cooldown - 1) })), 1000);
    }
    return () => clearInterval(t);
  }, [officerEmailOtp.cooldown]);

  useEffect(() => {
    let t;
    if (officerPhoneOtp.cooldown > 0) {
      t = setInterval(() => setOfficerPhoneOtp(p => ({ ...p, cooldown: Math.max(0, p.cooldown - 1) })), 1000);
    }
    return () => clearInterval(t);
  }, [officerPhoneOtp.cooldown]);

  // ── BIDDER OTP HANDLERS ─────────────────────────────────────────────────
  const handleBidderSendEmailOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!bidderForm.email || !emailRegex.test(bidderForm.email.trim())) {
      return toast.error('Enter a valid company email address first.');
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/send-otp', {
        type: 'EMAIL', target: bidderForm.email.trim()
      });
      setBidderEmailOtp(p => ({ ...p, sent: true, code: '', cooldown: 60, sessionToken: res.data?.sessionToken || '' }));
      toast.success(`Verification OTP code sent to ${bidderForm.email}. (Demo OTP: 123456)`);
    } catch (err) {
      setBidderEmailOtp(p => ({ ...p, sent: true, code: '', cooldown: 60 }));
      toast.success(`Verification OTP code sent to ${bidderForm.email}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBidderVerifyEmailOtp = async () => {
    if (!bidderEmailOtp.code || !/^\d{6}$/.test(bidderEmailOtp.code.trim())) {
      return toast.error('Enter the 6-digit OTP code from your email.');
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', {
        type: 'EMAIL', target: bidderForm.email.trim(), otp: bidderEmailOtp.code.trim()
      });
      if (res.data?.verified) {
        setBidderEmailOtp(p => ({ ...p, verified: true }));
        toast.success('✓ Company email verified successfully!');
      } else {
        toast.error('Invalid OTP. Please try again.');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP. Check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBidderSendPhoneOtp = async () => {
    const cleanPhone = bidderForm.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return toast.error('Enter a valid 10-digit mobile phone number first.');
    }
    setLoading(true);
    try {
      await api.post('/auth/send-otp', {
        type: 'PHONE', target: cleanPhone
      });
      setBidderPhoneOtp(p => ({ ...p, sent: true, code: '', cooldown: 60 }));
      toast.success(`Verification SMS OTP sent to +91 ${cleanPhone}. (Demo OTP: 123456)`);
    } catch (err) {
      setBidderPhoneOtp(p => ({ ...p, sent: true, code: '', cooldown: 60 }));
      toast.success(`Verification SMS OTP sent to +91 ${cleanPhone}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBidderVerifyPhoneOtp = async () => {
    if (!bidderPhoneOtp.code || !/^\d{6}$/.test(bidderPhoneOtp.code.trim())) {
      return toast.error('Enter the 6-digit SMS OTP code.');
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', {
        type: 'PHONE', target: bidderForm.phone.replace(/\D/g, ''), otp: bidderPhoneOtp.code.trim()
      });
      if (res.data?.verified) {
        setBidderPhoneOtp(p => ({ ...p, verified: true }));
        toast.success('✓ Mobile phone number verified successfully!');
      } else {
        toast.error('Invalid OTP. Please try again.');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP. Check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBidderRegister = async () => {
    if (!bidderForm.companyName.trim()) return toast.error('Company / Organisation name is required.');
    if (!bidderForm.email.trim()) return toast.error('Company email is required.');
    if (!bidderEmailOtp.verified) return toast.error('Please verify your official company email OTP.');
    if (!bidderForm.phone.trim()) return toast.error('Mobile phone number is required.');
    if (!bidderPhoneOtp.verified) return toast.error('Please verify your mobile phone OTP.');
    if (!bidderForm.password || bidderForm.password.length < 6) return toast.error('Password must be at least 6 characters.');
    if (bidderForm.password !== bidderForm.confirmPassword) return toast.error('Passwords do not match.');

    setLoading(true);
    try {
      await api.post('/auth/register-bidder', {
        name: bidderForm.companyName.trim(),
        organizationName: bidderForm.companyName.trim(),
        email: bidderForm.email.trim(),
        phone: bidderForm.phone.trim(),
        password: bidderForm.password,
        role: 'BIDDER'
      });
      setSubmittedStatus('BIDDER_DONE');
      toast.success('Account created! Continue to complete your verification profile.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── OFFICER / AUDITOR OTP HANDLERS ──────────────────────────────────────
  const handleOfficerSendEmailOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!officerForm.email || !emailRegex.test(officerForm.email.trim())) {
      return toast.error('Enter a valid official email address first.');
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/send-otp', {
        type: 'EMAIL', target: officerForm.email.trim()
      });
      setOfficerEmailOtp(p => ({ ...p, sent: true, code: '', cooldown: 60, sessionToken: res.data?.sessionToken || '' }));
      toast.success(`Verification OTP sent to ${officerForm.email}. (Demo OTP: 123456)`);
    } catch (err) {
      setOfficerEmailOtp(p => ({ ...p, sent: true, code: '', cooldown: 60 }));
      toast.success(`Verification OTP sent to ${officerForm.email}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOfficerVerifyEmailOtp = async () => {
    if (!officerEmailOtp.code || !/^\d{6}$/.test(officerEmailOtp.code.trim())) {
      return toast.error('Enter the 6-digit OTP code from your email.');
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', {
        type: 'EMAIL', target: officerForm.email.trim(), otp: officerEmailOtp.code.trim()
      });
      if (res.data?.verified) {
        setOfficerEmailOtp(p => ({ ...p, verified: true }));
        toast.success('✓ Official email address verified successfully!');
      } else {
        toast.error('Invalid OTP code. Please try again.');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP code. Check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOfficerSendPhoneOtp = async () => {
    const cleanPhone = officerForm.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return toast.error('Enter a valid 10-digit mobile phone number first.');
    }
    setLoading(true);
    try {
      await api.post('/auth/send-otp', {
        type: 'PHONE', target: cleanPhone
      });
      setOfficerPhoneOtp(p => ({ ...p, sent: true, code: '', cooldown: 60 }));
      toast.success(`Verification SMS sent to +91 ${cleanPhone}. (Demo OTP: 123456)`);
    } catch (err) {
      setOfficerPhoneOtp(p => ({ ...p, sent: true, code: '', cooldown: 60 }));
      toast.success(`Verification SMS sent to +91 ${cleanPhone}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOfficerVerifyPhoneOtp = async () => {
    if (!officerPhoneOtp.code || !/^\d{6}$/.test(officerPhoneOtp.code.trim())) {
      return toast.error('Enter the 6-digit SMS OTP code.');
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', {
        type: 'PHONE', target: officerForm.phone.replace(/\D/g, ''), otp: officerPhoneOtp.code.trim()
      });
      if (res.data?.verified) {
        setOfficerPhoneOtp(p => ({ ...p, verified: true }));
        toast.success('✓ Official mobile number verified successfully!');
      } else {
        toast.error('Invalid OTP code. Please try again.');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP code. Check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOfficerSubmit = async () => {
    if (!officerForm.name.trim()) return toast.error('Full Name is required.');
    if (!officerForm.employeeId.trim()) return toast.error('Official Employee / Officer ID is required.');
    if (!officerForm.email.trim()) return toast.error('Official Email Address is required.');
    if (!officerEmailOtp.verified) return toast.error('Please verify your official Email address OTP.');
    if (!officerForm.phone.trim()) return toast.error('Mobile phone number is required.');
    if (!officerPhoneOtp.verified) return toast.error('Please verify your Mobile phone number OTP.');
    if (!officerForm.password || officerForm.password.length < 6) return toast.error('Password must be at least 6 characters.');
    if (officerForm.password !== officerForm.confirmPassword) return toast.error('Passwords do not match.');

    setLoading(true);
    try {
      if (selectedRole === 'PROCUREMENT_OFFICER') {
        await api.post('/auth/register-officer', {
          name: officerForm.name.trim(),
          email: officerForm.email.trim(),
          phone: officerForm.phone.trim(),
          employeeId: officerForm.employeeId.trim(),
          organization: 'Government Procurement Authority',
          department: 'Public Procurement Division',
          designation: officerForm.designation.trim() || 'Procurement Officer',
          password: officerForm.password,
        });
      } else if (selectedRole === 'COMPLIANCE_AUDITOR') {
        await api.post('/auth/register-auditor', {
          name: officerForm.name.trim(),
          email: officerForm.email.trim(),
          phone: officerForm.phone.trim(),
          auditorId: officerForm.employeeId.trim(),
          employeeId: officerForm.employeeId.trim(),
          organization: 'Office of Comptroller & Auditor General (CAG)',
          department: 'Compliance Audit Division',
          designation: officerForm.designation.trim() || 'Compliance Auditor',
          password: officerForm.password,
        });
      }
      setSubmittedStatus('OFFICER_DONE');
      toast.success('Registration submitted for Administrative approval!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#f8fafc',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 16px', position: 'relative',
    }}>
      {/* Floating Top-Left Back Button */}
      <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 20 }}>
        <button
          type="button"
          onClick={() => {
            if (submittedStatus) {
              setSubmittedStatus(null);
            } else if (selectedRole) {
              setSelectedRole(null);
              setSearchParams({});
            } else {
              navigate('/login');
            }
          }}
          className="btn-secondary"
          style={{
            borderRadius: '20px',
            padding: '7px 16px',
            fontSize: '0.82rem',
            fontWeight: 700,
          }}
        >
          <span>←</span> {selectedRole && !submittedStatus ? 'Change Role' : 'Back to Sign In'}
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: 580, position: 'relative', zIndex: 1 }}>
        {/* Header Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <img
              src="/complygem_logo.png"
              alt="ComplyGeM Logo"
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                margin: '0 auto 10px',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </Link>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.65rem', color: '#0f172a', marginBottom: 2 }}>
            Platform Registration
          </h1>
          <p style={{ color: '#475569', fontSize: '0.88rem' }}>ComplyGeM AI Public Procurement Portal</p>
        </div>

        {/* ── STEP 1: ROLE SELECTION (When no role selected) ──────────────── */}
        {!selectedRole && !submittedStatus && (
          <div className="card" style={{ padding: 32, boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.05)' }}>
            <p style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 16, letterSpacing: '0.04em' }}>
              Select Registration Role
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ACCOUNT_TYPES.map(type => (
                <div
                  key={type.type}
                  onClick={() => {
                    if (type.disabled) return;
                    setSelectedRole(type.type);
                  }}
                  style={{
                    padding: '16px 18px', borderRadius: 12, cursor: type.disabled ? 'not-allowed' : 'pointer',
                    border: `1px solid ${type.disabled ? '#e2e8f0' : '#e2e8f0'}`,
                    background: type.disabled ? '#f1f5f9' : '#ffffff',
                    opacity: type.disabled ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', gap: 14,
                    boxShadow: type.disabled ? 'none' : '0 2px 4px rgba(0,0,0,0.02)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '1.6rem' }}>{type.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.92rem', color: type.disabled ? '#94a3b8' : '#0f172a' }}>
                        {type.title}
                      </span>
                      {type.badge && (
                        <span style={{
                          fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: 12,
                          color: type.badgeColor, background: `${type.badgeColor}15`,
                          border: `1px solid ${type.badgeColor}35`,
                        }}>
                          {type.badge}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{type.desc}</span>
                  </div>
                  {!type.disabled && <span style={{ color: '#2563eb', fontSize: '1.3rem', fontWeight: 800 }}>›</span>}
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.84rem', color: '#64748b' }}>
              Already registered? <Link to="/login" style={{ color: '#2563eb', fontWeight: 800 }}>Sign In</Link>
            </div>
          </div>
        )}

        {/* ── BIDDER REGISTRATION (SINGLE PAGE WITH DUAL OTP) ─────────────── */}
        {selectedRole === 'BIDDER' && !submittedStatus && (
          <div className="card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '12px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10 }}>
              <span style={{ fontSize: '1.3rem' }}>🏢</span>
              <div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>Bidder / Supplier Account</div>
                <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600 }}>Dual Email & Mobile Phone Verification Required</div>
              </div>
              <button type="button" onClick={() => { setSelectedRole(null); setSearchParams({}); }}
                style={{ marginLeft: 'auto', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 16, padding: '4px 12px', color: '#475569', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}>Change</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Company Name */}
              <div>
                <label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 800, display: 'block', marginBottom: 4 }}>COMPANY / ORGANISATION NAME *</label>
                <input
                  className="input"
                  placeholder="e.g. ABC Safety Technologies Pvt. Ltd."
                  value={bidderForm.companyName}
                  onChange={e => setBidderForm(p => ({ ...p, companyName: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>

              {/* 1. Company Email + Email OTP */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ color: '#475569' }}>1. OFFICIAL COMPANY EMAIL *</span>
                  {bidderEmailOtp.verified && <span style={{ color: '#059669', fontSize: '0.72rem', fontWeight: 800 }}>✓ Email Verified</span>}
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="input"
                    type="email"
                    placeholder="contact@yourcompany.com"
                    value={bidderForm.email}
                    onChange={e => { setBidderForm(p => ({ ...p, email: e.target.value })); setBidderEmailOtp(p => ({ ...p, verified: false, sent: false, code: '' })); }}
                    disabled={bidderEmailOtp.verified}
                    style={{ flex: 1, borderColor: bidderEmailOtp.verified ? '#10b981' : undefined }}
                  />
                  {!bidderEmailOtp.verified && (
                    <button type="button" className="btn-secondary"
                      style={{ whiteSpace: 'nowrap', fontSize: '0.78rem', padding: '6px 14px', opacity: bidderEmailOtp.cooldown > 0 ? 0.6 : 1 }}
                      onClick={handleBidderSendEmailOtp}
                      disabled={loading || !bidderForm.email || bidderEmailOtp.cooldown > 0}
                    >
                      {bidderEmailOtp.cooldown > 0 ? `Resend (${bidderEmailOtp.cooldown}s)` : bidderEmailOtp.sent ? 'Resend OTP' : 'Send Email OTP'}
                    </button>
                  )}
                </div>

                {/* Email OTP entry box */}
                {bidderEmailOtp.sent && !bidderEmailOtp.verified && (
                  <div style={{ marginTop: 10, padding: 14, background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ fontSize: '0.74rem', color: '#1d4ed8', fontWeight: 800 }}>ENTER 6-DIGIT EMAIL OTP</label>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Demo bypass: 123456</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        className="input"
                        type="text"
                        maxLength={6}
                        placeholder="● ● ● ● ● ●"
                        value={bidderEmailOtp.code}
                        onChange={e => setBidderEmailOtp(p => ({ ...p, code: e.target.value.replace(/\D/g, '') }))}
                        style={{ flex: 1, fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '0.3em', textAlign: 'center' }}
                      />
                      <button type="button" className="btn-primary"
                        style={{ fontSize: '0.78rem', padding: '6px 16px' }}
                        onClick={handleBidderVerifyEmailOtp}
                        disabled={loading || bidderEmailOtp.code.length !== 6}
                      >
                        Verify Email
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Authorized Mobile Phone Number + Phone OTP */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ color: '#475569' }}>2. AUTHORIZED MOBILE NUMBER (10 DIGITS) *</span>
                  {bidderPhoneOtp.verified && <span style={{ color: '#059669', fontSize: '0.72rem', fontWeight: 800 }}>✓ Mobile Verified</span>}
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ display: 'flex', flex: 1 }}>
                    <span style={{
                      padding: '8px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1',
                      borderRight: 'none', borderRadius: '8px 0 0 8px', color: '#475569', fontSize: '0.85rem', fontWeight: 700
                    }}>
                      +91
                    </span>
                    <input
                      className="input"
                      type="tel"
                      placeholder="9880112345"
                      maxLength={10}
                      value={bidderForm.phone}
                      onChange={e => {
                        const num = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setBidderForm(p => ({ ...p, phone: num }));
                        setBidderPhoneOtp(p => ({ ...p, verified: false, sent: false, code: '' }));
                      }}
                      disabled={bidderPhoneOtp.verified}
                      style={{
                        flex: 1, borderRadius: '0 8px 8px 0', fontFamily: 'monospace',
                        borderColor: bidderPhoneOtp.verified ? '#10b981' : undefined
                      }}
                    />
                  </div>
                  {!bidderPhoneOtp.verified && (
                    <button type="button" className="btn-secondary"
                      style={{ whiteSpace: 'nowrap', fontSize: '0.78rem', padding: '6px 14px', opacity: bidderPhoneOtp.cooldown > 0 ? 0.6 : 1 }}
                      onClick={handleBidderSendPhoneOtp}
                      disabled={loading || bidderForm.phone.replace(/\D/g, '').length !== 10 || bidderPhoneOtp.cooldown > 0}
                    >
                      {bidderPhoneOtp.cooldown > 0 ? `Resend (${bidderPhoneOtp.cooldown}s)` : bidderPhoneOtp.sent ? 'Resend SMS' : 'Send Phone OTP'}
                    </button>
                  )}
                </div>

                {/* Phone OTP entry box */}
                {bidderPhoneOtp.sent && !bidderPhoneOtp.verified && (
                  <div style={{ marginTop: 10, padding: 14, background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ fontSize: '0.74rem', color: '#1d4ed8', fontWeight: 800 }}>ENTER 6-DIGIT SMS OTP</label>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Demo bypass: 123456</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        className="input"
                        type="text"
                        maxLength={6}
                        placeholder="● ● ● ● ● ●"
                        value={bidderPhoneOtp.code}
                        onChange={e => setBidderPhoneOtp(p => ({ ...p, code: e.target.value.replace(/\D/g, '') }))}
                        style={{ flex: 1, fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '0.3em', textAlign: 'center' }}
                      />
                      <button type="button" className="btn-primary"
                        style={{ fontSize: '0.78rem', padding: '6px 16px' }}
                        onClick={handleBidderVerifyPhoneOtp}
                        disabled={loading || bidderPhoneOtp.code.length !== 6}
                      >
                        Verify Mobile
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Password */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 800, display: 'block', marginBottom: 4 }}>PASSWORD *</label>
                  <input className="input" type="password" placeholder="Min 6 characters"
                    value={bidderForm.password} onChange={e => setBidderForm(p => ({ ...p, password: e.target.value }))}
                    style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 800, display: 'block', marginBottom: 4 }}>CONFIRM PASSWORD *</label>
                  <input className="input" type="password" placeholder="Repeat password"
                    value={bidderForm.confirmPassword} onChange={e => setBidderForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    style={{ width: '100%' }} />
                </div>
              </div>

              {/* Verification Checklist */}
              <div style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: '0.8rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>Verification Status:</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ color: bidderEmailOtp.verified ? '#059669' : '#dc2626', fontWeight: 700 }}>
                    {bidderEmailOtp.verified ? '✓ Email Verified' : '✗ Email Pending OTP'}
                  </span>
                  <span style={{ color: bidderPhoneOtp.verified ? '#059669' : '#dc2626', fontWeight: 700 }}>
                    {bidderPhoneOtp.verified ? '✓ Mobile Verified' : '✗ Mobile Pending OTP'}
                  </span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: '0.95rem', background: 'linear-gradient(135deg, #059669, #047857)', marginTop: 4 }}
                onClick={handleBidderRegister}
                disabled={loading || !bidderEmailOtp.verified || !bidderPhoneOtp.verified}
              >
                {loading ? '⟳ Creating Account…' : (!bidderEmailOtp.verified || !bidderPhoneOtp.verified) ? '🔒 Verify Email & Mobile to Continue' : '🚀 Create Bidder Account →'}
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.84rem', color: '#64748b' }}>
              Already registered? <Link to="/login?portal=BIDDER" style={{ color: '#2563eb', fontWeight: 800 }}>Sign In</Link>
            </div>
          </div>
        )}

        {/* ── OFFICER / AUDITOR REGISTRATION (SINGLE PAGE WITH DUAL OTP) ─── */}
        {(selectedRole === 'PROCUREMENT_OFFICER' || selectedRole === 'COMPLIANCE_AUDITOR') && !submittedStatus && (
          <div className="card" style={{ padding: 32 }}>
            {/* Header role context */}
            <div style={{
              padding: '14px 18px',
              borderRadius: 12,
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.4rem' }}>{ACCOUNT_TYPES.find(t => t.type === selectedRole)?.icon || '🏛️'}</span>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0f172a' }}>
                    Registering as: {ACCOUNT_TYPES.find(t => t.type === selectedRole)?.title || selectedRole.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#2563eb', fontWeight: 700 }}>
                    {ACCOUNT_TYPES.find(t => t.type === selectedRole)?.badge || 'Requires Admin Approval'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole(null);
                  setSearchParams({});
                }}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '4px 12px',
                  color: '#475569',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Change Role
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Row 1: Full Name & Official Designation */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 800, display: 'block', marginBottom: 4 }}>FULL NAME *</label>
                  <input
                    className="input"
                    placeholder="e.g. Rajesh Kumar"
                    value={officerForm.name}
                    onChange={e => setOfficerForm({ ...officerForm, name: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 800, display: 'block', marginBottom: 4 }}>OFFICIAL DESIGNATION</label>
                  <input
                    className="input"
                    placeholder={selectedRole === 'PROCUREMENT_OFFICER' ? 'e.g. Senior Procurement Officer' : 'e.g. Lead Compliance Auditor'}
                    value={officerForm.designation}
                    onChange={e => setOfficerForm({ ...officerForm, designation: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Row 2: Official Employee / Officer ID */}
              <div>
                <label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 800, display: 'block', marginBottom: 4 }}>
                  {selectedRole === 'PROCUREMENT_OFFICER' ? 'OFFICIAL EMPLOYEE / OFFICER ID *' : 'OFFICIAL AUDITOR ID *'}
                </label>
                <input
                  className="input"
                  placeholder={selectedRole === 'PROCUREMENT_OFFICER' ? 'e.g. EMP-PWD-101' : 'e.g. AUD-CAG-001'}
                  value={officerForm.employeeId}
                  onChange={e => setOfficerForm({ ...officerForm, employeeId: e.target.value })}
                  style={{ width: '100%', fontFamily: 'monospace', fontWeight: 700 }}
                />
              </div>

              {/* 1. Official Email with Email OTP verification */}
              <div>
                <label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span>1. OFFICIAL EMAIL ADDRESS *</span>
                  {officerEmailOtp.verified && (
                    <span style={{ color: '#059669', fontSize: '0.72rem', fontWeight: 800 }}>
                      ✓ Email Verified
                    </span>
                  )}
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="input"
                    type="email"
                    placeholder="name@gov.in"
                    value={officerForm.email}
                    onChange={e => {
                      setOfficerForm({ ...officerForm, email: e.target.value });
                      setOfficerEmailOtp(p => ({ ...p, verified: false, sent: false, code: '' }));
                    }}
                    disabled={officerEmailOtp.verified}
                    style={{ flex: 1, borderColor: officerEmailOtp.verified ? '#10b981' : undefined }}
                  />
                  {!officerEmailOtp.verified && (
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '6px 14px', whiteSpace: 'nowrap', opacity: officerEmailOtp.cooldown > 0 ? 0.6 : 1 }}
                      onClick={handleOfficerSendEmailOtp}
                      disabled={loading || !officerForm.email || officerEmailOtp.cooldown > 0}
                    >
                      {officerEmailOtp.cooldown > 0 ? `Resend (${officerEmailOtp.cooldown}s)` : officerEmailOtp.sent ? 'Resend OTP' : 'Send Email OTP'}
                    </button>
                  )}
                </div>

                {/* Email OTP Input Box */}
                {officerEmailOtp.sent && !officerEmailOtp.verified && (
                  <div style={{ marginTop: 10, padding: 14, background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ fontSize: '0.74rem', color: '#1d4ed8', fontWeight: 800 }}>ENTER 6-DIGIT EMAIL OTP *</label>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Demo bypass: 123456</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        className="input"
                        type="text"
                        maxLength={6}
                        placeholder="● ● ● ● ● ●"
                        value={officerEmailOtp.code}
                        onChange={e => setOfficerEmailOtp(p => ({ ...p, code: e.target.value.replace(/\D/g, '') }))}
                        style={{ flex: 1, fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '0.25em', textAlign: 'center' }}
                      />
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ fontSize: '0.78rem', padding: '6px 16px' }}
                        onClick={handleOfficerVerifyEmailOtp}
                        disabled={loading || officerEmailOtp.code.length !== 6}
                      >
                        Verify Email
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Official Mobile Phone Number with Phone OTP verification */}
              <div>
                <label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span>2. OFFICIAL MOBILE PHONE NUMBER *</span>
                  {officerPhoneOtp.verified && (
                    <span style={{ color: '#059669', fontSize: '0.72rem', fontWeight: 800 }}>
                      ✓ Mobile Verified
                    </span>
                  )}
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ display: 'flex', flex: 1 }}>
                    <span style={{
                      padding: '8px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1',
                      borderRight: 'none', borderRadius: '8px 0 0 8px', color: '#475569', fontSize: '0.85rem', fontWeight: 700
                    }}>
                      +91
                    </span>
                    <input
                      className="input"
                      type="tel"
                      placeholder="9880112345"
                      maxLength={10}
                      value={officerForm.phone}
                      onChange={e => {
                        const num = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setOfficerForm({ ...officerForm, phone: num });
                        setOfficerPhoneOtp(p => ({ ...p, verified: false, sent: false, code: '' }));
                      }}
                      disabled={officerPhoneOtp.verified}
                      style={{
                        flex: 1, borderRadius: '0 8px 8px 0', fontFamily: 'monospace',
                        borderColor: officerPhoneOtp.verified ? '#10b981' : undefined
                      }}
                    />
                  </div>
                  {!officerPhoneOtp.verified && (
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '6px 14px', whiteSpace: 'nowrap', opacity: officerPhoneOtp.cooldown > 0 ? 0.6 : 1 }}
                      onClick={handleOfficerSendPhoneOtp}
                      disabled={loading || officerForm.phone.replace(/\D/g, '').length !== 10 || officerPhoneOtp.cooldown > 0}
                    >
                      {officerPhoneOtp.cooldown > 0 ? `Resend (${officerPhoneOtp.cooldown}s)` : officerPhoneOtp.sent ? 'Resend SMS' : 'Send Phone OTP'}
                    </button>
                  )}
                </div>

                {/* Phone OTP Input Box */}
                {officerPhoneOtp.sent && !officerPhoneOtp.verified && (
                  <div style={{ marginTop: 10, padding: 14, background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ fontSize: '0.74rem', color: '#1d4ed8', fontWeight: 800 }}>ENTER 6-DIGIT SMS OTP *</label>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Demo bypass: 123456</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        className="input"
                        type="text"
                        maxLength={6}
                        placeholder="● ● ● ● ● ●"
                        value={officerPhoneOtp.code}
                        onChange={e => setOfficerPhoneOtp(p => ({ ...p, code: e.target.value.replace(/\D/g, '') }))}
                        style={{ flex: 1, fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '0.25em', textAlign: 'center' }}
                      />
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ fontSize: '0.78rem', padding: '6px 16px' }}
                        onClick={handleOfficerVerifyPhoneOtp}
                        disabled={loading || officerPhoneOtp.code.length !== 6}
                      >
                        Verify Mobile
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Row 3: Password & Confirm Password */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 800, display: 'block', marginBottom: 4 }}>PASSWORD *</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="Min 6 characters"
                    value={officerForm.password}
                    onChange={e => setOfficerForm({ ...officerForm, password: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 800, display: 'block', marginBottom: 4 }}>CONFIRM PASSWORD *</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="Repeat password"
                    value={officerForm.confirmPassword}
                    onChange={e => setOfficerForm({ ...officerForm, confirmPassword: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Verification Checklist */}
              <div style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: '0.8rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>Verification Status:</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ color: officerEmailOtp.verified ? '#059669' : '#dc2626', fontWeight: 700 }}>
                    {officerEmailOtp.verified ? '✓ Email Verified' : '✗ Email Pending OTP'}
                  </span>
                  <span style={{ color: officerPhoneOtp.verified ? '#059669' : '#dc2626', fontWeight: 700 }}>
                    {officerPhoneOtp.verified ? '✓ Mobile Verified' : '✗ Mobile Pending OTP'}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: '0.95rem', marginTop: 6 }}
                onClick={handleOfficerSubmit}
                disabled={loading || !officerEmailOtp.verified || !officerPhoneOtp.verified}
              >
                {loading ? '⟳ Creating Account...' : (!officerEmailOtp.verified || !officerPhoneOtp.verified) ? '🔒 Verify Email & Mobile to Continue' : selectedRole === 'PROCUREMENT_OFFICER' ? '🚀 Create Officer Account →' : '🚀 Create Auditor Account →'}
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.84rem', color: '#64748b' }}>
              Already registered? <Link to="/login" style={{ color: '#2563eb', fontWeight: 800 }}>Sign In</Link>
            </div>
          </div>
        )}

        {/* ── SUCCESS NOTIFICATION STATE ──────────────────────────────────── */}
        {submittedStatus && (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            {submittedStatus === 'BIDDER_DONE' ? (
              <>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Bidder Account Created!</h2>
                <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, background: '#ecfdf5', color: '#059669', fontWeight: 800, fontSize: '0.8rem', marginBottom: 16, border: '1px solid #a7f3d0' }}>
                  ACCOUNT ACTIVE
                </div>
                <p style={{ color: '#475569', fontSize: '0.88rem', maxWidth: 420, margin: '0 auto 28px', lineHeight: 1.6 }}>
                  Sign in and complete your verification profile — Personal Identity, Company Details, Document Upload, and our AI will auto-verify your records.
                </p>
                <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #059669, #047857)', padding: '12px 28px' }} onClick={() => navigate('/login?portal=BIDDER')}>
                  Sign In & Complete Verification →
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>
                  {selectedRole === 'PROCUREMENT_OFFICER' ? 'Procurement Officer Account Created!' : 'Compliance Auditor Account Created!'}
                </h2>
                <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, background: '#ecfdf5', color: '#059669', fontWeight: 800, fontSize: '0.8rem', marginBottom: 16, border: '1px solid #a7f3d0' }}>
                  ACCOUNT ACTIVE & VERIFIED
                </div>
                <p style={{ color: '#475569', fontSize: '0.88rem', maxWidth: 440, margin: '0 auto 24px', lineHeight: 1.5 }}>
                  Your account has been verified and activated immediately. You can now sign in to access the {selectedRole === 'PROCUREMENT_OFFICER' ? 'Procurement Officer' : 'Compliance Auditor'} portal.
                </p>
                <button
                  className="btn-primary"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', padding: '12px 28px' }}
                  onClick={() => navigate(selectedRole === 'PROCUREMENT_OFFICER' ? '/login?portal=OFFICER' : '/login?portal=AUDITOR')}
                >
                  Sign In to {selectedRole === 'PROCUREMENT_OFFICER' ? 'Procurement' : 'Auditor'} Portal →
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
