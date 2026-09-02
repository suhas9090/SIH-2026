import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/Sidebar';
import { complianceAPI } from '../../services/api';
import toast from 'react-hot-toast';

// ─── Pipeline Stage Definitions ───────────────────────────────────────────────
const STAGES = [
  { key: 'stage1_bidCapture',         label: 'Capture Verification Session',      icon: '📥', desc: 'Recording officer identity, bid received timestamp & session ID.' },
  { key: 'stage2_tenderRequirements', label: 'Load Tender Requirements',          icon: '📋', desc: 'Fetching all mandatory & optional criteria from tender specification.' },
  { key: 'stage3_documentAnalysis',   label: 'OCR + Document Parsing',            icon: '🔬', desc: 'Extracting fields from submitted PDFs — GST cert, PAN, Udyam, financials.' },
  { key: 'stage4_govtGateway',        label: 'Government Gateway Verification',   icon: '🏛️', desc: 'Real-time triangulation with CBDT, GSTN, MCA21, MSME, CVC as of bid evaluation date.' },
  { key: 'stage5_performanceAnalysis',label: 'Past Performance Analysis',         icon: '📊', desc: 'Reviewing GeM seller ratings, prior contract completion, and dispute records.' },
  { key: 'stage6_criteriaMatching',   label: 'Tender Criteria Matching',          icon: '⚡', desc: 'Cross-verifying turnover, experience, MII content, and technical eligibility against tender.' },
  { key: 'stage7_riskScore',          label: 'Risk & Compliance Score Engine',    icon: '📈', desc: 'Computing weighted compliance score and risk classification.' },
  { key: 'stage8_aiExplanation',      label: 'AI Explanation & Evidence Trail',   icon: '🧠', desc: 'Generating deterministic AI narratives with provenance for each criterion.' },
  { key: 'stage9_finalDecision',      label: 'Final Verdict & Officer Report',    icon: '✅', desc: 'Producing final verdict: Auto-Compliant or Officer Review Required.' },
];

const GATEWAY_NAMES = {
  CBDT_PAN_LOOKUP:          'CBDT – PAN Status',
  GSTN_PORTAL_REGULARITY:   'GSTN – GST Filing Regularity',
  MCA21_ROC_REGISTRY:       'MCA21 – Company Status',
  MSME_UDYAM_PORTAL:        'MSME – Udyam Portal',
  CVC_DEBARMENT_REGISTRY:   'CVC – Debarment Registry',
};

const CAT_COLORS = {
  REGISTRATION:  '#3b82f6',
  TAX:           '#6366f1',
  INCORPORATION: '#8b5cf6',
  MSME:          '#ec4899',
  FINANCIAL:     '#f59e0b',
  MAKE_IN_INDIA: '#10b981',
  BLACKLISTING:  '#ef4444',
  EXPERIENCE:    '#14b8a6',
};

