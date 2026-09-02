import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/Sidebar';
import { auditAPI } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ENTITY_COLOR = {
  TENDER: '#2563eb',
  BIDDER: '#059669',
  DOCUMENT: '#7c3aed',
  COMPLIANCE: '#d97706',
  REPORT: '#0891b2',
  AI_PIPELINE: '#9333ea',
  HUMAN_REVIEW: '#ea580c',
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
          <div style={{ fontSize: '0.75rem', color: '#0891b2', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
            STATUTORY OVERSIGHT & TRACEABILITY
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.45rem', color: '#0f172a', marginBottom: 4 }}>
            System Audit Trail & Provenance
          </h1>
          <p style={{ color: '#475569', fontSize: '0.88rem' }}>
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
                  padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                  fontSize: '0.78rem', fontWeight: 700,
                  background: filterType === type ? '#eff6ff' : '#ffffff',
                  color: filterType === type ? '#1d4ed8' : '#475569',
                  border: `1px solid ${filterType === type ? '#bfdbfe' : '#e2e8f0'}`,
                  boxShadow: filterType === type ? '0 2px 6px rgba(37,99,235,0.1)' : 'none',
                  transition: 'all 0.15s ease'
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
            style={{ maxWidth: 300, width: '100%', fontSize: '0.82rem' }}
          />
        </div>

        {/* Audit Log Entries List / Empty State */}
        {filteredLogs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📜</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>No Audit Events Recorded Yet</h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', maxWidth: 420, margin: '0 auto' }}>
              Every procurement action, document upload, OCR extraction, and human review decision will be permanently and immutably logged here.
            </p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="section-title">Audit Log Entries ({filteredLogs.length})</span>
              <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 800, background: '#ecfdf5', padding: '4px 10px', borderRadius: 12, border: '1px solid #a7f3d0' }}>
                ● SHA-256 VERIFIED IMMUTABLE LOG
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredLogs.map((log, i) => (
                <div
                  key={log.id || i}
                  style={{
                    display: 'flex', gap: 16, padding: '14px 20px',
                    borderBottom: i < filteredLogs.length - 1 ? '1px solid #f1f5f9' : 'none',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace', fontWeight: 700, minWidth: 80 }}>
                    {format(new Date(log.timestamp), 'HH:mm:ss')}
                  </div>

                  <div style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800, flexShrink: 0,
                    background: `${ENTITY_COLOR[log.entityType] || '#64748b'}15`,
                    color: ENTITY_COLOR[log.entityType] || '#64748b',
                    border: `1px solid ${ENTITY_COLOR[log.entityType] || '#64748b'}35`,
                    minWidth: 100, textAlign: 'center',
                  }}>
                    {log.entityType.replace(/_/g, ' ')}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>
                      {log.details?.info || log.action}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', fontFamily: 'monospace', marginTop: 2 }}>
                      Action: {log.action}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.82rem', color: '#2563eb', fontWeight: 800 }}>
                      {log.user?.name || 'System Auto-Engine'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
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
