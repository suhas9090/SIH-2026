import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const PendingApprovalPage = () => {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--gradient-hero)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div className="card" style={{ maxWidth: 480, width: '100%', textAlign: 'center', padding: 36 }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>⏳</div>
        <h1 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#f59e0b', marginBottom: 12 }}>
          Account Pending Administrator Approval
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: 20 }}>
          Your request for <strong style={{ color: '#f0f4ff' }}>{profile?.role?.replace(/_/g, ' ') || 'Government Access'}</strong> has been recorded and is currently under review by the ComplyGeM Administrator.
        </p>
        <div style={{
          padding: '12px 16px', background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, marginBottom: 24,
          fontSize: '0.78rem', color: '#94a3b8', textAlign: 'left',
        }}>
          <div>• You will receive an official email notification upon authorization.</div>
          <div style={{ marginTop: 6 }}>• Ensure your official domain email address has been verified.</div>
        </div>
        <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={async () => { await logout(); navigate('/login'); }}>
          ← Sign Out / Return to Login
        </button>
      </div>
    </div>
  );
};

export const AccountSuspendedPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--gradient-hero)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div className="card" style={{ maxWidth: 480, width: '100%', textAlign: 'center', padding: 36, border: '1px solid rgba(239,68,68,0.4)' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🚫</div>
        <h1 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#ef4444', marginBottom: 12 }}>
          Account Access Suspended
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: 24 }}>
          Your account has been deactivated or suspended by the platform administrator. For security reasons, access to procurement services has been revoked.
        </p>
        <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={async () => { await logout(); navigate('/login'); }}>
          ← Sign Out
        </button>
      </div>
    </div>
  );
};

export const Forbidden403Page = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--gradient-hero)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div className="card" style={{ maxWidth: 480, width: '100%', textAlign: 'center', padding: 36 }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🛡️</div>
        <h1 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#f0f4ff', marginBottom: 8 }}>
          403 — Access Forbidden
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: 24 }}>
          You do not have the required permissions or custom role claims to access this resource.
        </p>
        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/dashboard')}>
          ← Return to Your Dashboard
        </button>
      </div>
    </div>
  );
};
