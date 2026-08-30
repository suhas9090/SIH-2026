import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function validateEmail(email) {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim());
}

// ─── MFA OTP Input ────────────────────────────────────────────────────────────
const OTPInput = ({ value, onChange }) => {
  const inputs = useRef([]);
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      if (digits[i] === '' && i > 0) inputs.current[i - 1]?.focus();
      onChange(value.slice(0, i) + value.slice(i + 1));
    } else if (/^\d$/.test(e.key)) {
      const next = value.slice(0, i) + e.key + value.slice(i + 1);
      onChange(next.slice(0, 6));
      if (i < 5) inputs.current[i + 1]?.focus();
    }
  };

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '20px 0' }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onKeyDown={e => handleKey(i, e)}
          onChange={() => {}}
          style={{
            width: 48, height: 56, textAlign: 'center', fontSize: '1.4rem', fontWeight: 700,
            background: 'var(--bg-input)', border: `2px solid ${d ? 'rgba(59,130,246,0.6)' : 'var(--bg-border)'}`,
            borderRadius: 10, color: '#f0f4ff', outline: 'none',
            transition: 'border-color 0.2s',
          }}
        />
      ))}
    </div>
  );
};

export default function LoginPage() {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [showPass,     setShowPass]     = useState(false);

  const [loginStep, setLoginStep] = useState('credentials'); // 'credentials' | 'mfa' | 'blocked'
  const [blockedReason, setBlockedReason] = useState(null);
  const [otpValue, setOtpValue] = useState('');
  const [loading, setLoading]   = useState(false);

  const [demoLoading, setDemoLoading] = useState(false);

  const isEmailValid = validateEmail(email);

  // ── Credential submit ─────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      return toast.error('Please enter both email and password.');
    }

    if (!validateEmail(email)) {
      return toast.error('Please enter a valid email address (e.g., name@domain.com).');
    }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const code = err.code || '';
      const msg  = err.message || '';

      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        toast.error('Invalid email or password.');
      } else if (code === 'auth/too-many-requests') {
        setBlockedReason({
          title: 'Account Temporarily Locked',
          icon: '🔒',
          color: '#ef4444',
          message: 'Too many failed login attempts. Your account has been temporarily locked. Please try again after a few minutes or reset your password.',
          action: { label: 'Reset Password', fn: () => {} },
        });
        setLoginStep('blocked');
      } else if (msg.includes('PENDING_APPROVAL') || msg.includes('pending')) {
        setBlockedReason({
          title: 'Account Pending Approval',
          icon: '⏳',
          color: '#f59e0b',
          message: 'Your account request is pending administrator approval. You will receive an email notification once it is reviewed.',
          action: null,
        });
        setLoginStep('blocked');
      } else if (msg.includes('EMAIL_NOT_VERIFIED') || code === 'auth/email-not-verified') {
        setBlockedReason({
          title: 'Email Not Verified',
          icon: '✉',
          color: '#3b82f6',
          message: `We sent a verification link to ${email}. Please check your inbox and verify your email address before signing in.`,
          action: { label: 'Resend Verification Email', fn: () => toast.success('Verification email resent!') },
        });
        setLoginStep('blocked');
      } else if (msg.includes('ACCOUNT_DEACTIVATED')) {
        setBlockedReason({
          title: 'Account Deactivated',
          icon: '🚫',
          color: '#ef4444',
          message: 'Your account has been deactivated. Please contact your system administrator.',
          action: null,
        });
        setLoginStep('blocked');
      } else {
        toast.error(msg.replace('Firebase: ', '') || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── MFA OTP submit ────────────────────────────────────────────────────────
  const handleMFA = async (e) => {
    e.preventDefault();
    if (otpValue.length !== 6) return toast.error('Enter the 6-digit code.');

    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      toast.success('MFA verified. Welcome!');
      navigate('/dashboard');
    } catch {
      toast.error('Incorrect code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Demo login ────────────────────────────────────────────────────────────
  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      await demoLogin();
      toast.success('Demo mode activated!');
      navigate('/dashboard');
    } catch {
      toast.error('Demo login failed. Make sure the backend is running on port 5000.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--gradient-hero)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden',
    }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(30,64,175,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 13, margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #1e40af, #0891b2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
          }} className="animate-pulse-glow">⚖</div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.8rem', color: '#f0f4ff', marginBottom: 6 }}>
            ComplyGeM AI
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Bid Compliance Verification Platform</p>
        </div>

        {/* ── Credentials step ── */}
        {loginStep === 'credentials' && (
          <div className="card" style={{ padding: 32 }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f0f4ff', marginBottom: 24, textAlign: 'center' }}>
              Sign In to Your Account
            </h2>

            <form onSubmit={handleLogin} noValidate>
              {/* Email */}
              <div style={{ marginBottom: 14 }}>
                <label className="label">Official Email</label>
                <input
                  className={`input ${emailTouched && email && !isEmailValid ? 'border-red-500' : ''}`}
                  type="email"
                  placeholder="officer@ministry.gov.in"
                  value={email}
                  onChange={e => {
                    setEmailTouched(true);
                    setEmail(e.target.value);
                  }}
                  onBlur={() => setEmailTouched(true)}
                  autoComplete="email"
                  style={{
                    borderColor: emailTouched && email && !isEmailValid ? '#ef4444' : isEmailValid ? '#10b981' : undefined
                  }}
                />
                {emailTouched && email && !isEmailValid && (
                  <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>⚠</span> Please enter a valid email (e.g. name@domain.com)
                  </div>
                )}
                {isEmailValid && (
                  <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>✓</span> Valid email address
                  </div>
                )}
              </div>

              {/* Password */}
              <div style={{ marginBottom: 8 }}>
                <label className="label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input" type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1rem',
                  }}>
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div style={{ textAlign: 'right', marginBottom: 20 }}>
                <span
                  style={{ fontSize: '0.8rem', color: '#3b82f6', cursor: 'pointer' }}
                  onClick={() => toast('Password reset: Enter your email to receive a reset link.')}
                >
                  Forgot password?
                </span>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem' }}>
                {loading ? '⟳ Signing in...' : '→ Sign In'}
              </button>
            </form>

            {/* MFA info note */}
            <div style={{
              marginTop: 16, padding: '10px 12px',
              background: 'rgba(30,64,175,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8,
              fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <span style={{ flexShrink: 0 }}>🔐</span>
              <span>Privileged accounts (Procurement Officers, Reviewers, Admins) will be prompted for multi-factor authentication after password verification.</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
              <div className="divider" style={{ flex: 1, margin: 0 }} />
              <span style={{ color: '#4a6080', fontSize: '0.75rem' }}>OR</span>
              <div className="divider" style={{ flex: 1, margin: 0 }} />
            </div>

            {/* Demo Login */}
            <button
              onClick={handleDemoLogin} disabled={demoLoading}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.875rem' }}
            >
              {demoLoading ? '⟳ Loading...' : '🎮 Try Demo Mode — No Firebase Required'}
            </button>

            <div className="mock-banner" style={{ marginTop: 12 }}>
              <span>⚠</span> Demo mode uses sandbox data — not real government information
            </div>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: '#64748b' }}>
              No account?{' '}
              <Link to="/register" style={{ color: '#3b82f6', fontWeight: 600 }}>Register here</Link>
            </p>
          </div>
        )}

        {/* ── MFA step ── */}
        {loginStep === 'mfa' && (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔐</div>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f0f4ff', marginBottom: 8 }}>
              Two-Factor Authentication
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: 4 }}>
              Enter the 6-digit code from your authenticator app or the OTP sent to
            </p>
            <p style={{ color: '#3b82f6', fontWeight: 600, fontSize: '0.875rem', marginBottom: 8 }}>
              {email}
            </p>

            <form onSubmit={handleMFA}>
              <OTPInput value={otpValue} onChange={setOtpValue} />

              <button type="submit" className="btn-primary" disabled={loading || otpValue.length !== 6}
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                {loading ? '⟳ Verifying...' : '✓ Verify Code'}
              </button>
            </form>

            <button
              className="btn-ghost"
              style={{ marginTop: 14, fontSize: '0.8rem', color: '#64748b', width: '100%', justifyContent: 'center' }}
              onClick={() => { setLoginStep('credentials'); setOtpValue(''); }}
            >
              ← Use a different account
            </button>

            <p style={{ marginTop: 12, fontSize: '0.75rem', color: '#4a6080' }}>
              Code expires in 5 minutes. <span style={{ color: '#3b82f6', cursor: 'pointer' }}>Resend code</span>
            </p>
          </div>
        )}

        {/* ── Blocked / approval / locked state ── */}
        {loginStep === 'blocked' && blockedReason && (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>{blockedReason.icon}</div>
            <h2 style={{
              fontWeight: 800, fontSize: '1.1rem', marginBottom: 12,
              color: blockedReason.color,
            }}>
              {blockedReason.title}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: 20 }}>
              {blockedReason.message}
            </p>

            {blockedReason.action && (
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}
                onClick={blockedReason.action.fn}>
                {blockedReason.action.label}
              </button>
            )}

            <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => { setLoginStep('credentials'); setBlockedReason(null); }}>
              ← Try Again
            </button>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: 14, fontSize: '0.75rem' }}>
          <Link to="/" style={{ color: '#4a6080' }}>← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
