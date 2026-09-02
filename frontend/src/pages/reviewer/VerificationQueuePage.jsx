import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/Sidebar';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  PENDING: { color: '#f59e0b', label: '⏳ Pending Review' },
  UNDER_REVIEW: { color: '#3b82f6', label: '🔍 Under Review' },
  VERIFIED: { color: '#10b981', label: '✓ Verified' },
  REJECTED: { color: '#ef4444', label: '✗ Rejected' },
  MISMATCH_DETECTED: { color: '#f59e0b', label: '⚠ Mismatch' },
  REUPLOAD_REQUIRED: { color: '#ef4444', label: '↑ Re-upload Required' },
  EXPIRED: { color: '#64748b', label: '⏰ Expired' },
};

const LIFECYCLE_COLORS = {
  DOCUMENT_VERIFICATION_PENDING: '#f59e0b',
  UNDER_OFFICER_REVIEW: '#3b82f6',
  CORRECTION_REQUIRED: '#ef4444',
  APPROVED_TO_BID: '#10b981',
};

export default function VerificationQueuePage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ queue: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/verification-officer/queue')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load verification queue.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.queue.filter(p =>
    !search || p.company?.legalName?.toLowerCase().includes(search.toLowerCase()) ||
    p.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = data.stats || {};

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>OFFICER CONSOLE</div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>Bidder Verification Queue</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Review and approve bidder verifications — oldest applications shown first</p>
        </div>
        <button className="btn-secondary" onClick={() => setLoading(true) || api.get('/verification-officer/queue').then(r => setData(r.data)).finally(() => setLoading(false))}>
          ↻ Refresh Queue
        </button>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'TOTAL PENDING', val: stats.totalPending || 0, color: '#f59e0b', icon: '⏳' },
            { label: 'NEW SUBMISSIONS', val: stats.newBidders || 0, color: '#3b82f6', icon: '📥' },
            { label: 'UNDER REVIEW', val: stats.underReview || 0, color: '#8b5cf6', icon: '🔍' },
            { label: 'DOCS PENDING REVIEW', val: stats.documentsPending || 0, color: '#ef4444', icon: '📋' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(15,23,42,0.8)', border: `1px solid ${s.color}25`, borderRadius: 14, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 700 }}>{s.label}</div>
                <span style={{ fontSize: '1.2rem' }}>{s.icon}</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input className="input" placeholder="Search by company name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 400 }} />
        </div>

        {/* Queue table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin-slow 1s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: '#64748b' }}>Loading verification queue...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '52px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✅</div>
            <h3 style={{ color: '#f0f4ff', fontWeight: 800, marginBottom: 8 }}>Queue is Clear</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No bidders are awaiting verification review at this time.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(p => {
              const lc = p.lifecycleStatus;
              const lcColor = LIFECYCLE_COLORS[lc] || '#64748b';
              const docsPending = (p.documents || []).filter(d => ['PENDING', 'UNDER_REVIEW'].includes(d.verificationStatus)).length;
              const docsRejected = (p.documents || []).filter(d => ['REJECTED', 'MISMATCH_DETECTED'].includes(d.verificationStatus)).length;
              const daysPending = Math.ceil((new Date() - new Date(p.updatedAt || p.createdAt)) / (1000 * 60 * 60 * 24));
              return (
                <div key={p.id} style={{ background: 'rgba(15,23,42,0.8)', border: `1px solid ${lcColor}25`, borderRadius: 14, padding: '18px 22px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}
                  onClick={() => navigate(`/reviewer/bidder/${p.id}`)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = lcColor + '50'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = lcColor + '25'}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 800, color: '#f0f4ff', fontSize: '0.95rem', marginBottom: 3 }}>
                      {p.company?.legalName || p.user?.name || 'Unknown Company'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {p.user?.email} · {p.company?.companyType || 'Company type not set'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: 2 }}>
                      Submitted {daysPending === 0 ? 'today' : `${daysPending} day${daysPending !== 1 ? 's' : ''} ago`} · {p._count?.documents || 0} documents
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    {docsPending > 0 && <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '3px 10px', borderRadius: 10 }}>{docsPending} pending docs</span>}
                    {docsRejected > 0 && <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '3px 10px', borderRadius: 10 }}>{docsRejected} rejected</span>}
                    {daysPending >= 3 && <span style={{ fontSize: '0.65rem', color: '#ef4444', background: 'rgba(239,68,68,0.08)', padding: '2px 8px', borderRadius: 8, fontWeight: 700 }}>⚡ HIGH PRIORITY</span>}
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: lcColor, background: `${lcColor}15`, padding: '4px 12px', borderRadius: 12, border: `1px solid ${lcColor}30` }}>
                      {lc.replace(/_/g, ' ')}
                    </span>
                    <span style={{ color: '#3b82f6', fontSize: '0.8rem', fontWeight: 700 }}>Review →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
