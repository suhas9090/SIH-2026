import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/Sidebar';
import { bidderAPI } from '../services/api';

const SEV_META = {
  HIGH: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'HIGH SEVERITY' },
  MEDIUM: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'MEDIUM SEVERITY' },
  LOW: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'LOW SEVERITY' },
};

export default function RiskAlertsPage() {
  const navigate = useNavigate();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await bidderAPI.list();
        if (res.data && Array.isArray(res.data)) {
          const highRisk = res.data.filter(b => b.complianceReport?.riskLevel === 'HIGH' || b.complianceReport?.riskLevel === 'CRITICAL');
          setFlags(highRisk.map((b, i) => ({
            id: `f-${i}`,
            tenderRef: b.tender?.referenceNo || 'GEM-2026',
            bidderName: b.organizationName,
            severity: b.complianceReport?.riskLevel || 'MEDIUM',
            title: b.complianceReport?.summary || 'Risk flag identified in submission',
            description: b.complianceReport?.recommendations || 'Manual verification recommended.',
            category: 'COMPLIANCE',
            status: 'REQUIRES_HUMAN_REVIEW',
            detectedAt: b.updatedAt ? new Date(b.updatedAt).toLocaleDateString() : 'Recent',
          })));
        } else {
          setFlags([]);
        }
      } catch {
        setFlags([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = flags.filter(f => filter === 'ALL' || f.severity === filter);

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
            RISK ENGINE & COMPLIANCE TELEMETRY
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.45rem', color: '#0f172a', marginBottom: 4 }}>
            Risk Flags & Discrepancy Alerts
          </h1>
          <p style={{ color: '#475569', fontSize: '0.88rem' }}>
            Non-accusatory flags categorized by severity, with direct links to verified document citations
          </p>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Severity Metrics Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Risk Alerts', value: flags.length, color: '#dc2626' },
            { label: 'High Severity', value: flags.filter(f => f.severity === 'HIGH').length, color: '#dc2626' },
            { label: 'Medium Severity', value: flags.filter(f => f.severity === 'MEDIUM').length, color: '#d97706' },
            { label: 'Low Severity', value: flags.filter(f => f.severity === 'LOW').length, color: '#2563eb' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: 18, borderLeft: `4px solid ${s.color}` }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.8rem', color: '#0f172a', marginBottom: 2 }}>
                {s.value}
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#475569' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🛡️</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>No Active Risk Alerts</h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', maxWidth: 420, margin: '0 auto 20px' }}>
              All submitted procurement bids, entity registrations, and document extractions are in clean standing.
            </p>
            <button className="btn-secondary" onClick={() => navigate('/tenders')}>
              View Active Tenders
            </button>
          </div>
        )}

        {/* Risk Items List */}
        {filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map(flag => {
              const meta = SEV_META[flag.severity] || SEV_META.MEDIUM;

              return (
                <div key={flag.id} className="card" style={{ borderLeft: `4px solid ${meta.color}`, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.82rem', color: '#2563eb' }}>
                          {flag.tenderRef}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>•</span>
                        <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>{flag.bidderName}</span>
                      </div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>{flag.title}</h3>
                    </div>

                    <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '4px 10px', borderRadius: 12, background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                      {meta.label}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5, marginBottom: 14 }}>
                    {flag.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Detected {flag.detectedAt}</span>
                    <button className="btn-secondary" style={{ fontSize: '0.74rem', padding: '4px 10px' }} onClick={() => navigate('/bids')}>
                      Inspect Evidence File →
                    </button>
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
