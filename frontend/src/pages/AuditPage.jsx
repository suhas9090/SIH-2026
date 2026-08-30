import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/Sidebar';
import { auditAPI } from '../services/api';
import { format } from 'date-fns';

const DEMO_LOGS = [
  { id: '1', action: 'POST /api/tenders', entityType: 'TENDER', user: { name: 'Ramesh Kumar', role: 'PROCUREMENT_OFFICER' }, details: { statusCode: 201 }, timestamp: new Date(Date.now() - 300000) },
  { id: '2', action: 'POST /api/tenders/:id/upload', entityType: 'TENDER', user: { name: 'Ramesh Kumar' }, details: { statusCode: 201 }, timestamp: new Date(Date.now() - 250000) },
  { id: '3', action: 'POST /api/tenders/:id/extract-requirements', entityType: 'TENDER', user: { name: 'Ramesh Kumar' }, details: { statusCode: 200, info: 'Gemini AI extracted 7 requirements' }, timestamp: new Date(Date.now() - 200000) },
  { id: '4', action: 'POST /api/bidders', entityType: 'BIDDER', user: { name: 'Ramesh Kumar' }, details: { statusCode: 201 }, timestamp: new Date(Date.now() - 150000) },
  { id: '5', action: 'POST /api/bidders/:id/upload-documents', entityType: 'DOCUMENT', user: { name: 'Ramesh Kumar' }, details: { statusCode: 201, info: '6 documents uploaded' }, timestamp: new Date(Date.now() - 120000) },
  { id: '6', action: 'POST /api/bidders/:id/verify', entityType: 'COMPLIANCE', user: { name: 'Ramesh Kumar' }, details: { statusCode: 200, info: 'Compliance verification complete. Score: 72%' }, timestamp: new Date(Date.now() - 60000) },
  { id: '7', action: 'POST /api/compliance/review/:itemId', entityType: 'COMPLIANCE', user: { name: 'Suresh Officer' }, details: { statusCode: 200, info: 'Human review: APPROVED OEM Authorization' }, timestamp: new Date(Date.now() - 30000) },
];

const ACTION_COLOR = { TENDER: '#3b82f6', BIDDER: '#10b981', DOCUMENT: '#8b5cf6', COMPLIANCE: '#f59e0b', REPORT: '#06b6d4' };

export default function AuditPage() {
  const [logs, setLogs] = useState(DEMO_LOGS);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await auditAPI.list({ limit: 50 });
        if (res.data.logs?.length) setLogs(res.data.logs);
      } catch { /* demo */ }
    };
    fetch();
  }, []);

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>Audit Logs</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Complete traceability of all system actions and decisions</p>
        </div>
      </div>
      <div style={{ padding: '28px 32px' }}>
        <div className="card" style={{ padding: 0 }}>
          {logs.map((log, i) => (
            <div key={log.id || i} style={{
              display: 'flex', gap: 16, padding: '14px 24px',
              borderBottom: '1px solid rgba(30,45,74,0.4)',
              alignItems: 'flex-start'
            }}>
              <div style={{ fontSize: '0.72rem', color: '#4a6080', minWidth: 100, paddingTop: 2 }}>
                {format(new Date(log.timestamp), 'HH:mm:ss')}
              </div>
              <div style={{
                padding: '2px 8px', borderRadius: 6, fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
                background: `${ACTION_COLOR[log.entityType] || '#64748b'}20`,
                color: ACTION_COLOR[log.entityType] || '#64748b', height: 'fit-content'
              }}>{log.entityType}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#94a3b8' }}>{log.action}</div>
                {log.details?.info && <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>{log.details.info}</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.78rem', color: '#f0f4ff', fontWeight: 500 }}>{log.user?.name || 'System'}</div>
                <div style={{ fontSize: '0.7rem', color: '#4a6080' }}>{log.user?.role?.replace(/_/g, ' ')}</div>
              </div>
              {log.details?.statusCode && (
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 6, flexShrink: 0,
                  color: log.details.statusCode < 300 ? '#10b981' : '#ef4444',
                  background: log.details.statusCode < 300 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'
                }}>{log.details.statusCode}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
