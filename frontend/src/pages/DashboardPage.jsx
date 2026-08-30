import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppLayout } from '../components/Sidebar';
import { tenderAPI, complianceAPI } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// ─── Shared Mock Data ────────────────────────────────────────────────────────
const DEMO_TENDERS = [
  { id: 't1', referenceNo: 'GEM-2026-001', title: 'Supply of Industrial Safety Equipment', organization: 'Ministry of Labour', status: 'ACTIVE', estimatedValue: 50000000, closingDate: new Date(Date.now() + 7*86400000), _count: { bidders: 5 } },
  { id: 't2', referenceNo: 'GEM-2026-002', title: 'IT Infrastructure Procurement', organization: 'NIC', status: 'PROCESSING', estimatedValue: 20000000, closingDate: new Date(Date.now() + 14*86400000), _count: { bidders: 3 } },
  { id: 't3', referenceNo: 'GEM-2026-003', title: 'Office Automation Hardware', organization: 'PWD', status: 'ACTIVE', estimatedValue: 10000000, closingDate: new Date(Date.now() + 21*86400000), _count: { bidders: 8 } },
];

const STATUS_COLOR = { ACTIVE: '#10b981', PROCESSING: '#3b82f6', DRAFT: '#64748b', CLOSED: '#ef4444', CANCELLED: '#ef4444' };

// =============================================================================
// 1. 🏛️ PROCUREMENT OFFICER DASHBOARD
// =============================================================================
const OfficerDashboard = ({ profile, tenders, navigate }) => {
  return (
    <div>
      {/* Top Welcome & Primary CTAs */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '1.2rem' }}>🏛️</span>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff' }}>
              Good morning, {profile?.name?.split(' ')[0] || 'Officer'}
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Procurement Compliance Verification Overview — {profile?.organization || 'Ministry of Labour'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-secondary" onClick={() => navigate('/compliance/b1')}>
            🔍 Start Compliance Verification
          </button>
          <button className="btn-primary" onClick={() => navigate('/tenders/create')}>
            + Create New Tender
          </button>
        </div>
      </div>

      <div style={{ padding: '28px 32px' }}>
        {/* Top 4 Operational Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Active Tenders', value: '12', icon: '📋', variant: 'blue', desc: 'Under active evaluation' },
            { label: 'Bids Received', value: '48', icon: '📥', variant: 'cyan', desc: 'Across all active tenders' },
            { label: 'Pending Verification', value: '14', icon: '⏳', variant: 'amber', desc: 'Awaiting OCR & rule checks' },
            { label: 'Flagged Cases', value: '7', icon: '⚠️', variant: 'red', desc: 'High compliance risk' },
          ].map(card => (
            <div key={card.label} className={`stat-card stat-card-${card.variant}`}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: '1.4rem' }}>{card.icon}</div>
                <span style={{ fontSize: '0.68rem', color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                  LIVE
                </span>
              </div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '2.2rem', color: '#f0f4ff', lineHeight: 1, marginBottom: 4 }}>
                {card.value}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#94a3b8' }}>{card.label}</div>
              <div style={{ fontSize: '0.72rem', color: '#4a6080' }}>{card.desc}</div>
            </div>
          ))}
        </div>

        {/* Attention Required Banner */}
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 14, padding: '16px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: '1.8rem' }}>⚠️</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f87171' }}>
                Attention Required: 3 Bidders with Compliance Inconsistencies
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>
                • ABC Industries Pvt Ltd: GST filing mismatch (₹3.2 Cr vs ₹5 Cr required) • TechCorp Ltd: Expired OEM Authorization • Sigma Global: Blacklist registry verification pending
              </div>
            </div>
          </div>
          <button className="btn-primary" style={{ background: '#ef4444', flexShrink: 0 }} onClick={() => navigate('/compliance/b1')}>
            Review Inconsistencies →
          </button>
        </div>

        {/* Main 2-Column Section: Tenders & AI Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          {/* Recent Tenders Table */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="section-title">Recent Tenders Overview</span>
              <Link to="/tenders" style={{ color: '#3b82f6', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
            </div>

            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Tender ID</th>
                    <th>Title</th>
                    <th>Bids</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tenders.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b' }}>{t.referenceNo}</td>
                      <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t.title}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '2px 8px', borderRadius: 10, fontWeight: 700, fontSize: '0.8rem' }}>
                          {t._count?.bidders || 5}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          background: `${STATUS_COLOR[t.status]}20`, color: STATUS_COLOR[t.status],
                          border: `1px solid ${STATUS_COLOR[t.status]}40`,
                          padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
                        }}>{t.status}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn-ghost" style={{ fontSize: '0.75rem', color: '#3b82f6', padding: '4px 8px' }} onClick={() => navigate(`/tenders/${t.id}`)}>
                            Open Review
                          </button>
                          <button className="btn-ghost" style={{ fontSize: '0.75rem', color: '#10b981', padding: '4px 8px' }} onClick={() => navigate('/reports')}>
                            Report
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: AI Verification Engine Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <span className="section-title" style={{ display: 'block', marginBottom: 14 }}>AI Verification Engine</span>
              {[
                { name: 'Gemini 1.5 Pro LLM', status: 'READY', color: '#10b981' },
                { name: 'PyMuPDF + Tesseract OCR', status: 'ACTIVE', color: '#10b981' },
                { name: 'FAISS Vector Index', status: '768-DIM', color: '#10b981' },
                { name: 'RAG Procurement Rules', status: 'GFR 2017', color: '#10b981' },
                { name: 'GST / PAN / Udyam Gateway', status: 'SANDBOX', color: '#f59e0b' },
              ].map(svc => (
                <div key={svc.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(30,45,74,0.4)' }}>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{svc.name}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 700, color: svc.color }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: svc.color, display: 'inline-block' }} />
                    {svc.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(30,64,175,0.15), rgba(8,145,178,0.15))' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f0f4ff', marginBottom: 6 }}>Automated Verification Flow</div>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: 12 }}>
                Upload tender docs → AI extracts criteria → Bidders submit evidence → Deterministic engine evaluates compliance.
              </p>
              <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem' }} onClick={() => navigate('/compliance/b1')}>
                Open Verification Workbench →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// 2. 🔍 REVIEWER / EVALUATOR DASHBOARD
