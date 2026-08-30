import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/Sidebar';
import { tenderAPI, bidderAPI } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const CAT_COLOR = { FINANCIAL: '#3b82f6', REGISTRATION: '#10b981', TAX: '#06b6d4', MSME_UDYAM: '#8b5cf6', OEM: '#f59e0b', EXPERIENCE: '#ec4899', BLACKLISTING: '#ef4444', OTHER: '#64748b' };

const DEMO_TENDER = {
  id: 't1', referenceNo: 'TND-2026-001', title: 'Supply of Industrial Safety Equipment',
  organization: 'Ministry of Labour', status: 'ACTIVE', estimatedValue: 50000000,
  closingDate: new Date(Date.now() + 7*86400000), description: 'Procurement of industrial safety equipment for factories.',
  requirements: [
    { id: 'r1', category: 'REGISTRATION', title: 'Valid GST Registration', mandatory: true, textValue: 'Active' },
    { id: 'r2', category: 'TAX', title: 'Valid PAN', mandatory: true },
    { id: 'r3', category: 'MSME_UDYAM', title: 'Udyam/MSME Registration', mandatory: false },
    { id: 'r4', category: 'FINANCIAL', title: 'Minimum Annual Turnover ≥ ₹5 Cr', mandatory: true, minValue: 50000000, currency: 'INR' },
    { id: 'r5', category: 'OEM', title: 'OEM Authorization Certificate', mandatory: true },
    { id: 'r6', category: 'EXPERIENCE', title: 'Minimum 3 Years Experience', mandatory: true, minValue: 3, unit: 'years' },
    { id: 'r7', category: 'BLACKLISTING', title: 'Non-Blacklisting Declaration', mandatory: true },
  ],
  bidders: [
    { id: 'b1', organizationName: 'ABC Industries Pvt Ltd', gstin: '29AABCA1234C1Z5', complianceReport: { overallScore: 72, riskLevel: 'MEDIUM' }, _count: { documents: 6 } },
    { id: 'b2', organizationName: 'XYZ Technologies Ltd', gstin: '27AABCX5678D1Z3', complianceReport: { overallScore: 88, riskLevel: 'LOW' }, _count: { documents: 5 } },
  ]
};

