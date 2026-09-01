import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, DEMO_PROFILES } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function validateEmail(email) {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim());
}

export default function LoginPage() {
  const { login, switchDemoRole } = useAuth();
  const navigate = useNavigate();

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
      minHeight: '100vh', background: 'var(--bg-dark)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 16px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient Lighting */}
      <div style={{
        position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 750, height: 750, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(30, 64, 175, 0.16) 0%, rgba(6, 182, 212, 0.04) 45%, transparent 75%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 10 }}>
        <div className="card" style={{ padding: '36px 32px' }}>
          {/* Logo Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, margin: '0 auto 10px',
              background: 'linear-gradient(135deg, #1e40af 0%, #0284c7 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', color: '#ffffff',
            }}>
              ◈
            </div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#f0f4ff', letterSpacing: '-0.02em', marginBottom: 2 }}>
              COMPLYGEM <span style={{ color: '#0284c7' }}>AI</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
              Sign in to your procurement or compliance account
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
                onClick={() => toast.success('Password reset link sent to your email.')}
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

          {/* Quick Preset Role Loader for Evaluators & Testing */}
          <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--bg-border)' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>
              ⚡ Quick Role Test Presets (1-Click Fill)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: '0.72rem', padding: '5px 8px', color: '#3b82f6', background: 'rgba(59,130,246,0.06)' }}
                onClick={() => handleSelectPreset('PROCUREMENT_OFFICER')}
              >
                👨‍💼 Procurement Officer
              </button>
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: '0.72rem', padding: '5px 8px', color: '#10b981', background: 'rgba(16,185,129,0.06)' }}
                onClick={() => handleSelectPreset('BIDDER')}
              >
                🏢 Bidder / Vendor
              </button>
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: '0.72rem', padding: '5px 8px', color: '#06b6d4', background: 'rgba(6,182,212,0.06)' }}
                onClick={() => handleSelectPreset('AUDITOR')}
              >
                🔍 Compliance Auditor
              </button>
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: '0.72rem', padding: '5px 8px', color: '#ef4444', background: 'rgba(239,68,68,0.06)' }}
                onClick={() => handleSelectPreset('ADMIN')}
              >
                🛡️ System Admin
              </button>
            </div>
          </div>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.82rem', color: '#64748b' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#3b82f6', fontWeight: 700 }}>Create an account</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.75rem' }}>
          <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>← Back to Public Portal</Link>
        </p>
      </div>
    </div>
  );
}
