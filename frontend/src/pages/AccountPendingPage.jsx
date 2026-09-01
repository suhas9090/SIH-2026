import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AccountPendingPage() {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--gradient-hero)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div className="card" style={{ maxWidth: 540, width: '100%', textAlign: 'center', padding: 36 }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🟡</div>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 8 }}>
          Account Awaiting Administrative Approval
        </h1>
        <div style={{
          display: 'inline-block', padding: '4px 14px', borderRadius: 20,
          background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 800, fontSize: '0.78rem',
          marginBottom: 18, border: '1px solid rgba(245,158,11,0.3)',
        }}>
          STATUS: PENDING APPROVAL
        </div>

        <div style={{ textAlign: 'left', padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--bg-border)', marginBottom: 20 }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>REGISTERED IDENTITY</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f0f4ff', marginTop: 2 }}>{profile?.name || 'Registered User'}</div>
          <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>{profile?.email}</div>
          <div style={{ fontSize: '0.78rem', color: '#3b82f6', marginTop: 6 }}>
            Role: <strong>{profile?.role?.replace(/_/g, ' ') || 'BIDDER'}</strong> · {profile?.organization || 'Organization'}
          </div>
        </div>

        <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: 24 }}>
          Your registration has been submitted and is currently being verified by an authorized system administrator.
          Once approved, your account will be activated.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn-secondary" onClick={() => logout()}>
            Sign Out
          </button>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            ⟳ Check Status
          </button>
        </div>
      </div>
    </div>
  );
}
