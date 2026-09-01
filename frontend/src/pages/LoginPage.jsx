import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, DEMO_PROFILES } from '../contexts/AuthContext';
import RolePortalSelector from '../components/RolePortalSelector';
import toast from 'react-hot-toast';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function validateEmail(email) {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim());
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('portals'); // 'portals' | 'credentials'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const isEmailValid = validateEmail(email);

  // Quick Preset Selection Helper
  const handleSelectPreset = (roleKey) => {
    const prof = DEMO_PROFILES[roleKey];
    if (prof) {
      setEmail(prof.email);
      setPassword('Admin@123456');
      setActiveTab('credentials');
      toast.success(`Loaded credentials for ${prof.name}`);
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
      
      const role = userRes?.role || 'PROCUREMENT_OFFICER';
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
        toast.error('Invalid email or password. You can use the preset quick accounts below.');
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
        background: 'radial-gradient(ellipse, rgba(30, 64, 175, 0.16) 0%, rgba(6, 182, 212, 0.04) 45%, transparent 75%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: activeTab === 'portals' ? 1140 : 480,
        position: 'relative',
        zIndex: 10,
        transition: 'max-width 0.3s ease',
      }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <div style={{
              width: 50, height: 50, borderRadius: 14, margin: '0 auto 12px',
              background: 'linear-gradient(135deg, #1e40af 0%, #0284c7 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', color: '#ffffff',
              boxShadow: '0 8px 20px rgba(2, 132, 199, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}>
              ◈
            </div>
          </Link>
          <h1 style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 800,
            fontSize: '1.85rem',
            color: '#f0f4ff',
            letterSpacing: '-0.02em',
            marginBottom: 4,
          }}>
            COMPLYGEM <span style={{ color: '#0284c7' }}>AI</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: 500, margin: '0 auto' }}>
            Integrated Bid Compliance Verification Platform · Government of India
          </p>
        </div>

        {/* Tab Switcher: Role Portals vs Manual Sign-in */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 28,
        }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.9)',
            padding: '4px',
            borderRadius: '30px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'inline-flex',
            gap: 4,
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('portals')}
              style={{
                padding: '8px 20px',
                borderRadius: '24px',
                border: 'none',
                background: activeTab === 'portals' ? '#2563eb' : 'transparent',
                color: activeTab === 'portals' ? '#ffffff' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              ⚡ Select Access Portal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('credentials')}
              style={{
                padding: '8px 20px',
                borderRadius: '24px',
                border: 'none',
                background: activeTab === 'credentials' ? '#2563eb' : 'transparent',
                color: activeTab === 'credentials' ? '#ffffff' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              🔒 Email & Password Sign-In
            </button>
          </div>
        </div>

        {/* TAB 1: Role Portal Selector Cards */}
        {activeTab === 'portals' ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#3b82f6',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                background: 'rgba(59, 130, 246, 0.1)',
                padding: '4px 12px',
                borderRadius: '20px',
                border: '1px solid rgba(59, 130, 246, 0.25)',
              }}>
                Choose Your Role Portal to Enter
              </span>
            </div>

            <RolePortalSelector onSelectPreset={handleSelectPreset} />

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
        ) : (
          /* TAB 2: Direct Credentials Form */
          <div className="card" style={{ padding: '36px 32px' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#f0f4ff', marginBottom: 4 }}>
                Account Sign In
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                Enter registered email address and credentials
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
                  placeholder="officer@complygem.gov.in"
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

              {/* Remember me */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.78rem', color: '#94a3b8' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#3b82f6', width: 14, height: 14 }}
                  />
                  Remember me
                </label>
                <span
                  style={{ fontSize: '0.78rem', color: '#3b82f6', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => toast.success('Password reset instructions sent to your email.')}
                >
                  Forgot password?
                </span>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '0.9rem' }}
              >
                {loading ? '⟳ Signing in...' : 'Sign In to Account →'}
              </button>
            </form>

            {/* Quick Presets */}
            <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--bg-border)' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>
                ⚡ Quick Fill Presets
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: '0.72rem', padding: '5px 8px', color: '#3b82f6', background: 'rgba(59,130,246,0.06)' }}
                  onClick={() => handleSelectPreset('PROCUREMENT_OFFICER')}
                >
                  🏛️ Officer
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: '0.72rem', padding: '5px 8px', color: '#10b981', background: 'rgba(16,185,129,0.06)' }}
                  onClick={() => handleSelectPreset('BIDDER')}
                >
                  🏢 Bidder
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: '0.72rem', padding: '5px 8px', color: '#06b6d4', background: 'rgba(6,182,212,0.06)' }}
                  onClick={() => handleSelectPreset('AUDITOR')}
                >
                  🔍 Auditor
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: '0.72rem', padding: '5px 8px', color: '#ef4444', background: 'rgba(239,68,68,0.06)' }}
                  onClick={() => handleSelectPreset('ADMIN')}
                >
                  🛡️ Admin
                </button>
              </div>
            </div>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.82rem', color: '#64748b' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#3b82f6', fontWeight: 700 }}>Create an account</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
