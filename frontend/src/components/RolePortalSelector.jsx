import React from 'react';
import { useNavigate } from 'react-router-dom';

export const PORTAL_ROLES = [
  {
    id: 'PROCUREMENT_OFFICER',
    roleKey: 'PROCUREMENT_OFFICER',
    title: 'Procurement Officer',
    badge: '🏛️',
    description: 'Publish tenders, manage bid submissions, review automated scorecards, and finalize evaluations.',
    color: '#2563eb',
    lightBg: 'rgba(37, 99, 235, 0.12)',
    borderHover: 'rgba(37, 99, 235, 0.4)',
    btnColor: '#2563eb',
    btnHover: '#1d4ed8',
    btnText: 'Officer Login',
    path: '/procurement/dashboard',
    defaultEmail: 'officer@complygem.gov.in',
    demoName: 'Rajesh Kumar (Procurement Officer)',
    officerInfo: 'Ministry of Labour & Employment'
  },
  {
    id: 'BIDDER',
    roleKey: 'BIDDER',
    title: 'Bidder & Vendor',
    badge: '🏢',
    description: 'Search active tenders, upload encrypted qualification documents, and track compliance verification.',
    color: '#059669',
    lightBg: 'rgba(5, 150, 105, 0.12)',
    borderHover: 'rgba(5, 150, 105, 0.4)',
    btnColor: '#059669',
    btnHover: '#047857',
    btnText: 'Bidder Login',
    path: '/bidder/dashboard',
    defaultEmail: 'vendor@abcindustries.com',
    demoName: 'Vikram Mehta (Bidder / Supplier)',
    officerInfo: 'ABC Industries Pvt Ltd'
  },
  {
    id: 'AUDITOR',
    roleKey: 'AUDITOR',
    title: 'Compliance Auditor',
    badge: '🔍',
    description: 'Examine AI verification flags, cross-reference statutory citations, and perform human overrides.',
    color: '#0891b2',
    lightBg: 'rgba(8, 145, 178, 0.12)',
    borderHover: 'rgba(8, 145, 178, 0.4)',
    btnColor: '#0891b2',
    btnHover: '#0e7490',
    btnText: 'Auditor Login',
    path: '/auditor/dashboard',
    defaultEmail: 'auditor@complygem.gov.in',
    demoName: 'Justice S. Narayan (Auditor)',
    officerInfo: 'CAG / NIC Oversight'
  },
  {
    id: 'ADMIN',
    roleKey: 'ADMIN',
    title: 'System Administrator',
    badge: '🛡️',
    description: 'Govern platform security, manage RBAC permissions, approve officer accounts, and inspect audit trails.',
    color: '#dc2626',
    lightBg: 'rgba(220, 38, 38, 0.12)',
    borderHover: 'rgba(220, 38, 38, 0.4)',
    btnColor: '#dc2626',
    btnHover: '#b91c1c',
    btnText: 'Admin Login',
    path: '/admin/dashboard',
    defaultEmail: 'admin@complygem.gov.in',
    demoName: 'System Administrator',
    officerInfo: 'ComplyGeM Central Authority'
  }
];

export default function RolePortalSelector({ onSelectPortal }) {
  const navigate = useNavigate();

  const handlePortalClick = (portal) => {
    if (onSelectPortal) {
      onSelectPortal(portal);
    } else {
      navigate(`/login?portal=${portal.roleKey}`);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        alignItems: 'stretch',
      }}>
        {PORTAL_ROLES.map((portal) => (
          <div
            key={portal.id}
            className="portal-card"
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '28px 22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.borderColor = portal.borderHover;
              e.currentTarget.style.boxShadow = `0 18px 36px rgba(0, 0, 0, 0.45), 0 0 24px ${portal.lightBg}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.35)';
            }}
          >
            {/* Ambient Corner Glow */}
            <div style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: portal.lightBg,
              filter: 'blur(20px)',
              pointerEvents: 'none',
            }} />

            {/* Icon Badge */}
            <div style={{ marginBottom: 18 }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                margin: '0 auto',
                background: portal.lightBg,
                border: `1px solid ${portal.color}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                boxShadow: `0 4px 14px ${portal.lightBg}`,
              }}>
                {portal.badge}
              </div>
            </div>

            {/* Title & Description */}
            <div style={{ flex: 1, marginBottom: 22 }}>
              <h3 style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 800,
                fontSize: '1.2rem',
                color: '#f8fafc',
                marginBottom: 8,
                letterSpacing: '-0.01em',
              }}>
                {portal.title}
              </h3>
              <p style={{
                fontSize: '0.82rem',
                color: '#94a3b8',
                lineHeight: 1.55,
                margin: 0,
              }}>
                {portal.description}
              </p>
            </div>

            {/* Action Button: Opens Sign-In Page */}
            <div>
              <button
                type="button"
                onClick={() => handlePortalClick(portal)}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: '30px',
                  background: portal.btnColor,
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: `0 4px 14px ${portal.btnColor}40`,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = portal.btnHover;
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = portal.btnColor;
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <span>➜</span> {portal.btnText}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