// =============================================================================
const ReviewerDashboard = ({ profile, navigate }) => {
  const [decisionState, setDecisionState] = useState({});

  const handleDecision = (caseId, action) => {
    setDecisionState(prev => ({ ...prev, [caseId]: action }));
    toast.success(`Action recorded: ${action}`);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '1.2rem' }}>🔍</span>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff' }}>
              Review Center
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Second-Level Evaluation & Human-in-the-Loop Oversight — {profile?.organization || 'NIC'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="mock-banner">⚠ 6 Cases Require Human Verification</div>
        </div>
      </div>

      <div style={{ padding: '28px 32px' }}>
        {/* Reviewer Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Pending Reviews', value: '15', icon: '⏳', color: '#f59e0b' },
            { label: 'High Risk Flagged', value: '6', icon: '🔴', color: '#ef4444' },
            { label: 'Reviewed Today', value: '9', icon: '✓', color: '#10b981' },
            { label: 'AI Accuracy Rating', value: '96.4%', icon: '🎯', color: '#3b82f6' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: 18, borderLeft: `3px solid ${s.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>{s.label}</span>
                <span style={{ fontSize: '1.2rem' }}>{s.icon}</span>
              </div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.8rem', color: '#f0f4ff' }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* 🔴 HIGH PRIORITY CASE SPOTLIGHT */}
        <div className="card" style={{ padding: 24, marginBottom: 24, border: '1px solid rgba(239,68,68,0.4)', background: 'linear-gradient(145deg, rgba(239,68,68,0.06), #0f1629)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ background: '#ef4444', color: 'white', padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 800 }}>
                🔴 HIGH PRIORITY CASE
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>Tender: GEM-2026-001</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>
              AI Confidence: 91%
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#4a6080', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>BIDDER NAME</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#f0f4ff' }}>ABC Industries Pvt Ltd</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace', marginTop: 2 }}>GSTIN: 29AABCA1234C1Z5</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#4a6080', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>DETECTED ISSUE</div>
              <div style={{ fontSize: '0.85rem', color: '#f87171', fontWeight: 600 }}>
                Financial Statement turnover shows ₹3.20 Cr, failing required threshold of ₹5.00 Cr
              </div>
            </div>
          </div>

          {/* AI Reasoning Pipeline */}
          <div style={{ background: 'rgba(15,22,41,0.8)', border: '1px solid var(--bg-border)', borderRadius: 10, padding: 14, marginBottom: 18 }}>
            <div style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: 700, marginBottom: 6 }}>🧠 AI REASONING CHAIN</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.6 }}>
              <strong>Requirement:</strong> Minimum average annual turnover of ₹5 Cr in preceding 3 FYs.<br />
              <strong>Evidence Found:</strong> Audited P&L Statement (Page 4) specifies ₹3.20 Cr for FY 2025-26.<br />
              <strong>Rule Decision:</strong> NON_COMPLIANT (Deficit: ₹1.80 Cr).
            </div>
          </div>

          {/* Interactive Decision Actions */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" style={{ background: '#10b981', fontSize: '0.8rem' }} onClick={() => handleDecision('c1', 'Accepted Finding')}>
              ✔ Accept Finding
            </button>
            <button className="btn-secondary" style={{ borderColor: '#ef4444', color: '#ef4444', fontSize: '0.8rem' }} onClick={() => handleDecision('c1', 'Marked as Incorrect')}>
              ✖ Mark as Incorrect
            </button>
            <button className="btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => handleDecision('c1', 'Re-verification Requested')}>
              ↩ Request Re-verification
            </button>
            <button className="btn-ghost" style={{ fontSize: '0.8rem', color: '#3b82f6' }} onClick={() => navigate('/compliance/b1')}>
              Open Full Verification Screen →
            </button>
            {decisionState['c1'] && (
              <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700, marginLeft: 'auto' }}>
                ✓ {decisionState['c1']}
              </span>
            )}
          </div>
        </div>

        {/* Review Queue Table */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg-border)' }}>
            <span className="section-title">Flagged Cases Awaiting Review</span>
          </div>
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Bidder</th>
                  <th>Tender</th>
                  <th>Flagged Item</th>
                  <th>AI Confidence</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { bidder: 'XYZ Technologies Ltd', tender: 'GEM-2026-002', item: 'OEM Authorization lacks validity period', conf: '88%', status: 'REQUIRES_REVIEW' },
                  { bidder: 'Sigma Global Supply', tender: 'GEM-2026-001', item: 'Blacklist registry check returned 1 potential match', conf: '76%', status: 'INCONSISTENT' },
                  { bidder: 'Apex Equipments', tender: 'GEM-2026-003', item: 'Udyam enterprise category mismatch', conf: '94%', status: 'REQUIRES_REVIEW' },
                ].map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{row.bidder}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b' }}>{row.tender}</td>
                    <td style={{ fontSize: '0.82rem', color: '#94a3b8' }}>{row.item}</td>
                    <td><span style={{ fontWeight: 700, color: '#3b82f6', fontSize: '0.8rem' }}>{row.conf}</span></td>
                    <td><span className="badge badge-review">{row.status}</span></td>
                    <td>
                      <button className="btn-ghost" style={{ color: '#3b82f6', fontSize: '0.75rem' }} onClick={() => navigate('/compliance/b1')}>
                        Review Case →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// 3. 🏢 BIDDER (SUPPLIER) DASHBOARD
