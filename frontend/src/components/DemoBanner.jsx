import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * DemoBanner — Warning shown when the user is in demo mode.
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
            Mock Government Data Active · Logged in as{' '}
            <strong style={{ color: '#b45309' }}>{profile?.role?.replace(/_/g, ' ')}</strong>
            {' '}({profile?.name})
          </span>
        </div>
      </div>
      <div style={styles.right}>
        <span style={styles.pill}>Evaluation Environment</span>
        <button
          style={styles.dismissBtn}
          onClick={() => setDismissed(true)}
          title="Dismiss banner"
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
    background: '#fffbeb',
    borderBottom: '1px solid #fde68a',
    padding: '8px 20px',
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
    color: '#b45309',
    fontWeight: 800,
    fontSize: '0.76rem',
    letterSpacing: '0.08em',
    marginRight: 6,
  },
  separator: {
    color: '#d97706',
    marginRight: 6,
    fontSize: '0.76rem',
  },
  desc: {
    color: '#78350f',
    fontSize: '0.78rem',
    fontWeight: 600,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  pill: {
    background: '#fef3c7',
    border: '1px solid #fde68a',
    color: '#92400e',
    borderRadius: 20,
    padding: '2px 10px',
    fontSize: '0.7rem',
    fontWeight: 800,
    letterSpacing: '0.04em',
  },
  dismissBtn: {
    background: 'transparent',
    border: '1px solid #fde68a',
    color: '#b45309',
    borderRadius: 6,
    width: 24,
    height: 24,
    cursor: 'pointer',
    fontSize: '0.72rem',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
