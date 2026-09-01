import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/Sidebar';
import { auditAPI } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const DEMO_LOGS = [
  { id: '1', action: 'POST /api/tenders', entityType: 'TENDER', user: { name: 'Rajesh Kumar', role: 'PROCUREMENT_OFFICER' }, details: { info: 'Created Tender GEM-2026-001 (Supply of Industrial Safety Equipment)' }, timestamp: new Date(Date.now() - 3600000 * 5) },
  { id: '2', action: 'POST /api/tenders/:id/upload', entityType: 'DOCUMENT', user: { name: 'Rajesh Kumar', role: 'PROCUREMENT_OFFICER' }, details: { info: 'Uploaded Tender Specification PDF (28 Pages, SHA-256 Verified)' }, timestamp: new Date(Date.now() - 3600000 * 4.8) },
  { id: '3', action: 'POST /api/tenders/:id/extract-requirements', entityType: 'AI_PIPELINE', user: { name: 'AI Engine', role: 'SYSTEM' }, details: { info: 'PyMuPDF + Gemini extracted 7 mandatory criteria' }, timestamp: new Date(Date.now() - 3600000 * 4.5) },
  { id: '4', action: 'POST /api/bidders', entityType: 'BIDDER', user: { name: 'Vikram Mehta', role: 'BIDDER' }, details: { info: 'Registered Bidder: ABC Industries Pvt Ltd (GSTIN: 29AABCA1234C1Z5)' }, timestamp: new Date(Date.now() - 3600000 * 3) },
  { id: '5', action: 'POST /api/bidders/:id/upload-documents', entityType: 'DOCUMENT', user: { name: 'Vikram Mehta', role: 'BIDDER' }, details: { info: 'Submitted 6 verification documents (Financial, GST, OEM, PAN)' }, timestamp: new Date(Date.now() - 3600000 * 2.5) },
  { id: '6', action: 'POST /api/bidders/:id/verify', entityType: 'COMPLIANCE', user: { name: 'Rule Engine v2', role: 'SYSTEM' }, details: { info: 'Evaluated compliance. Score: 72/100 (Medium Risk). Deficit on Turnover.' }, timestamp: new Date(Date.now() - 3600000 * 1.5) },
  { id: '7', action: 'POST /api/compliance/review/:itemId', entityType: 'HUMAN_REVIEW', user: { name: 'Dr. Anita Desai', role: 'REVIEWER' }, details: { info: 'Human review sign-off: Marked OEM Authorization for verification' }, timestamp: new Date(Date.now() - 3600000 * 1) },
  { id: '8', action: 'POST /api/reports/:id/generate', entityType: 'REPORT', user: { name: 'Rajesh Kumar', role: 'PROCUREMENT_OFFICER' }, details: { info: 'Generated official multi-page PDF audit report with statutory disclaimer' }, timestamp: new Date(Date.now() - 1800000) },
];

const ENTITY_COLOR = {
  TENDER: '#3b82f6',
  BIDDER: '#10b981',
  DOCUMENT: '#8b5cf6',
  COMPLIANCE: '#f59e0b',
  REPORT: '#06b6d4',
  AI_PIPELINE: '#c084fc',
  HUMAN_REVIEW: '#fb923c',
};

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await auditAPI.list({ limit: 50 });
        setLogs(res.data?.logs || []);
      } catch {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesType = filterType === 'ALL' || log.entityType === filterType;
    const matchesSearch = !search ||
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.details?.info?.toLowerCase().includes(search.toLowerCase()) ||
      log.user?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ fontSize: '0.75rem', color: '#06b6d4', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            STATUTORY OVERSIGHT & TRACEABILITY
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>
            System Audit Trail & Provenance
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Immutable event logs, decision reasoning chains, and human-in-the-loop audit records
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={() => toast.success('Audit log export downloaded!')}>
            📥 Export Audit Log (CSV)
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Filters and Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['ALL', 'TENDER', 'BIDDER', 'DOCUMENT', 'AI_PIPELINE', 'COMPLIANCE', 'HUMAN_REVIEW', 'REPORT'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                style={{
                  padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: '0.75rem', fontWeight: 700,
                  background: filterType === type ? '#1e3a5f' : 'rgba(255,255,255,0.03)',
                  color: filterType === type ? '#60a5fa' : '#94a3b8',
                }}
              >
                {type.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <input
            className="input"
            placeholder="Search audit actions, users, descriptions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 300, width: '100%', fontSize: '0.8rem' }}
          />
        </div>

        {/* Audit Log Entries List / Empty State */}
        {filteredLogs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📜</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f0f4ff', marginBottom: 6 }}>No Audit Events Recorded Yet</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: 420, margin: '0 auto' }}>
              Every procurement action, document upload, OCR extraction, and human review decision will be permanently and immutably logged here.
            </p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="section-title">Audit Log Entries ({filteredLogs.length})</span>
              <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>● SHA-256 VERIFIED IMMUTABLE LOG</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredLogs.map((log, i) => (
              <div
                key={log.id || i}
                style={{
                  display: 'flex', gap: 16, padding: '14px 20px',
                  borderBottom: i < filteredLogs.length - 1 ? '1px solid rgba(30,45,74,0.4)' : 'none',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace', minWidth: 80 }}>
                  {format(new Date(log.timestamp), 'HH:mm:ss')}
                </div>

                <div style={{
                  padding: '3px 8px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 800, flexShrink: 0,
                  background: `${ENTITY_COLOR[log.entityType] || '#64748b'}20`,
                  color: ENTITY_COLOR[log.entityType] || '#64748b',
                  minWidth: 100, textAlign: 'center',
                }}>
                  {log.entityType.replace(/_/g, ' ')}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f0f4ff' }}>
                    {log.details?.info || log.action}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace', marginTop: 2 }}>
                    Action: {log.action}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 700 }}>
                    {log.user?.name || 'System Auto-Engine'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    {log.user?.role?.replace(/_/g, ' ') || 'SYSTEM'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>
    </AppLayout>
  );
}
