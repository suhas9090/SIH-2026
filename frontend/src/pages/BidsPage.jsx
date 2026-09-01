import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/Sidebar';
import { bidderAPI } from '../services/api';
import toast from 'react-hot-toast';

const RISK_BADGE = {
  LOW: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: 'LOW RISK' },
  MEDIUM: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: 'MEDIUM RISK' },
  HIGH: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'HIGH RISK' },
};

export default function BidsPage() {
  const navigate = useNavigate();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await bidderAPI.list();
        if (res.data && Array.isArray(res.data)) {
          setBids(res.data.map(b => ({
            id: b.id,
            organizationName: b.organizationName,
            tenderId: b.tenderId,
            tenderRef: b.tender?.referenceNo || 'GEM-2026',
            tenderTitle: b.tender?.title || 'Tender',
            gstin: b.gstin,
            pan: b.pan,
            contactName: b.contactName,
            contactEmail: b.contactEmail,
            complianceScore: b.complianceReport?.overallScore ?? 0,
            riskLevel: b.complianceReport?.riskLevel || 'LOW',
            status: b.complianceReport?.overallScore >= 80 ? 'VERIFIED' : 'UNDER_REVIEW',
            docsCount: b._count?.documents || 0,
          })));
        } else {
          setBids([]);
        }
      } catch {
        setBids([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filteredBids = bids.filter(b => {
    const matchesFilter = statusFilter === 'ALL' || b.status === statusFilter || b.riskLevel === statusFilter;
    const matchesSearch = !search ||
      b.organizationName?.toLowerCase().includes(search.toLowerCase()) ||
      b.tenderRef?.toLowerCase().includes(search.toLowerCase()) ||
      b.contactName?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            BIDDING PORTFOLIO
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>
            Received Bid Submissions & AI Evaluations
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Multi-factor compliance scores, risk levels, and direct links to the 3-panel evidence workspace
          </p>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Filter Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { key: 'ALL', label: 'All Bids' },
              { key: 'VERIFIED', label: 'Verified & Compliant' },
              { key: 'UNDER_REVIEW', label: 'Under Review' },
              { key: 'HIGH', label: 'High Risk' },
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

          <input
            className="input"
            placeholder="Search by supplier, tender, contact..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 280, fontSize: '0.8rem' }}
          />
        </div>

        {/* Empty State */}
        {filteredBids.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📤</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f0f4ff', marginBottom: 6 }}>No Bids Received Yet</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: 420, margin: '0 auto 20px' }}>
              No vendor bids have been submitted yet. Once bidders submit documents for published tenders, they will appear here for verification.
            </p>
            <button className="btn-secondary" onClick={() => navigate('/tenders')}>
              View Active Tenders
            </button>
          </div>
        )}

        {/* Bids Table */}
        {filteredBids.length > 0 && (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Bidder Organization</th>
                    <th>Target Tender</th>
                    <th style={{ textAlign: 'center' }}>Compliance Score</th>
                    <th>Risk Level</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBids.map(bid => {
                    const riskMeta = RISK_BADGE[bid.riskLevel] || RISK_BADGE.MEDIUM;

                    return (
                      <tr key={bid.id}>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f0f4ff' }}>
                          {bid.organizationName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {bid.contactName} · {bid.docsCount} Docs
                        </div>
                      </td>
                      <td>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.78rem', color: '#60a5fa' }}>
                          {bid.tenderRef}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>{bid.tenderTitle}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 900, fontSize: '1.1rem', color: bid.complianceScore >= 80 ? '#10b981' : bid.complianceScore >= 60 ? '#f59e0b' : '#ef4444' }}>
                          {bid.complianceScore}%
                        </div>
                        <div className="progress-bar" style={{ height: 4, width: 80, margin: '4px auto 0' }}>
                          <div className="progress-fill" style={{ width: `${bid.complianceScore}%`, background: bid.complianceScore >= 80 ? '#10b981' : bid.complianceScore >= 60 ? '#f59e0b' : '#ef4444' }} />
                        </div>
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
                        <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600 }}>
                          {bid.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-primary"
                          style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                          onClick={() => navigate(`/compliance/${bid.id}`)}
                        >
                          Inspect Evidence →
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
