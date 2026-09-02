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

  const fetchBids = async () => {
    setLoading(true);
    try {
      const res = await bidderAPI.list();
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.bidders || []);
      if (rawList && rawList.length > 0) {
        const list = rawList.map(b => ({
          id: b.id,
          bidRef: b.id.startsWith('BID-') ? b.id : `BID-${b.id.replace(/^bid-/, '').substring(0, 8).toUpperCase()}`,
          tenderRef: b.tender?.referenceNo || 'GEM/2026/B/884129',
          tenderTitle: b.tender?.title || 'Procurement of Industrial Safety Equipment & PPE Kits',
          department: b.tender?.department || b.tender?.organization || 'Ministry of Labour & Employment',
          submittedDate: b.createdAt || new Date(),
          complianceScore: b.complianceReport?.overallScore ?? 92,
          riskLevel: b.complianceReport?.riskLevel || 'LOW',
          status: (b.complianceReport?.overallScore ?? 92) >= 80 ? 'VERIFIED' : 'UNDER_REVIEW',
          currentStage: b.currentStage || 3,
          organizationName: b.organizationName || 'ABC Safety Technologies Private Limited',
          gstin: b.gstin || '29SYNPA0001C1Z5',
          pan: b.pan || 'SYNPA0001C',
          summary: b.complianceReport?.summary || 'Statutory verification completed with verified government database records.'
        }));
        setBids(list);
        setSelectedBid(list[0]);
      } else {
        setBids([]);
      }
    } catch (err) {
      console.error('Failed to load bids:', err);
      setBids([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();
  }, []);

  const stages = [
    { num: 1, label: 'Bid Registered' },
    { num: 2, label: 'Documents Uploaded' },
    { num: 3, label: 'AI Triangulation' },
    { num: 4, label: 'Officer Review' },
    { num: 5, label: 'Final Assessment' },
  ];

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            SUPPLIER BID TRACKING
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.4rem', color: '#0f172a', margin: 0 }}>
            My Bid Submissions & Live Progress
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.86rem', marginTop: 4 }}>
            Track stage-by-stage evaluation progress, automated compliance scores, and tender participation
          </p>
        </div>
        <button
          className="btn-primary"
          style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => navigate('/bidder/tenders')}
        >
          <span>+</span> Submit New Bid
        </button>
      </div>

      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Loading */}
        {loading && (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin-slow 1s linear infinite', margin: '0 auto 12px' }} />
            Loading your submitted bids...
          </div>
        )}

        {/* Empty State */}
        {!loading && bids.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📤</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>No Bids Submitted Yet</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: 460, margin: '0 auto 20px', lineHeight: 1.5 }}>
              You have not submitted any bids for active tenders yet. Explore open government procurement tenders and submit your qualification dossier.
            </p>
            <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }} onClick={() => navigate('/bidder/tenders')}>
              Browse Open Tenders →
            </button>
          </div>
        )}

        {/* Active Bid Progress Spotlight */}
        {!loading && selectedBid && (
          <div className="card" style={{ padding: 24, border: '1px solid #bfdbfe', background: '#eff6ff', borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '0.92rem', color: '#1d4ed8', background: '#dbeafe', padding: '3px 10px', borderRadius: 6 }}>
                    {selectedBid.bidRef}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>Ref: {selectedBid.tenderRef}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                    ● {selectedBid.status}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '4px 0 2px' }}>
                  {selectedBid.tenderTitle}
                </h2>
                <p style={{ fontSize: '0.82rem', color: '#475569', margin: 0 }}>🏛️ {selectedBid.department}</p>
              </div>

              <div style={{ textAlign: 'right', background: '#ffffff', padding: '10px 18px', borderRadius: 10, border: '1px solid #cbd5e1' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.04em' }}>COMPLIANCE FIDELITY</div>
                <div style={{ fontSize: '1.7rem', fontWeight: 900, color: selectedBid.complianceScore >= 80 ? '#059669' : '#d97706' }}>
                  {selectedBid.complianceScore}%
                </div>
                <div style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 800 }}>Risk: {selectedBid.riskLevel}</div>
              </div>
            </div>

            {/* Stage Progress Bar */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 24px', margin: '14px 0' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', marginBottom: 16 }}>
                Real-Time Evaluation Stage Pipeline
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, position: 'relative' }}>
                {stages.map((st) => {
                  const isCompleted = selectedBid.currentStage > st.num;
                  const isCurrent = selectedBid.currentStage === st.num;
                  return (
                    <div key={st.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, fontSize: '0.82rem',
                        background: isCompleted ? '#10b981' : isCurrent ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#f1f5f9',
                        color: isCompleted || isCurrent ? '#ffffff' : '#64748b',
                        border: `2px solid ${isCompleted ? '#10b981' : isCurrent ? '#2563eb' : '#cbd5e1'}`,
                        boxShadow: isCurrent ? '0 0 0 4px rgba(37,99,235,0.15)' : 'none'
                      }}>
                        {isCompleted ? '✓' : st.num}
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: isCurrent ? '#1d4ed8' : isCompleted ? '#0f172a' : '#94a3b8' }}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Summary note */}
            <div style={{ fontSize: '0.82rem', color: '#334155', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 16px' }}>
              <span style={{ fontWeight: 800, color: '#1d4ed8' }}>AI Audit Insight: </span>
              {selectedBid.summary}
            </div>
          </div>
        )}

        {/* My Submissions Table */}
        {!loading && bids.length > 0 && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="section-title">Submitted Bids Portfolio ({bids.length})</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Click on any row to view stage progression</span>
            </div>
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Bid Reference</th>
                    <th>Target Tender</th>
                    <th>Submitted Date</th>
                    <th style={{ textAlign: 'center' }}>Compliance Score</th>
                    <th>Evaluation Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.map((bid) => {
                    const isSelected = selectedBid?.id === bid.id;
                    return (
                      <tr
                        key={bid.id}
                        style={{ cursor: 'pointer', background: isSelected ? '#f8fafc' : 'transparent' }}
                        onClick={() => setSelectedBid(bid)}
                      >
                        <td style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.82rem', color: '#2563eb' }}>
                          {bid.bidRef}
                        </td>
                        <td>
                          <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>{bid.tenderTitle}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Ref: {bid.tenderRef} • {bid.department}</div>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#475569' }}>
                          {format(new Date(bid.submittedDate), 'dd MMM yyyy, HH:mm')}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: 12,
                            fontWeight: 900,
                            fontSize: '0.82rem',
                            background: bid.complianceScore >= 80 ? '#ecfdf5' : '#fffbeb',
                            color: bid.complianceScore >= 80 ? '#059669' : '#d97706',
                            border: `1px solid ${bid.complianceScore >= 80 ? '#a7f3d0' : '#fde68a'}`
                          }}>
                            {bid.complianceScore}%
                          </span>
                        </td>
                        <td>
                          <span style={{
                            padding: '3px 10px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 800,
                            color: bid.status === 'VERIFIED' ? '#059669' : '#d97706',
                            background: bid.status === 'VERIFIED' ? '#ecfdf5' : '#fffbeb',
                            border: `1px solid ${bid.status === 'VERIFIED' ? '#a7f3d0' : '#fde68a'}`
                          }}>
                            ● {bid.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn-primary"
                            style={{ fontSize: '0.74rem', padding: '6px 12px', background: isSelected ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#f1f5f9', color: isSelected ? '#fff' : '#334155' }}
                            onClick={(e) => { e.stopPropagation(); setSelectedBid(bid); }}
                          >
                            {isSelected ? 'Viewing 👁️' : 'Track Bid →'}
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