// =============================================================================
const BidderDashboard = ({ profile, tenders, navigate }) => {
  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '1.2rem' }}>🏢</span>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff' }}>
              Welcome, {profile?.organization || 'ABC Industries Pvt Ltd'}
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Supplier Bidding Portal — Track submissions, compliance status, and new tenders
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={() => navigate('/tenders')}>
            🔎 Find Tenders
          </button>
          <button className="btn-primary" onClick={() => navigate('/tenders/t1/bidders/b1')}>
            📤 Upload Documents
          </button>
        </div>
      </div>

      <div style={{ padding: '28px 32px' }}>
        {/* Top Supplier Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Eligible Tenders', value: '8', icon: '📋', color: '#3b82f6', desc: 'Matching your category' },
            { label: 'My Active Bids', value: '3', icon: '📤', color: '#10b981', desc: 'Submitted for verification' },
            { label: 'Action Needed', value: '2', icon: '⚠️', color: '#f59e0b', desc: 'Missing or update required' },
            { label: 'Verified Profile', value: '100%', icon: '✓', color: '#8b5cf6', desc: 'GSTIN & PAN Active' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '1.3rem' }}>{s.icon}</span>
                <span style={{ fontSize: '0.7rem', color: s.color, fontWeight: 700 }}>ACTIVE</span>
              </div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '2rem', color: '#f0f4ff', marginBottom: 2 }}>
                {s.value}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#94a3b8' }}>{s.label}</div>
              <div style={{ fontSize: '0.7rem', color: '#4a6080' }}>{s.desc}</div>
            </div>
          ))}
        </div>

        {/* My Current Submission Spotlight */}
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>GEM-2026-001</span>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f0f4ff', marginTop: 2 }}>
                Supply of Industrial Safety Equipment
              </div>
            </div>
            <span className="badge badge-review">Under Evaluation</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 18 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                <span style={{ color: '#94a3b8' }}>Document Upload Status</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>100% (6/6 Docs)</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '100%', background: '#10b981' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                <span style={{ color: '#94a3b8' }}>Preliminary Compliance Score</span>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>72% (Evaluation in progress)</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '72%', background: '#f59e0b' }} />
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: '0.82rem', color: '#f59e0b' }}>
              ⚠️ <strong>2 items require attention:</strong> Upload updated FY financial statement and verify OEM authorization certificate validity.
            </div>
            <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 12px' }} onClick={() => navigate('/tenders/t1/bidders/b1')}>
              Update Documents →
            </button>
          </div>
        </div>

        {/* Available Tenders for Bidder */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-title">Available Tenders Open for Bidding</span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Strictly isolated to public tenders</span>
          </div>

          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Tender</th>
                  <th>Ministry</th>
                  <th>Value</th>
                  <th>Deadline</th>
                  <th>Your Eligibility</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tenders.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t.title}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>{t.referenceNo}</div>
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{t.organization}</td>
                    <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>₹{(t.estimatedValue / 10000000).toFixed(1)} Cr</td>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{format(new Date(t.closingDate), 'dd MMM yyyy')}</td>
                    <td>
                      <span style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700 }}>
                        ✓ Eligible
                      </span>
                    </td>
                    <td>
                      <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '6px 12px' }} onClick={() => navigate(`/tenders/${t.id}`)}>
                        Submit Bid →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// 4. 🛡️ ADMINISTRATOR DASHBOARD
