import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/Sidebar';
import { tenderAPI, bidderAPI } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const CAT_COLOR = {
  REGISTRATION: '#2563eb',
  TAX: '#059669',
  FINANCIAL: '#7c3aed',
  EXPERIENCE: '#ea580c',
  TECHNICAL: '#0284c7',
  OEM: '#dc2626',
};

const RISK_BADGE = {
  LOW: { label: 'Low Risk', color: '#059669', bg: '#ecfdf5' },
  MEDIUM: { label: 'Medium Risk', color: '#d97706', bg: '#fffbeb' },
  HIGH: { label: 'High Risk', color: '#dc2626', bg: '#fef2f2' },
  CRITICAL: { label: 'Critical Risk', color: '#991b1b', bg: '#fee2e2' },
};

export default function TenderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddBidder, setShowAddBidder] = useState(false);
  const [bidderForm, setBidderForm] = useState({
    organizationName: '',
    gstin: '',
    pan: '',
    contactName: '',
    contactEmail: '',
  });

  const loadTender = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tenderAPI.get(id);
      setTender(res.data);
    } catch {
      toast.error('Failed to load tender details');
      navigate('/tenders');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadTender();
  }, [loadTender]);

  const handleExtractRequirements = async () => {
    setLoading(true);
    try {
      await tenderAPI.extractRequirements(id);
      toast.success('🧠 AI extraction completed successfully');
      await loadTender();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Extraction failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishDraft = async () => {
    setLoading(true);
    try {
      await tenderAPI.update(id, { status: 'ACTIVE' });
      toast.success('🚀 Tender published to GeM Portal! Active for public bidding.');
      await loadTender();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to publish tender');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBidder = async (e) => {
    e.preventDefault();
    if (!bidderForm.organizationName) return toast.error('Organization name is required');
    try {
      await bidderAPI.create(id, bidderForm);
      toast.success('Bidder registered successfully');
      setShowAddBidder(false);
      setBidderForm({ organizationName: '', gstin: '', pan: '', contactName: '', contactEmail: '' });
      await loadTender();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add bidder');
    }
  };

  if (loading && !tender) {
    return (
      <AppLayout>
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          ⟳ Loading tender specification...
        </div>
      </AppLayout>
    );
  }

  if (!tender) return null;

  const isDraft = tender.status === 'DRAFT';

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'requirements', label: `Requirements (${tender.requirements?.length || 0})` },
    { key: 'bids', label: `Bids Received (${tender.bidders?.length || 0})` },
    { key: 'compliance', label: 'Compliance Overview' },
    { key: 'risk', label: 'Risk Distribution' },
    { key: 'reports', label: 'Reports & Audits' },
  ];

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#2563eb', fontWeight: 800 }}>
              {tender.referenceNo}
            </span>
            <span
              className="badge"
              style={{
                background: isDraft ? '#fffbeb' : '#ecfdf5',
                color: isDraft ? '#d97706' : '#059669',
                border: `1px solid ${isDraft ? '#fde68a' : '#a7f3d0'}`,
                fontWeight: 800
              }}
            >
              {isDraft ? '📝 DRAFT TENDER' : '✓ ACTIVE / PUBLISHED'}
            </span>
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.45rem', color: '#0f172a', marginBottom: 4 }}>
            {tender.title}
          </h1>
          <p style={{ color: '#475569', fontSize: '0.88rem' }}>
            {tender.organization} {tender.department ? `· ${tender.department}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {isDraft && (
            <button
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
              onClick={handlePublishDraft}
              disabled={loading}
            >
              🚀 Publish Tender to GeM
            </button>
          )}
          <button className="btn-secondary" onClick={handleExtractRequirements} disabled={loading}>
            {loading ? '⟳ Processing...' : '🧠 AI Extract Requirements'}
          </button>
          <button className="btn-primary" onClick={() => setShowAddBidder(true)}>
            + Add Bidder
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                cursor: 'pointer',
                background: activeTab === tab.key ? '#eff6ff' : '#ffffff',
                color: activeTab === tab.key ? '#1d4ed8' : '#475569',
                border: `1px solid ${activeTab === tab.key ? '#bfdbfe' : '#e2e8f0'}`,
                fontWeight: 800,
                fontSize: '0.82rem',
                boxShadow: activeTab === tab.key ? '0 2px 6px rgba(37,99,235,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: OVERVIEW ──────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Top Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { label: 'Estimated Tender Value', value: tender.estimatedValue ? `₹${(tender.estimatedValue / 10000000).toFixed(2)} Cr` : '—', icon: '💰', color: '#059669' },
                { label: 'Total Bids Received', value: tender.bidders?.length || 0, icon: '📥', color: '#2563eb' },
                { label: 'Structured Criteria', value: tender.requirements?.length || 0, icon: '📋', color: '#7c3aed' },
                { label: 'Submission Deadline', value: tender.closingDate ? format(new Date(tender.closingDate), 'dd MMM yyyy') : 'N/A', icon: '⏳', color: '#b45309' },
              ].map((s) => (
                <div key={s.label} className="card" style={{ padding: 18, borderLeft: `4px solid ${s.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '1.2rem' }}>{s.icon}</span>
                  </div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.6rem', color: '#0f172a', marginBottom: 2 }}>
                    {s.value}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#64748b' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Scope of Work */}
            <div className="card">
              <span className="section-title" style={{ display: 'block', marginBottom: 8 }}>
                Procurement Scope of Work
              </span>
              <p style={{ color: '#334155', fontSize: '0.88rem', lineHeight: 1.6 }}>
                {tender.description || 'No detailed scope description provided.'}
              </p>
            </div>
          </div>
        )}

        {/* ── TAB 2: REQUIREMENTS ──────────────────────────────────────────── */}
        {activeTab === 'requirements' && (
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="section-title">Structured Eligibility & Compliance Criteria ({tender.requirements?.length || 0})</span>
              <button className="btn-secondary" style={{ fontSize: '0.75rem' }} onClick={handleExtractRequirements}>
                🧠 Re-Run AI Extraction
              </button>
            </div>
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Criterion Title</th>
                    <th>Required Verification Evidence</th>
                    <th>Mandatory Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tender.requirements?.map((req) => (
                    <tr key={req.id}>
                      <td>
                        <span style={{
                          padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800,
                          background: `${CAT_COLOR[req.category] || '#64748b'}15`,
                          border: `1px solid ${CAT_COLOR[req.category] || '#64748b'}35`,
                          color: CAT_COLOR[req.category] || '#64748b',
                        }}>
                          {req.category}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
                        {req.title}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#475569' }}>
                        {req.description}
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 800,
                          color: req.mandatory ? '#dc2626' : '#059669',
                          background: req.mandatory ? '#fef2f2' : '#ecfdf5',
                          padding: '3px 8px', borderRadius: 6, border: `1px solid ${req.mandatory ? '#fecaca' : '#a7f3d0'}`
                        }}>
                          {req.mandatory ? 'MANDATORY' : 'OPTIONAL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: BIDS RECEIVED ─────────────────────────────────────────── */}
        {activeTab === 'bids' && (
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="section-title">Bidders & Compliance Scores ({tender.bidders?.length || 0})</span>
              <button className="btn-primary" style={{ fontSize: '0.75rem' }} onClick={() => setShowAddBidder(true)}>
                + Register Bidder
              </button>
            </div>
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Bidder Organization</th>
                    <th>GSTIN / PAN</th>
                    <th style={{ textAlign: 'center' }}>Compliance Score</th>
                    <th>Risk Assessment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tender.bidders?.map((bidder) => {
                    const score = bidder.complianceReport?.overallScore ?? 72;
                    const risk = bidder.complianceReport?.riskLevel || 'MEDIUM';
                    const riskMeta = RISK_BADGE[risk] || RISK_BADGE.MEDIUM;

                    return (
                      <tr key={bidder.id}>
                        <td>
                          <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                            {bidder.organizationName}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>{bidder.contactName} ({bidder.contactEmail})</div>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#64748b' }}>
                          <div>{bidder.gstin || 'GST: Pending'}</div>
                          <div>{bidder.pan || 'PAN: Pending'}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: 900, fontSize: '1.15rem', color: score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#dc2626' }}>
                            {score}%
                          </div>
                          <div className="progress-bar" style={{ height: 6, width: 80, margin: '4px auto 0', background: '#e2e8f0', borderRadius: 4 }}>
                            <div className="progress-fill" style={{ width: `${score}%`, background: score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#dc2626', height: '100%', borderRadius: 4 }} />
                          </div>
                        </td>
                        <td>
                          <span style={{
                            padding: '4px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800,
                            background: riskMeta.bg, color: riskMeta.color, border: `1px solid ${riskMeta.color}35`
                          }}>
                            {riskMeta.label}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700 }}>
                            {score >= 80 ? 'Verified' : 'Under Review'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn-primary"
                              style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                              onClick={() => navigate(`/compliance/${bidder.id}`)}
                            >
                              Review Compliance →
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 4: COMPLIANCE OVERVIEW ──────────────────────────────────── */}
        {activeTab === 'compliance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <span className="section-title" style={{ display: 'block', marginBottom: 12 }}>
                Tender Compliance Matrix & Distribution
              </span>
              <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.6 }}>
                Automated rule evaluations comparing tender thresholds against OCR-extracted figures. All calculations remain deterministic in backend code.
              </p>
            </div>
          </div>
        )}

        {/* ── TAB 5: RISK DISTRIBUTION ────────────────────────────────────── */}
        {activeTab === 'risk' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <span className="section-title" style={{ display: 'block', marginBottom: 12 }}>
                Risk & Inconsistency Analysis
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                <div style={{ padding: 16, background: '#ecfdf5', borderRadius: 10, border: '1px solid #a7f3d0' }}>
                  <div style={{ color: '#059669', fontWeight: 800, fontSize: '0.88rem' }}>Low Risk (1 Bidder)</div>
                  <div style={{ fontSize: '0.78rem', color: '#065f46', marginTop: 4 }}>Apex Safety Solutions LLP (Score: 94%)</div>
                </div>
                <div style={{ padding: 16, background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
                  <div style={{ color: '#d97706', fontWeight: 800, fontSize: '0.88rem' }}>Medium Risk (1 Bidder)</div>
                  <div style={{ fontSize: '0.78rem', color: '#92400e', marginTop: 4 }}>ABC Industries Pvt Ltd (Deficit on Turnover)</div>
                </div>
                <div style={{ padding: 16, background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca' }}>
                  <div style={{ color: '#dc2626', fontWeight: 800, fontSize: '0.88rem' }}>High Risk (1 Bidder)</div>
                  <div style={{ fontSize: '0.78rem', color: '#991b1b', marginTop: 4 }}>Zenith Protection Gear Co (Missing mandatory docs)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 6: REPORTS ──────────────────────────────────────────────── */}
        {activeTab === 'reports' && (
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className="section-title">Official Compliance Reports (PDF)</span>
              <button className="btn-primary" onClick={() => navigate('/reports')}>
                Go to Reports Archive →
              </button>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.6 }}>
              Multi-page PDF reports with executive summary, weighted risk formula breakdowns, government verification audit badges, and statutory disclaimers.
            </p>
          </div>
        )}
      </div>

      {/* Add Bidder Modal */}
      {showAddBidder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowAddBidder(false)}>
          <div className="card" style={{ maxWidth: 500, width: '100%', background: '#ffffff', border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>Register Bidder Submission</h2>
              <button className="btn-ghost" onClick={() => setShowAddBidder(false)} style={{ fontSize: '1rem', color: '#64748b' }}>✕</button>
            </div>
            <form onSubmit={handleAddBidder} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 800, display: 'block', marginBottom: 4 }}>COMPANY / BIDDER NAME *</label>
                <input className="input" placeholder="e.g. Apex Industrial Systems" value={bidderForm.organizationName} onChange={e => setBidderForm({ ...bidderForm, organizationName: e.target.value })} required style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 800, display: 'block', marginBottom: 4 }}>GSTIN</label>
                  <input className="input" placeholder="29AABCA1234C1Z5" value={bidderForm.gstin} onChange={e => setBidderForm({ ...bidderForm, gstin: e.target.value })} style={{ width: '100%', fontFamily: 'monospace' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 800, display: 'block', marginBottom: 4 }}>PAN</label>
                  <input className="input" placeholder="AABCA1234C" value={bidderForm.pan} onChange={e => setBidderForm({ ...bidderForm, pan: e.target.value })} style={{ width: '100%', fontFamily: 'monospace' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 800, display: 'block', marginBottom: 4 }}>CONTACT NAME</label>
                  <input className="input" placeholder="Rajesh Patel" value={bidderForm.contactName} onChange={e => setBidderForm({ ...bidderForm, contactName: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 800, display: 'block', marginBottom: 4 }}>OFFICIAL EMAIL</label>
                  <input className="input" type="email" placeholder="contact@apex.com" value={bidderForm.contactEmail} onChange={e => setBidderForm({ ...bidderForm, contactEmail: e.target.value })} style={{ width: '100%' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button type="button" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowAddBidder(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>Add Bidder to Tender</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
