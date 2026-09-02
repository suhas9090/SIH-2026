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
          <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
            OFFICER ACCOUNT
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.45rem', color: '#0f172a', marginBottom: 4 }}>
            Officer Profile & Security Settings
          </h1>
          <p style={{ color: '#475569', fontSize: '0.88rem' }}>
            Government authority identity, organization affiliation, and session management
          </p>
        </div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 840, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Profile Card */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #0284c7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', color: '#fff', fontWeight: 800,
              boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
            }}>
              {profile?.name?.[0] || 'O'}
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>{profile?.name || 'Rajesh Kumar'}</h2>
              <div style={{ fontSize: '0.82rem', color: '#2563eb', fontWeight: 800, marginTop: 2 }}>
                {role?.replace(/_/g, ' ')} · {profile?.organization || 'Ministry of Labour & Employment'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800 }}>OFFICIAL GOVERNMENT EMAIL</label>
              <div style={{ color: '#0f172a', fontSize: '0.88rem', fontWeight: 700, marginTop: 2 }}>{profile?.email || 'rajesh.officer@labour.gov.in'}</div>
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800 }}>DESIGNATION</label>
              <div style={{ color: '#0f172a', fontSize: '0.88rem', fontWeight: 700, marginTop: 2 }}>Senior Procurement Officer (Level-11)</div>
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800 }}>ACCOUNT APPROVAL STATUS</label>
              <div style={{ color: '#059669', fontSize: '0.88rem', fontWeight: 800, marginTop: 2 }}>● Verified & Active</div>
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800 }}>PORTAL ACCESS LEVEL</label>
              <div style={{ color: '#2563eb', fontSize: '0.88rem', fontWeight: 700, marginTop: 2 }}>Full Tender & Procurement Authority</div>
            </div>
          </div>
        </div>

        {/* Security Settings Card */}
        <div className="card" style={{ padding: 24 }}>
          <span className="section-title" style={{ display: 'block', marginBottom: 14 }}>
            Security & Authentication Controls
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0f172a' }}>Two-Factor Authentication (2FA / TOTP)</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Hardware token / Authenticator app enabled for sensitive tender approvals</div>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 800, background: '#ecfdf5', padding: '4px 10px', borderRadius: 8, border: '1px solid #a7f3d0' }}>ENABLED</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0f172a' }}>Active Device Session</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Windows 10 / Chrome · Localhost Session · Token refreshed</div>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#2563eb', fontWeight: 800, background: '#eff6ff', padding: '4px 10px', borderRadius: 8, border: '1px solid #bfdbfe' }}>ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
