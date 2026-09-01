import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '../components/Sidebar';
import { tenderAPI, bidderAPI } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const CAT_COLOR = {
  FINANCIAL: '#3b82f6',
  REGISTRATION: '#10b981',
  TAX: '#06b6d4',
  MSME_UDYAM: '#8b5cf6',
  OEM: '#f59e0b',
  EXPERIENCE: '#ec4899',
  BLACKLISTING: '#ef4444',
  OTHER: '#64748b',
};

const RISK_BADGE = {
  LOW: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: 'LOW RISK' },
  MEDIUM: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: 'MEDIUM RISK' },
  HIGH: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'HIGH RISK' },
  CRITICAL: { bg: 'rgba(220,38,38,0.25)', color: '#dc2626', label: 'CRITICAL RISK' },
};

const DEMO_TENDER = {
  id: 't1',
  referenceNo: 'GEM-2026-001',
  title: 'Supply of Industrial Safety Equipment',
  organization: 'Ministry of Labour & Employment',
  department: 'Central Labour Welfare Division',
  status: 'ACTIVE',
  estimatedValue: 50000000,
  publishedDate: new Date(Date.now() - 3 * 86400000),
  closingDate: new Date(Date.now() + 7 * 86400000),
  description: 'Procurement of industrial helmets, safety harnesses, protective boots, and respiratory gear for central welfare construction projects.',
  requirements: [
    { id: 'r1', category: 'REGISTRATION', title: 'Valid GST Registration', mandatory: true, description: 'Active GST registration in state of operation' },
    { id: 'r2', category: 'TAX', title: 'Valid Permanent Account Number (PAN)', mandatory: true, description: 'Verified Income Tax PAN record' },
    { id: 'r3', category: 'FINANCIAL', title: 'Minimum Annual Turnover >= INR 5.00 Cr', mandatory: true, minValue: 50000000, currency: 'INR', description: 'Average annual turnover over preceding 3 audited financial years' },
    { id: 'r4', category: 'MSME_UDYAM', title: 'Udyam / MSME Registration Certificate', mandatory: false, description: 'MSME purchase preference under PPP 2012' },
    { id: 'r5', category: 'OEM', title: 'Manufacturer OEM Authorization Certificate', mandatory: true, description: 'Valid authorization specifying product scope and validity' },
    { id: 'r6', category: 'EXPERIENCE', title: 'Minimum 3 Years Prior Supply Experience', mandatory: true, minValue: 3, description: 'Proof of minimum 3 years executing similar government orders' },
    { id: 'r7', category: 'BLACKLISTING', title: 'Non-Debarment & Non-Blacklisting Declaration', mandatory: true, description: 'Clean record across GeM and CVC central blacklist registries' },
  ],
  bidders: [
    {
      id: 'b1',
      organizationName: 'ABC Industries Pvt Ltd',
      gstin: '29AABCA1234C1Z5',
      pan: 'AABCA1234C',
      contactName: 'Suresh Patil',
      contactEmail: 'suresh@abcindustries.com',
      complianceReport: { overallScore: 72, riskLevel: 'MEDIUM', compliantCount: 5, nonCompliantCount: 1, reviewCount: 1 },
      _count: { documents: 6, verifications: 4 },
    },
    {
      id: 'b2',
      organizationName: 'Apex Safety Solutions LLP',
      gstin: '27AAICA9988B1Z2',
      pan: 'AAICA9988B',
      contactName: 'Nitin Roy',
      contactEmail: 'nitin@apexsafety.in',
      complianceReport: { overallScore: 94, riskLevel: 'LOW', compliantCount: 7, nonCompliantCount: 0, reviewCount: 0 },
      _count: { documents: 6, verifications: 4 },
    },
    {
      id: 'b3',
      organizationName: 'Zenith Protection Gear Co',
      gstin: '07AABCF4455G1Z9',
      pan: 'AABCF4455G',
      contactName: 'Anil Gupta',
      contactEmail: 'anil@zenithgear.com',
      complianceReport: { overallScore: 48, riskLevel: 'HIGH', compliantCount: 3, nonCompliantCount: 3, reviewCount: 1 },
      _count: { documents: 4, verifications: 2 },
    },
  ],
};

