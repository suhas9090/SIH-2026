import React from 'react';
import { AppLayout } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { profile, role, logout } = useAuth();

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            OFFICER ACCOUNT
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>
            Officer Profile & Security Settings
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Government authority identity, organization affiliation, and session management
          </p>
        </div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Profile Card */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #1e40af, #0891b2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', color: '#fff', fontWeight: 800,
            }}>
              {profile?.name?.[0] || 'O'}
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f0f4ff' }}>{profile?.name || 'Rajesh Kumar'}</h2>
              <div style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 700 }}>
                {role?.replace(/_/g, ' ')} · {profile?.organization || 'Ministry of Labour & Employment'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, borderTop: '1px solid var(--bg-border)', paddingTop: 16 }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>OFFICIAL GOVERNMENT EMAIL</label>
              <div style={{ color: '#f0f4ff', fontSize: '0.85rem', fontWeight: 600, marginTop: 2 }}>{profile?.email || 'rajesh.officer@labour.gov.in'}</div>
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>DESIGNATION</label>
              <div style={{ color: '#f0f4ff', fontSize: '0.85rem', fontWeight: 600, marginTop: 2 }}>Senior Procurement Officer (Level-11)</div>
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>ACCOUNT APPROVAL STATUS</label>
              <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 700, marginTop: 2 }}>● Verified & Active</div>
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>PORTAL ACCESS LEVEL</label>
              <div style={{ color: '#3b82f6', fontSize: '0.85rem', fontWeight: 600, marginTop: 2 }}>Full Tender & Procurement Authority</div>
            </div>
          </div>
        </div>

        {/* Security Settings Card */}
        <div className="card" style={{ padding: 24 }}>
          <span className="section-title" style={{ display: 'block', marginBottom: 14 }}>
            Security & Authentication Controls
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--bg-border)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#f0f4ff' }}>Two-Factor Authentication (2FA / TOTP)</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Hardware token / Authenticator app enabled for sensitive tender approvals</div>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 800 }}>ENABLED</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--bg-border)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#f0f4ff' }}>Active Device Session</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Windows 10 / Chrome · Localhost Session · Token refreshed</div>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 800 }}>ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
