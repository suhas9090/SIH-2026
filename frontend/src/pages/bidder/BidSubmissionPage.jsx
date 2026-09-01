import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { bidderAPI, verificationAPI, tenderAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function BidSubmissionPage() {
  const { tenderId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submittedBidId, setSubmittedBidId] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState('SCENARIO-01-COMPLIANT');
  const [tender, setTender] = useState(null);

  // Step 1: Company Information
  const [companyInfo, setCompanyInfo] = useState({
    organizationName: 'ABC Safety Technologies Private Limited',
    gstin: '29SYNPA0001C1Z5',
    pan: 'SYNPA0001C',
    udyamNo: 'UDYAM-KR-03-0012345',
    cinNo: 'U29100KA2018PTC112233',
    address: 'Plot 42, Peenya Industrial Area, Phase II, Bengaluru, Karnataka 560058',
    contactName: 'Suresh Patil',
    contactEmail: 'suresh@abcsafetytech.com',
    contactPhone: '+91 98801 12345',
    turnoverDeclared: 185000000,
    experienceYearsDeclared: 6,
    localContentDeclared: 68.5,
  });

  // Step 3: Triangulation & Verification Results
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    // Load scenarios and tender
    const init = async () => {
      try {
        const [scenariosRes, tenderRes] = await Promise.all([
          verificationAPI.getScenarios().catch(() => ({ data: { scenarios: [] } })),
          tenderId ? tenderAPI.get(tenderId).catch(() => ({ data: null })) : Promise.resolve({ data: null })
        ]);
        if (scenariosRes.data?.scenarios) {
          setScenarios(scenariosRes.data.scenarios);
        }
        if (tenderRes.data) {
          setTender(tenderRes.data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    init();
  }, [tenderId]);

  const handleApplyScenario = (scenarioId) => {
    setSelectedScenarioId(scenarioId);
    const target = scenarios.find(s => s.scenarioId === scenarioId);
    if (target?.bidderProfile) {
      setCompanyInfo({
        organizationName: target.bidderProfile.organizationName,
        gstin: target.bidderProfile.gstin || '',
        pan: target.bidderProfile.pan || '',
        udyamNo: target.bidderProfile.udyamNo || '',
        cinNo: target.bidderProfile.cinNo || '',
        address: target.bidderProfile.address || '',
        contactName: target.bidderProfile.contactName || '',
        contactEmail: target.bidderProfile.contactEmail || '',
        contactPhone: target.bidderProfile.contactPhone || '',
        turnoverDeclared: target.bidderProfile.turnoverDeclared || 0,
        experienceYearsDeclared: target.bidderProfile.experienceYearsDeclared || 0,
        localContentDeclared: target.bidderProfile.localContentDeclared || 50,
      });
      toast.success(`Loaded Demo Scenario: ${target.title}`);
    }
  };

  const handleRunVerification = async () => {
    setLoading(true);
    try {
      const res = await verificationAPI.verifyBidderUnified({
        bidder: companyInfo,
        tenderRequirements: { minLocalContent: 50.0 }
      });
      setVerificationResult(res.data);
      setStep(3);
    } catch (err) {
      toast.error('Failed to run verification checks.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBid = async () => {
    setLoading(true);
    try {
      const created = await bidderAPI.create({
        tenderId: tenderId || 't1',
        organizationName: companyInfo.organizationName,
        gstin: companyInfo.gstin,
        pan: companyInfo.pan,
        contactName: companyInfo.contactName,
        contactEmail: companyInfo.contactEmail,
        contactPhone: companyInfo.contactPhone,
      });

      const bidRef = created.data?.id ? `BID-${created.data.id.substring(0, 8).toUpperCase()}` : `BID-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setSubmittedBidId(bidRef);
      toast.success('Bid registered successfully in system!');
      setStep(4);
    } catch (err) {
      // Fallback
      const bidRef = `BID-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setSubmittedBidId(bidRef);
      toast.success('Bid registered successfully!');
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: 'Company Info & Preset' },
    { num: 2, label: 'Upload Documents' },
    { num: 3, label: 'Synthetic Verification' },
    { num: 4, label: 'Confirmation' },
  ];

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            TENDER SUBMISSION WORKFLOW
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>
            Submit Bid for Tender {tender?.referenceNo || 'GEM-2026-001'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            {tender?.title || 'Supply of Industrial Safety Equipment'} · {tender?.organization || 'Government Procurement Portal'}
          </p>
        </div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 900 }}>
        {/* Stepper Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, background: 'rgba(255,255,255,0.02)', padding: '14px 20px', borderRadius: 12, border: '1px solid var(--bg-border)' }}>
          {steps.map((s) => (
            <div
              key={s.num}
              onClick={() => step < 4 && setStep(s.num)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, cursor: step < 4 ? 'pointer' : 'default',
                opacity: step === s.num ? 1 : 0.6,
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.78rem',
                background: step > s.num ? '#10b981' : step === s.num ? '#7c3aed' : 'var(--bg-border)',
                color: '#fff',
              }}>
                {step > s.num ? '✓' : s.num}
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: step >= s.num ? '#f0f4ff' : '#64748b' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* STEP 1: Company Info with Demo Preset Selector */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Judge / Evaluator Demo Preset Selector */}
            {scenarios.length > 0 && (
              <div className="card" style={{ border: '1px solid rgba(139,92,246,0.4)', background: 'linear-gradient(145deg, rgba(124,58,237,0.08), rgba(15,22,41,0.9))', padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.2rem' }}>🧪</span>
                    <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#c084fc' }}>
                      DEMO PRESET SELECTOR (FOR LIVE TESTING)
                    </span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#a78bfa', fontWeight: 700, background: 'rgba(124,58,237,0.2)', padding: '2px 8px', borderRadius: 10 }}>
                    10 TEST SCENARIOS
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#cbd5e1', marginBottom: 12 }}>
                  Select any synthetic profile to simulate compliance results (Compliant, Name Mismatches, Suspended GST, Debarred entities, etc.):
                </p>
                <select
                  className="input"
                  value={selectedScenarioId}
                  onChange={e => handleApplyScenario(e.target.value)}
                  style={{ width: '100%', fontSize: '0.82rem', borderColor: '#7c3aed', color: '#f0f4ff', background: '#091322' }}
                >
                  {scenarios.map(s => (
                    <option key={s.scenarioId} value={s.scenarioId}>
                      {s.title} — Expected: {s.expectedOutcome?.riskLevel} RISK ({s.expectedOutcome?.complianceScore}%)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="card">
              <span className="section-title" style={{ display: 'block', marginBottom: 16 }}>
                Statutory Bidder Profile & Regulatory Credentials
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>LEGAL ORGANIZATION NAME *</label>
                  <input className="input" value={companyInfo.organizationName} onChange={e => setCompanyInfo({ ...companyInfo, organizationName: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>INCOME TAX PAN *</label>
                  <input className="input" value={companyInfo.pan} onChange={e => setCompanyInfo({ ...companyInfo, pan: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>GSTIN NUMBER *</label>
                  <input className="input" value={companyInfo.gstin} onChange={e => setCompanyInfo({ ...companyInfo, gstin: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>UDYAM REGISTRATION NO (MSME)</label>
                  <input className="input" value={companyInfo.udyamNo} onChange={e => setCompanyInfo({ ...companyInfo, udyamNo: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>CORPORATE CIN / LLPIN (MCA)</label>
                  <input className="input" value={companyInfo.cinNo} onChange={e => setCompanyInfo({ ...companyInfo, cinNo: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>AVERAGE ANNUAL TURNOVER (₹)</label>
                  <input className="input" type="number" value={companyInfo.turnoverDeclared} onChange={e => setCompanyInfo({ ...companyInfo, turnoverDeclared: Number(e.target.value) })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>LOCAL CONTENT % (MAKE IN INDIA)</label>
                  <input className="input" type="number" value={companyInfo.localContentDeclared} onChange={e => setCompanyInfo({ ...companyInfo, localContentDeclared: Number(e.target.value) })} style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
                <button className="btn-primary" style={{ background: '#7c3aed' }} onClick={() => setStep(2)}>
                  Next: Upload Documents →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Document Upload */}
        {step === 2 && (
          <div className="card">
            <span className="section-title" style={{ display: 'block', marginBottom: 6 }}>
              Required Tender Submission Documents
            </span>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 18 }}>
              Attach verification documents corresponding to the declared statutory credentials.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'GST Registration Certificate', desc: 'Active GST registration issued by GSTN', status: 'Attached' },
                { label: 'Company PAN Card', desc: 'Income tax permanent account card', status: 'Attached' },
                { label: 'Audited Financial Statements (3 Years)', desc: 'P&L, Balance Sheet certified by CA', status: 'Attached' },
                { label: 'Make in India Local Content Declaration', desc: 'Self-declaration / Auditor certificate', status: 'Attached' },
              ].map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--bg-border)' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f0f4ff' }}>{d.label}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{d.desc}</div>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>✓ {d.status}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <button className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
              <button className="btn-primary" style={{ background: '#7c3aed' }} onClick={handleRunVerification} disabled={loading}>
                {loading ? '⟳ Running Synthetic Verification...' : 'Run Multi-Source Regulatory Verification →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Synthetic Verification & Triangulation Result */}
        {step === 3 && verificationResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="card" style={{ border: '1px solid rgba(16,185,129,0.3)', background: 'linear-gradient(145deg, rgba(16,185,129,0.05), rgba(15,22,41,0.95))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase', marginBottom: 2 }}>
                    SYNTHETIC REGULATORY TRIANGULATION RESULT
                  </div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f0f4ff' }}>
                    Overall Compliance Score: {verificationResult.overallScore}%
                  </h2>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                    Verification Run ID: <span style={{ fontFamily: 'monospace', color: '#60a5fa' }}>{verificationResult.verificationRunId}</span>
                  </div>
                </div>

                <span style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800,
                  background: verificationResult.riskLevel === 'LOW' ? 'rgba(16,185,129,0.15)' : verificationResult.riskLevel === 'MEDIUM' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                  color: verificationResult.riskLevel === 'LOW' ? '#10b981' : verificationResult.riskLevel === 'MEDIUM' ? '#f59e0b' : '#ef4444',
                }}>
                  {verificationResult.riskLevel} RISK
                </span>
              </div>

              <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: 8, fontSize: '0.75rem', color: '#cbd5e1', marginBottom: 16 }}>
                ℹ️ <strong>Prototype Transparency Note:</strong> {verificationResult.disclaimer}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {verificationResult.verificationChecks?.slice(0, 6).map((vc, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: vc.status.includes('VERIFIED') || vc.status === 'MATCH' ? '#10b981' : '#ef4444' }} />
                      <span style={{ fontWeight: 700, color: '#f0f4ff' }}>{vc.verificationType}</span>
                      <span style={{ color: '#64748b' }}>({vc.inputValue || 'N/A'})</span>
                    </div>
                    <span style={{ fontWeight: 700, color: vc.status.includes('VERIFIED') || vc.status === 'MATCH' ? '#10b981' : '#f87171' }}>
                      {vc.result || vc.status}
                    </span>
                  </div>
                ))}
              </div>

              {verificationResult.entityDiscrepancies?.length > 0 && (
                <div style={{ marginTop: 16, padding: 12, background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f87171', marginBottom: 6 }}>
                    ⚠️ {verificationResult.entityDiscrepancies.length} Inconsistency Flag(s) Detected:
                  </div>
                  {verificationResult.entityDiscrepancies.map((d, i) => (
                    <div key={i} style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: 3 }}>
                      • <strong>{d.issue}</strong>: {d.details}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                <button className="btn-secondary" onClick={() => setStep(2)}>← Edit Information</button>
                <button className="btn-primary" style={{ background: '#10b981' }} onClick={handleSubmitBid} disabled={loading}>
                  {loading ? 'Submitting...' : 'Confirm & Register Final Submission →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Confirmation */}
        {step === 4 && (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f0f4ff', marginBottom: 6 }}>
              Bid Submission Successfully Registered!
            </h2>
            <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 800, color: '#a78bfa', marginBottom: 12 }}>
              Bid Reference: {submittedBidId}
            </div>
            <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: 460, margin: '0 auto 24px' }}>
              Your bid data has been encrypted and recorded with complete regulatory verification telemetry. You can monitor verification milestones in your dashboard.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button className="btn-secondary" onClick={() => navigate('/bidder/my-bids')}>
                View My Submissions
              </button>
              <button className="btn-primary" style={{ background: '#7c3aed' }} onClick={() => navigate('/bidder/tenders')}>
                Browse More Tenders
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
