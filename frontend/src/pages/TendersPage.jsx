import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/Sidebar';
import { tenderAPI } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_COLOR = { ACTIVE: '#10b981', PROCESSING: '#3b82f6', DRAFT: '#64748b', CLOSED: '#64748b' };
const DEMO_TENDERS = [
  { id: 't1', referenceNo: 'TND-2026-001', title: 'Supply of Industrial Safety Equipment', organization: 'Ministry of Labour', department: 'Factories & Boilers', status: 'ACTIVE', estimatedValue: 50000000, closingDate: new Date(Date.now() + 7*86400000), _count: { bidders: 5, requirements: 7 } },
  { id: 't2', referenceNo: 'TND-2026-002', title: 'IT Infrastructure Procurement', organization: 'NIC', department: 'IT Division', status: 'PROCESSING', estimatedValue: 20000000, closingDate: new Date(Date.now() + 14*86400000), _count: { bidders: 3, requirements: 0 } },
  { id: 't3', referenceNo: 'TND-2026-003', title: 'Office Furniture Supply', organization: 'PWD', department: 'Procurement', status: 'ACTIVE', estimatedValue: 10000000, closingDate: new Date(Date.now() + 21*86400000), _count: { bidders: 8, requirements: 5 } },
];

export default function TendersPage() {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState(DEMO_TENDERS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await tenderAPI.list({ search, status: statusFilter });
        if (res.data.tenders?.length) setTenders(res.data.tenders);
      } catch { /* use demo */ }
    };
    fetch();
  }, [search, statusFilter]);

  const filtered = tenders.filter(t =>
    (!search || t.title.toLowerCase().includes(search.toLowerCase()) || t.referenceNo.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || t.status === statusFilter)
  );

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>Tenders</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Manage procurement tenders and bidder compliance</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/tenders/create')}>+ Create Tender</button>
      </div>

      <div style={{ padding: '28px 32px' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <input className="input" placeholder="Search tenders..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 360 }} />
          <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 160 }}>
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PROCESSING">Processing</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {/* Cards */}
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
                <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600 }}>View details →</span>
              </div>
            </div>
          ))}
        </div>

        {!filtered.length && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#4a6080' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📋</div>
            <p style={{ fontSize: '1rem', color: '#64748b' }}>No tenders found</p>
            <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/tenders/create')}>
              + Create your first tender
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
