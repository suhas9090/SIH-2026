import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/Sidebar';
import { tenderAPI } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_COLOR = {
  ACTIVE: '#059669',
  PROCESSING: '#2563eb',
  DRAFT: '#64748b',
  CLOSED: '#dc2626',
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
          <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.04em' }}>
            PROCUREMENT REGISTRY
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.45rem', color: '#0f172a', marginBottom: 4 }}>
            Tender Management & Bidding Portfolios
          </h1>
          <p style={{ color: '#475569', fontSize: '0.88rem' }}>
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
                  padding: '7px 15px', borderRadius: 8, cursor: 'pointer',
                  fontSize: '0.8rem', fontWeight: 700,
                  background: statusFilter === tab.key ? '#eff6ff' : '#ffffff',
                  color: statusFilter === tab.key ? '#1d4ed8' : '#475569',
                  border: `1px solid ${statusFilter === tab.key ? '#bfdbfe' : '#e2e8f0'}`,
                  boxShadow: statusFilter === tab.key ? '0 2px 6px rgba(37,99,235,0.1)' : '0 1px 2px rgba(0,0,0,0.02)',
                  transition: 'all 0.15s ease'
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
              style={{ width: 280, fontSize: '0.82rem' }}
            />
            <div style={{ display: 'flex', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, padding: 3 }}>
              <button
                onClick={() => setViewMode('TABLE')}
                style={{
                  padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: viewMode === 'TABLE' ? '#ffffff' : 'transparent',
                  color: viewMode === 'TABLE' ? '#1d4ed8' : '#64748b', fontSize: '0.78rem', fontWeight: 800,
                  boxShadow: viewMode === 'TABLE' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('CARDS')}
                style={{
                  padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: viewMode === 'CARDS' ? '#ffffff' : 'transparent',
                  color: viewMode === 'CARDS' ? '#1d4ed8' : '#64748b', fontSize: '0.78rem', fontWeight: 800,
                  boxShadow: viewMode === 'CARDS' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
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
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>No Tenders Found</h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', maxWidth: 420, margin: '0 auto 20px' }}>
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
                      <td style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.82rem', color: '#2563eb' }}>
                        {t.referenceNo}
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>{t.title}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>{t.organization} {t.department ? `· ${t.department}` : ''}</div>
                      </td>
                      <td style={{ fontWeight: 800, color: '#059669', fontSize: '0.84rem' }}>
                        {t.estimatedValue ? `₹${(t.estimatedValue / 10000000).toFixed(2)} Cr` : '—'}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 700 }}>
                        {t.closingDate ? format(new Date(t.closingDate), 'dd MMM yyyy') : 'N/A'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '3px 10px', borderRadius: 12, fontWeight: 800, fontSize: '0.78rem' }}>
                          {t._count?.bidders || t.bidders?.length || 0}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          background: `${STATUS_COLOR[t.status] || '#64748b'}15`, color: STATUS_COLOR[t.status] || '#64748b',
                          border: `1px solid ${STATUS_COLOR[t.status] || '#64748b'}35`,
                          padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 800,
                        }}>
                          {t.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-secondary" style={{ fontSize: '0.74rem', padding: '4px 10px' }} onClick={() => navigate(`/tenders/${t.id}`)}>
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
                    background: `${STATUS_COLOR[tender.status]}15`, color: STATUS_COLOR[tender.status],
                    border: `1px solid ${STATUS_COLOR[tender.status]}35`,
                    padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 800
                  }}>{tender.status}</span>
                  <span style={{ fontSize: '0.76rem', color: '#64748b', fontFamily: 'monospace', fontWeight: 700 }}>{tender.referenceNo}</span>
                </div>

                <h3 style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a', marginBottom: 6, lineHeight: 1.4 }}>{tender.title}</h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 16 }}>{tender.organization} {tender.department ? `— ${tender.department}` : ''}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16, borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 800, marginBottom: 2 }}>VALUE</div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                      {tender.estimatedValue ? `₹${(tender.estimatedValue / 10000000).toFixed(1)} Cr` : '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 800, marginBottom: 2 }}>BIDDERS</div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#2563eb' }}>{tender._count?.bidders || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 800, marginBottom: 2 }}>REQUIREMENTS</div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: tender._count?.requirements ? '#059669' : '#d97706' }}>
                      {tender._count?.requirements || 'Extract'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
                    Closes: {tender.closingDate ? format(new Date(tender.closingDate), 'dd MMM yyyy') : 'N/A'}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: '#2563eb', fontWeight: 800 }}>Inspect Bids →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
