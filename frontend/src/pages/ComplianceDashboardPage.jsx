import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/Sidebar';
import { complianceAPI, bidderAPI, reportAPI } from '../services/api';
import EvidenceViewer from '../components/EvidenceViewer';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import toast from 'react-hot-toast';

const STATUS_CFG = {
  COMPLIANT:             { label: '✓ Compliant',     cls: 'badge-compliant',     color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  NON_COMPLIANT:         { label: '✗ Non-Compliant', cls: 'badge-non-compliant', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  MISSING:               { label: '⚠ Missing Doc',   cls: 'badge-missing',       color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  MISSING_EVIDENCE:      { label: '⚠ No Evidence',   cls: 'badge-missing',       color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
  INCONSISTENT:          { label: '≠ Inconsistent',  cls: 'badge-inconsistent',  color: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
  NEEDS_REVIEW:          { label: '👁 Needs Review', cls: 'badge-review',        color: '#fcd34d', bg: 'rgba(252,211,77,0.1)' },
  REQUIRES_HUMAN_REVIEW: { label: '👁 Review Req.',  cls: 'badge-review',        color: '#fcd34d', bg: 'rgba(252,211,77,0.1)' },
  UNVERIFIED:            { label: '○ Unverified',    cls: 'badge-pending',       color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' },
  PENDING_VERIFICATION:  { label: '⟳ Pending',       cls: 'badge-pending',       color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
};

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

const RISK_CFG = {
  LOW:      { color: '#10b981', label: 'LOW RISK',      bg: 'rgba(16,185,129,0.12)', border: '#10b981' },
  MEDIUM:   { color: '#f59e0b', label: 'MEDIUM RISK',   bg: 'rgba(245,158,11,0.12)', border: '#f59e0b' },
  HIGH:     { color: '#ef4444', label: 'HIGH RISK',     bg: 'rgba(239,68,68,0.12)',  border: '#ef4444' },
  CRITICAL: { color: '#dc2626', label: 'CRITICAL RISK', bg: 'rgba(220,38,38,0.18)',  border: '#dc2626' },
};

export default function ComplianceDashboardPage() {
  const { bidderId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const [verifyingBid, setVerifyingBid] = useState(false);

  // EvidenceViewer modal state
  const [viewingEvidenceItem, setViewingEvidenceItem] = useState(null);

  // Review modal state
  const [reviewingItem, setReviewingItem] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVED');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [overrideStatus, setOverrideStatus] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Active tab inside the page
  const [activeTab, setActiveTab] = useState('requirements'); // 'requirements' | 'risk' | 'verifications'

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [compRes, bidderRes] = await Promise.all([
        complianceAPI.getBidderCompliance(bidderId),
        bidderAPI.get(bidderId).catch(() => ({ data: null })),
      ]);

      const mergedData = {
        ...compRes.data,
        bidder: compRes.data?.bidder || bidderRes.data || { organizationName: 'Bidder' },
      };
      setData(mergedData);
    } catch (err) {
      console.error('Failed to load compliance data:', err);
      setError('Unable to load compliance data from server. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  }, [bidderId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVerifyBid = async () => {
    setVerifyingBid(true);
    try {
      await bidderAPI.verify(bidderId);
      toast.success('Real-time bid compliance verified against master government gateways as of present date!');
      await fetchData();
    } catch (err) {
      toast.error('Verification failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setVerifyingBid(false);
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      await reportAPI.generate(bidderId);
      toast.success('Compliance report generated & updated!');
      await fetchData();
    } catch (err) {
      toast.error('Failed to generate report: ' + (err.response?.data?.error || err.message));
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const response = await reportAPI.download(bidderId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ComplyGeM_Report_${bidderId}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF report downloaded!');
    } catch (err) {
      toast.error('Failed to download PDF: ' + (err.response?.data?.error || err.message));
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleOpenReview = (item, e) => {
    e?.stopPropagation();
    setReviewingItem(item);
    setReviewAction('APPROVED');
    setReviewRemarks('');
    setOverrideStatus('');
  };

  const handleSubmitReview = async () => {
    if (!reviewingItem || !reviewAction) {
      return toast.error('Please select a review action.');
    }
    setSubmittingReview(true);
    try {
      await complianceAPI.reviewItem(reviewingItem.id, {
        action: reviewAction,
        remarks: reviewRemarks,
        overrideStatus: overrideStatus || undefined,
      });
      toast.success('Human review decision recorded!');
      setReviewingItem(null);
      await fetchData();
    } catch (err) {
      toast.error('Failed to submit review: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ padding: '60px 32px', textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: 44, height: 44, border: '3px solid #e2e8f0', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin-slow 1s linear infinite', margin: '0 auto 16px' }} />
          <h2 style={{ color: '#0f172a', fontWeight: 800 }}>Loading Compliance Intelligence...</h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Evaluating deterministic rules and RAG evidence against master government registries...</p>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div style={{ padding: '40px 32px' }}>
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 14,
            padding: 32,
            textAlign: 'center',
            maxWidth: 600,
            margin: '0 auto',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
            <h2 style={{ color: '#dc2626', fontWeight: 800, marginBottom: 8 }}>Compliance Data Unavailable</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 20 }}>{error}</p>
            <button className="btn-primary" onClick={fetchData}>
              ⟳ Retry Loading
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const { report, items = [], verifications = [], bidder = {}, riskAnalysis } = data || {};
  const effectiveRisk = riskAnalysis || report || {};
  const isVerified = bidder?.status === 'VERIFIED';
  const riskCfg = RISK_CFG[effectiveRisk.riskLevel] || (isVerified ? RISK_CFG.LOW : RISK_CFG.MEDIUM);

  const pieData = [
    { name: 'Compliant',     value: effectiveRisk.compliantCount || 0,     color: '#10b981' },
    { name: 'Non-Compliant', value: effectiveRisk.nonCompliantCount || 0,  color: '#ef4444' },
    { name: 'Missing',       value: effectiveRisk.missingCount || 0,       color: '#f59e0b' },
    { name: 'Review Needed', value: effectiveRisk.reviewCount || 0,        color: '#fb923c' },
    { name: 'Inconsistent',  value: effectiveRisk.inconsistentCount || 0,  color: '#c084fc' },
    { name: 'Unverified',    value: effectiveRisk.unverifiedCount || 0,    color: '#9ca3af' },
  ].filter(d => d.value > 0);

  return (
    <AppLayout>
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 800, letterSpacing: '0.05em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{bidder?.tender?.referenceNo || 'GEM/2026/B/884129'}</span>
            <span>·</span>
            <span>{bidder?.tender?.organization || 'Ministry of Labour & Employment'}</span>
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.45rem', color: '#0f172a', marginBottom: 4 }}>
            {bidder?.organizationName || 'Bidder Verification'}
          </h1>
          <div style={{ color: '#64748b', fontSize: '0.84rem' }}>
            {bidder?.tender?.title || 'Tender Compliance Verification'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn-secondary" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <button
            className="btn-primary"
            style={{ background: 'linear-gradient(135deg, #059669, #047857)', display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={handleVerifyBid}
            disabled={verifyingBid}
          >
            {verifyingBid ? '⟳ Verifying Live Registries...' : '⚡ Verify Present-Date Bid Compliance'}
          </button>
          <button
            className="btn-secondary"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
          >
            {downloadingPdf ? '⟳ Generating PDF...' : '📥 Download PDF'}
          </button>
          <button
            className="btn-secondary"
            onClick={handleGenerateReport}
            disabled={generatingReport}
          >
            {generatingReport ? '⟳ Calculating...' : '📊 Recalculate'}
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* ── Point-in-Time Regulatory Verification Notice Banner ── */}
        <div style={{
          background: isVerified ? '#f0fdf4' : '#eff6ff',
          border: `1px solid ${isVerified ? '#bbf7d0' : '#bfdbfe'}`,
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.8rem' }}>{isVerified ? '✅' : '⚡'}</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: '0.92rem', color: isVerified ? '#15803d' : '#1d4ed8' }}>
                {isVerified ? 'Bid Compliance Verified as of Present Date' : 'Tender Bid Point-in-Time Compliance Verification Required'}
              </div>
              <div style={{ fontSize: '0.78rem', color: isVerified ? '#166534' : '#3b82f6', marginTop: 2 }}>
                {isVerified
                  ? 'All statutory documents (PAN operative status, GST filing regularity, MCA active status, CVC zero-debarment) verified against live government gateways.'
                  : 'Company registration approval confirms baseline identity. Tender bid verification independently verifies present-date validity (PAN not deactivated, GST returns active, zero blacklisting, tender turnover).'}
              </div>
            </div>
          </div>
          {!isVerified && (
            <button
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', fontSize: '0.8rem', padding: '8px 16px' }}
              onClick={handleVerifyBid}
              disabled={verifyingBid}
            >
              {verifyingBid ? 'Verifying...' : 'Run Real-Time Verification →'}
            </button>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Compliant',     val: effectiveRisk.compliantCount,     color: '#10b981' },
            { label: 'Non-Compliant', val: effectiveRisk.nonCompliantCount,  color: '#ef4444' },
            { label: 'Missing Docs',  val: effectiveRisk.missingCount,       color: '#f59e0b' },
            { label: 'Inconsistent',  val: effectiveRisk.inconsistentCount,  color: '#c084fc' },
            { label: 'Needs Review',  val: effectiveRisk.reviewCount,        color: '#fb923c' },
            { label: 'Pending',       val: effectiveRisk.pendingCount,       color: '#3b82f6' },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: `${s.color}0D`,
                border: `1px solid ${s.color}33`,
                borderRadius: 12,
                padding: '12px 16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.6rem', color: s.color, lineHeight: 1.1 }}>
                {s.val ?? 0}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, marginTop: 4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Main 2-Column: Score & Registry Verifications ────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, marginBottom: 24 }}>
          {/* Score & Risk Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: '100%', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.08em' }}>
                DETERMINISTIC COMPLIANCE SCORE
              </span>
            </div>

            {/* Score Ring */}
            <div style={{ position: 'relative', width: 150, height: 150 }}>
              <svg width="150" height="150" viewBox="0 0 150 150">
                <circle cx="75" cy="75" r="62" fill="none" stroke="var(--bg-border)" strokeWidth="12" />
                <circle
                  cx="75"
                  cy="75"
                  r="62"
                  fill="none"
                  stroke={riskCfg.border}
                  strokeWidth="12"
                  strokeDasharray={`${((effectiveRisk.overallScore || 0) / 100) * 2 * Math.PI * 62} ${2 * Math.PI * 62}`}
                  strokeLinecap="round"
                  transform="rotate(-90 75 75)"
                  style={{ transition: 'stroke-dasharray 1s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '2.4rem', color: '#f0f4ff', lineHeight: 1 }}>
                  {Math.round(effectiveRisk.overallScore || 0)}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>/ 100</span>
              </div>
            </div>

            {/* Risk Badge */}
            <div
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: riskCfg.bg,
                border: `1px solid ${riskCfg.border}50`,
                textAlign: 'center',
                width: '100%',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: riskCfg.color }}>
                {riskCfg.label}
              </div>
            </div>

            {/* Pie Breakdown */}
            {pieData.length > 0 && (
              <div style={{ width: '100%', height: 120 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={34} outerRadius={52} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--bg-border)',
                        borderRadius: 8,
                        fontSize: '0.75rem',
                      }}
                      formatter={(val, name) => [`${val} items`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* AI Narrative Note */}
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.06)',
                border: '1px solid rgba(59, 130, 246, 0.18)',
                borderRadius: 10,
                padding: 12,
                width: '100%',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: '#60a5fa', fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>🧠</span> AI COMPLIANCE INTERPRETATION
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5 }}>
                {effectiveRisk.summary || 'Deterministic evaluation complete. Review individual requirement items below.'}
              </div>
            </div>
          </div>

          {/* Government Verifications & Provenance */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="section-title">Authorized Government Registries</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {verifications.length} Verifications Run
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {verifications.map((v) => {
                const isVerified = v.status === 'VERIFIED' || v.status === 'MOCK_VERIFIED';
                const isFailed = v.status === 'FAILED';
                const badgeColor = isVerified ? '#10b981' : isFailed ? '#ef4444' : '#f59e0b';

                return (
                  <div
                    key={v.source}
                    style={{
                      border: '1px solid var(--bg-border)',
                      borderRadius: 10,
                      padding: 12,
                      background: 'rgba(255,255,255,0.01)',
                      borderLeft: `3px solid ${badgeColor}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#f0f4ff' }}>
                        {v.source.replace(/_/g, ' ')}
                      </span>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: v.isMockData ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                          color: v.isMockData ? '#fbbf24' : '#4ade80',
                          border: `1px solid ${v.isMockData ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`,
                        }}
                      >
                        {v.isMockData ? 'MOCK DATA' : 'LIVE API'}
                      </span>
                    </div>

                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: badgeColor,
                        marginBottom: 6,
                      }}
                    >
                      ● {v.status.replace(/_/g, ' ')}
                    </span>

                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      {v.verifiedData ? (
                        Object.entries(v.verifiedData)
                          .slice(0, 3)
                          .filter(([k]) => k !== 'note')
                          .map(([k, val]) => (
                            <div key={k} style={{ marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <span style={{ color: '#4a6080' }}>{k}: </span>
                              <span style={{ color: '#cbd5e1' }}>{String(val)}</span>
                            </div>
                          ))
                      ) : (
                        <span style={{ color: '#4a6080', fontStyle: 'italic' }}>No data returned</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {verifications.length === 0 && (
                <div style={{ color: '#4a6080', fontStyle: 'italic', fontSize: '0.8rem', padding: 12 }}>
                  No government verifications recorded yet.
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20, borderBottom: '1px solid var(--bg-border)', paddingBottom: 10 }}>
              <button
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: 'none',
                  background: activeTab === 'requirements' ? '#1e3a5f' : 'transparent',
                  color: activeTab === 'requirements' ? '#60a5fa' : '#64748b',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                onClick={() => setActiveTab('requirements')}
              >
                📋 Requirements ({items.length})
              </button>
              <button
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: 'none',
                  background: activeTab === 'risk' ? '#1e3a5f' : 'transparent',
                  color: activeTab === 'risk' ? '#60a5fa' : '#64748b',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                onClick={() => setActiveTab('risk')}
              >
                ⚖️ Risk Breakdown & Formula ({(effectiveRisk.riskFlags || []).length} Flags)
              </button>
            </div>
          </div>
        </div>

        {/* ── Tab Content 1: Requirements Table ─────────────────────────────── */}
        {activeTab === 'requirements' && (
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="section-title">Tender Requirement Compliance Matrix</span>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                  Click any row to open the complete Evidence Viewer with provenance & AI explanation.
                </p>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>
                💡 Click row for Evidence
              </span>
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const cfg = STATUS_CFG[item.status] || STATUS_CFG.PENDING_VERIFICATION;
                    const req = item.requirement || {};
                    const hasReviews = item.reviews && item.reviews.length > 0;

                    return (
                      <tr
                        key={item.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setViewingEvidenceItem(item)}
                      >
                        <td>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              background: `${CAT_COLOR[req.category] || '#64748b'}20`,
                              color: CAT_COLOR[req.category] || '#64748b',
                            }}
                          >
                            {(req.category || 'OTHER').replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td style={{ fontWeight: 600, maxWidth: 200 }}>
                          <div>{req.title}</div>
                          {hasReviews && (
                            <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>
                              ✓ Human Reviewed ({item.reviews.length})
                            </span>
                          )}
                        </td>

                        <td>
                          {req.mandatory !== false ? (
                            <span style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 800 }}>
                              MANDATORY
                            </span>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '0.72rem' }}>Optional</span>
                          )}
                        </td>

                        <td style={{ maxWidth: 200, color: '#94a3b8', fontSize: '0.78rem' }}>
                          {item.evidenceSummary ? (
                            <div>
                              <span>{item.evidenceSummary}</span>
                              {item.evidencePage && (
                                <span style={{ color: '#64748b', fontSize: '0.7rem' }}> (p.{item.evidencePage})</span>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#4a6080', fontStyle: 'italic' }}>None found</span>
                          )}
                        </td>

                        <td style={{ maxWidth: 200, color: '#94a3b8', fontSize: '0.78rem' }}>
                          {item.ruleApplied || 'Rule check pending.'}
                        </td>

                        <td>
                          <span className={`badge ${cfg.cls}`}>
                            {cfg.label}
                          </span>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div className="progress-bar" style={{ width: 50 }}>
                              <div
                                className="progress-fill"
                                style={{
                                  width: `${Math.round((item.confidence || 0.8) * 100)}%`,
                                  background: (item.confidence || 0.8) >= 0.8 ? '#10b981' : '#f59e0b',
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              {Math.round((item.confidence || 0.8) * 100)}%
                            </span>
                          </div>
                        </td>

                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn-ghost"
                              style={{ fontSize: '0.72rem', padding: '3px 8px', color: '#3b82f6' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingEvidenceItem(item);
                              }}
                            >
                              Evidence →
                            </button>
                            <button
                              className="btn-ghost"
                              style={{ fontSize: '0.72rem', padding: '3px 8px', color: '#fb923c' }}
                              onClick={(e) => handleOpenReview(item, e)}
                            >
                              Review 👤
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#4a6080' }}>
                        No compliance items found. Please run verification.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Tab Content 2: Risk Breakdown & Formula ───────────────────────── */}
        {activeTab === 'risk' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Risk Formula Breakdown Card */}
            <div className="card">
              <div style={{ marginBottom: 16 }}>
                <span className="section-title">Deterministic Risk Formula Breakdown</span>
                <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>
                  Overall score is computed from 3 weighted factor categories. Every point is explainable.
                </p>
              </div>

              {effectiveRisk.formula?.factors ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  {effectiveRisk.formula.factors.map((factor) => (
                    <div
                      key={factor.name}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--bg-border)',
                        borderRadius: 12,
                        padding: 16,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f0f4ff' }}>
                          {factor.name}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: 700 }}>
                          Weight: {Math.round(factor.weight * 100)}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.8rem', color: '#f0f4ff' }}>
                          {factor.score}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>/ 100</span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>
                          +{factor.contribution} pts
                        </span>
                      </div>
                      <div className="progress-bar" style={{ marginBottom: 8 }}>
                        <div className="progress-fill" style={{ width: `${factor.score}%`, background: '#3b82f6' }} />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {factor.detail}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#4a6080', fontSize: '0.8rem' }}>No formula factors available.</div>
              )}
            </div>

            {/* Risk Flags Card */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span className="section-title">Identified Risk Flags & Issues</span>
                <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}>
                  {(effectiveRisk.riskFlags || []).length} Active Flags
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(effectiveRisk.riskFlags || []).map((flag, idx) => {
                  const isCrit = flag.severity === 'CRITICAL' || flag.severity === 'HIGH';
                  const flagColor = isCrit ? '#ef4444' : flag.severity === 'MEDIUM' ? '#f59e0b' : '#3b82f6';

                  return (
                    <div
                      key={idx}
                      style={{
                        border: `1px solid ${flagColor}40`,
                        background: `${flagColor}08`,
                        borderRadius: 10,
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                      }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>
                        {isCrit ? '⚠️' : 'ℹ️'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f0f4ff' }}>
                            {flag.title || flag.code}
                          </span>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              color: flagColor,
                              padding: '1px 6px',
                              borderRadius: 4,
                              background: `${flagColor}20`,
                            }}
                          >
                            {flag.severity}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                          {flag.description}
                        </div>
                        {flag.evidence && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                            <strong>Linked Evidence:</strong> {flag.evidence}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {(effectiveRisk.riskFlags || []).length === 0 && (
                  <div style={{ color: '#10b981', fontSize: '0.85rem', padding: '12px 0' }}>
                    ✓ No critical risk flags identified for this bidder submission.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Evidence Viewer Modal ────────────────────────────────────────────── */}
      {viewingEvidenceItem && (
        <EvidenceViewer
          item={viewingEvidenceItem}
          onClose={() => setViewingEvidenceItem(null)}
        />
      )}

      {/* ── Human Officer Review Modal ──────────────────────────────────────── */}
      {reviewingItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setReviewingItem(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: 550,
              width: '100%',
              background: '#0a1628',
              border: '1px solid #1e3a5f',
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: 700 }}>
                  HUMAN-IN-THE-LOOP EVALUATION
                </span>
                <h3 style={{ color: '#f0f4ff', fontWeight: 800, fontSize: '1.05rem', marginTop: 4 }}>
                  {reviewingItem.requirement?.title || 'Requirement Review'}
                </h3>
              </div>
              <button className="btn-ghost" onClick={() => setReviewingItem(null)}>
                ✕
              </button>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 16, background: '#0d1b2e', padding: 10, borderRadius: 8 }}>
              <div><strong>Extracted Evidence:</strong> {reviewingItem.evidenceSummary || 'None found.'}</div>
              <div style={{ marginTop: 4 }}><strong>Current AI Status:</strong> {reviewingItem.status}</div>
            </div>

            {/* Review Decision Buttons */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                OFFICER ACTION
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { key: 'APPROVED',         label: '✓ Approve',        color: '#10b981' },
                  { key: 'REJECTED',         label: '✗ Reject',         color: '#ef4444' },
                  { key: 'MARK_FOR_REVIEW',  label: '👁 Mark for Review', color: '#fb923c' },
                ].map((act) => (
                  <button
                    key={act.key}
                    onClick={() => setReviewAction(act.key)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: 8,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: reviewAction === act.key ? `${act.color}25` : 'transparent',
                      color: reviewAction === act.key ? act.color : '#94a3b8',
                      border: `1px solid ${reviewAction === act.key ? act.color : '#1e2d4a'}`,
                    }}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Status Override */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                OVERRIDE STATUS (OPTIONAL)
              </label>
              <select
                className="input"
                value={overrideStatus}
                onChange={(e) => setOverrideStatus(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">-- Keep Current Status ({reviewingItem.status}) --</option>
                <option value="COMPLIANT">COMPLIANT</option>
                <option value="NON_COMPLIANT">NON_COMPLIANT</option>
                <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
                <option value="MISSING_EVIDENCE">MISSING_EVIDENCE</option>
              </select>
            </div>

            {/* Remarks */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                OFFICER REMARKS / JUSTIFICATION
              </label>
              <textarea
                className="input"
                placeholder="Enter justification or observations for audit trail..."
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                style={{ width: '100%', height: 70, resize: 'none' }}
              />
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setReviewingItem(null)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ flex: 2, justifyContent: 'center' }}
                disabled={submittingReview}
                onClick={handleSubmitReview}
              >
                {submittingReview ? '⟳ Recording...' : 'Submit Human Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
