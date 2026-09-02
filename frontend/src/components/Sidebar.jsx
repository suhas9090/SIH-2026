import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth, DEMO_PROFILES } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';

// 5-Role Distinct Navigation Menus
const ROLE_NAV_ITEMS = {
  ADMIN: [
    { path: '/dashboard',      label: 'Platform Dashboard' },
    { path: '/admin',          label: 'User Management' },
    { path: '/admin?tab=rbac', label: 'Roles & Permissions' },
    { path: '/admin?tab=integrations', label: 'Integrations (GST/PAN)' },
    { path: '/admin?tab=ai',   label: 'AI & Verification Ops' },
    { path: '/tenders',        label: 'Tender Monitoring' },
    { path: '/audit',          label: 'System Audit Logs' },
    { path: '/admin?tab=security', label: 'Security & Access' },
  ],
  PROCUREMENT_OFFICER: [
    { path: '/dashboard',      label: 'Dashboard' },
    { path: '/procurement/verify-company-profiles', label: 'Verify Company Profiles' },
    { path: '/tenders',        label: 'Tenders (All / Active)' },
    { path: '/tenders/create', label: 'Create Tender' },
    { path: '/bids',           label: 'Bids Received' },
    { path: '/risk-alerts',    label: 'Risk & Alerts' },
    { path: '/reports',        label: 'Compliance Reports' },
    { path: '/profile',        label: 'Officer Profile' },
  ],
  REVIEWER: [
    { path: '/dashboard',                    label: 'Verification Dashboard' },
    { path: '/reviewer/verification-queue',  label: 'Bidder Verification Queue', badge: 'NEW' },
    { path: '/auditor/queue',                label: 'Document Review Queue' },
    { path: '/compliance/4c57ba4b-7854-4dbf-b0fc-ac987e46f9bf', label: '3-Panel Workspace' },
    { path: '/auditor/comparison',           label: 'Cross-Doc Matrix' },
    { path: '/auditor/disputed',             label: 'Disputed Results' },
    { path: '/auditor/completed',            label: 'Completed Reviews' },
    { path: '/risk-alerts',                  label: 'Risk Flags & Alerts' },
    { path: '/audit',                        label: 'Audit Trail' },
    { path: '/reports',                      label: 'Official Reports' },
  ],
  BIDDER: [
    { path: '/dashboard',              label: 'Supplier Dashboard' },
    { path: '/bidder/profile',         label: 'Company Profile & Documents' },
    { path: '/bidder/tenders',         label: 'Browse Tenders' },
    { path: '/bidder/my-bids',         label: 'My Bids & Tracking' },
    { path: '/notifications',          label: 'Notifications' },
  ],
  AUDITOR: [
    { path: '/dashboard',             label: 'Auditor Overview' },
    { path: '/auditor/queue',         label: 'Verification Queue' },
    { path: '/compliance/4c57ba4b-7854-4dbf-b0fc-ac987e46f9bf', label: '3-Panel Evidence Viewer' },
    { path: '/auditor/comparison',    label: 'Cross-Doc Matrix' },
    { path: '/auditor/disputed',      label: 'Disputed Results' },
    { path: '/auditor/completed',     label: 'Completed Reviews' },
    { path: '/reports',               label: 'Compliance Records' },
    { path: '/audit',                 label: 'Decision Traceability' },
  ],
};

