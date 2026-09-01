import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, DEMO_PROFILES } from '../contexts/AuthContext';
import RolePortalSelector, { PORTAL_ROLES } from '../components/RolePortalSelector';
import toast from 'react-hot-toast';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function validateEmail(email) {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim());
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const portalParam = searchParams.get('portal');
  const [selectedPortal, setSelectedPortal] = useState(
    PORTAL_ROLES.find(p => p.roleKey === portalParam) || null
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  // Sync with query param if present
  useEffect(() => {
    if (portalParam) {
      const match = PORTAL_ROLES.find(p => p.roleKey === portalParam);
      if (match) {
        setSelectedPortal(match);
        setEmail(match.defaultEmail || '');
        setPassword('');
      }
    }
  }, [portalParam]);

  const isEmailValid = validateEmail(email);

  const handlePortalSelect = (portal) => {
    setSelectedPortal(portal);
    setEmail(portal.defaultEmail || '');
    setPassword('');
    setSearchParams({ portal: portal.roleKey });
  };

  const handleClearPortal = () => {
    setSelectedPortal(null);
    setEmail('');
    setPassword('');
    setSearchParams({});
  };

  const handleFillDemo = () => {
    if (selectedPortal) {
      setEmail(selectedPortal.defaultEmail);
      setPassword('Admin@123456');
      toast.success(`Loaded credentials for ${selectedPortal.demoName}`);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      return toast.error('Please enter both email and password.');
    }

    if (!validateEmail(email)) {
      return toast.error('Please enter a valid email address.');
    }

    setLoading(true);
    try {
      const userRes = await login(email.trim().toLowerCase(), password);
      toast.success('Signed in successfully!');
      
      const role = userRes?.role || selectedPortal?.roleKey || 'PROCUREMENT_OFFICER';
      if (role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (role === 'BIDDER') {
        navigate('/bidder/dashboard');
      } else if (role === 'AUDITOR' || role === 'REVIEWER') {
        navigate('/auditor/dashboard');
      } else {
        navigate('/procurement/dashboard');
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        toast.error('Invalid email or password. You can use the quick demo fill button.');
      } else {
        toast.error(msg.replace('Firebase: ', '') || 'Sign-in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-dark)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient Radial Lights */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 900, height: 900, borderRadius: '50%',
        background: selectedPortal
          ? `radial-gradient(ellipse, ${selectedPortal.color}25 0%, rgba(6, 182, 212, 0.04) 45%, transparent 75%)`
          : 'radial-gradient(ellipse, rgba(30, 64, 175, 0.16) 0%, rgba(6, 182, 212, 0.04) 45%, transparent 75%)',
        pointerEvents: 'none',
        transition: 'background 0.4s ease',
      }} />

      {/* Floating Top-Left Back Button */}
      <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 20 }}>
        <button
          type="button"
          onClick={() => navigate('/')}
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
          <span>←</span> Back to Home
        </button>
      </div>

      <div style={{
        width: '100%',
        maxWidth: selectedPortal ? 480 : 1140,
        position: 'relative',
        zIndex: 10,
        transition: 'max-width 0.3s ease',
      }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <img
              src="/complygem_logo.png"
              alt="ComplyGeM Logo"
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                margin: '0 auto 12px',
                objectFit: 'contain',
                boxShadow: '0 8px 24px rgba(2, 132, 199, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'block',
              }}
            />
          </Link>
          <h1 style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 800,
            fontSize: '1.75rem',
            color: '#f0f4ff',
            letterSpacing: '-0.02em',
            marginBottom: 4,
          }}>
            COMPLYGEM <span style={{ color: selectedPortal ? selectedPortal.color : '#0284c7' }}>AI</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', maxWidth: 500, margin: '0 auto' }}>
            Integrated Bid Compliance Verification Platform · Government of India
          </p>
        </div>

        {/* VIEW 1: DEDICATED PORTAL SIGN IN FORM */}
        {selectedPortal ? (
          <div className="card" style={{
            padding: '34px 30px',
            border: `1px solid ${selectedPortal.color}40`,
            boxShadow: `0 20px 40px rgba(0,0,0,0.5), 0 0 30px ${selectedPortal.lightBg}`,
            position: 'relative',
          }}>
            {/* Top Portal Switcher Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              <button
                type="button"
                onClick={handleClearPortal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: 0,
                }}
              >
                ← All Portals
              </button>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: selectedPortal.color,
                background: selectedPortal.lightBg,
                padding: '3px 10px',
                borderRadius: '12px',
                border: `1px solid ${selectedPortal.color}33`,
              }}>
                {selectedPortal.officerInfo}
              </span>
            </div>

            {/* Portal Title & Badge */}
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                margin: '0 auto 10px',
                background: selectedPortal.lightBg,
                border: `1px solid ${selectedPortal.color}50`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                boxShadow: `0 4px 14px ${selectedPortal.lightBg}`,
              }}>
                {selectedPortal.badge}
              </div>
              <h2 style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 800,
                fontSize: '1.35rem',
                color: '#f8fafc',
                marginBottom: 4,
              }}>
                {selectedPortal.title} Sign In
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>
                {selectedPortal.description}
              </p>
            </div>

            <form onSubmit={handleLogin} noValidate>
              {/* Email */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                  OFFICIAL EMAIL ADDRESS
                </label>
                <input
                  className="input"
                  type="email"
                  placeholder={selectedPortal.defaultEmail}
                  value={email}
                  onChange={e => {
                    setEmailTouched(true);
                    setEmail(e.target.value);
                  }}
                  onBlur={() => setEmailTouched(true)}
                  autoComplete="email"
                  style={{
                    width: '100%',
                    borderColor: emailTouched && email && !isEmailValid ? '#ef4444' : isEmailValid ? '#10b981' : undefined
                  }}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                  PASSWORD
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    style={{ width: '100%', paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1rem',
                    }}
                  >
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.78rem', color: '#94a3b8' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{ accentColor: selectedPortal.color, width: 14, height: 14 }}
                  />
                  Remember me
                </label>
                <span
                  style={{ fontSize: '0.78rem', color: selectedPortal.color, cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => toast.success('Password reset instructions sent to your official email.')}
                >
                  Forgot password?
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '10px',
                  background: selectedPortal.btnColor,
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: `0 4px 14px ${selectedPortal.btnColor}50`,
                  transition: 'all 0.15s ease',
                }}
              >
                {loading ? '⟳ Signing in...' : `Sign In as ${selectedPortal.title} →`}
              </button>

              {/* Quick Fill Demo Button */}
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={handleFillDemo}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    color: '#94a3b8',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; }}
                >
                  ⚡ Fill Demo Credentials ({selectedPortal.demoName.split(' ')[0]})
                </button>
              </div>
            </form>

            <p style={{ textAlign: 'center', marginTop: 22, fontSize: '0.8rem', color: '#64748b' }}>
              Don't have an official account?{' '}
              <Link to="/register" style={{ color: selectedPortal.color, fontWeight: 700 }}>
                Register Organization
              </Link>
            </p>
          </div>
        ) : (
          /* VIEW 2: PORTAL SELECTOR OVERVIEW (4 Cards) */
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#3b82f6',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                background: 'rgba(59, 130, 246, 0.1)',
                padding: '4px 14px',
                borderRadius: '20px',
                border: '1px solid rgba(59, 130, 246, 0.25)',
              }}>
                Select Your Access Portal to Sign In
              </span>
            </div>

            <RolePortalSelector onSelectPortal={handlePortalSelect} />

            <div style={{
              marginTop: 28,
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 20,
              flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Need official registration?{' '}
                <Link to="/register" style={{ color: '#3b82f6', fontWeight: 700, textDecoration: 'none' }}>
                  Register as Bidder or Officer →
                </Link>
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.1)' }}>|</span>
              <Link to="/" style={{ color: '#94a3b8', fontSize: '0.82rem', textDecoration: 'none' }}>
                ← Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