// ─── Utility ──────────────────────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'medium' }) : '—';
const fmtCr   = (n) => n >= 10000000 ? `₹ ${(n / 10000000).toFixed(2)} Cr` : `₹ ${(n / 100000).toFixed(2)} L`;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BidVerificationPage() {
  const { bidderId } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState('idle'); // idle | running | complete | error
  const [currentStageIdx, setCurrentStageIdx] = useState(-1);
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [activeTab, setActiveTab] = useState('pipeline');
  const timerRef = useRef(null);
  const startRef = useRef(null);

  // Try to load existing session on mount
  useEffect(() => {
    complianceAPI.getSession(bidderId)
      .then(r => { setSession(r.data); setPhase('complete'); setCurrentStageIdx(STAGES.length); })
      .catch(() => {});
  }, [bidderId]);

  // Elapsed timer
  useEffect(() => {
    if (phase === 'running') {
      startRef.current = Date.now() - elapsedMs;
      timerRef.current = setInterval(() => setElapsedMs(Date.now() - startRef.current), 100);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const handleRunVerification = async () => {
    setPhase('running');
    setCurrentStageIdx(0);
    setSession(null);
    setError(null);
    setElapsedMs(0);

    // Animate through stages as the request runs
    const stageDelay = 600; // ms per stage for UX animation
    for (let i = 0; i < STAGES.length; i++) {
      setCurrentStageIdx(i);
      await new Promise(r => setTimeout(r, stageDelay));
    }

    try {
      const res = await complianceAPI.verifySession(bidderId);
      setSession(res.data);
      setPhase('complete');
      setCurrentStageIdx(STAGES.length);
      setActiveTab('report');
      if (res.data.isFullyCompliant) {
        toast.success('✅ All criteria verified — Bid is AUTO-COMPLIANT!');
      } else {
        toast.error(`🚨 ${res.data.unapprovedItems?.length || 0} exception(s) found — Officer review required.`);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setPhase('error');
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '28px 32px 20px', background: 'linear-gradient(135deg, #020817 0%, #0c1a35 100%)', borderBottom: '1px solid #1e293b' }}>
        <button
          onClick={() => navigate('/bids')}
          style={{ background: 'none', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', padding: '6px 14px', cursor: 'pointer', fontSize: '0.8rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ← Back to Bids
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              PROCUREMENT OFFICER — VERIFICATION SESSION
            </div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.55rem', color: '#f0f4ff', margin: 0 }}>
              AI Bid Compliance Verification
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 6 }}>
              Bid ID: <code style={{ color: '#60a5fa' }}>{bidderId}</code> · Full regulatory pipeline as of present evaluation date
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {phase === 'complete' && (
              <span style={{
                padding: '8px 16px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 800,
                background: session?.isFullyCompliant ? '#064e3b' : '#450a0a',
                color: session?.isFullyCompliant ? '#34d399' : '#f87171',
                border: `1px solid ${session?.isFullyCompliant ? '#059669' : '#dc2626'}`,
              }}>
                {session?.isFullyCompliant ? '✅ AUTO-COMPLIANT' : '🚨 REVIEW REQUIRED'}
              </span>
            )}
            <button
              className="btn-primary"
              style={{ background: phase === 'running' ? '#374151' : 'linear-gradient(135deg, #2563eb, #7c3aed)', fontSize: '0.9rem', padding: '10px 22px', display: 'flex', alignItems: 'center', gap: 8 }}
              onClick={handleRunVerification}
              disabled={phase === 'running'}
            >
              {phase === 'running' ? (
                <>
                  <span style={{ width: 16, height: 16, border: '2px solid #9ca3af', borderTop: '2px solid #60a5fa', borderRadius: '50%', display: 'inline-block', animation: 'spin-slow 0.8s linear infinite' }} />
                  Verifying... {(elapsedMs / 1000).toFixed(1)}s
                </>
              ) : (
                <>⚡ {phase === 'complete' ? 'Re-Run Verification' : 'Start Verification'}</>
              )}
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>

        {/* ── Error Banner ─────────────────────────────────────────────────── */}
        {phase === 'error' && (
          <div style={{ background: '#450a0a', border: '1px solid #dc2626', borderRadius: 12, padding: 20, marginBottom: 20, color: '#fca5a5' }}>
            <strong>⚠️ Verification Failed:</strong> {error}
          </div>
        )}

        {/* ── Idle Prompt ──────────────────────────────────────────────────── */}
        {phase === 'idle' && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>⚡</div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 8 }}>
              Ready to Verify Bid
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.92rem', maxWidth: 480, margin: '0 auto 28px' }}>
              Click <strong style={{ color: '#60a5fa' }}>Start Verification</strong> to run the full 9-stage AI compliance pipeline against all government registries as of the present date.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 600, margin: '0 auto' }}>
              {['🏛️ 5 Govt Gateways', '📋 8 Tender Criteria', '🔬 Document OCR'].map(s => (
                <div key={s} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '12px 16px', color: '#94a3b8', fontSize: '0.82rem', fontWeight: 700 }}>{s}</div>
              ))}
            </div>
          </div>
        )}

        {/* ── Pipeline Progress (running or complete) ───────────────────────── */}
        {(phase === 'running' || phase === 'complete') && (
          <div style={{ display: 'grid', gridTemplateColumns: phase === 'complete' ? '360px 1fr' : '1fr', gap: 24, marginBottom: 24 }}>

            {/* Stage List */}
            <div style={{ background: '#0a1628', border: '1px solid #1e293b', borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.08em', marginBottom: 16 }}>
                VERIFICATION PIPELINE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {STAGES.map((s, idx) => {
                  const isDone    = phase === 'complete' || idx < currentStageIdx;
                  const isActive  = phase === 'running' && idx === currentStageIdx;
                  const isPending = !isDone && !isActive;

                  return (
                    <div key={s.key} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10,
                      background: isActive ? 'rgba(59,130,246,0.12)' : isDone ? 'rgba(16,185,129,0.06)' : 'transparent',
                      border: `1px solid ${isActive ? '#3b82f6' : isDone ? 'rgba(16,185,129,0.2)' : '#1e293b'}`,
                      transition: 'all 0.3s ease'
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isDone ? '#059669' : isActive ? '#2563eb' : '#1e293b',
                        border: isActive ? '2px solid #60a5fa' : 'none',
                        fontSize: '0.75rem', fontWeight: 900, color: '#fff'
                      }}>
                        {isDone ? '✓' : isActive ? (
                          <span style={{ width: 10, height: 10, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', display: 'inline-block', animation: 'spin-slow 0.8s linear infinite' }} />
                        ) : idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isDone ? '#34d399' : isActive ? '#60a5fa' : '#475569' }}>
                          {s.icon} {s.label}
                        </div>
                        {isActive && (
                          <div style={{ fontSize: '0.68rem', color: '#60a5fa', marginTop: 2 }}>{s.desc}</div>
                        )}
                        {isDone && session?.pipeline?.[s.key]?.result && (
                          <div style={{ fontSize: '0.68rem', color: '#6ee7b7', marginTop: 2 }}>{session.pipeline[s.key].result}</div>
                        )}
                      </div>
                      {isDone && (
                        <span style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 700 }}>DONE</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {phase === 'complete' && session && (
                <div style={{ marginTop: 16, padding: '12px 14px', background: session.isFullyCompliant ? 'rgba(5,150,105,0.1)' : 'rgba(220,38,38,0.1)', borderRadius: 10, border: `1px solid ${session.isFullyCompliant ? '#059669' : '#dc2626'}` }}>
                  <div style={{ fontWeight: 900, fontSize: '0.88rem', color: session.isFullyCompliant ? '#34d399' : '#f87171' }}>
                    {session.isFullyCompliant ? '✅ Auto-Compliant Verdict' : '🚨 Exceptions Found'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 4 }}>
                    Duration: {((session.durationMs || 0) / 1000).toFixed(2)}s · Score: {session.overallScore}%
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel: Tabs */}
            {phase === 'complete' && session && (
              <div>
                {/* Tab Bar */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  {[
                    { key: 'report',     label: '📄 Final Report' },
                    { key: 'criteria',   label: '📋 Criteria Matching' },
                    { key: 'gateways',   label: '🏛️ Govt Gateways' },
                    { key: 'documents',  label: '🔬 Documents' },
                    { key: 'performance',label: '📊 Performance' },
                    { key: 'exceptions', label: `🚨 Exceptions (${session.unapprovedItems?.length || 0})` },
                  ].map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                      padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
                      background: activeTab === t.key ? '#1e3a5f' : '#0a1628',
                      color: activeTab === t.key ? '#60a5fa' : '#64748b',
                      border: `1px solid ${activeTab === t.key ? '#3b82f6' : '#1e293b'}`,
                    }}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* ── Tab: Final Report ─────────────────────────────────── */}
                {activeTab === 'report' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Verdict Banner */}
                    <div style={{
                      borderRadius: 14, padding: '20px 24px',
                      background: session.isFullyCompliant
                        ? 'linear-gradient(135deg, #064e3b, #065f46)'
                        : 'linear-gradient(135deg, #450a0a, #7f1d1d)',
                      border: `1px solid ${session.isFullyCompliant ? '#059669' : '#dc2626'}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span style={{ fontSize: '2.8rem' }}>{session.isFullyCompliant ? '✅' : '🚨'}</span>
                        <div>
                          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.35rem', color: '#f0f4ff' }}>
                            {session.isFullyCompliant ? 'Auto-Compliant — Bid Approved' : 'Officer Review Required'}
                          </div>
                          <div style={{ color: '#94a3b8', fontSize: '0.84rem', marginTop: 4 }}>
                            {session.summary}
                          </div>
                        </div>
                        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '2.2rem', color: session.isFullyCompliant ? '#34d399' : '#f87171' }}>
                            {session.overallScore}%
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Compliance Score</div>
                        </div>
                      </div>
                    </div>

                    {/* Session Info Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                      {[
                        { label: 'Session ID',         value: session.sessionId },
                        { label: 'Evaluation Date',    value: fmtDate(session.evaluationDate) },
                        { label: 'Bid Received At',    value: fmtDate(session.bidReceivedAt) },
                        { label: 'Session Duration',   value: `${((session.durationMs || 0) / 1000).toFixed(2)}s` },
                        { label: 'Officer',            value: session.officerName },
                        { label: 'Risk Level',         value: session.riskLevel },
                        { label: 'Bidder',             value: session.bidder?.organizationName },
                        { label: 'Tender Ref',         value: session.tender?.referenceNo },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ background: '#0a1628', border: '1px solid #1e293b', borderRadius: 10, padding: '12px 16px' }}>
                          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                          <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.84rem', wordBreak: 'break-all' }}>{value || '—'}</div>
                        </div>
                      ))}
                    </div>

                    {/* Recommendations */}
                    {session.recommendations?.length > 0 && (
                      <div style={{ background: '#0a1628', border: '1px solid #1e293b', borderRadius: 12, padding: 16 }}>
                        <div style={{ fontWeight: 800, color: '#94a3b8', fontSize: '0.78rem', letterSpacing: '0.06em', marginBottom: 10 }}>OFFICER RECOMMENDATIONS</div>
                        {session.recommendations.map((r, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderTop: i > 0 ? '1px solid #1e293b' : 'none' }}>
                            <span style={{ color: '#3b82f6', marginTop: 2 }}>→</span>
                            <span style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>{r}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Tab: Criteria Matching ─────────────────────────── */}
                {activeTab === 'criteria' && (
                  <div style={{ background: '#0a1628', border: '1px solid #1e293b', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e293b' }}>
                      <span style={{ fontWeight: 800, color: '#e2e8f0', fontSize: '0.9rem' }}>Tender Requirement Matching Matrix</span>
                      <span style={{ marginLeft: 10, fontSize: '0.75rem', color: '#64748b' }}>Evaluated as of {fmtDate(session.evaluationDate)}</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #1e293b' }}>
                          {['Category', 'Requirement', 'Threshold', 'Status', 'Confidence', 'Mandatory'].map(h => (
                            <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.72rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(session.criteriaMatching || []).map((c, i) => (
                          <tr key={c.requirementId} style={{ borderBottom: '1px solid #1e293b', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: '0.65rem', fontWeight: 800, background: `${CAT_COLORS[c.category] || '#64748b'}22`, color: CAT_COLORS[c.category] || '#64748b' }}>
                                {c.category}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#e2e8f0' }}>{c.title}</div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 3, lineHeight: 1.4 }}>{c.explanation}</div>
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: '#64748b', maxWidth: 180 }}>{c.threshold}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{
                                padding: '4px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800,
                                background: c.status === 'COMPLIANT' ? '#064e3b' : '#450a0a',
                                color: c.status === 'COMPLIANT' ? '#34d399' : '#f87171',
                                border: `1px solid ${c.status === 'COMPLIANT' ? '#059669' : '#dc2626'}`,
                              }}>
                                {c.status === 'COMPLIANT' ? '✓ PASS' : '✗ FAIL'}
                              </span>
                              {c.discrepancyType && (
                                <div style={{ fontSize: '0.65rem', color: '#f87171', marginTop: 3 }}>{c.discrepancyType}</div>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#e2e8f0' }}>{Math.round((c.confidence || 0) * 100)}%</div>
                              <div style={{ height: 4, background: '#1e293b', borderRadius: 2, marginTop: 4, width: 60 }}>
                                <div style={{ height: '100%', width: `${Math.round((c.confidence || 0) * 100)}%`, background: c.status === 'COMPLIANT' ? '#059669' : '#dc2626', borderRadius: 2 }} />
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: c.mandatory ? '#f87171' : '#64748b' }}>
                                {c.mandatory ? 'MANDATORY' : 'Optional'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ── Tab: Govt Gateways ───────────────────────────────── */}
                {activeTab === 'gateways' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(session.govtGatewayResults || []).map(g => (
                      <div key={g.id} style={{ background: '#0a1628', border: `1px solid ${g.status === 'MATCHED' ? '#064e3b' : '#450a0a'}`, borderRadius: 12, padding: '16px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <div>
                            <span style={{ fontWeight: 800, color: '#e2e8f0', fontSize: '0.9rem' }}>
                              {GATEWAY_NAMES[g.gateway] || g.gateway}
                            </span>
                            <span style={{ marginLeft: 10, fontSize: '0.68rem', color: '#64748b' }}>
                              Verified: {fmtDate(g.evaluationDate)}
                            </span>
                          </div>
                          <span style={{
                            padding: '4px 12px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800,
                            background: g.status === 'MATCHED' ? '#064e3b' : '#450a0a',
                            color: g.status === 'MATCHED' ? '#34d399' : '#f87171',
                          }}>
                            {g.status === 'MATCHED' ? '✓ VERIFIED' : '✗ ANOMALY'}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                          {Object.entries(g.details || {}).map(([k, v]) => v !== null && v !== undefined && (
                            <div key={k} style={{ background: '#0f172a', borderRadius: 8, padding: '8px 12px' }}>
                              <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>{k.replace(/([A-Z])/g, ' $1').trim()}</div>
                              <div style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 700, wordBreak: 'break-all' }}>{String(v)}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: 10, fontSize: '0.75rem', color: g.status === 'MATCHED' ? '#6ee7b7' : '#fca5a5', fontStyle: 'italic' }}>
                          {g.note}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Tab: Documents ─────────────────────────────────── */}
                {activeTab === 'documents' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(session.documentAnalysis || []).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', background: '#0a1628', border: '1px solid #1e293b', borderRadius: 12 }}>
                        No documents were submitted with this bid.
                      </div>
                    ) : (session.documentAnalysis || []).map(d => (
                      <div key={d.id} style={{ background: '#0a1628', border: '1px solid #1e293b', borderRadius: 12, padding: '16px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <div>
                            <span style={{ fontWeight: 800, color: '#e2e8f0' }}>📄 {d.fileName}</span>
                            <span style={{ marginLeft: 10, fontSize: '0.72rem', color: '#3b82f6', fontWeight: 800, padding: '2px 8px', background: 'rgba(59,130,246,0.1)', borderRadius: 6 }}>{d.documentType}</span>
                          </div>
                          <span style={{ padding: '4px 12px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800, background: '#064e3b', color: '#34d399' }}>
                            ✓ {d.crossVerificationStatus}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                          {Object.entries(d.parsedFields || {}).map(([k, v]) => (
                            <div key={k} style={{ background: '#0f172a', borderRadius: 8, padding: '8px 12px' }}>
                              <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>{k.replace(/([A-Z])/g, ' $1').trim()}</div>
                              <div style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 700 }}>{v}</div>
                            </div>
                          ))}
                          <div style={{ background: '#0f172a', borderRadius: 8, padding: '8px 12px' }}>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>OCR Confidence</div>
                            <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 800 }}>{Math.round((d.confidence || 0) * 100)}%</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Tab: Performance ──────────────────────────────────── */}
                {activeTab === 'performance' && session.performanceAnalysis && (
                  <div style={{ background: '#0a1628', border: '1px solid #1e293b', borderRadius: 14, padding: 24 }}>
                    <div style={{ fontWeight: 800, color: '#e2e8f0', marginBottom: 20, fontSize: '0.9rem' }}>Past Contract Performance Analysis</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                      {[
                        { label: 'Prior Contracts',        value: session.performanceAnalysis.priorContracts, unit: '', color: '#3b82f6' },
                        { label: 'Avg Completion Rate',    value: `${session.performanceAnalysis.averageCompletionRate}%`, unit: '', color: '#10b981' },
                        { label: 'On-Time Delivery',       value: `${session.performanceAnalysis.onTimeDeliveryRate}%`, unit: '', color: '#6366f1' },
                        { label: 'GeM Seller Rating',      value: `${session.performanceAnalysis.gemSellerRating}/5.0`, unit: '⭐', color: '#f59e0b' },
                        { label: 'Dispute History',        value: session.performanceAnalysis.disputeHistory, unit: ' disputes', color: session.performanceAnalysis.disputeHistory > 0 ? '#ef4444' : '#10b981' },
                      ].map(m => (
                        <div key={m.label} style={{ background: '#0f172a', borderRadius: 12, padding: '20px 16px', textAlign: 'center' }}>
                          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.8rem', color: m.color }}>{m.value}{m.unit}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, marginTop: 6 }}>{m.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 16, padding: 14, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10 }}>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>🧠 {session.performanceAnalysis.note}</span>
                    </div>
                  </div>
                )}

                {/* ── Tab: Exceptions ────────────────────────────────────── */}
                {activeTab === 'exceptions' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(!session.unapprovedItems || session.unapprovedItems.length === 0) ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(5,150,105,0.05)', border: '1px solid #059669', borderRadius: 14 }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>✅</div>
                        <div style={{ fontWeight: 800, color: '#34d399', fontSize: '1rem' }}>No Exceptions — All Criteria Passed</div>
                        <div style={{ color: '#64748b', fontSize: '0.84rem', marginTop: 6 }}>The bid is fully compliant and has been auto-approved by the AI engine.</div>
                      </div>
                    ) : (
                      <>
                        <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid #dc2626', borderRadius: 12, padding: '14px 18px', marginBottom: 4 }}>
                          <div style={{ fontWeight: 900, color: '#f87171', fontSize: '0.9rem' }}>
                            🚨 {session.unapprovedItems.length} Exception(s) Requiring Officer Decision
                          </div>
                          <div style={{ color: '#fca5a5', fontSize: '0.8rem', marginTop: 4 }}>
                            Review each exception below and either approve an override or reject the bid item.
                          </div>
                        </div>
                        {session.unapprovedItems.map((item) => (
                          <div key={item.id} style={{ background: '#0a1628', border: '1px solid #7f1d1d', borderRadius: 12, padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                              <div style={{ flex: 1, minWidth: 260 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                  <span style={{ fontWeight: 800, color: '#f87171', fontSize: '0.88rem' }}>
                                    ❌ {item.requirement?.title || item.title}
                                  </span>
                                  {item.discrepancyType && (
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#450a0a', color: '#f87171' }}>
                                      {item.discrepancyType}
                                    </span>
                                  )}
                                </div>
                                <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0, lineHeight: 1.55 }}>
                                  {item.explanation}
                                </p>
                              </div>
                              <button
                                className="btn-primary"
                                style={{ fontSize: '0.78rem', padding: '8px 16px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', whiteSpace: 'nowrap' }}
                                onClick={() => navigate(`/compliance/${bidderId}`)}
                              >
                                📋 Open Full Review →
                              </button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
