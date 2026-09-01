import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/Sidebar';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function BidderTenderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showPreCheckModal, setShowPreCheckModal] = useState(false);
  const [isPreChecking, setIsPreChecking] = useState(false);
  const [preCheckResults, setPreCheckResults] = useState(null);

  const tender = {
    id: id || 't1',
    referenceNo: 'GEM-2026-001',
    title: 'Supply of Industrial Safety Equipment',
    organization: 'Ministry of Labour & Employment',
    department: 'Central Labour Welfare Division',
    estimatedValue: 50000000,
    publishedDate: new Date(Date.now() - 3 * 86400000),
    closingDate: new Date(Date.now() + 7 * 86400000),
    description: 'Procurement of industrial helmets, safety harnesses, protective boots, and respiratory gear for central welfare construction projects. All supplied products must conform to IS 2925 and EN 397 safety standards.',
    requirements: [
      { id: 'r1', category: 'REGISTRATION', title: 'Valid GST Registration', mandatory: true, evidence: 'GST Certificate (Active state status)' },
      { id: 'r2', category: 'TAX', title: 'Valid Permanent Account Number (PAN)', mandatory: true, evidence: 'Income Tax Department PAN Card' },
      { id: 'r3', category: 'MSME_UDYAM', title: 'Udyam / MSME Registration Certificate', mandatory: false, evidence: 'Udyam Registration Certificate' },
      { id: 'r4', category: 'FINANCIAL', title: 'Minimum Annual Turnover ≥ INR 5.00 Cr', mandatory: true, evidence: 'Audited Financial Statements for last 3 financial years' },
      { id: 'r5', category: 'OEM', title: 'Manufacturer OEM Authorization Certificate', mandatory: true, evidence: 'Manufacturer authorization letter specifying scope' },
      { id: 'r6', category: 'EXPERIENCE', title: 'Minimum 3 Years Prior Supply Experience', mandatory: true, evidence: 'Copies of contracts / completion certificates' },
      { id: 'r7', category: 'BLACKLISTING', title: 'Non-Debarment & Non-Blacklisting Declaration', mandatory: true, evidence: 'Self-declaration affidavit on non-judicial stamp' },
    ],
    mandatoryDocuments: [
      'GST Registration Certificate',
      'PAN Card Copy',
      'Audited P&L Statements & Balance Sheets (FY 2023-24, 2024-25, 2025-26)',
      'OEM Authorization Certificate',
      'Technical Specification Parameter Compliance Matrix',
      'Non-Blacklisting Declaration Affidavit',
    ],
  };

  const runPreCheck = () => {
    setIsPreChecking(true);
    setTimeout(() => {
      setPreCheckResults({
        readinessScore: 78,
        items: [
          { name: 'GST Registration', status: 'COMPLIANT', note: 'Active Karnataka GSTIN found (29AABCA1234C1Z5)' },
          { name: 'PAN Card', status: 'COMPLIANT', note: 'Verified Company PAN (AABCA1234C)' },
          { name: 'Udyam Registration', status: 'COMPLIANT', note: 'Small MSME Certificate verified' },
          { name: 'Minimum Annual Turnover', status: 'WARNING', note: 'Extracted ₹3.20 Cr vs Required ₹5.00 Cr (MSE relaxation may apply)' },
          { name: 'OEM Authorization', status: 'REQUIRES_ATTENTION', note: 'Authorization found on Page 7; validity end date requires verification' },
          { name: 'Non-Blacklisting Affidavit', status: 'COMPLIANT', note: 'Clean record across GeM & CVC registries' },
        ],
      });
      setIsPreChecking(false);
      toast.success('Pre-bid compliance check complete!');
    }, 1500);
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#8b5cf6', fontWeight: 800 }}>
              {tender.referenceNo}
            </span>
            <span className="badge badge-active">OPEN FOR SUBMISSION</span>
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>
            {tender.title}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            {tender.organization} · {tender.department}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-secondary"
            style={{ color: '#8b5cf6', borderColor: 'rgba(139,92,246,0.4)', background: 'rgba(139,92,246,0.08)' }}
            onClick={() => { setShowPreCheckModal(true); if (!preCheckResults) runPreCheck(); }}
          >
            🧠 AI-Assisted Pre-Bid Check
          </button>
          <button
            className="btn-primary"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            onClick={() => navigate(`/bidder/submit/${tender.id}`)}
          >
            🚀 Start Bid Submission
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 960, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Key Highlights Card */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>ESTIMATED TENDER VALUE</div>
              <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#10b981', marginTop: 2 }}>
                ₹{(tender.estimatedValue / 10000000).toFixed(2)} Crore
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>PUBLISHED DATE</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f0f4ff', marginTop: 2 }}>
                {format(new Date(tender.publishedDate), 'dd MMM yyyy')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>SUBMISSION DEADLINE</div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fbbf24', marginTop: 2 }}>
                {format(new Date(tender.closingDate), 'dd MMM yyyy')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>PORTAL ID</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#8b5cf6', marginTop: 2, fontFamily: 'monospace' }}>
                {tender.referenceNo}
              </div>
            </div>
          </div>
        </div>

        {/* Scope of Work */}
        <div className="card">
          <span className="section-title" style={{ display: 'block', marginBottom: 8 }}>
            Tender Scope & Specification
          </span>
          <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6 }}>
            {tender.description}
          </p>
        </div>

        {/* Eligibility Criteria Matrix */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg-border)' }}>
            <span className="section-title">Eligibility Criteria ({tender.requirements.length})</span>
          </div>
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Requirement</th>
                  <th>Mandatory Evidence</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {tender.requirements.map(r => (
                  <tr key={r.id}>
                    <td>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '2px 8px', borderRadius: 6 }}>
                        {r.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#f0f4ff', fontSize: '0.85rem' }}>{r.title}</td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{r.evidence}</td>
                    <td>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: r.mandatory ? '#ef4444' : '#10b981' }}>
                        {r.mandatory ? 'MANDATORY' : 'OPTIONAL'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mandatory Documents Checklist */}
        <div className="card">
          <span className="section-title" style={{ display: 'block', marginBottom: 12 }}>
            Mandatory Bid Submission Documents
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {tender.mandatoryDocuments.map((doc, i) => (
              <div key={i} style={{ padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--bg-border)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#cbd5e1' }}>
                <span style={{ color: '#8b5cf6', fontWeight: 800 }}>📄</span>
                <span>{doc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Pre-Bid Check Modal */}
      {showPreCheckModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowPreCheckModal(false)}>
          <div className="card" style={{ maxWidth: 650, width: '100%', background: '#091322', border: '1px solid #7c3aed', padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#8b5cf6', fontWeight: 800 }}>PRE-SUBMISSION READINESS CHECK</span>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f0f4ff', marginTop: 2 }}>
                  AI-Assisted Eligibility Check
                </h2>
              </div>
              <button className="btn-ghost" onClick={() => setShowPreCheckModal(false)}>✕</button>
            </div>

            {isPreChecking ? (
              <div style={{ padding: '30px 0', textAlign: 'center' }}>
                <div style={{ width: 40, height: 40, border: '3px solid #1e3a5f', borderTop: '3px solid #8b5cf6', borderRadius: '50%', animation: 'spin-slow 1s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>Extracting requirements & comparing with company documents...</p>
              </div>
            ) : preCheckResults ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, background: 'rgba(124,58,237,0.1)', borderRadius: 10, border: '1px solid rgba(124,58,237,0.3)', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>ESTIMATED BID READINESS</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#a78bfa' }}>{preCheckResults.readinessScore}%</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#94a3b8' }}>
                    4 Compliant · 1 Warning · 1 Attention
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto', marginBottom: 16 }}>
                  {preCheckResults.items.map((item, idx) => (
                    <div key={idx} style={{ padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#f0f4ff' }}>{item.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>{item.note}</div>
                      </div>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                        color: item.status === 'COMPLIANT' ? '#10b981' : item.status === 'WARNING' ? '#f59e0b' : '#ef4444',
                        background: item.status === 'COMPLIANT' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                      }}>
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Important Disclaimer */}
                <div style={{ padding: 10, background: 'rgba(245,158,11,0.06)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.25)', fontSize: '0.72rem', color: '#fbbf24', marginBottom: 16 }}>
                  ⚠️ <strong>Disclaimer:</strong> This AI-assisted check is a preliminary readiness tool to help vendors avoid disqualification due to missing documents. It does not guarantee final procurement award or replace official committee evaluation.
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowPreCheckModal(false)}>Close</button>
                  <button className="btn-primary" style={{ flex: 1.5, justifyContent: 'center', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }} onClick={() => { setShowPreCheckModal(false); navigate(`/bidder/submit/${tender.id}`); }}>
                    Proceed to Bid Submission →
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
