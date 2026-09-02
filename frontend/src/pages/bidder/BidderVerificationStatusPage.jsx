import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/Sidebar';
import api from '../../services/api';

const LIFECYCLE_MAP = {
  REGISTERED: { label: 'Not Started', color: '#64748b', bg: 'rgba(100,116,139,0.12)', pct: 5 },
  IDENTITY_PENDING: { label: 'Identity In Progress', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', pct: 20 },
  IDENTITY_VERIFIED: { label: 'Identity Verified', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', pct: 40 },
  COMPANY_VERIFICATION_PENDING: { label: 'Company Verification In Progress', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', pct: 50 },
  COMPANY_VERIFIED: { label: 'Company Verified', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', pct: 65 },
  DOCUMENT_VERIFICATION_PENDING: { label: 'Documents Submitted — Awaiting Review', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', pct: 80 },
  UNDER_OFFICER_REVIEW: { label: 'Under Officer Review', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', pct: 88 },
  CORRECTION_REQUIRED: { label: 'Correction Required', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', pct: 60 },
  VERIFIED: { label: 'Verified', color: '#10b981', bg: 'rgba(16,185,129,0.12)', pct: 95 },
  APPROVED_TO_BID: { label: 'Approved — Eligible to Bid', color: '#10b981', bg: 'rgba(16,185,129,0.12)', pct: 100 },
  VERIFICATION_FAILED: { label: 'Verification Failed', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', pct: 0 },
  SUSPENDED: { label: 'Account Suspended', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', pct: 0 },
};

function CheckRow({ label, verified, pending, detail }) {
  const icon = verified ? '✓' : pending ? '⏳' : '✗';
  const color = verified ? '#10b981' : pending ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: verified ? 'rgba(16,185,129,0.04)' : pending ? 'rgba(245,158,11,0.04)' : 'rgba(239,68,68,0.04)', border: `1px solid ${color}22`, marginBottom: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 24, height: 24, borderRadius: '50%', background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, flexShrink: 0 }}>{icon}</span>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {detail && <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{detail}</span>}
        <span style={{ fontSize: '0.68rem', fontWeight: 800, color, background: `${color}15`, padding: '2px 8px', borderRadius: 10 }}>
          {verified ? 'VERIFIED' : pending ? 'PENDING' : 'NOT DONE'}
        </span>
      </div>
    </div>
  );
}

function DocRow({ doc }) {
  const statusMap = {
    PENDING: { c: '#f59e0b', label: '⏳ Pending' }, UNDER_REVIEW: { c: '#3b82f6', label: '🔍 Under Review' },
    VERIFIED: { c: '#10b981', label: '✓ Verified' }, REJECTED: { c: '#ef4444', label: '✗ Rejected' },
    MISMATCH_DETECTED: { c: '#f59e0b', label: '⚠ Mismatch' }, EXPIRED: { c: '#64748b', label: '⏰ Expired' },
    REUPLOAD_REQUIRED: { c: '#ef4444', label: '↑ Re-upload' },
  };
  const s = statusMap[doc.verificationStatus] || { c: '#94a3b8', label: doc.verificationStatus };
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 5 }}>
      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1' }}>📄 {doc.documentName}</div>
        <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 1 }}>{doc.documentType?.replace(/_/g,' ')} · {doc.documentCategory}</div>
        {doc.rejectionReason && <div style={{ fontSize: '0.68rem', color: '#ef4444', marginTop: 3 }}>Reason: {doc.rejectionReason}</div>}
      </div>
      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: s.c, background: `${s.c}15`, padding: '3px 9px', borderRadius: 10, whiteSpace: 'nowrap' }}>{s.label}</span>
    </div>
  );
}

