import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * DemoBanner — Persistent warning shown on all protected pages when
 * the user is logged in as a demo account (not real Firebase auth).
 * 
 * Spec §32: "The UI must clearly indicate Demo Data where applicable.
 * Never make demo data appear to be live government data."
 */
export default function DemoBanner() {
  const { isDemoUser, profile } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!isDemoUser || dismissed) return null;

  return (
    <div style={styles.banner} role="alert" aria-live="polite">
      <div style={styles.left}>
        <span style={styles.icon}>🔶</span>
        <div>
          <span style={styles.title}>DEMO MODE</span>
          <span style={styles.separator}>—</span>
          <span style={styles.desc}>
            Mock Government Data Active · Not Live Verification ·{' '}
            Logged in as{' '}
            <strong style={{ color: '#fcd34d' }}>{profile?.role?.replace(/_/g, ' ')}</strong>
            {' '}({profile?.name})
          </span>
        </div>
      </div>
      <div style={styles.right}>
        <span style={styles.pill}>For Evaluation Only</span>
        <button
          style={styles.dismissBtn}
          onClick={() => setDismissed(true)}
          title="Dismiss banner for this session"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

const styles = {
  banner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    background: 'linear-gradient(90deg, #1c1400 0%, #1a0e00 100%)',
    borderBottom: '1px solid #92400e',
    padding: '9px 20px',
    flexWrap: 'wrap',
    zIndex: 200,
    position: 'sticky',
    top: 0,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    fontSize: '1rem',
    flexShrink: 0,
  },
  title: {
    color: '#f59e0b',
    fontWeight: 800,
    fontSize: '0.78rem',
    letterSpacing: '0.1em',
    marginRight: 6,
    fontFamily: "'Inter', sans-serif",
  },
  separator: {
    color: '#78350f',
    marginRight: 6,
    fontSize: '0.78rem',
  },
  desc: {
    color: '#d97706',
    fontSize: '0.78rem',
    fontFamily: "'Inter', sans-serif",
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  pill: {
    background: '#78350f',
    color: '#fde68a',
    borderRadius: 20,
    padding: '2px 10px',
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
  },
  dismissBtn: {
    background: 'transparent',
    border: '1px solid #78350f',
    color: '#d97706',
    borderRadius: 6,
    width: 24,
    height: 24,
    cursor: 'pointer',
    fontSize: '0.7rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