export default function TenderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tender, setTender] = useState(DEMO_TENDER);
  const [loading, setLoading] = useState(false);
  const [showAddBidder, setShowAddBidder] = useState(false);
  const [bidderForm, setBidderForm] = useState({ organizationName: '', gstin: '', pan: '', udyamNo: '', cinNo: '', contactName: '', contactEmail: '', contactPhone: '' });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await tenderAPI.get(id);
        setTender(res.data);
      } catch { /* use demo */ }
    };
    fetch();
  }, [id]);

  const handleExtractRequirements = async () => {
    setLoading(true);
    try {
      const res = await tenderAPI.extractRequirements(id);
      toast.success(`Extracted ${res.data.count} requirements with Gemini AI!`);
      setTender(prev => ({ ...prev, requirements: res.data.requirements }));
    } catch (err) {
      toast.error('AI extraction failed. Check AI service is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBidder = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await bidderAPI.create({ ...bidderForm, tenderId: id });
      toast.success('Bidder added successfully!');
      setTender(prev => ({ ...prev, bidders: [...(prev.bidders || []), { ...res.data, _count: { documents: 0 } }] }));
      setShowAddBidder(false);
      setBidderForm({ organizationName: '', gstin: '', pan: '', udyamNo: '', cinNo: '', contactName: '', contactEmail: '', contactPhone: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add bidder.');
    } finally {
      setLoading(false);
    }
  };

  const RISK_STYLE = { LOW: 'risk-low', MEDIUM: 'risk-medium', HIGH: 'risk-high', CRITICAL: 'risk-critical' };

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ fontSize: '0.75rem', color: '#4a6080', marginBottom: 4, fontFamily: 'monospace' }}>{tender.referenceNo}</div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: '#f0f4ff', marginBottom: 4 }}>{tender.title}</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{tender.organization}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={handleExtractRequirements} disabled={loading}>
            {loading ? '⟳' : '🧠'} Extract Requirements (AI)
          </button>
          <button className="btn-primary" onClick={() => setShowAddBidder(true)}>+ Add Bidder</button>
        </div>
      </div>

      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
          {/* Requirements */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="section-title">Compliance Requirements ({tender.requirements?.length || 0})</span>
              {!tender.requirements?.length && (
                <button className="btn-ghost" style={{ fontSize: '0.75rem', color: '#3b82f6' }} onClick={handleExtractRequirements}>
                  Extract with AI →
                </button>
              )}
            </div>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {tender.requirements?.map(req => (
                <div key={req.id} style={{ padding: '12px 20px', borderBottom: '1px solid rgba(30,45,74,0.4)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 6, fontSize: '0.65rem', fontWeight: 700,
                    background: `${CAT_COLOR[req.category] || '#64748b'}20`,
                    color: CAT_COLOR[req.category] || '#64748b', flexShrink: 0, marginTop: 2
                  }}>{req.category?.replace(/_/g, ' ')}</span>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f0f4ff' }}>{req.title}</div>
                    {req.minValue && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                        Min: {req.currency === 'INR' ? `₹${(req.minValue/10000000).toFixed(1)} Cr` : `${req.minValue} ${req.unit || ''}`}
                      </div>
                    )}
                  </div>
                  {req.mandatory && <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#ef4444', flexShrink: 0 }}>MANDATORY</span>}
                </div>
              ))}
              {!tender.requirements?.length && (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#4a6080' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>🧠</div>
                  <p style={{ fontSize: '0.875rem' }}>Upload tender PDF and extract requirements with Gemini AI</p>
                </div>
              )}
            </div>
          </div>

          {/* Bidders */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="section-title">Bidders ({tender.bidders?.length || 0})</span>
            </div>
            <div>
              {tender.bidders?.map(bidder => (
                <div key={bidder.id} style={{
                  padding: '14px 20px', borderBottom: '1px solid rgba(30,45,74,0.4)',
                  cursor: 'pointer', transition: 'background 0.2s'
                }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => navigate(`/tenders/${id}/bidders/${bidder.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#f0f4ff' }}>{bidder.organizationName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace', marginTop: 2 }}>{bidder.gstin || 'GSTIN not provided'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {bidder.complianceReport ? (
                        <>
                          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: bidder.complianceReport.overallScore >= 75 ? '#10b981' : bidder.complianceReport.overallScore >= 50 ? '#f59e0b' : '#ef4444' }}>
                            {bidder.complianceReport.overallScore}%
                          </span>
                          <div><span className={RISK_STYLE[bidder.complianceReport.riskLevel] || 'risk-medium'}>{bidder.complianceReport.riskLevel}</span></div>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#4a6080' }}>Not verified</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <span style={{ fontSize: '0.7rem', color: '#4a6080' }}>📄 {bidder._count?.documents || 0} docs</span>
                    <span style={{ fontSize: '0.7rem', color: '#3b82f6', marginLeft: 'auto' }}>View details →</span>
                  </div>
                </div>
              ))}
              {!tender.bidders?.length && (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#4a6080' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>🏢</div>
                  <p style={{ fontSize: '0.875rem' }}>No bidders added yet</p>
                  <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => setShowAddBidder(true)}>+ Add Bidder</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Bidder Modal */}
      {showAddBidder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setShowAddBidder(false)}>
          <div className="card" style={{ maxWidth: 560, width: '100%', padding: 32 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f0f4ff', marginBottom: 24 }}>Add Bidder to Tender</h2>
            <form onSubmit={handleAddBidder}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="label">Organization Name *</label>
                  <input className="input" placeholder="ABC Industries Pvt Ltd" value={bidderForm.organizationName} onChange={e => setBidderForm(p => ({...p, organizationName: e.target.value}))} />
                </div>
                <div>
                  <label className="label">GSTIN</label>
                  <input className="input" placeholder="29AABCA1234C1Z5" value={bidderForm.gstin} onChange={e => setBidderForm(p => ({...p, gstin: e.target.value}))} />
                </div>
                <div>
                  <label className="label">PAN</label>
                  <input className="input" placeholder="AABCA1234C" value={bidderForm.pan} onChange={e => setBidderForm(p => ({...p, pan: e.target.value}))} />
                </div>
                <div>
                  <label className="label">Udyam Number</label>
                  <input className="input" placeholder="UDYAM-KA-01-0000001" value={bidderForm.udyamNo} onChange={e => setBidderForm(p => ({...p, udyamNo: e.target.value}))} />
                </div>
                <div>
                  <label className="label">CIN Number (MCA)</label>
                  <input className="input" placeholder="U12345KA2015PTC123456" value={bidderForm.cinNo} onChange={e => setBidderForm(p => ({...p, cinNo: e.target.value}))} />
                </div>
                <div>
                  <label className="label">Contact Name</label>
                  <input className="input" placeholder="Contact person" value={bidderForm.contactName} onChange={e => setBidderForm(p => ({...p, contactName: e.target.value}))} />
                </div>
                <div>
                  <label className="label">Contact Email</label>
                  <input className="input" type="email" placeholder="contact@company.com" value={bidderForm.contactEmail} onChange={e => setBidderForm(p => ({...p, contactEmail: e.target.value}))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddBidder(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                  {loading ? '⟳ Adding...' : 'Add Bidder →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
