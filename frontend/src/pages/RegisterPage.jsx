import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// ─── Strict Email Validator ──────────────────────────────────────────────────
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const FREE_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'rediffmail.com'];

function validateEmail(email) {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim());
}

function isFreeEmail(email) {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return FREE_EMAIL_DOMAINS.includes(domain);
}

// ─── Password strength calculator ────────────────────────────────────────────
function calcPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '', checks: {} };

  const checks = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number:    /[0-9]/.test(password),
    special:   /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    notTooShort: password.length >= 12,
  };

  const passed = Object.values(checks).filter(Boolean).length;

  const map = [
    { min: 0, label: '',         color: 'transparent', bg: 'var(--bg-border)' },
    { min: 1, label: 'Weak',     color: '#ef4444',     bg: '#ef4444' },
    { min: 2, label: 'Weak',     color: '#ef4444',     bg: '#ef4444' },
    { min: 3, label: 'Fair',     color: '#f59e0b',     bg: '#f59e0b' },
    { min: 4, label: 'Good',     color: '#3b82f6',     bg: '#3b82f6' },
    { min: 5, label: 'Strong',   color: '#10b981',     bg: '#10b981' },
    { min: 6, label: 'Very Strong', color: '#10b981',  bg: '#10b981' },
  ];

  const entry = map[passed] || map[0];
  return { score: passed, label: entry.label, color: entry.color, bg: entry.bg, checks };
}

// ─── Phone formatter ──────────────────────────────────────────────────────────
function validatePhone(phone) {
  if (!phone) return true; // optional
  const stripped = phone.replace(/[\s\-\(\)]/g, '');
  return /^\+?[1-9]\d{6,14}$/.test(stripped) && stripped.length === 10;
}

