import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/Sidebar';
import { complianceAPI, bidderAPI, reportAPI } from '../services/api';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import toast from 'react-hot-toast';

// Demo data for hackathon demonstration
const DEMO_DATA = {
  bidder: {
    id: 'b1', organizationName: 'ABC Industries Pvt Ltd', gstin: '29AABCA1234C1Z5',
    pan: 'AABCA1234C', udyamNo: 'UDYAM-KA-01-0000001',
    tender: { referenceNo: 'TND-2026-001', title: 'Supply of Industrial Safety Equipment' }
  },
  report: { overallScore: 72, riskLevel: 'MEDIUM', compliantCount: 4, nonCompliantCount: 1, missingCount: 1, inconsistentCount: 0, pendingCount: 0, reviewCount: 1, summary: 'Bidder shows moderate compliance. Annual turnover below required threshold. OEM authorization requires human review.', recommendations: 'Request updated financial statements from bidder. Verify OEM authorization with manufacturer.' },
  items: [
    { id: 'c1', requirement: { category: 'REGISTRATION', title: 'Valid GST Registration', mandatory: true, description: 'Bidder must possess a valid GST registration certificate.', minValue: null }, status: 'COMPLIANT', evidenceSummary: 'GSTIN: 29AABCA1234C1Z5', ruleApplied: 'GST registration is Active.', aiExplanation: 'The bidder has submitted a valid GST certificate with GSTIN 29AABCA1234C1Z5. Government verification confirms the registration is ACTIVE as of the verification date.', confidence: 1.0, evidencePage: 2 },
    { id: 'c2', requirement: { category: 'TAX', title: 'Valid PAN', mandatory: true, description: 'Bidder must have a valid Permanent Account Number (PAN).', minValue: null }, status: 'COMPLIANT', evidenceSummary: 'PAN: AABCA1234C', ruleApplied: 'PAN verified and active.', aiExplanation: 'PAN AABCA1234C has been verified with the Income Tax portal. Entity type confirmed as Company.', confidence: 1.0, evidencePage: 3 },
    { id: 'c3', requirement: { category: 'MSME_UDYAM', title: 'Udyam/MSME Registration', mandatory: false, description: 'Bidder must be registered under Udyam portal.' }, status: 'COMPLIANT', evidenceSummary: 'Udyam: UDYAM-KA-01-0000001, Category: Small', ruleApplied: 'Udyam verified. Category: Small', aiExplanation: 'Udyam registration verified. Enterprise category is Small, which qualifies for MSME purchase preference under MSME Policy 2012.', confidence: 1.0, ragReference: 'MSME Policy 2012: MSME enterprises are eligible for purchase preference.' },
    { id: 'c4', requirement: { category: 'FINANCIAL', title: 'Minimum Annual Turnover ≥ ₹5 Cr', mandatory: true, description: 'Minimum average annual turnover of INR 5 crore over preceding 3 financial years.', minValue: 50000000 }, status: 'NON_COMPLIANT', evidenceSummary: 'Found: ₹3.20 Cr INR (FY 2025-26)', ruleApplied: 'Actual: ₹3.20 Cr < Required: ₹5.00 Cr', aiExplanation: 'The financial statement for FY 2025-26 shows annual turnover of ₹3.2 crore. This is below the required minimum of ₹5 crore. The requirement is NOT met.', confidence: 0.92, evidencePage: 4, ragReference: 'GeM Procurement Rules: Financial eligibility requires audited financial statements.' },
    { id: 'c5', requirement: { category: 'OEM', title: 'OEM Authorization Certificate', mandatory: true, description: 'Bidder must submit a valid OEM authorization certificate from the manufacturer.' }, status: 'REQUIRES_HUMAN_REVIEW', evidenceSummary: 'Letter from XYZ Corp found', ruleApplied: 'Partial evidence found. Similarity score: 0.68. Human review recommended.', aiExplanation: 'A letter from XYZ Corporation was found that may constitute OEM authorization. However, the document does not explicitly state the products covered or the validity period. Human review is required.', confidence: 0.65, evidencePage: 7, ragReference: 'GeM Guidelines: OEM authorization must specify products, territory, and validity period.' },
    { id: 'c6', requirement: { category: 'EXPERIENCE', title: 'Minimum 3 Years Experience', mandatory: true, description: 'Minimum 3 years experience in supply of similar products.' }, status: 'COMPLIANT', evidenceSummary: 'Experience certificate — 5 years (2020-2025)', ruleApplied: 'Actual: 5 years >= Required: 3 years', aiExplanation: 'Experience certificate confirms 5 years of supply experience from 2020 to 2025, exceeding the minimum requirement of 3 years.', confidence: 0.88, evidencePage: 8 },
    { id: 'c7', requirement: { category: 'BLACKLISTING', title: 'Non-Blacklisting Declaration', mandatory: true, description: 'Bidder must not be blacklisted or debarred by any government entity.' }, status: 'COMPLIANT', evidenceSummary: 'Checked: GeM Blacklist, CVC Debarment List, Ministry Debarment List', ruleApplied: 'No adverse record found.', aiExplanation: 'Blacklist verification performed against GeM blacklist, CVC debarment list, and ministry debarment lists. No adverse record found.', confidence: 0.7, ragReference: 'CVC Guidelines: Blacklisted companies cannot participate in government procurement.' },
  ],
  verifications: [
    { source: 'GST_PORTAL', status: 'MOCK_VERIFIED', isMockData: true, verifiedData: { gstin: '29AABCA1234C1Z5', status: 'ACTIVE', legalName: 'ABC Industries Pvt Ltd', state: 'Karnataka' } },
    { source: 'PAN_INCOME_TAX', status: 'MOCK_VERIFIED', isMockData: true, verifiedData: { pan: 'AABCA1234C', entityType: 'Company', filingStatus: 'COMPLIANT' } },
    { source: 'UDYAM_PORTAL', status: 'MOCK_VERIFIED', isMockData: true, verifiedData: { udyamNo: 'UDYAM-KA-01-0000001', category: 'Small', status: 'ACTIVE' } },
    { source: 'BLACKLIST_REGISTRY', status: 'MOCK_VERIFIED', isMockData: true, verifiedData: { isBlacklisted: false, result: 'NO_ADVERSE_RECORD' } },
  ]
};