const ROLE_META = {
  ADMIN:               { label: 'System Administrator', icon: '🛡️', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', desc: 'Platform health, users & security' },
  PROCUREMENT_OFFICER: { label: 'Procurement Officer', icon: '🏛️', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', desc: 'Tenders, bids & procurement assessments' },
  REVIEWER:            { label: 'Compliance Officer',  icon: '🔍', color: '#10b981', bg: 'rgba(16,185,129,0.15)', desc: 'Evidence examination, OCR & rule checks' },
  BIDDER:              { label: 'Bidder (Supplier)',   icon: '🏢', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', desc: 'Document uploads & submission tracking' },
  AUDITOR:             { label: 'Independent Auditor', icon: '⚖️', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)', desc: 'Read-only traceability & compliance oversight' },
};

const Sidebar = () => {
  const { profile, logout, role, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [bidderLifecycle, setBidderLifecycle] = useState(null);

  // Fetch bidder lifecycle status to show onboarding banner
  useEffect(() => {
    if (role === 'BIDDER') {
      api.get('/bidder-onboarding/verification-status')
        .then(r => setBidderLifecycle(r.data?.lifecycleStatus || 'REGISTERED'))
        .catch(() => setBidderLifecycle('REGISTERED'));
    }
  }, [role]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (e) {
      toast.error('Logout failed');
    }
  };

  // For bidder: hide REQUIRED badge once approved
  const isApproved = bidderLifecycle === 'APPROVED_TO_BID';
  const navItems = (ROLE_NAV_ITEMS[role] || ROLE_NAV_ITEMS.PROCUREMENT_OFFICER).map(item => {
    if (item.badge === 'REQUIRED' && isApproved) return { ...item, badge: undefined };
    return item;
  });
  const currentRoleMeta = ROLE_META[role] || ROLE_META.PROCUREMENT_OFFICER;

  return (
    <div className="sidebar" style={{ background: '#ffffff', borderRight: '1px solid #e2e8f0' }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="/complygem_logo.png"
            alt="ComplyGeM Logo"
            style={{
              width: 36, height: 36, borderRadius: 8,
              objectFit: 'contain',
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.02em' }}>
              COMPLYGEM <span style={{ color: '#2563eb' }}>AI</span>
            </div>
            <div style={{ fontSize: '0.62rem', color: '#2563eb', fontWeight: 800, letterSpacing: '0.06em' }}>
              PUBLIC PROCUREMENT AI
            </div>
          </div>
        </div>

        {/* User Identity Profile Card */}
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              padding: '10px 12px', borderRadius: 10,
              background: currentRoleMeta.bg || '#eff6ff', border: `1px solid ${currentRoleMeta.color || '#2563eb'}30`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{currentRoleMeta.icon}</span>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: currentRoleMeta.color }}>
                {currentRoleMeta.label}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#0f172a', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.name || user?.displayName || 'Authorized User'}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.organization || 'Central Procurement Division'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div style={{ padding: '14px 10px', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', padding: '0 10px 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Menu
        </div>

        {/* Bidder Onboarding Nudge Banner */}
        {role === 'BIDDER' && bidderLifecycle && bidderLifecycle !== 'APPROVED_TO_BID' && (
          <div
            onClick={() => navigate('/bidder/onboarding')}
            style={{
              margin: '0 4px 12px', padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
              background: '#fef3c7',
              border: '1px solid #fde68a',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#b45309', marginBottom: 3 }}>⚠️ Verification In Progress</div>
            <div style={{ fontSize: '0.65rem', color: '#78350f', lineHeight: 1.4 }}>
              Complete statutory profile & document verification to participate in tenders.
            </div>
            <div style={{ marginTop: 6, fontSize: '0.68rem', fontWeight: 800, color: '#d97706' }}>Complete Verification →</div>
          </div>
        )}
        {role === 'BIDDER' && bidderLifecycle === 'APPROVED_TO_BID' && (
          <div style={{ margin: '0 4px 12px', padding: '8px 12px', borderRadius: 10, background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#059669' }}>✓ Verified Bidder</div>
            <div style={{ fontSize: '0.65rem', color: '#065f46', marginTop: 2 }}>Eligible to participate in all tenders</div>
          </div>
        )}

        {navItems.map((item) => {
          const isLocked = role === 'BIDDER' && !isApproved && item.path !== '/bidder/onboarding' && item.path !== '/bidder/verification-status';
          return (
            <NavLink
              key={item.path + item.label}
              to={isLocked ? '/bidder/onboarding' : item.path}
              onClick={(e) => {
                if (isLocked) {
                  e.preventDefault();
                  toast.error('🔒 Complete identity & company verification to unlock this feature.');
                  navigate('/bidder/onboarding');
                }
              }}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px',
                borderRadius: 8, textDecoration: 'none',
                color: isActive ? '#1d4ed8' : isLocked ? '#94a3b8' : '#334155',
                background: isActive ? '#eff6ff' : 'transparent',
                border: `1px solid ${isActive ? '#bfdbfe' : 'transparent'}`,
                fontSize: '0.85rem',
                fontWeight: isActive ? 700 : 600,
                marginBottom: 3, transition: 'all 0.15s',
                opacity: isLocked ? 0.6 : 1,
                cursor: isLocked ? 'not-allowed' : 'pointer'
              })}
            >
              <span style={{ flex: 1 }}>{item.label}</span>
              {isLocked ? (
                <span style={{
                  fontSize: '0.55rem', fontWeight: 900, padding: '2px 6px', borderRadius: 6,
                  color: '#64748b', background: '#f1f5f9',
                  border: '1px solid #e2e8f0', letterSpacing: '0.04em'
                }}>LOCKED</span>
              ) : item.badge ? (
                <span style={{
                  fontSize: '0.55rem', fontWeight: 900, padding: '2px 6px', borderRadius: 6,
                  color: item.badge === 'REQUIRED' ? '#b45309' : '#1d4ed8',
                  background: item.badge === 'REQUIRED' ? '#fef3c7' : '#dbeafe',
                  border: `1px solid ${item.badge === 'REQUIRED' ? '#fde68a' : '#bfdbfe'}`,
                  letterSpacing: '0.04em',
                }}>{item.badge}</span>
              ) : null}
            </NavLink>
          );
        })}
      </div>

      {/* User Profile & Logout */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#e2e8f0', border: '1px solid #cbd5e1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.85rem', color: '#1e293b', fontWeight: 800,
          }}>
            {profile?.name?.[0] || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.name || 'Authorized User'}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.organization || 'Central Procurement Division'}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '7px 12px', borderRadius: 8,
            border: '1px solid #fecaca', background: '#fef2f2',
            color: '#dc2626', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
          onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
        >
          <span>⏻</span> Sign Out
        </button>
      </div>
    </div>
  );
};

export const AppLayout = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
        {/* Universal Top Action & Back Navigation Bar */}
        <div style={{
          padding: '10px 24px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
        }}>
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/dashboard');
              }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '20px',
              padding: '5px 14px',
              color: '#334155',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.borderColor = '#94a3b8';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.color = '#334155';
            }}
          >
            <span style={{ fontSize: '0.9rem' }}>←</span> Back
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/complygem_logo.png"
              alt="ComplyGeM Logo"
              style={{ width: 22, height: 22, borderRadius: 6, objectFit: 'contain' }}
            />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', letterSpacing: '0.04em' }}>
              COMPLYGEM <span style={{ color: '#2563eb' }}>AI</span> VERIFICATION
            </span>
          </div>
        </div>

        <main style={{ flex: 1, background: '#f8fafc' }}>{children}</main>
      </div>
    </div>
  );
};

export default Sidebar;
