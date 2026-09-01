import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/Sidebar';
import { tenderAPI } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_COLOR = {
  ACTIVE: '#10b981',
  PROCESSING: '#3b82f6',
  DRAFT: '#64748b',
  CLOSED: '#ef4444',
  ARCHIVED: '#475569',
};

export default function TendersPage() {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('TABLE'); // 'TABLE' or 'CARDS'

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await tenderAPI.list({ search, status: statusFilter === 'ALL' ? undefined : statusFilter });
        setTenders(res.data.tenders || []);
      } catch {
        setTenders([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [search, statusFilter]);

  const filtered = tenders.filter(t => {
    const matchesSearch = !search ||
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.referenceNo?.toLowerCase().includes(search.toLowerCase()) ||
      t.department?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' ||
      (statusFilter === 'CLOSING_SOON' ? (new Date(t.closingDate) - Date.now() < 5 * 86400000 && t.status === 'ACTIVE') : t.status === statusFilter);

    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            PROCUREMENT REGISTRY
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>
            Tender Management & Bidding Portfolios
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Monitor active tenders, submission deadlines, received bids, and AI-assisted compliance statuses
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={() => navigate('/tenders/create')}>
            + Create New Tender
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Filter Bar & Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { key: 'ALL', label: 'All Tenders' },
              { key: 'ACTIVE', label: 'Active Tenders' },
              { key: 'CLOSING_SOON', label: 'Closing Soon (≤ 5 Days)' },
              { key: 'CLOSED', label: 'Closed Tenders' },
              { key: 'DRAFT', label: 'Drafts' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: '0.78rem', fontWeight: 700,
                  background: statusFilter === tab.key ? '#1e3a5f' : 'rgba(255,255,255,0.03)',
                  color: statusFilter === tab.key ? '#60a5fa' : '#94a3b8',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              className="input"
              placeholder="Search by ID, title, ministry..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 280, fontSize: '0.8rem' }}
            />
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 2 }}>
              <button
                onClick={() => setViewMode('TABLE')}
                style={{
                  padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: viewMode === 'TABLE' ? '#1e3a5f' : 'transparent',
                  color: viewMode === 'TABLE' ? '#60a5fa' : '#64748b', fontSize: '0.75rem', fontWeight: 700
                }}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('CARDS')}
                style={{
                  padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: viewMode === 'CARDS' ? '#1e3a5f' : 'transparent',
                  color: viewMode === 'CARDS' ? '#60a5fa' : '#64748b', fontSize: '0.75rem', fontWeight: 700
                }}
              >
                Cards
              </button>
            </div>
          </div>
        </div>

        {/* ── EMPTY STATE ─────────────────────────────────────────────────── */}
        {filtered.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f0f4ff', marginBottom: 6 }}>No Tenders Found</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: 420, margin: '0 auto 20px' }}>
              You have not created any procurement tenders yet. Click the button below to publish your first tender.
            </p>
            <button className="btn-primary" onClick={() => navigate('/tenders/create')}>
              + Create Your First Tender
            </button>
          </div>
        )}

        {/* ── TABLE VIEW ──────────────────────────────────────────────────── */}
        {viewMode === 'TABLE' && filtered.length > 0 && (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Tender Reference</th>
                    <th>Tender Name & Ministry</th>
                    <th>Estimated Value</th>
                    <th>Closing Deadline</th>
                    <th style={{ textAlign: 'center' }}>Bids Received</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem', color: '#60a5fa' }}>
                        {t.referenceNo}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f0f4ff' }}>{t.title}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{t.organization} {t.department ? `· ${t.department}` : ''}</div>
                      </td>
                      <td style={{ fontWeight: 700, color: '#10b981', fontSize: '0.82rem' }}>
                        {t.estimatedValue ? `₹${(t.estimatedValue / 10000000).toFixed(2)} Cr` : '—'}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 600 }}>
                        {t.closingDate ? format(new Date(t.closingDate), 'dd MMM yyyy') : 'N/A'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', padding: '3px 10px', borderRadius: 12, fontWeight: 800, fontSize: '0.78rem' }}>
                          {t._count?.bidders || t.bidders?.length || 0}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          background: `${STATUS_COLOR[t.status] || '#64748b'}20`, color: STATUS_COLOR[t.status] || '#64748b',
                          border: `1px solid ${STATUS_COLOR[t.status] || '#64748b'}40`,
                          padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
                        }}>
                          {t.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '4px 8px' }} onClick={() => navigate(`/tenders/${t.id}`)}>
                            View Tender →
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CARDS VIEW ──────────────────────────────────────────────────── */}
        {viewMode === 'CARDS' && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {filtered.map(tender => (
              <div key={tender.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/tenders/${tender.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{
                    background: `${STATUS_COLOR[tender.status]}20`, color: STATUS_COLOR[tender.status],
                    border: `1px solid ${STATUS_COLOR[tender.status]}40`,
                    padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700
                  }}>{tender.status}</span>
                  <span style={{ fontSize: '0.75rem', color: '#4a6080', fontFamily: 'monospace' }}>{tender.referenceNo}</span>
                </div>

                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f0f4ff', marginBottom: 6, lineHeight: 1.4 }}>{tender.title}</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 16 }}>{tender.organization} {tender.department ? `— ${tender.department}` : ''}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16, borderTop: '1px solid var(--bg-border)', paddingTop: 14 }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#4a6080', marginBottom: 2 }}>VALUE</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f0f4ff' }}>
                      {tender.estimatedValue ? `₹${(tender.estimatedValue / 10000000).toFixed(1)} Cr` : '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#4a6080', marginBottom: 2 }}>BIDDERS</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#3b82f6' }}>{tender._count?.bidders || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#4a6080', marginBottom: 2 }}>REQUIREMENTS</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: tender._count?.requirements ? '#10b981' : '#f59e0b' }}>
                      {tender._count?.requirements || 'Extract'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#4a6080' }}>
                    Closes: {tender.closingDate ? format(new Date(tender.closingDate), 'dd MMM yyyy') : 'N/A'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600 }}>Inspect Bids →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
