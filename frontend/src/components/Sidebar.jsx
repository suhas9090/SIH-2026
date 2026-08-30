import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// Role-specific navigation menus
const ROLE_NAV_ITEMS = {
  PROCUREMENT_OFFICER: [
    { path: '/dashboard',      icon: '⊞', label: 'Dashboard' },
    { path: '/tenders',        icon: '📋', label: 'Tenders' },
    { path: '/tenders/create', icon: '＋', label: 'Create Tender' },
    { path: '/reports',        icon: '📊', label: 'Compliance Reports' },
    { path: '/audit',          icon: '📜', label: 'Audit Trail' },
  ],
  REVIEWER: [
    { path: '/dashboard',      icon: '⊞', label: 'Dashboard' },
    { path: '/dashboard',      icon: '🔍', label: 'Review Queue' },
    { path: '/tenders',        icon: '📋', label: 'Tender Documents' },
    { path: '/reports',        icon: '📊', label: 'Evaluation Reports' },
    { path: '/audit',          icon: '📜', label: 'Audit Trail' },
  ],
  BIDDER: [
    { path: '/dashboard',      icon: '⊞', label: 'Dashboard' },
    { path: '/tenders',        icon: '🔎', label: 'Find Tenders' },
    { path: '/dashboard',      icon: '📤', label: 'My Submissions' },
    { path: '/reports',        icon: '📊', label: 'My Compliance' },
  ],
  ADMIN: [
    { path: '/dashboard',      icon: '⊞', label: 'Dashboard' },
    { path: '/admin',          icon: '👥', label: 'Users & Approvals' },
    { path: '/admin',          icon: '🛡️', label: 'Roles & RBAC' },
    { path: '/tenders',        icon: '📋', label: 'All Tenders' },
    { path: '/audit',          icon: '📜', label: 'System Audit Logs' },
  ],
};

const ROLE_META = {
  PROCUREMENT_OFFICER: { label: 'Procurement Officer', icon: '🏛️', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  REVIEWER:            { label: 'Reviewer / Evaluator', icon: '🔍', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  BIDDER:              { label: 'Bidder (Supplier)',   icon: '🏢', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  ADMIN:               { label: 'Administrator',       icon: '🛡️', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
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
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#f0f4ff', letterSpacing: '-0.02em' }}>
              ComplyGeM
            </div>
            <div style={{ fontSize: '0.65rem', color: '#3b82f6', fontWeight: 600, letterSpacing: '0.08em' }}>AI PLATFORM</div>
          </div>
        </div>

        {/* Demo Mode & Quick Role Switcher Banner */}
        <div style={{ marginTop: 12 }}>
          <div
            onClick={() => setShowRoleSwitcher(s => !s)}
            style={{
              padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
              background: currentRoleMeta.bg, border: `1px solid ${currentRoleMeta.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.9rem' }}>{currentRoleMeta.icon}</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: currentRoleMeta.color }}>
                {currentRoleMeta.label}
              </span>
            </div>
            <span style={{ fontSize: '0.65rem', color: currentRoleMeta.color }}>⚙ Switch</span>
          </div>

          {/* Persona Switcher Dropdown */}
          {showRoleSwitcher && (
            <div style={{
              marginTop: 6, padding: '8px', background: 'var(--bg-input)',
              border: '1px solid var(--bg-border)', borderRadius: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}>
              <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, paddingLeft: 4 }}>
                Switch Role Persona (SIH Demo)
              </div>
              {Object.entries(ROLE_META).map(([roleKey, meta]) => (
                <button
                  key={roleKey}
                  onClick={() => {
                    switchDemoRole(roleKey);
                    setShowRoleSwitcher(false);
                    toast.success(`Switched to ${meta.label}`);
                    navigate('/dashboard');
                  }}
                  style={{
                    width: '100%', padding: '6px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: role === roleKey ? meta.bg : 'transparent',
                    color: role === roleKey ? meta.color : '#94a3b8',
                    display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 600,
                    textAlign: 'left', marginBottom: 2, transition: 'all 0.15s',
                  }}
                  onMouseOver={e => role !== roleKey && (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseOut={e => role !== roleKey && (e.currentTarget.style.background = 'transparent')}
                >
                  <span>{meta.icon}</span>
                  <span style={{ flex: 1 }}>{meta.label}</span>
                  {role === roleKey && <span style={{ fontSize: '0.7rem' }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {navItems.map((item, idx) => (
          <NavLink
            key={`${item.path}-${idx}`}
            to={item.path}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span style={{ fontSize: '1rem' }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User profile */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--bg-border)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
          padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: `linear-gradient(135deg, ${currentRoleMeta.color}, #0891b2)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.875rem', fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {profile?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f0f4ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.name || 'User'}
            </div>
            <div style={{ fontSize: '0.65rem', color: currentRoleMeta.color, fontWeight: 700, letterSpacing: '0.04em' }}>
              {currentRoleMeta.label}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', color: '#ef4444' }}
        >
          <span>⏻</span> Sign Out
        </button>
      </div>
    </div>
  );
};

export const AppLayout = ({ children }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div className="main-content" style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  );
};

export default Sidebar;
