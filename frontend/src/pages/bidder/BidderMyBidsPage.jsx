import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/Sidebar';
import { bidderAPI } from '../../services/api';
import { format } from 'date-fns';

export default function BidderMyBidsPage() {
  const navigate = useNavigate();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBid, setSelectedBid] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await bidderAPI.list();
        if (res.data && Array.isArray(res.data)) {
          const list = res.data.map(b => ({
            id: b.id,
            bidRef: `BID-${b.id.substring(0, 8).toUpperCase()}`,
            tenderRef: b.tender?.referenceNo || 'GEM-2026',
            tenderTitle: b.tender?.title || 'Tender',
            department: b.tender?.department || b.tender?.organization || 'Government Department',
            submittedDate: b.createdAt || new Date(),
            complianceScore: b.complianceReport?.overallScore ?? 0,
            riskLevel: b.complianceReport?.riskLevel || 'LOW',
            status: b.complianceReport?.overallScore >= 80 ? 'VERIFIED' : 'UNDER_REVIEW',
            currentStage: 3,
            clarificationRequested: false,
          }));
          setBids(list);
          if (list.length > 0) setSelectedBid(list[0]);
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

  const stages = [
    { num: 1, label: 'Bid Created' },
    { num: 2, label: 'Documents Submitted' },
    { num: 3, label: 'AI Verification Completed' },
    { num: 4, label: 'Officer Review' },
    { num: 5, label: 'Final Assessment' },
  ];

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            SUPPLIER PORTFOLIO
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>
            My Bid Submissions & Tracking
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Real-time stage-by-stage evaluation progress, compliance status, and clarification alerts
          </p>
        </div>
        <button
          className="btn-primary"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          onClick={() => navigate('/bidder/tenders')}
        >
          + Submit New Bid
        </button>
      </div>

      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Empty State */}
        {bids.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📤</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f0f4ff', marginBottom: 6 }}>No Bids Submitted Yet</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: 420, margin: '0 auto 20px' }}>
              You have not submitted any bids for open tenders yet. Discover available tenders and submit your qualification documents.
            </p>
            <button className="btn-primary" style={{ background: '#7c3aed' }} onClick={() => navigate('/bidder/tenders')}>
              Browse Open Tenders →
            </button>
          </div>
        )}

        {/* Active Bid Progress Spotlight */}
        {selectedBid && (
          <div className="card" style={{ padding: 22, border: '1px solid rgba(139,92,246,0.3)', background: 'linear-gradient(145deg, rgba(124,58,237,0.08), #0f1629)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.85rem', color: '#a78bfa' }}>
                    {selectedBid.bidRef}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>({selectedBid.tenderRef})</span>
                </div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f0f4ff' }}>
                  {selectedBid.tenderTitle}
                </h2>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>{selectedBid.department}</p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>PRELIMINARY COMPLIANCE</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: selectedBid.complianceScore >= 80 ? '#10b981' : '#f59e0b' }}>
                  {selectedBid.complianceScore}%
                </div>
              </div>
            </div>

            {/* Stage Progress Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 16px', position: 'relative' }}>
              {stages.map((st) => (
                <div key={st.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 2, textAlign: 'center', width: 120 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.8rem',
                    background: selectedBid.currentStage > st.num ? '#10b981' : selectedBid.currentStage === st.num ? '#7c3aed' : 'var(--bg-border)',
                    color: '#fff',
                  }}>
                    {selectedBid.currentStage > st.num ? '✓' : st.num}
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: selectedBid.currentStage >= st.num ? '#f0f4ff' : '#64748b' }}>
                    {st.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Submissions Table */}
        {bids.length > 0 && (
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg-border)' }}>
              <span className="section-title">All Submitted Bids ({bids.length})</span>
            </div>
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Bid Reference</th>
                    <th>Target Tender</th>
                    <th>Submitted Date</th>
                    <th style={{ textAlign: 'center' }}>Compliance</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.map((bid) => (
                    <tr key={bid.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedBid(bid)}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.82rem', color: '#a78bfa' }}>
                        {bid.bidRef}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f0f4ff' }}>{bid.tenderTitle}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{bid.tenderRef}</div>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                        {format(new Date(bid.submittedDate), 'dd MMM yyyy')}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: bid.complianceScore >= 80 ? '#10b981' : '#f59e0b' }}>
                          {bid.complianceScore}%
                        </span>
                      </td>
                      <td>
                        <span style={{
                          padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800,
                          color: bid.status === 'VERIFIED' ? '#10b981' : '#f59e0b',
                          background: bid.status === 'VERIFIED' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        }}>
                          {bid.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-secondary"
                          style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                          onClick={(e) => { e.stopPropagation(); navigate('/bidder/compliance'); }}
                        >
                          View Compliance →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