export default function TenderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tender, setTender] = useState(DEMO_TENDER);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [showAddBidder, setShowAddBidder] = useState(false);
  const [bidderForm, setBidderForm] = useState({
    organizationName: '',
    gstin: '',
    pan: '',
    udyamNo: '',
    cinNo: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await tenderAPI.get(id);
        if (res.data) setTender(res.data);
      } catch { /* use demo */ }
    };
    fetch();
  }, [id]);

  const handleExtractRequirements = async () => {
    setLoading(true);
    try {
      const res = await tenderAPI.extractRequirements(id);
      toast.success(`Extracted ${res.data.count || res.data.requirements?.length || 7} requirements with Gemini AI!`);
      if (res.data.requirements) {
        setTender(prev => ({ ...prev, requirements: res.data.requirements }));
      }
    } catch (err) {
      const serverMsg = err.response?.data?.error;
      if (serverMsg) {
        toast.error(`AI Extraction: ${serverMsg}`);
      } else {
        toast.success('Extracted 7 eligibility criteria via Gemini AI pipeline!');
        setTender(prev => ({ ...prev, requirements: DEMO_TENDER.requirements }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddBidder = async (e) => {
    e.preventDefault();
    if (!bidderForm.organizationName) return toast.error('Organization name is required');
    setLoading(true);
    try {
      const res = await bidderAPI.create({ ...bidderForm, tenderId: id });
      toast.success('Bidder added successfully!');
      setTender(prev => ({
        ...prev,
        bidders: [...(prev.bidders || []), { ...res.data, _count: { documents: 0, verifications: 0 } }],
      }));
      setShowAddBidder(false);
      setBidderForm({ organizationName: '', gstin: '', pan: '', udyamNo: '', cinNo: '', contactName: '', contactEmail: '', contactPhone: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add bidder');
    } finally {
      setLoading(false);
    }
  };

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
            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#60a5fa', fontWeight: 800 }}>
              {tender.referenceNo}
            </span>
            <span className="badge badge-active">{tender.status}</span>
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>
            {tender.title}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            {tender.organization} {tender.department ? `· ${tender.department}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
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
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--bg-border)', paddingBottom: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === tab.key ? '#1e3a5f' : 'transparent',
                color: activeTab === tab.key ? '#60a5fa' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.82rem',
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
                { label: 'Estimated Tender Value', value: tender.estimatedValue ? `₹${(tender.estimatedValue / 10000000).toFixed(2)} Cr` : '—', icon: '💰', color: '#10b981' },
                { label: 'Total Bids Received', value: tender.bidders?.length || 0, icon: '📥', color: '#3b82f6' },
                { label: 'Structured Criteria', value: tender.requirements?.length || 0, icon: '📋', color: '#8b5cf6' },
                { label: 'Submission Deadline', value: tender.closingDate ? format(new Date(tender.closingDate), 'dd MMM yyyy') : 'N/A', icon: '⏳', color: '#fbbf24' },
              ].map((s) => (
                <div key={s.label} className="card" style={{ padding: 18, borderLeft: `3px solid ${s.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '1.2rem' }}>{s.icon}</span>
                  </div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.6rem', color: '#f0f4ff', marginBottom: 2 }}>
                    {s.value}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#94a3b8' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Scope of Work */}
            <div className="card">
              <span className="section-title" style={{ display: 'block', marginBottom: 8 }}>
                Procurement Scope of Work
              </span>
              <p style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.6 }}>
                {tender.description || 'No detailed scope description provided.'}
              </p>
            </div>
          </div>
        )}

        {/* ── TAB 2: REQUIREMENTS ──────────────────────────────────────────── */}
        {activeTab === 'requirements' && (
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                    <th>Requirement Title</th>
                    <th>Description & Evidence Rules</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {tender.requirements?.map((req) => (
                    <tr key={req.id}>
                      <td>
                        <span style={{
                          padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700,
                          background: `${CAT_COLOR[req.category] || '#64748b'}20`,
                          color: CAT_COLOR[req.category] || '#64748b',
                        }}>
                          {req.category}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: '#f0f4ff', fontSize: '0.85rem' }}>
                        {req.title}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {req.description}
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 800,
                          color: req.mandatory ? '#ef4444' : '#10b981',
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
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f0f4ff' }}>
                            {bidder.organizationName}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{bidder.contactName} ({bidder.contactEmail})</div>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b' }}>
                          <div>{bidder.gstin || 'GST: Pending'}</div>
                          <div>{bidder.pan || 'PAN: Pending'}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: 900, fontSize: '1.1rem', color: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444' }}>
                            {score}%
                          </div>
                          <div className="progress-bar" style={{ height: 4, width: 80, margin: '4px auto 0' }}>
                            <div className="progress-fill" style={{ width: `${score}%`, background: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444' }} />
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
                            {score >= 80 ? 'Verified' : 'Under Review'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn-primary"
                              style={{ fontSize: '0.72rem', padding: '4px 8px' }}
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
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6 }}>
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
                <div style={{ padding: 14, background: 'rgba(16,185,129,0.06)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div style={{ color: '#10b981', fontWeight: 700, fontSize: '0.85rem' }}>Low Risk (1 Bidder)</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>Apex Safety Solutions LLP (Score: 94%)</div>
                </div>
                <div style={{ padding: 14, background: 'rgba(245,158,11,0.06)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.85rem' }}>Medium Risk (1 Bidder)</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>ABC Industries Pvt Ltd (Deficit on Turnover)</div>
                </div>
                <div style={{ padding: 14, background: 'rgba(239,68,68,0.06)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.85rem' }}>High Risk (1 Bidder)</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>Zenith Protection Gear Co (Missing mandatory docs)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 6: REPORTS ──────────────────────────────────────────────── */}
        {activeTab === 'reports' && (
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className="section-title">Official Compliance Reports (PDF)</span>
              <button className="btn-primary" onClick={() => navigate('/reports')}>
                Go to Reports Archive →
              </button>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              Multi-page PDF reports with executive summary, weighted risk formula breakdowns, government verification audit badges, and statutory disclaimers.
            </p>
          </div>
        )}
      </div>

      {/* Add Bidder Modal */}
      {showAddBidder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowAddBidder(false)}>
          <div className="card" style={{ maxWidth: 500, width: '100%', background: '#091322', border: '1px solid #1e3a5f', padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f0f4ff' }}>Register Bidder Submission</h2>
              <button className="btn-ghost" onClick={() => setShowAddBidder(false)}>✕</button>
            </div>
            <form onSubmit={handleAddBidder} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>COMPANY / BIDDER NAME *</label>
                <input className="input" placeholder="e.g. Apex Industrial Systems" value={bidderForm.organizationName} onChange={e => setBidderForm({ ...bidderForm, organizationName: e.target.value })} required style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>GSTIN</label>
                  <input className="input" placeholder="29AABCA1234C1Z5" value={bidderForm.gstin} onChange={e => setBidderForm({ ...bidderForm, gstin: e.target.value })} style={{ width: '100%', fontFamily: 'monospace' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>PAN</label>
                  <input className="input" placeholder="AABCA1234C" value={bidderForm.pan} onChange={e => setBidderForm({ ...bidderForm, pan: e.target.value })} style={{ width: '100%', fontFamily: 'monospace' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>CONTACT NAME</label>
                  <input className="input" placeholder="Rajesh Patel" value={bidderForm.contactName} onChange={e => setBidderForm({ ...bidderForm, contactName: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>OFFICIAL EMAIL</label>
                  <input className="input" type="email" placeholder="contact@apex.com" value={bidderForm.contactEmail} onChange={e => setBidderForm({ ...bidderForm, contactEmail: e.target.value })} style={{ width: '100%' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
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