export default function BidderVerificationStatusPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/bidder-onboarding/verification-status')
      .then(r => setStatus(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AppLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin-slow 1s linear infinite' }} />
      </div>
    </AppLayout>
  );

  const lifecycle = status?.lifecycleStatus || 'REGISTERED';
  const lm = LIFECYCLE_MAP[lifecycle] || LIFECYCLE_MAP['REGISTERED'];
  const p = status?.personal || {};
  const c = status?.company || {};
  const docs = status?.documents || [];
  const score = status?.overallScore || 0;

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>VERIFICATION CENTRE</div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>Verification Status</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Track your complete verification progress</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/bidder/onboarding')}>Continue Verification →</button>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Overall Status Card */}
        <div style={{ background: 'rgba(15,23,42,0.8)', border: `1px solid ${lm.color}30`, borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: 6 }}>OVERALL VERIFICATION STATUS</div>
              <span style={{ padding: '5px 16px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 800, color: lm.color, background: lm.bg, border: `1px solid ${lm.color}35` }}>● {lm.label}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>COMPLIANCE SCORE</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444' }}>{score}%</div>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 20, height: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${lm.pct}%`, background: `linear-gradient(90deg,${lm.color},${lm.color}cc)`, borderRadius: 20, transition: 'width 1s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: '0.65rem', color: '#475569' }}>Registration</span>
            <span style={{ fontSize: '0.65rem', color: '#475569' }}>Identity</span>
            <span style={{ fontSize: '0.65rem', color: '#475569' }}>Company</span>
            <span style={{ fontSize: '0.65rem', color: '#475569' }}>Documents</span>
            <span style={{ fontSize: '0.65rem', color: lm.pct === 100 ? '#10b981' : '#475569', fontWeight: lm.pct === 100 ? 800 : 400 }}>Approved</span>
          </div>
          {status?.rejectionReason && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10 }}>
              <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}>⚠ Officer Remarks</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>{status.rejectionReason}</div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Personal Verification */}
          <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20 }}>
            <div style={{ fontWeight: 800, color: '#f0f4ff', fontSize: '0.92rem', marginBottom: 16 }}>👤 Personal Identity</div>
            <CheckRow label="Email Verified" verified={p.emailVerified} pending={false} />
            <CheckRow label="Mobile Verified" verified={p.mobileVerified} pending={false} />
            <CheckRow label="Profile Complete" verified={p.profileComplete} pending={!p.profileComplete} />
            <CheckRow label="PAN Verification" verified={p.panVerified} pending={!p.panVerified} />
            <CheckRow label="Aadhaar / OTP Verification" verified={p.aadhaarVerified} pending={!p.aadhaarVerified} />
          </div>

          {/* Company Verification */}
          <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20 }}>
            <div style={{ fontWeight: 800, color: '#f0f4ff', fontSize: '0.92rem', marginBottom: 16 }}>🏢 Company Registration</div>
            <CheckRow label="Company Profile Saved" verified={c.profileComplete} pending={!c.profileComplete} />
            <CheckRow label="Company PAN" verified={c.panVerified} pending={!c.panVerified} detail="CBDT" />
            <CheckRow label="GST Registration" verified={c.gstVerified} pending={!c.gstVerified} detail="GSTN" />
            <CheckRow label="Udyam / MSME" verified={c.udyamVerified} pending={!c.udyamVerified && !c.panVerified} detail="Ministry of MSME" />
            <CheckRow label="MCA / Incorporation" verified={c.mcaVerified} pending={!c.mcaVerified && !c.gstVerified} detail="MCA21" />
            <CheckRow label="Blacklist Check" verified={c.blacklistClear === true} pending={c.blacklistClear === undefined} detail={c.blacklistClear === false ? '⚠ FLAGGED' : c.blacklistClear === true ? 'Clear' : ''} />
          </div>
        </div>

        {/* Document Status */}
        <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 800, color: '#f0f4ff', fontSize: '0.92rem' }}>📁 Document Vault ({docs.length} documents)</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.entries(status?.documentStats || {}).map(([stat, cnt]) => (
                <span key={stat} style={{ fontSize: '0.65rem', fontWeight: 800, color: stat === 'VERIFIED' ? '#10b981' : stat === 'REJECTED' ? '#ef4444' : '#f59e0b', background: `${stat === 'VERIFIED' ? '#10b981' : stat === 'REJECTED' ? '#ef4444' : '#f59e0b'}15`, padding: '2px 8px', borderRadius: 10 }}>
                  {cnt} {stat.replace(/_/g,' ')}
                </span>
              ))}
            </div>
          </div>
          {docs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ color: '#475569', fontSize: '0.82rem' }}>No documents uploaded yet.</div>
              <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/bidder/onboarding')}>Upload Documents →</button>
            </div>
          ) : (
            docs.map(doc => <DocRow key={doc.id} doc={doc} />)
          )}
        </div>

        {/* CTA */}
        {lifecycle !== 'APPROVED_TO_BID' && (
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: '0.95rem' }} onClick={() => navigate('/bidder/onboarding')}>
            Continue Verification →
          </button>
        )}
        {lifecycle === 'APPROVED_TO_BID' && (
          <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.05))', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎉</div>
            <div style={{ fontWeight: 900, color: '#10b981', fontSize: '1.1rem', marginBottom: 6 }}>Fully Verified & Approved!</div>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 16 }}>You are eligible to participate in government procurement tenders.</p>
            <button className="btn-primary" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }} onClick={() => navigate('/bidder/tenders')}>Browse Eligible Tenders →</button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
