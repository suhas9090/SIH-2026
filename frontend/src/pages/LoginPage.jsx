import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RolePortalSelector, { PORTAL_ROLES } from '../components/RolePortalSelector';
import api from '../services/api';
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
  const [accessDeniedData, setAccessDeniedData] = useState(null);

  useEffect(() => {
    if (portalParam) {
      const match = PORTAL_ROLES.find(p => p.roleKey === portalParam);
      if (match) {
        setSelectedPortal(match);
        setEmail(match.defaultEmail || '');
        setPassword('');
        setAccessDeniedData(null);
      }
    }
  }, [portalParam]);

  const isEmailValid = validateEmail(email);

  const handlePortalSelect = (portal) => {
    setSelectedPortal(portal);
    setEmail(portal.defaultEmail || '');
    setPassword('');
    setAccessDeniedData(null);
    setSearchParams({ portal: portal.roleKey });
  };

  const handleClearPortal = () => {
    setSelectedPortal(null);
    setEmail('');
    setPassword('');
    setAccessDeniedData(null);
    setSearchParams({});
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
    setAccessDeniedData(null);
    try {
      const userRes = await login(email.trim().toLowerCase(), password, selectedPortal?.roleKey);
      toast.success('Signed in successfully!');
      
      const role = userRes?.role || selectedPortal?.roleKey || 'PROCUREMENT_OFFICER';
      if (role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (role === 'BIDDER') {
        try {
          const vRes = await api.get('/bidder-onboarding/verification-status');
          if (vRes.data?.lifecycleStatus === 'APPROVED_TO_BID') {
            navigate('/bidder/dashboard');
          } else {
            navigate('/bidder/onboarding');
          }
        } catch (_) {
          navigate('/bidder/onboarding');
        }
      } else if (role === 'AUDITOR' || role === 'REVIEWER') {
        navigate('/auditor/dashboard');
      } else {
        navigate('/procurement/dashboard');
      }
    } catch (err) {
      if (err.code === 'ROLE_PORTAL_MISMATCH' && err.data) {
        setAccessDeniedData(err.data);
        toast.error(err.message, { duration: 6000 });
      } else {
        const msg = err.message || 'Login failed. Please check your credentials.';
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative',
    }}>
      {/* Floating Top-Left Back Button */}
      <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 20 }}>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="btn-secondary"
          style={{
            borderRadius: '20px',
            padding: '7px 16px',
            fontSize: '0.82rem',
            fontWeight: 700,
          }}
        >
          <span>←</span> Back to Home
        </button>
      </div>

      <div style={{
        width: '100%',
        maxWidth: selectedPortal ? 460 : 1140,
        position: 'relative',
        zIndex: 10,
        transition: 'max-width 0.3s ease',
      }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
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
          <h1 style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 900,
            fontSize: '1.8rem',
            color: '#0f172a',
            letterSpacing: '-0.02em',
            marginBottom: 4,
          }}>
            COMPLYGEM <span style={{ color: selectedPortal ? selectedPortal.color : '#2563eb' }}>AI</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem', maxWidth: 480, margin: '0 auto' }}>
            Public Procurement Compliance & Verification Platform
          </p>
        </div>

        {/* VIEW 1: DEDICATED PORTAL SIGN IN FORM */}
        {selectedPortal ? (
          <div className="card" style={{
            padding: '32px 28px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.02)',
            position: 'relative',
          }}>
            {/* Top Portal Switcher Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: '1px solid #f1f5f9',
            }}>
              <button
                type="button"
                onClick={handleClearPortal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: 0,
                }}
              >
                ← Change Portal
              </button>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: selectedPortal.color,
                background: selectedPortal.circleBg || '#eff6ff',
                padding: '3px 10px',
                borderRadius: '12px',
              }}>
                {selectedPortal.title}
              </span>
            </div>

            {/* Portal Title & Badge */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                margin: '0 auto 10px',
                background: selectedPortal.circleBg || '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
              }}>
                {selectedPortal.badge}
              </div>
              <h2 style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 900,
                fontSize: '1.35rem',
                color: '#0f172a',
                marginBottom: 4,
              }}>
                {selectedPortal.title} Login
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.82rem', margin: 0 }}>
                {selectedPortal.description}
              </p>
            </div>

            {/* Access Denied Alert Card */}
            {accessDeniedData && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 12,
                padding: '14px 16px',
                marginBottom: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', fontWeight: 800, fontSize: '0.85rem', marginBottom: 4 }}>
                  <span>🚫</span>
                  <span>Portal Access Denied</span>
                </div>
                <p style={{ color: '#7f1d1d', fontSize: '0.8rem', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                  {accessDeniedData.error || `You have a ${accessDeniedData.userRoleLabel || 'different'} account. You cannot log in through this portal.`}
                </p>
                {accessDeniedData.correctPortalKey && (
                  <button
                    type="button"
                    onClick={() => {
                      const match = PORTAL_ROLES.find(p => p.roleKey === accessDeniedData.correctPortalKey);
                      if (match) {
                        setSelectedPortal(match);
                        setSearchParams({ portal: match.roleKey });
                        setAccessDeniedData(null);
                        setPassword('');
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Switch to {accessDeniedData.correctPortalLabel || 'Your Designated Portal'} →
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleLogin} noValidate>
              {/* Email */}
              <div style={{ marginBottom: 14 }}>
                <label className="label">
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
                    borderColor: emailTouched && email && !isEmailValid ? '#ef4444' : isEmailValid ? '#10b981' : undefined
                  }}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: 16 }}>
                <label className="label">
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
                    style={{ paddingRight: 44 }}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.8rem', color: '#475569' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{ accentColor: selectedPortal.color, width: 14, height: 14 }}
                  />
                  Remember me
                </label>
                <span
                  style={{ fontSize: '0.8rem', color: selectedPortal.color, cursor: 'pointer', fontWeight: 700 }}
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
                  padding: '12px',
                  borderRadius: '10px',
                  background: selectedPortal.btnColor,
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: `0 4px 14px ${selectedPortal.btnColor}40`,
                  transition: 'all 0.15s ease',
                }}
              >
                {loading ? '⟳ Signing in...' : `Sign In as ${selectedPortal.title} →`}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 22, fontSize: '0.82rem', color: '#64748b' }}>
              Don't have an official account?{' '}
              <Link to={`/register?role=${selectedPortal.roleKey}`} style={{ color: selectedPortal.color, fontWeight: 800, textDecoration: 'none' }}>
                Register as {selectedPortal.title} →
              </Link>
            </p>
          </div>
        ) : (
          /* VIEW 2: PORTAL SELECTOR OVERVIEW (4 Cards) */
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <span style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                color: '#2563eb',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                background: '#eff6ff',
                padding: '6px 16px',
                borderRadius: '20px',
                border: '1px solid #bfdbfe',
              }}>
                Select Your Access Portal to Sign In
              </span>
            </div>

            <RolePortalSelector onSelectPortal={handlePortalSelect} />

            <div style={{
              marginTop: 32,
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 20,
              flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '0.84rem', color: '#475569' }}>
                Need official registration?{' '}
                <Link to="/register" style={{ color: '#2563eb', fontWeight: 800, textDecoration: 'none' }}>
                  Register as Bidder or Officer →
                </Link>
              </span>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <Link to="/" style={{ color: '#64748b', fontSize: '0.84rem', textDecoration: 'none', fontWeight: 600 }}>
                ← Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
