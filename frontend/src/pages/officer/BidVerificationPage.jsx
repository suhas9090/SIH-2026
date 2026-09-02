import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/Sidebar';
import { complianceAPI } from '../../services/api';
import toast from 'react-hot-toast';

const STAGES = [
  { key: 'stage1_bidCapture',         label: 'Capturing session',              icon: '📥' },
  { key: 'stage2_tenderRequirements', label: 'Loading tender requirements',     icon: '📋' },
  { key: 'stage3_documentAnalysis',   label: 'Parsing submitted documents',    icon: '🔬' },
  { key: 'stage4_govtGateway',        label: 'Querying government registries', icon: '🏛' },
  { key: 'stage5_performanceAnalysis',label: 'Reviewing past performance',     icon: '📊' },
  { key: 'stage6_criteriaMatching',   label: 'Matching tender criteria',       icon: '✓' },
  { key: 'stage7_riskScore',          label: 'Computing compliance score',     icon: '⚖' },
  { key: 'stage8_aiExplanation',      label: 'Generating evidence trail',      icon: '📝' },
  { key: 'stage9_finalDecision',      label: 'Producing final verdict',        icon: '🏁' },
];

const GATEWAY_LABELS = {
  CBDT_PAN_LOOKUP:         'CBDT — PAN Status',
  GSTN_PORTAL_REGULARITY:  'GSTN — GST Filing',
  MCA21_ROC_REGISTRY:      'MCA21 — Company Status',
  MSME_UDYAM_PORTAL:       'MSME — Udyam Portal',
  CVC_DEBARMENT_REGISTRY:  'CVC — Debarment Registry',
};

const CAT_COLOR = {
  REGISTRATION:  '#3b82f6',
  TAX:           '#6366f1',
  INCORPORATION: '#8b5cf6',
  MSME:          '#ec4899',
  FINANCIAL:     '#f59e0b',
  MAKE_IN_INDIA: '#10b981',
  BLACKLISTING:  '#ef4444',
  EXPERIENCE:    '#14b8a6',
};

const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const S = {
  page: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    minHeight: '100vh',
    background: '#f8fafc',
    color: '#1e293b',
  },
  topbar: {
    background: '#fff',
    borderBottom: '1px solid #e2e8f0',
    padding: '16px 32px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  backBtn: {
    background: 'none',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    color: '#64748b',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '0.82rem',
    fontWeight: 500,
  },
  heading: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  },
  subtext: {
    fontSize: '0.8rem',
    color: '#64748b',
    marginTop: 2,
  },
  verifyBtn: {
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '9px 20px',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  verifyBtnDisabled: {
    background: '#94a3b8',
    cursor: 'not-allowed',
  },
  body: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '28px 24px',
  },
  card: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    marginBottom: 20,
  },
  cardHead: {
    padding: '14px 20px',
    borderBottom: '1px solid #f1f5f9',
    fontWeight: 600,
    fontSize: '0.9rem',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  cardBody: {
    padding: '20px',
  },
  badge: (pass) => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 5,
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.03em',
    background: pass ? '#dcfce7' : '#fee2e2',
    color: pass ? '#15803d' : '#b91c1c',
  }),
  label: {
    fontSize: '0.72rem',
    color: '#94a3b8',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 3,
  },
  value: {
    fontSize: '0.88rem',
    color: '#1e293b',
    fontWeight: 500,
  },
};