const STATUS_CFG = {
  COMPLIANT: { label: '✓ Compliant', cls: 'badge-compliant', color: '#10b981' },
  NON_COMPLIANT: { label: '✗ Non-Compliant', cls: 'badge-non-compliant', color: '#ef4444' },
  MISSING: { label: '⚠ Missing', cls: 'badge-missing', color: '#f59e0b' },
  INCONSISTENT: { label: '≠ Inconsistent', cls: 'badge-inconsistent', color: '#a855f7' },
  PENDING_VERIFICATION: { label: '⟳ Pending', cls: 'badge-pending', color: '#3b82f6' },
  REQUIRES_HUMAN_REVIEW: { label: '👁 Review', cls: 'badge-review', color: '#fb923c' },
};

const CAT_COLOR = { FINANCIAL: '#3b82f6', REGISTRATION: '#10b981', TAX: '#06b6d4', MSME_UDYAM: '#8b5cf6', OEM: '#f59e0b', EXPERIENCE: '#ec4899', BLACKLISTING: '#ef4444', OTHER: '#64748b' };

export default function ComplianceDashboardPage() {
  const { bidderId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(DEMO_DATA);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reviewAction, setReviewAction] = useState('');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [compRes, bidderRes] = await Promise.all([
          complianceAPI.getBidderCompliance(bidderId),
          bidderAPI.get(bidderId)
        ]);
        setData({ ...compRes.data, bidder: bidderRes.data });
      } catch { /* use demo */ }
    };
    fetch();
  }, [bidderId]);

  const { report, items, verifications, bidder } = data;

  const pieData = report ? [
    { name: 'Compliant', value: report.compliantCount, color: '#10b981' },
    { name: 'Non-Compliant', value: report.nonCompliantCount, color: '#ef4444' },
    { name: 'Missing', value: report.missingCount, color: '#f59e0b' },
    { name: 'Review', value: report.reviewCount, color: '#fb923c' },
    { name: 'Pending', value: report.pendingCount, color: '#3b82f6' },
  ].filter(d => d.value > 0) : [];

  const handleReview = async () => {
    if (!selectedItem || !reviewAction) return toast.error('Select an action.');
    setLoading(true);
    try {
      await complianceAPI.reviewItem(selectedItem.id, { action: reviewAction, remarks: reviewRemarks });
      toast.success('Review submitted successfully.');
      setSelectedItem(null);
    } catch {
      toast.error('Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  const RISK_CFG = {
    LOW: { color: '#10b981', label: 'LOW RISK', bg: 'rgba(16,185,129,0.1)' },
    MEDIUM: { color: '#f59e0b', label: 'MEDIUM RISK', bg: 'rgba(245,158,11,0.1)' },
    HIGH: { color: '#ef4444', label: 'HIGH RISK', bg: 'rgba(239,68,68,0.1)' },
    CRITICAL: { color: '#dc2626', label: 'CRITICAL RISK', bg: 'rgba(220,38,38,0.1)' },
  };
  const riskCfg = RISK_CFG[report?.riskLevel] || RISK_CFG.MEDIUM;

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ fontSize: '0.75rem', color: '#4a6080', marginBottom: 4 }}>
            {bidder?.tender?.referenceNo} — Compliance Dashboard
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: '#f0f4ff', marginBottom: 4 }}>
            {bidder?.organizationName || 'Bidder'}
          </h1>
          <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{bidder?.tender?.title}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="mock-banner">⚠ SANDBOX — Demo data</div>
          <button className="btn-secondary" onClick={() => navigate(-1)}>← Back</button>
          <button className="btn-primary" onClick={() => { toast.success('Report generated!'); navigate(`/reports`); }}>
            📊 Generate Report
          </button>
        </div>
      </div>

      <div style={{ padding: '28px 32px' }}>
        {/* Top Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Compliant', val: report?.compliantCount, color: '#10b981' },
            { label: 'Non-Compliant', val: report?.nonCompliantCount, color: '#ef4444' },
            { label: 'Missing', val: report?.missingCount, color: '#f59e0b' },
            { label: 'Inconsistent', val: report?.inconsistentCount, color: '#a855f7' },
            { label: 'Pending', val: report?.pendingCount, color: '#3b82f6' },
            { label: 'Review', val: report?.reviewCount, color: '#fb923c' },
          ].map(s => (
            <div key={s.label} style={{
              background: `${s.color}10`, border: `1px solid ${s.color}30`, borderRadius: 12,
              padding: '14px 16px', textAlign: 'center'
            }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.8rem', color: s.color }}>{s.val ?? 0}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, marginBottom: 24 }}>
          {/* Score Panel */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            {/* Score Ring */}
            <div>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.08em' }}>COMPLIANCE SCORE</span>
              </div>
              <div style={{ position: 'relative', width: 160, height: 160 }}>
                <svg width="160" height="160" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="68" fill="none" stroke="var(--bg-border)" strokeWidth="12"/>
                  <circle cx="80" cy="80" r="68" fill="none"
                    stroke={report?.overallScore >= 75 ? '#10b981' : report?.overallScore >= 50 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="12"
                    strokeDasharray={`${((report?.overallScore || 0) / 100) * 2 * Math.PI * 68} ${2 * Math.PI * 68}`}
                    strokeLinecap="round" transform="rotate(-90 80 80)" style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '2.5rem', color: '#f0f4ff', lineHeight: 1 }}>
                    {report?.overallScore || 0}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: '#64748b' }}>/ 100</span>
                </div>
              </div>
            </div>

            {/* Risk Level */}
            <div style={{
              padding: '10px 20px', borderRadius: 10, background: riskCfg.bg,
              border: `1px solid ${riskCfg.color}40`, textAlign: 'center', width: '100%'
            }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: riskCfg.color }}>{riskCfg.label}</div>
            </div>

            {/* Pie Chart */}
            {pieData.length > 0 && (
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 8, fontSize: '0.75rem' }}
                    formatter={(val, name) => [val, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* AI Summary */}
            <div style={{ background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: 10, padding: 14, width: '100%' }}>
              <div style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 700, marginBottom: 6 }}>🧠 AI SUMMARY</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6 }}>{report?.summary}</div>
            </div>
          </div>

          {/* Government Verifications */}
          <div className="card">
            <span className="section-title" style={{ display: 'block', marginBottom: 16 }}>Government Data Verification</span>
            <div className="mock-banner" style={{ marginBottom: 16 }}>
              ⚠ All verifications below are SANDBOX/DEMO data — not real government portal responses
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {verifications?.map(v => (
                <div key={v.source} style={{
                  border: '1px solid var(--bg-border)', borderRadius: 10, padding: 14,
                  borderLeft: `3px solid ${v.status === 'MOCK_VERIFIED' ? '#10b981' : v.status === 'FAILED' ? '#ef4444' : '#3b82f6'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#f0f4ff' }}>{v.source.replace(/_/g, ' ')}</span>
                    {v.isMockData && <span className="badge badge-mock">MOCK</span>}
                  </div>
                  <span className={`badge ${v.status === 'MOCK_VERIFIED' ? 'badge-compliant' : 'badge-pending'}`} style={{ fontSize: '0.7rem' }}>
                    {v.status.replace(/_/g, ' ')}
                  </span>
                  <div style={{ marginTop: 8 }}>
                    {v.verifiedData && Object.entries(v.verifiedData).slice(0, 3).filter(([k]) => k !== 'note').map(([k, val]) => (
                      <div key={k} style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                        <span style={{ color: '#4a6080' }}>{k}: </span>
                        <span style={{ color: '#94a3b8', fontFamily: typeof val === 'boolean' ? undefined : 'monospace' }}>
                          {typeof val === 'boolean' ? (val ? '✓ Yes' : '✗ No') : String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Compliance Items Table */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-title">Compliance Requirements Analysis</span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{items?.length || 0} requirements evaluated</span>
          </div>

          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Requirement</th>
                  <th>Mandatory</th>
                  <th>Evidence Found</th>
                  <th>Rule Applied</th>
                  <th>Status</th>
                  <th>Confidence</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items?.map(item => {
                  const cfg = STATUS_CFG[item.status] || {};
                  return (
                    <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedItem(item)}>
                      <td>
                        <span style={{
                          padding: '2px 8px', borderRadius: 6, fontSize: '0.65rem', fontWeight: 700,
                          background: `${CAT_COLOR[item.requirement?.category] || '#64748b'}20`,
                          color: CAT_COLOR[item.requirement?.category] || '#64748b'
                        }}>{item.requirement?.category?.replace(/_/g, ' ')}</span>
                      </td>
                      <td style={{ fontWeight: 600, maxWidth: 200 }}>
                        {item.requirement?.title}
                        {item.ragReference && <div style={{ fontSize: '0.7rem', color: '#3b82f6', marginTop: 2 }}>📚 RAG reference available</div>}
                      </td>
                      <td>
                        {item.requirement?.mandatory
                          ? <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 700 }}>MANDATORY</span>
                          : <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Optional</span>}
                      </td>
                      <td style={{ maxWidth: 180, color: '#94a3b8', fontSize: '0.8rem' }}>
                        {item.evidenceSummary || <span style={{ color: '#4a6080', fontStyle: 'italic' }}>None found</span>}
                        {item.evidencePage && <span style={{ color: '#64748b', fontSize: '0.7rem' }}> (p.{item.evidencePage})</span>}
                      </td>
                      <td style={{ maxWidth: 200, color: '#64748b', fontSize: '0.78rem' }}>{item.ruleApplied}</td>
                      <td>
                        <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div className="progress-bar" style={{ width: 60 }}>
                            <div className="progress-fill" style={{ width: `${(item.confidence || 0) * 100}%`, background: item.confidence >= 0.8 ? '#10b981' : item.confidence >= 0.6 ? '#f59e0b' : '#ef4444' }} />
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{Math.round((item.confidence || 0) * 100)}%</span>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn-ghost"
                          style={{ fontSize: '0.75rem', padding: '4px 10px', color: '#3b82f6' }}
                          onClick={e => { e.stopPropagation(); setSelectedItem(item); }}
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Explainability Modal */}
      {selectedItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setSelectedItem(null)}>
          <div className="card" style={{ maxWidth: 700, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 32 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, background: `${CAT_COLOR[selectedItem.requirement?.category]}20`, color: CAT_COLOR[selectedItem.requirement?.category] }}>
                  {selectedItem.requirement?.category?.replace(/_/g, ' ')}
                </span>
                <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f0f4ff', marginTop: 8, marginBottom: 4 }}>{selectedItem.requirement?.title}</h2>
                <p style={{ color: '#64748b', fontSize: '0.8rem' }}>{selectedItem.requirement?.description}</p>
              </div>
              <button className="btn-ghost" onClick={() => setSelectedItem(null)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>

            {/* Status */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <span className={`badge ${STATUS_CFG[selectedItem.status]?.cls}`} style={{ fontSize: '0.875rem', padding: '6px 16px' }}>
                {STATUS_CFG[selectedItem.status]?.label}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                Confidence: <span style={{ color: '#f0f4ff', fontWeight: 700 }}>{Math.round((selectedItem.confidence || 0) * 100)}%</span>
              </span>
            </div>

            {/* Explainability sections */}
            {[
              { title: '📄 Evidence Found', content: selectedItem.evidenceSummary, sub: selectedItem.evidencePage ? `Source: Document Page ${selectedItem.evidencePage}` : null, color: '#3b82f6' },
              { title: '⚖ Compliance Rule Applied', content: selectedItem.ruleApplied, color: '#f59e0b' },
              { title: '🧠 AI Interpretation (Gemini)', content: selectedItem.aiExplanation, color: '#8b5cf6' },
              { title: '📚 RAG Reference (Procurement Guidelines)', content: selectedItem.ragReference, color: '#06b6d4' },
            ].filter(s => s.content).map(section => (
              <div key={section.title} style={{ marginBottom: 16, padding: 14, background: `${section.color}08`, border: `1px solid ${section.color}20`, borderRadius: 10 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: section.color, marginBottom: 8 }}>{section.title}</div>
                <div style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.7 }}>{section.content}</div>
                {section.sub && <div style={{ fontSize: '0.72rem', color: '#4a6080', marginTop: 6 }}>{section.sub}</div>}
              </div>
            ))}

            {/* Human Review Panel */}
            {(selectedItem.status === 'REQUIRES_HUMAN_REVIEW' || selectedItem.status === 'INCONSISTENT') && (
              <div style={{ padding: 16, background: 'rgba(251, 146, 60, 0.08)', border: '1px solid rgba(251, 146, 60, 0.25)', borderRadius: 10, marginTop: 8 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fb923c', marginBottom: 12 }}>👤 HUMAN-IN-THE-LOOP — Officer Review Required</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  {['APPROVED', 'REJECTED', 'MARK_FOR_REVIEW'].map(action => (
                    <button
                      key={action}
                      onClick={() => setReviewAction(action)}
                      style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                        background: reviewAction === action ? 'rgba(59, 130, 246, 0.2)' : 'rgba(30,45,74,0.5)',
                        color: reviewAction === action ? '#60a5fa' : '#64748b',
                        border: `1px solid ${reviewAction === action ? 'rgba(59,130,246,0.4)' : 'var(--bg-border)'}`,
                      }}
                    >{action.replace(/_/g, ' ')}</button>
                  ))}
                </div>
                <textarea
                  className="input"
                  placeholder="Officer remarks (optional)..."
                  value={reviewRemarks}
                  onChange={e => setReviewRemarks(e.target.value)}
                  style={{ height: 60, resize: 'none', marginBottom: 10 }}
                />
                <button className="btn-primary" disabled={loading || !reviewAction} onClick={handleReview} style={{ width: '100%', justifyContent: 'center' }}>
                  {loading ? '⟳ Submitting...' : 'Submit Review Decision'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