// =============================================================================
const AdminDashboard = ({ profile, navigate }) => {
  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '1.2rem' }}>🛡️</span>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff' }}>
              System Administration Console
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            User provisioning, RBAC authorization matrix, and platform health
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={() => navigate('/admin')}>
            👥 Open User Management
          </button>
        </div>
      </div>

      <div style={{ padding: '28px 32px' }}>
        {/* System Overview Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Users', value: '128', icon: '👥', color: '#3b82f6', desc: 'Registered platform users' },
            { label: 'Active Bidders', value: '42', icon: '🏢', color: '#8b5cf6', desc: 'Verified supplier entities' },
            { label: 'Govt. Officers', value: '18', icon: '🏛️', color: '#10b981', desc: 'Authorized procurement staff' },
            { label: 'System Uptime', value: '99.8%', icon: '⚡', color: '#06b6d4', desc: 'FastAPI & Node services' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '1.3rem' }}>{s.icon}</span>
                <span style={{ fontSize: '0.7rem', color: s.color, fontWeight: 700 }}>ONLINE</span>
              </div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '2rem', color: '#f0f4ff', marginBottom: 2 }}>
                {s.value}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#94a3b8' }}>{s.label}</div>
              <div style={{ fontSize: '0.7rem', color: '#4a6080' }}>{s.desc}</div>
            </div>
          ))}
        </div>

        {/* Pending Approvals Spotlight */}
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <span className="section-title">Government User Requests Pending Approval</span>
            </div>
            <button className="btn-ghost" style={{ fontSize: '0.8rem', color: '#3b82f6' }} onClick={() => navigate('/admin')}>
              View all requests →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { name: 'Priya Sharma', email: 'priya@pwd.gov.in', role: 'PROCUREMENT_OFFICER', org: 'Public Works Department (Delhi)' },
              { name: 'Arjun Reviewer', email: 'arjun@dgft.gov.in', role: 'REVIEWER', org: 'Directorate General of Foreign Trade' },
            ].map(user => (
              <div key={user.email} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid var(--bg-border)',
                borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f0f4ff' }}>{user.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>{user.email}</div>
                  <div style={{ fontSize: '0.72rem', color: '#3b82f6', marginTop: 4, fontWeight: 600 }}>
                    Requested: {user.role.replace(/_/g, ' ')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-primary" style={{ fontSize: '0.72rem', padding: '6px 10px', background: '#10b981' }} onClick={() => toast.success(`Approved ${user.name}`)}>
                    ✓ Approve
                  </button>
                  <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '6px 10px', color: '#ef4444' }} onClick={() => toast.error(`Rejected ${user.name}`)}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Component Health */}
        <div className="card" style={{ padding: 20 }}>
          <span className="section-title" style={{ display: 'block', marginBottom: 16 }}>Platform Component Health</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { name: 'OCR Engine', sub: 'PyMuPDF + Tesseract', status: 'Operational', icon: '📄' },
              { name: 'AI LLM Engine', sub: 'Google Gemini 1.5 Pro', status: 'Operational', icon: '🧠' },
              { name: 'Vector Database', sub: 'FAISS (768-dim embeddings)', status: 'Operational', icon: '⚡' },
              { name: 'Gov Portal Gateways', sub: 'GST, PAN, Udyam, MCA', status: 'Operational (Sandbox)', icon: '🏛️' },
            ].map(comp => (
              <div key={comp.name} style={{
                background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 10, padding: 14,
              }}>
                <div style={{ fontSize: '1.3rem', marginBottom: 6 }}>{comp.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f0f4ff' }}>{comp.name}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 8 }}>{comp.sub}</div>
                <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  {comp.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN DASHBOARD PAGE ROUTER (Switches view dynamically based on role)
// =============================================================================
export default function DashboardPage() {
  const { profile, role } = useAuth();
  const navigate = useNavigate();
  const [tenders, setTenders] = useState(DEMO_TENDERS);

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        const res = await tenderAPI.list({ limit: 5 });
        if (res.data?.tenders?.length) setTenders(res.data.tenders);
      } catch { /* use demo */ }
    };
    fetchTenders();
  }, []);

  return (
    <AppLayout>
      {role === 'PROCUREMENT_OFFICER' && <OfficerDashboard profile={profile} tenders={tenders} navigate={navigate} />}
      {role === 'REVIEWER' && <ReviewerDashboard profile={profile} navigate={navigate} />}
      {role === 'BIDDER' && <BidderDashboard profile={profile} tenders={tenders} navigate={navigate} />}
      {role === 'ADMIN' && <AdminDashboard profile={profile} navigate={navigate} />}
    </AppLayout>
  );
}
