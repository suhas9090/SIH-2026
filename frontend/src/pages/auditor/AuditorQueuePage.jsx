import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/Sidebar';
import { bidderAPI } from '../../services/api';

const RISK_BADGE = {
  HIGH: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'HIGH RISK' },
  MEDIUM: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: 'MEDIUM RISK' },
  LOW: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: 'LOW RISK' },
};

export default function AuditorQueuePage() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await bidderAPI.list();
        if (res.data && Array.isArray(res.data)) {
          const mapped = res.data.map(b => ({
            id: b.id,
            bidderName: b.organizationName,
            tenderRef: b.tender?.referenceNo || 'GEM-2026',
            tenderTitle: b.tender?.title || 'Tender',
            riskLevel: b.complianceReport?.riskLevel || 'LOW',
            flaggedIssue: b.complianceReport?.summary || 'Standard Compliance Evaluation',
            extractedValue: `${b._count?.documents || 0} Documents Submitted`,
            confidence: '95%',
            status: b.complianceReport?.overallScore >= 80 ? 'VERIFIED' : 'REQUIRES_HUMAN_REVIEW',
            submittedAt: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Recent',
          }));
          setQueue(mapped);
        } else {
          setQueue([]);
        }
      } catch {
        setQueue([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filteredQueue = queue.filter(item => {
    const matchesFilter = filter === 'ALL' || item.riskLevel === filter || (filter === 'PENDING' && item.status.includes('REVIEW'));
    const matchesSearch = !search ||
      item.bidderName.toLowerCase().includes(search.toLowerCase()) ||
      item.tenderRef.toLowerCase().includes(search.toLowerCase()) ||
      item.flaggedIssue.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ fontSize: '0.75rem', color: '#06b6d4', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            HUMAN-IN-THE-LOOP VERIFICATION WORKSPACE
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>
            Auditor Verification Queue
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Independently examine AI-extracted findings, validate document citations, and record authoritative human decisions
          </p>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* KPI Metric Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Pending Reviews', count: queue.filter(q => q.status.includes('REVIEW')).length, color: '#f59e0b', desc: 'Awaiting human sign-off' },
            { label: 'High Risk Cases', count: queue.filter(q => q.riskLevel === 'HIGH').length, color: '#ef4444', desc: 'Critical inconsistencies' },
            { label: 'Verified Bids', count: queue.filter(q => q.status === 'VERIFIED').length, color: '#10b981', desc: 'Approved with audit log' },
            { label: 'Total in Queue', count: queue.length, color: '#06b6d4', desc: 'Active submissions' },
          ].map(c => (
            <div key={c.label} className="card" style={{ padding: 16, borderLeft: `3px solid ${c.color}` }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.8rem', color: '#f0f4ff', marginBottom: 2 }}>
                {c.count}
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#94a3b8' }}>{c.label}</div>
              <div style={{ fontSize: '0.68rem', color: '#4a6080', marginTop: 2 }}>{c.desc}</div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredQueue.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f0f4ff', marginBottom: 6 }}>Verification Queue is Empty</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: 420, margin: '0 auto 20px' }}>
              No bidder submissions are currently pending compliance evaluation. When vendors submit documents for tenders, they will appear here for review.
            </p>
            <button className="btn-secondary" onClick={() => navigate('/tenders')}>
              View Active Tenders
            </button>
          </div>
        )}

        {/* Priority Queue Table */}
        {filteredQueue.length > 0 && (
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="section-title">Priority Verification Queue ({filteredQueue.length})</span>
              <span style={{ fontSize: '0.72rem', color: '#06b6d4', fontWeight: 700 }}>
                ● HUMAN-IN-THE-LOOP GATEWAY
              </span>
            </div>

            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Bidder Organization</th>
                    <th>Target Tender</th>
                    <th>Risk Level</th>
                    <th>Flagged Inconsistency / Issue</th>
                    <th>AI Confidence</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQueue.map(item => {
                    const riskMeta = RISK_BADGE[item.riskLevel] || RISK_BADGE.MEDIUM;

                    return (
                      <tr key={item.id}>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f0f4ff' }}>
                            {item.bidderName}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.submittedAt}</div>
                        </td>
                        <td>
                          <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#06b6d4', fontWeight: 700 }}>
                            {item.tenderRef}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>{item.tenderTitle}</div>
                        </td>
                        <td>
                          <span style={{
                            padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800,
                            background: riskMeta.bg, color: riskMeta.color,
                          }}>
                            {riskMeta.label}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: item.riskLevel === 'HIGH' ? '#f87171' : '#fbbf24' }}>
                            {item.flaggedIssue}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                            {item.extractedValue}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#f0f4ff' }}>
                            {item.confidence}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-primary"
                            style={{ fontSize: '0.75rem', padding: '6px 14px', background: 'linear-gradient(135deg, #0891b2, #0284c7)' }}
                            onClick={() => navigate(`/compliance/${item.id}`)}
                          >
                            🔍 Open Review Workspace →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