export default function BidVerificationPage() {
  const { bidderId } = useParams();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('idle');
  const [stageIdx, setStageIdx] = useState(-1);
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    complianceAPI.getSession(bidderId)
      .then(r => { setSession(r.data); setPhase('done'); })
      .catch(() => {});
  }, [bidderId]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const runVerification = async () => {
    setPhase('running');
    setStageIdx(0);
    setSession(null);
    setError(null);

    for (let i = 0; i < STAGES.length; i++) {
      setStageIdx(i);
      await new Promise(r => setTimeout(r, 550));
    }

    try {
      const res = await complianceAPI.verifySession(bidderId);
      setSession(res.data);
      setPhase('done');
      if (res.data.isFullyCompliant) {
        toast.success('All criteria verified — bid is compliant.');
      } else {
        toast.error(`${res.data.unapprovedItems?.length || 0} exception(s) found.`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
      setPhase('error');
    }
  };

  const compliant = session?.isFullyCompliant;
  const exceptions = session?.unapprovedItems || [];

  return (
    <AppLayout>
      <div style={S.page}>

        {/* Top Bar */}
        <div style={S.topbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button style={S.backBtn} onClick={() => navigate('/bids')}>← Back</button>
            <div>
              <h1 style={S.heading}>Compliance Verification</h1>
              <div style={S.subtext}>
                Bid {bidderId} &nbsp;·&nbsp;
                {session ? `Evaluated ${fmt(session.evaluationDate)}` : 'Not yet verified'}
              </div>
            </div>
          </div>
          <button
            style={{ ...S.verifyBtn, ...(phase === 'running' ? S.verifyBtnDisabled : {}) }}
            onClick={runVerification}
            disabled={phase === 'running'}
          >
            {phase === 'running' ? (
              <>
                <Spinner /> Verifying…
              </>
            ) : (
              phase === 'done' ? 'Re-verify' : 'Verify'
            )}
          </button>
        </div>

        <div style={S.body}>

          {/* Error */}
          {phase === 'error' && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#b91c1c', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {/* Progress (running) */}
          {phase === 'running' && (
            <div style={{ ...S.card }}>
              <div style={S.cardHead}>Verification in progress</div>
              <div style={{ ...S.cardBody, padding: '16px 20px' }}>
                {STAGES.map((s, i) => {
                  const done   = i < stageIdx;
                  const active = i === stageIdx;
                  return (
                    <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 0', borderBottom: i < STAGES.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 700,
                        background: done ? '#dcfce7' : active ? '#dbeafe' : '#f1f5f9',
                        color: done ? '#15803d' : active ? '#2563eb' : '#94a3b8',
                        border: active ? '2px solid #93c5fd' : '1px solid transparent',
                      }}>
                        {done ? '✓' : active ? <Spinner small /> : <span style={{ fontSize: '0.65rem' }}>{i + 1}</span>}
                      </div>
                      <span style={{ fontSize: '0.84rem', color: done ? '#374151' : active ? '#2563eb' : '#94a3b8', fontWeight: active ? 600 : 400 }}>
                        {s.icon} {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Idle prompt */}
          {phase === 'idle' && (
            <div style={{ ...S.card, textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: 12 }}>📋</div>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', marginBottom: 8 }}>Ready to verify this bid</h2>
              <p style={{ color: '#64748b', fontSize: '0.87rem', maxWidth: 420, margin: '0 auto 20px' }}>
                Click <strong>Verify</strong> to run a full compliance check against all government registries as of today.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['CBDT PAN', 'GSTN', 'MCA21', 'MSME / Udyam', 'CVC Debarment'].map(g => (
                  <span key={g} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 10px', fontSize: '0.78rem', color: '#475569' }}>{g}</span>
                ))}
              </div>
            </div>
          )}

          {/* ── Full Compliance Report ──────────────────────────────── */}
          {phase === 'done' && session && (
            <>
              {/* Verdict */}
              <div style={{
                background: compliant ? '#f0fdf4' : '#fff7ed',
                border: `1px solid ${compliant ? '#86efac' : '#fcd34d'}`,
                borderRadius: 10, padding: '20px 24px', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: compliant ? '#15803d' : '#b45309', marginBottom: 4 }}>
                    {compliant ? '✓ Compliant — No exceptions found' : `⚠ ${exceptions.length} exception${exceptions.length > 1 ? 's' : ''} require your review`}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    {session.summary}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: compliant ? '#16a34a' : '#d97706' }}>
                    {session.overallScore}%
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>COMPLIANCE SCORE</div>
                </div>
              </div>

              {/* Exceptions panel — shown prominently if any */}
              {!compliant && exceptions.length > 0 && (
                <div style={S.card}>
                  <div style={{ ...S.cardHead, color: '#b91c1c' }}>
                    Exceptions Requiring Decision
                    <span style={{ marginLeft: 'auto', background: '#fee2e2', color: '#b91c1c', borderRadius: 5, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700 }}>
                      {exceptions.length}
                    </span>
                  </div>
                  <div style={S.cardBody}>
                    {exceptions.map((item, i) => (
                      <div key={item.id} style={{
                        padding: '14px 0',
                        borderBottom: i < exceptions.length - 1 ? '1px solid #f1f5f9' : 'none',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <span style={{ color: '#ef4444', fontWeight: 700, marginTop: 1, flexShrink: 0 }}>✗</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b', marginBottom: 3 }}>
                              {item.requirement?.title || item.title}
                              {item.discrepancyType && (
                                <span style={{ marginLeft: 8, fontSize: '0.68rem', background: '#fee2e2', color: '#b91c1c', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                                  {item.discrepancyType}
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                              {item.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Session info */}
              <div style={S.card}>
                <div style={S.cardHead}>Session Details</div>
                <div style={{ ...S.cardBody, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
                  {[
                    { label: 'Session ID',      value: session.sessionId },
                    { label: 'Evaluated on',    value: fmt(session.evaluationDate) },
                    { label: 'Bid received',    value: fmt(session.bidReceivedAt) },
                    { label: 'Officer',         value: session.officerName },
                    { label: 'Bidder',          value: session.bidder?.organizationName },
                    { label: 'GSTIN',           value: session.bidder?.gstin },
                    { label: 'PAN',             value: session.bidder?.pan },
                    { label: 'Tender ref',      value: session.tender?.referenceNo },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div style={S.label}>{label}</div>
                      <div style={{ ...S.value, wordBreak: 'break-all' }}>{value || '—'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Criteria checklist */}
              <div style={S.card}>
                <div style={S.cardHead}>
                  Tender Criteria
                  <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#64748b', fontWeight: 400 }}>
                    {(session.criteriaMatching || []).filter(c => c.status === 'COMPLIANT').length} / {(session.criteriaMatching || []).length} passed
                  </span>
                </div>
                <div>
                  {(session.criteriaMatching || []).map((c, i) => {
                    const pass = c.status === 'COMPLIANT';
                    const isLast = i === (session.criteriaMatching || []).length - 1;
                    return (
                      <div key={c.requirementId} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 14, padding: '13px 20px',
                        borderBottom: isLast ? 'none' : '1px solid #f8fafc',
                        background: i % 2 === 0 ? '#fff' : '#fafafa',
                      }}>
                        <span style={{ fontSize: '1rem', color: pass ? '#16a34a' : '#ef4444', marginTop: 1, flexShrink: 0, fontWeight: 700 }}>
                          {pass ? '✓' : '✗'}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.86rem', color: '#1e293b' }}>{c.title}</span>
                            {!c.mandatory && (
                              <span style={{ fontSize: '0.65rem', color: '#94a3b8', background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>Optional</span>
                            )}
                            <span style={{ fontSize: '0.68rem', padding: '1px 7px', borderRadius: 4, fontWeight: 700, background: (CAT_COLOR[c.category] || '#94a3b8') + '15', color: CAT_COLOR[c.category] || '#94a3b8' }}>
                              {c.category}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{c.explanation}</div>
                        </div>
                        <div style={{ flexShrink: 0, textAlign: 'right' }}>
                          <span style={S.badge(pass)}>{pass ? 'PASS' : 'FAIL'}</span>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 4 }}>{Math.round((c.confidence || 0) * 100)}% confidence</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Government registries */}
              <div style={S.card}>
                <div style={S.cardHead}>Government Registry Results</div>
                <div>
                  {(session.govtGatewayResults || []).map((g, i) => {
                    const ok = g.status === 'MATCHED';
                    const isLast = i === (session.govtGatewayResults || []).length - 1;
                    return (
                      <div key={g.id} style={{ padding: '14px 20px', borderBottom: isLast ? 'none' : '1px solid #f8fafc' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.86rem', color: '#1e293b', flex: 1 }}>
                            {GATEWAY_LABELS[g.gateway] || g.gateway}
                          </span>
                          <span style={S.badge(ok)}>{ok ? 'VERIFIED' : 'ANOMALY'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                          {Object.entries(g.details || {}).filter(([, v]) => v != null).slice(0, 4).map(([k, v]) => (
                            <div key={k}>
                              <div style={S.label}>{k.replace(/([A-Z])/g, ' $1').trim()}</div>
                              <div style={{ ...S.value, fontSize: '0.82rem' }}>{String(v)}</div>
                            </div>
                          ))}
                        </div>
                        {g.note && (
                          <div style={{ marginTop: 6, fontSize: '0.76rem', color: ok ? '#15803d' : '#b45309', fontStyle: 'italic' }}>
                            {g.note}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Past performance */}
              {session.performanceAnalysis && (
                <div style={S.card}>
                  <div style={S.cardHead}>Past Performance</div>
                  <div style={{ ...S.cardBody, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Prior contracts',   value: session.performanceAnalysis.priorContracts },
                      { label: 'Avg completion',    value: `${session.performanceAnalysis.averageCompletionRate}%` },
                      { label: 'GeM seller rating', value: `${session.performanceAnalysis.gemSellerRating} / 5` },
                      { label: 'Disputes',          value: session.performanceAnalysis.disputeHistory },
                    ].map(m => (
                      <div key={m.label} style={{ minWidth: 120, padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{m.value}</div>
                        <div style={S.label}>{m.label}</div>
                      </div>
                    ))}
                    {session.performanceAnalysis.note && (
                      <div style={{ flex: '1 1 300px', fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', lineHeight: 1.55 }}>
                        {session.performanceAnalysis.note}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Documents */}
              {session.documentAnalysis?.length > 0 && (
                <div style={S.card}>
                  <div style={S.cardHead}>Submitted Documents</div>
                  <div>
                    {session.documentAnalysis.map((d, i) => (
                      <div key={d.id} style={{ padding: '13px 20px', borderBottom: i < session.documentAnalysis.length - 1 ? '1px solid #f8fafc' : 'none', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b', marginBottom: 3 }}>📄 {d.fileName}</div>
                          <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>{d.documentType}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 16 }}>
                          {Object.entries(d.parsedFields || {}).filter(([, v]) => v).slice(0, 2).map(([k, v]) => (
                            <div key={k}>
                              <div style={S.label}>{k.replace(/([A-Z])/g, ' $1').trim()}</div>
                              <div style={{ ...S.value, fontSize: '0.8rem' }}>{v}</div>
                            </div>
                          ))}
                          <div>
                            <div style={S.label}>OCR confidence</div>
                            <div style={{ ...S.value, fontSize: '0.8rem', color: '#16a34a', fontWeight: 700 }}>{Math.round((d.confidence || 0) * 100)}%</div>
                          </div>
                        </div>
                        <span style={S.badge(true)}>MATCHED</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {session.recommendations?.length > 0 && (
                <div style={{ ...S.card }}>
                  <div style={S.cardHead}>Officer Notes</div>
                  <div style={{ ...S.cardBody }}>
                    {session.recommendations.map((r, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: i < session.recommendations.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                        <span style={{ color: '#94a3b8', marginTop: 2 }}>→</span>
                        <span style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.55 }}>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function Spinner({ small }) {
  return (
    <span style={{
      display: 'inline-block',
      width: small ? 10 : 14,
      height: small ? 10 : 14,
      border: `2px solid ${small ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.4)'}`,
      borderTop: `2px solid ${small ? '#2563eb' : '#fff'}`,
      borderRadius: '50%',
      animation: 'spin-slow 0.75s linear infinite',
      flexShrink: 0,
    }} />
  );
}