// ─── Account type config ─────────────────────────────────────────────────────
const ACCOUNT_TYPES = [
  {
    type: 'BIDDER',
    icon: '🏢',
    title: 'Bidder / Supplier',
    desc: 'Register your organization to submit bids on GeM tenders',
    badge: null,
    badgeColor: null,
    roles: null,
    approvalRequired: false,
  },
  {
    type: 'GOVERNMENT',
    icon: '🏛',
    title: 'Authorized Government User',
    desc: 'Procurement officers and reviewers — requires administrator approval',
    badge: 'Requires Approval',
    badgeColor: '#f59e0b',
    roles: [
      { value: 'PROCUREMENT_OFFICER', label: 'Procurement Officer', desc: 'Create tenders, verify bidders, generate compliance reports' },
      { value: 'REVIEWER',            label: 'Reviewer / Evaluator', desc: 'Review flagged items and AI-extracted compliance results' },
    ],
  },
  {
    type: 'ADMIN',
    icon: '🔒',
    title: 'Administrator',
    desc: 'Admin access is invitation-only and cannot be self-registered',
    badge: 'Invitation Only',
    badgeColor: '#ef4444',
    disabled: true,
  },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [step, setStep] = useState(1); // 1=type, 2=details, 3=done
  const [accountType, setAccountType] = useState(null);   // 'BIDDER' | 'GOVERNMENT'
  const [selectedRole, setSelectedRole] = useState('PROCUREMENT_OFFICER');

  const [form, setForm] = useState({
    name: '', organization: '', organizationId: '',
    email: '', phone: '', password: '', confirmPassword: '',
    agreeTerms: false,
  });

  const [emailTouched, setEmailTouched]  = useState(false);
  const [showPassword, setShowPassword]  = useState(false);
  const [showConfirm,  setShowConfirm]   = useState(false);
  const [loading, setLoading]            = useState(false);

  const isEmailValid = validateEmail(form.email);
  const strength = calcPasswordStrength(form.password);

  const handleChange = useCallback((key, val) =>
    setForm(prev => ({ ...prev, [key]: val })), []);

  // Determine effective role from accountType + selectedRole
  const effectiveRole = accountType === 'BIDDER' ? 'BIDDER' : selectedRole;

  // ── Step 1 → 2 ──────────────────────────────────────────────────────────
  const handleSelectType = (type) => {
    if (type === 'ADMIN') return; // blocked
    setAccountType(type);
    setStep(2);
  };

  // ── Step 2 → Submit ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validations
    if (!form.name.trim())             return toast.error('Full name is required.');
    if (!form.organization.trim())     return toast.error('Organization name is required.');
    
    // Strict Email Validation
    if (!form.email.trim()) {
      return toast.error('Official email is required.');
    }
    if (!validateEmail(form.email)) {
      return toast.error('Please enter a valid email address (e.g., name@domain.com).');
    }

    if (!form.password)                return toast.error('Password is required.');
    if (strength.score < 4)            return toast.error('Password is too weak. Meet all requirements below.');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match.');
    if (form.phone && !validatePhone(form.phone)) return toast.error('Invalid phone number. Must be exactly 10 digits.');
    if (!form.agreeTerms)              return toast.error('You must agree to the Terms & Privacy Policy.');

    setLoading(true);
    try {
      await register(
        form.email.trim().toLowerCase(),
        form.password,
        form.name.trim(),
        form.organization.trim(),
        form.phone,
        effectiveRole,
        form.organizationId.trim(),
      );
      setStep(3);
    } catch (err) {
      const msg = err.message?.replace('Firebase: ', '') || 'Registration failed.';
      if (msg.includes('email-already-in-use')) {
        toast.error('An account with this email already exists. Try signing in.');
      } else if (msg.includes('invalid-email')) {
        toast.error('The email address is improperly formatted.');
      } else if (msg.includes('ROLE_NOT_ALLOWED')) {
        toast.error('That role cannot be self-registered.');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => { setAccountType(null); setStep(1); };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--gradient-hero)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '40%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(30,64,175,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 540, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #1e40af, #0891b2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
          }} className="animate-pulse-glow">⚖</div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: '#f0f4ff', marginBottom: 4 }}>
            Create Your Account
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>ComplyGeM AI — SIH26100 Prototype</p>
        </div>

        {/* ─── Step 1: Account Type ─────────────────────────────────────── */}
        {step === 1 && (
          <div className="card" style={{ padding: 28 }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
              Select Account Type
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ACCOUNT_TYPES.map(type => (
                <div
                  key={type.type}
                  onClick={() => handleSelectType(type.type)}
                  style={{
                    padding: '16px 18px', borderRadius: 12, cursor: type.disabled ? 'not-allowed' : 'pointer',
                    border: `1px solid ${type.disabled ? 'rgba(30,45,74,0.4)' : 'var(--bg-border)'}`,
                    background: type.disabled ? 'rgba(30,45,74,0.2)' : 'var(--bg-input)',
                    opacity: type.disabled ? 0.6 : 1,
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 14,
                  }}
                  onMouseOver={e => !type.disabled && (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)')}
                  onMouseOut={e => !type.disabled && (e.currentTarget.style.borderColor = 'var(--bg-border)')}
                >
                  <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{type.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: type.disabled ? '#4a6080' : '#f0f4ff' }}>
                        {type.title}
                      </span>
                      {type.badge && (
                        <span style={{
                          fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                          color: type.badgeColor, background: `${type.badgeColor}18`,
                          border: `1px solid ${type.badgeColor}30`,
                        }}>{type.badge}</span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>{type.desc}</span>
                  </div>
                  {!type.disabled && (
                    <span style={{ color: '#4a6080', fontSize: '1.1rem' }}>›</span>
                  )}
                </div>
              ))}
            </div>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: '#64748b' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#3b82f6', fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>
        )}

        {/* ─── Step 2: Registration Details ────────────────────────────── */}
        {step === 2 && (
          <div className="card" style={{ padding: 28 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <button className="btn-ghost" style={{ padding: '4px 8px' }} onClick={handleBack}>← Back</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.2rem' }}>
                  {accountType === 'BIDDER' ? '🏢' : '🏛'}
                </span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f0f4ff' }}>
                  {accountType === 'BIDDER' ? 'Bidder / Supplier' : 'Government User Request'}
                </span>
              </div>
            </div>

            {/* Government role sub-selection */}
            {accountType === 'GOVERNMENT' && (
              <div style={{ marginBottom: 20 }}>
                <label className="label">Requested Role *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {ACCOUNT_TYPES[1].roles.map(r => (
                    <div
                      key={r.value}
                      onClick={() => setSelectedRole(r.value)}
                      style={{
                        padding: '12px', borderRadius: 10, cursor: 'pointer',
                        border: `1px solid ${selectedRole === r.value ? 'rgba(59,130,246,0.5)' : 'var(--bg-border)'}`,
                        background: selectedRole === r.value ? 'rgba(59,130,246,0.08)' : 'var(--bg-input)',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: selectedRole === r.value ? '#60a5fa' : '#f0f4ff', marginBottom: 3 }}>
                        {r.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.5 }}>{r.desc}</div>
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: 10, padding: '10px 12px',
                  background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8,
                  fontSize: '0.78rem', color: '#f59e0b', display: 'flex', alignItems: 'flex-start', gap: 8,
                }}>
                  <span style={{ flexShrink: 0 }}>⚠</span>
                  <span>Government access requires administrator approval. Your request will be reviewed before you can access the platform.</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Name + Organization */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label className="label">Full Name *</label>
                  <input className="input" placeholder="Your full name" value={form.name}
                    onChange={e => handleChange('name', e.target.value)} />
                </div>
                <div>
                  <label className="label">Organization *</label>
                  <input className="input" placeholder="Ministry / Company" value={form.organization}
                    onChange={e => handleChange('organization', e.target.value)} />
                </div>
              </div>

              {/* Organization ID */}
              <div style={{ marginBottom: 14 }}>
                <label className="label">
                  {accountType === 'BIDDER' ? 'CIN / GSTIN / Udyam No.' : 'Department / Ministry Code'}
                  <span style={{ color: '#4a6080', marginLeft: 4, fontWeight: 400 }}>(Optional but recommended)</span>
                </label>
                <input className="input"
                  placeholder={accountType === 'BIDDER' ? 'e.g., UDYAM-KA-01-0000001' : 'e.g., Ministry/Dept code'}
                  value={form.organizationId} onChange={e => handleChange('organizationId', e.target.value)} />
              </div>

              {/* Email + Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                {/* Strict Email Input */}
                <div>
                  <label className="label">Official Email *</label>
                  <input
                    className={`input ${emailTouched && form.email && !isEmailValid ? 'border-red-500' : ''}`}
                    type="email"
                    placeholder={accountType === 'BIDDER' ? 'you@company.com' : 'you@ministry.gov.in'}
                    value={form.email}
                    onChange={e => {
                      setEmailTouched(true);
                      handleChange('email', e.target.value);
                    }}
                    onBlur={() => setEmailTouched(true)}
                    style={{
                      borderColor: emailTouched && form.email && !isEmailValid ? '#ef4444' : isEmailValid ? '#10b981' : undefined
                    }}
                  />
                  {/* Email validation hints */}
                  {emailTouched && form.email && !isEmailValid && (
                    <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>⚠</span> Please enter a valid email format (e.g. name@domain.com)
                    </div>
                  )}
                  {isEmailValid && (
                    <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>✓</span> Valid email address
                    </div>
                  )}
                  {accountType === 'GOVERNMENT' && isEmailValid && isFreeEmail(form.email) && (
                    <div style={{ fontSize: '0.72rem', color: '#f59e0b', marginTop: 4, lineHeight: 1.4 }}>
                      🏛 Note: Official government accounts should preferably use official domains (.gov.in / .nic.in).
                    </div>
                  )}
                </div>

                {/* Phone Input */}
                <div>
                  <label className="label">
                    Phone Number
                    <span style={{ color: '#4a6080', marginLeft: 4, fontWeight: 400 }}>(Optional)</span>
                  </label>
                  <div style={{ display: 'flex', gap: 0 }}>
                    <span style={{
                      display: 'flex', alignItems: 'center', padding: '0 12px',
                      background: 'rgba(30,45,74,0.8)', border: '1px solid var(--bg-border)',
                      borderRight: 'none', borderRadius: '10px 0 0 10px',
                      fontSize: '0.875rem', color: '#94a3b8', flexShrink: 0,
                    }}>+91</span>
                    <input className="input"
                      style={{ borderRadius: '0 10px 10px 0' }}
                      placeholder="9876543210"
                      type="tel"
                      maxLength={10}
                      value={form.phone}
                      onChange={e => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    />
                  </div>
                  {form.phone && form.phone.length > 0 && form.phone.length !== 10 && (
                    <p style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 4 }}>Phone number must be exactly 10 digits</p>
                  )}
                  {form.phone && form.phone.length === 10 && (
                    <p style={{ fontSize: '0.72rem', color: '#10b981', marginTop: 4 }}>✓ Valid 10-digit number</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 14 }}>
                <label className="label">Password *</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={form.password}
                    onChange={e => handleChange('password', e.target.value)}
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1rem',
                    }}>
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>

                {/* Password strength bar */}
                {form.password && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} style={{
                          flex: 1, height: 4, borderRadius: 2,
                          background: strength.score >= i ? strength.bg : 'var(--bg-border)',
                          transition: 'background 0.3s',
                        }} />
                      ))}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: strength.color, fontWeight: 600 }}>
                      {strength.label || 'Enter a password'}
                    </div>
                  </div>
                )}

                {/* Requirement checklist */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px', marginTop: 8 }}>
                  {[
                    ['length',    '8+ characters'],
                    ['uppercase', 'Uppercase letter'],
                    ['lowercase', 'Lowercase letter'],
                    ['number',    'Number (0–9)'],
                    ['special',   'Special character (!@# …)'],
                  ].map(([key, label]) => (
                    <div key={key} style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 5,
                      color: strength.checks[key] ? '#10b981' : '#4a6080' }}>
                      <span>{strength.checks[key] ? '✓' : '○'}</span>
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm password */}
              <div style={{ marginBottom: 18 }}>
                <label className="label">Confirm Password *</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={form.confirmPassword}
                    onChange={e => handleChange('confirmPassword', e.target.value)}
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowConfirm(s => !s)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1rem',
                    }}>
                    {showConfirm ? '🙈' : '👁'}
                  </button>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 4 }}>Passwords do not match</p>
                )}
                {form.confirmPassword && form.password === form.confirmPassword && form.confirmPassword.length > 0 && (
                  <p style={{ fontSize: '0.72rem', color: '#10b981', marginTop: 4 }}>✓ Passwords match</p>
                )}
              </div>

              {/* Terms */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.agreeTerms}
                  onChange={e => handleChange('agreeTerms', e.target.checked)}
                  style={{ marginTop: 2, accentColor: '#3b82f6', width: 16, height: 16 }} />
                <span style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                  I agree to the{' '}
                  <span style={{ color: '#3b82f6', cursor: 'pointer' }}>Terms of Service</span>
                  {' '}and{' '}
                  <span style={{ color: '#3b82f6', cursor: 'pointer' }}>Privacy Policy</span>.
                  I confirm that information provided is accurate.
                </span>
              </label>

              <button type="submit" className="btn-primary" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem' }}>
                {loading ? '⟳ Creating account...' : '→ Create Account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.875rem', color: '#64748b' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#3b82f6', fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>
        )}

        {/* ─── Step 3: Confirmation ─────────────────────────────────────── */}
        {step === 3 && (
          <div className="card" style={{ padding: 36, textAlign: 'center' }}>
            {effectiveRole === 'BIDDER' ? (
              <>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
                <h2 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#10b981', marginBottom: 12 }}>
                  Account Created!
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: 8 }}>
                  Welcome to ComplyGeM AI. Please verify your email address to activate your account.
                </p>
                <div style={{ padding: '12px 16px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, marginBottom: 24, fontSize: '0.82rem', color: '#94a3b8' }}>
                  📧 A verification email has been sent to <strong style={{ color: '#f0f4ff' }}>{form.email}</strong>. Please check your inbox.
                </div>
                <button className="btn-primary" style={{ justifyContent: 'center', width: '100%' }} onClick={() => navigate('/login')}>
                  → Go to Sign In
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>⏳</div>
                <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: '#f59e0b', marginBottom: 12 }}>
                  Request Submitted — Pending Approval
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: 16 }}>
                  Your account request for <strong style={{ color: '#f0f4ff' }}>{selectedRole.replace(/_/g, ' ')}</strong> has been submitted.
                </p>
                <div style={{
                  padding: '16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, marginBottom: 24, textAlign: 'left',
                }}>
                  {[
                    '✉ Verify your email address (check your inbox)',
                    '🛡 An administrator will review your request',
                    '📧 You will be notified by email when approved',
                    '🔐 Multi-factor authentication will be required on first login',
                  ].map(step => (
                    <div key={step} style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ marginTop: 1 }}>›</span> {step}
                    </div>
                  ))}
                </div>
                <button className="btn-secondary" style={{ justifyContent: 'center', width: '100%' }} onClick={() => navigate('/login')}>
                  ← Return to Sign In
                </button>
              </>
            )}
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.75rem' }}>
          <Link to="/" style={{ color: '#4a6080' }}>← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
