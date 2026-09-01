import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth, DEMO_PROFILES } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import DemoBanner from './DemoBanner';

// 5-Role Distinct Navigation Menus
const ROLE_NAV_ITEMS = {
  ADMIN: [
    { path: '/dashboard',      icon: '⊞', label: 'Platform Dashboard' },
    { path: '/admin',          icon: '👥', label: 'User Management' },
    { path: '/admin?tab=rbac', icon: '🛡️', label: 'Roles & Permissions' },
    { path: '/admin?tab=integrations', icon: '🔌', label: 'Integrations (GST/PAN)' },
    { path: '/admin?tab=ai',   icon: '🧠', label: 'AI & Verification Ops' },
    { path: '/tenders',        icon: '📋', label: 'Tender Monitoring' },
    { path: '/audit',          icon: '📜', label: 'System Audit Logs' },
    { path: '/admin?tab=security', icon: '🔒', label: 'Security & Access' },
  ],
  PROCUREMENT_OFFICER: [
    { path: '/dashboard',      icon: '⊞', label: 'Dashboard' },
    { path: '/tenders',        icon: '📋', label: 'Tenders (All / Active)' },
    { path: '/tenders/create', icon: '＋', label: 'Create Tender' },
    { path: '/bids',           icon: '📥', label: 'Bids Received' },
    { path: '/risk-alerts',    icon: '⚠️', label: 'Risk & Alerts' },
    { path: '/reports',        icon: '📊', label: 'Compliance Reports' },
    { path: '/audit',          icon: '📜', label: 'Audit Trail' },
    { path: '/notifications',  icon: '🔔', label: 'Notifications' },
    { path: '/profile',        icon: '👤', label: 'Officer Profile' },
  ],
  REVIEWER: [
    { path: '/dashboard',             icon: '⊞', label: 'Verification Dashboard' },
    { path: '/auditor/queue',         icon: '🔍', label: 'Verification Queue' },
    { path: '/compliance/4c57ba4b-7854-4dbf-b0fc-ac987e46f9bf', icon: '⚖️', label: '3-Panel Workspace' },
    { path: '/auditor/comparison',    icon: '📑', label: 'Cross-Doc Matrix' },
    { path: '/auditor/disputed',      icon: '💡', label: 'Disputed Results' },
    { path: '/auditor/completed',     icon: '✓', label: 'Completed Reviews' },
    { path: '/risk-alerts',           icon: '⚠️', label: 'Risk Flags & Alerts' },
    { path: '/audit',                 icon: '📜', label: 'Audit Trail' },
    { path: '/reports',               icon: '📊', label: 'Official Reports' },
  ],
  BIDDER: [
    { path: '/dashboard',             icon: '⊞', label: 'Supplier Dashboard' },
    { path: '/bidder/tenders',        icon: '🔎', label: 'Browse Tenders' },
    { path: '/bidder/my-bids',        icon: '📤', label: 'My Bids & Tracking' },
    { path: '/bidder/documents',      icon: '📁', label: 'Company Documents' },
    { path: '/bidder/compliance',     icon: '📊', label: 'Compliance Status' },
    { path: '/bidder/clarifications', icon: '✍️', label: 'Clarification Requests' },
    { path: '/notifications',         icon: '🔔', label: 'Notifications' },
    { path: '/bidder/profile',        icon: '🏢', label: 'Company Profile' },
  ],
  AUDITOR: [
    { path: '/dashboard',             icon: '⊞', label: 'Auditor Overview' },
    { path: '/auditor/queue',         icon: '🔍', label: 'Verification Queue' },
    { path: '/compliance/4c57ba4b-7854-4dbf-b0fc-ac987e46f9bf', icon: '⚖️', label: '3-Panel Evidence Viewer' },
    { path: '/auditor/comparison',    icon: '📑', label: 'Cross-Doc Matrix' },
    { path: '/auditor/disputed',      icon: '💡', label: 'Disputed Results' },
    { path: '/auditor/completed',     icon: '✓', label: 'Completed Reviews' },
    { path: '/reports',               icon: '📊', label: 'Compliance Records' },
    { path: '/audit',                 icon: '📜', label: 'Decision Traceability' },
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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (e) {
      toast.error('Logout failed');
    }
  };

  const navItems = ROLE_NAV_ITEMS[role] || ROLE_NAV_ITEMS.PROCUREMENT_OFFICER;
  const currentRoleMeta = ROLE_META[role] || ROLE_META.PROCUREMENT_OFFICER;

  return (
    <div className="sidebar" style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--bg-border)' }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--bg-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, #1e40af, #0891b2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', flexShrink: 0,
          }}>⚖</div>
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#f0f4ff', letterSpacing: '-0.02em' }}>
              ComplyGeM
            </div>
            <div style={{ fontSize: '0.62rem', color: '#3b82f6', fontWeight: 700, letterSpacing: '0.08em' }}>
              SIH26100 · GeM AI
            </div>
          </div>
        </div>

        {/* User Identity Profile Card */}
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              padding: '10px 12px', borderRadius: 8,
              background: currentRoleMeta.bg, border: `1px solid ${currentRoleMeta.color}40`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{currentRoleMeta.icon}</span>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: currentRoleMeta.color }}>
                {currentRoleMeta.label}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#f0f4ff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.name || user?.displayName || 'Authorized User'}
              </div>
              <div style={{ fontSize: '0.62rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.organization || 'GeM Portal'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div style={{ padding: '14px 10px', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#4a6080', padding: '0 10px 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Navigation
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.path + item.label}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
              borderRadius: 8, textDecoration: 'none', color: '#94a3b8', fontSize: '0.82rem',
              fontWeight: 600, marginBottom: 2, transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: '1rem', width: 20, textAlign: 'center' }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* User Profile & Logout */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid var(--bg-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: currentRoleMeta.bg, border: `1px solid ${currentRoleMeta.color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.85rem', color: currentRoleMeta.color, fontWeight: 700,
          }}>
            {profile?.name?.[0] || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#f0f4ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.name || 'Authorized User'}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.organization || 'GeM Portal'}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '6px 12px', borderRadius: 6,
            border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)',
            color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <span>⏻</span> Sign Out
        </button>
      </div>
    </div>
  );
};

export const AppLayout = ({ children }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
        <DemoBanner />
        <main style={{ flex: 1 }}>{children}</main>
      </div>
    </div>
  );
};

export default Sidebar;
