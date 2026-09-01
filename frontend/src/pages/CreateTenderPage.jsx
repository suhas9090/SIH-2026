import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/Sidebar';
import { tenderAPI } from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Industrial Safety Equipment',
  'IT & Cloud Infrastructure',
  'Medical & Healthcare Supplies',
  'Office Furniture & Stationery',
  'Vehicles & Transport Services',
  'Construction & Civil Works',
  'Consulting & Professional Services',
  'Facility Management & Security',
];

export default function CreateTenderPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Basic Information
  const [basicInfo, setBasicInfo] = useState({
    referenceNo: `GEM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    title: '',
    department: 'Ministry of Labour & Employment',
    organization: 'Central Public Procurement Portal',
    category: 'Industrial Safety Equipment',
    estimatedValue: '50000000', // 5 Cr
    publishedDate: new Date().toISOString().split('T')[0],
    closingDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    description: '',
  });

  // Step 2: Eligibility Requirements
  const [eligibility, setEligibility] = useState({
    minTurnover: '50000000',
    turnoverOperator: 'GREATER_THAN_OR_EQUAL',
    turnoverCurrency: 'INR',
    turnoverEvidence: 'Audited Financial Statement (3 Years)',
    gstRequired: true,
    gstEvidence: 'Valid GST Registration Certificate',
    panRequired: true,
    panEvidence: 'Permanent Account Number (PAN Card)',
    minExperience: '3',
    experienceEvidence: 'Prior Government / PSU Supply Order Completion Certificates',
  });

  // Step 3: Mandatory Documents Checklist
  const [mandatoryDocs, setMandatoryDocs] = useState({
    panCard: true,
    gstCertificate: true,
    udyamCertificate: true,
    financialStatements: true,
    technicalCompliance: true,
    oemAuthorization: true,
    blacklistingDeclaration: true,
    experienceProof: true,
  });

  // Step 4: Additional Requirements & Preferences
  const [additionalReqs, setAdditionalReqs] = useState({
    msmePreference: true,
    startupExemption: true,
    makeInIndiaPercentage: '50',
    localContentRequired: true,
    nonBlacklistingRequired: true,
    earnestMoneyDeposit: '100000', // 1 Lakh EMD
  });

  const handleCreateAndPublish = async (isDraft = false) => {
    if (!basicInfo.title) return toast.error('Tender title is required');
    setLoading(true);

    try {
      // Build structured requirements array
      const structuredRequirements = [
        {
          category: 'REGISTRATION',
          title: 'Valid GST Registration',
          description: `Bidder must possess a valid GST registration. Evidence: ${eligibility.gstEvidence}`,
          mandatory: eligibility.gstRequired,
          evidenceTypes: ['GST_CERTIFICATE'],
        },
        {
          category: 'TAX',
          title: 'Valid Permanent Account Number (PAN)',
          description: `Bidder must possess a verified PAN. Evidence: ${eligibility.panEvidence}`,
          mandatory: eligibility.panRequired,
          evidenceTypes: ['PAN_CARD'],
        },
        {
          category: 'FINANCIAL',
          title: `Minimum Annual Turnover >= INR ${(parseFloat(eligibility.minTurnover) / 10000000).toFixed(2)} Cr`,
          description: `Minimum average annual turnover required. Evidence: ${eligibility.turnoverEvidence}`,
          minValue: parseFloat(eligibility.minTurnover) || 0,
          mandatory: true,
          currency: eligibility.turnoverCurrency,
          evidenceTypes: ['FINANCIAL_STATEMENT'],
        },
        {
          category: 'EXPERIENCE',
          title: `Minimum ${eligibility.minExperience} Years Prior Experience`,
          description: `Evidence: ${eligibility.experienceEvidence}`,
          minValue: parseFloat(eligibility.minExperience) || 0,
          mandatory: true,
          evidenceTypes: ['EXPERIENCE_CERTIFICATE'],
        },
      ];

      if (mandatoryDocs.oemAuthorization) {
        structuredRequirements.push({
          category: 'OEM',
          title: 'Manufacturer OEM Authorization Certificate',
          description: 'Valid authorization specifying product scope, territory, and duration.',
          mandatory: true,
          evidenceTypes: ['OEM_AUTHORIZATION'],
        });
      }

      if (additionalReqs.msmePreference) {
        structuredRequirements.push({
          category: 'MSME_UDYAM',
          title: 'Udyam / MSME Registration Certificate',
          description: 'MSME purchase preference applicable under Public Procurement Policy 2012.',
          mandatory: false,
          evidenceTypes: ['UDYAM_CERTIFICATE'],
        });
      }

      if (additionalReqs.nonBlacklistingRequired) {
        structuredRequirements.push({
          category: 'BLACKLISTING',
          title: 'Non-Debarment & Non-Blacklisting Declaration',
          description: 'Self-declaration and clean record across GeM and CVC blacklist registries.',
          mandatory: true,
          evidenceTypes: ['OTHER'],
        });
      }

      const payload = {
        referenceNo: basicInfo.referenceNo,
        title: basicInfo.title,
        organization: basicInfo.organization,
        department: basicInfo.department,
        category: basicInfo.category,
        estimatedValue: parseFloat(basicInfo.estimatedValue) || 0,
        publishedDate: new Date(basicInfo.publishedDate),
        closingDate: new Date(basicInfo.closingDate),
        description: basicInfo.description,
        status: isDraft ? 'DRAFT' : 'ACTIVE',
        requirements: structuredRequirements,
      };

      const res = await tenderAPI.create(payload);
      toast.success(isDraft ? 'Tender saved as draft!' : 'Tender published successfully to GeM Portal!');
      navigate(`/tenders/${res.data.id}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to publish tender');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: 'Basic Details' },
    { num: 2, label: 'Eligibility' },
    { num: 3, label: 'Mandatory Docs' },
    { num: 4, label: 'Preferences' },
    { num: 5, label: 'Review & Publish' },
  ];

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            PROCUREMENT MANAGEMENT
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>
            Create Procurement Tender
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Define structured eligibility rules, mandatory evidence checklists, and statutory preferences
          </p>
        </div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 900 }}>
        {/* Stepper Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, background: 'rgba(255,255,255,0.02)', padding: '14px 20px', borderRadius: 12, border: '1px solid var(--bg-border)' }}>
          {steps.map((s) => (
            <div
              key={s.num}
              onClick={() => setStep(s.num)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                opacity: step === s.num ? 1 : 0.6,
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.78rem',
                background: step === s.num ? '#3b82f6' : step > s.num ? '#10b981' : 'var(--bg-border)',
                color: '#fff',
              }}>
                {step > s.num ? '✓' : s.num}
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: step === s.num ? '#60a5fa' : '#94a3b8' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* ── STEP 1: BASIC INFORMATION ────────────────────────────────────── */}
        {step === 1 && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span className="section-title">Step 1 — Basic Tender Information</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>TENDER REFERENCE ID</label>
                <input className="input" value={basicInfo.referenceNo} onChange={e => setBasicInfo({ ...basicInfo, referenceNo: e.target.value })} style={{ width: '100%', fontFamily: 'monospace' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>PROCUREMENT CATEGORY</label>
                <select className="input" value={basicInfo.category} onChange={e => setBasicInfo({ ...basicInfo, category: e.target.value })} style={{ width: '100%' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>TENDER TITLE *</label>
              <input className="input" placeholder="e.g. Supply and Installation of Industrial Safety Equipment" value={basicInfo.title} onChange={e => setBasicInfo({ ...basicInfo, title: e.target.value })} required style={{ width: '100%' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>GOVERNMENT DEPARTMENT / MINISTRY</label>
                <input className="input" value={basicInfo.department} onChange={e => setBasicInfo({ ...basicInfo, department: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>ESTIMATED TENDER VALUE (INR)</label>
                <input className="input" type="number" placeholder="50000000" value={basicInfo.estimatedValue} onChange={e => setBasicInfo({ ...basicInfo, estimatedValue: e.target.value })} style={{ width: '100%' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>PUBLICATION DATE</label>
                <input className="input" type="date" value={basicInfo.publishedDate} onChange={e => setBasicInfo({ ...basicInfo, publishedDate: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>SUBMISSION DEADLINE</label>
                <input className="input" type="date" value={basicInfo.closingDate} onChange={e => setBasicInfo({ ...basicInfo, closingDate: e.target.value })} style={{ width: '100%' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>SCOPE OF WORK & DESCRIPTION</label>
              <textarea className="input" rows={3} placeholder="Describe the procurement scope, delivery locations, and technical guidelines..." value={basicInfo.description} onChange={e => setBasicInfo({ ...basicInfo, description: e.target.value })} style={{ width: '100%' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button className="btn-primary" onClick={() => setStep(2)}>
                Next: Eligibility Requirements →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: ELIGIBILITY REQUIREMENTS ─────────────────────────────── */}
        {step === 2 && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span className="section-title">Step 2 — Structured Eligibility Criteria</span>
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Define mathematical thresholds and operator logic for automated compliance verification.
            </p>

            {/* Financial Turnover */}
            <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--bg-border)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f0f4ff', marginBottom: 8 }}>
                1. Minimum Average Annual Turnover
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#64748b' }}>OPERATOR</label>
                  <select className="input" value={eligibility.turnoverOperator} onChange={e => setEligibility({ ...eligibility, turnoverOperator: e.target.value })} style={{ width: '100%' }}>
                    <option value="GREATER_THAN_OR_EQUAL">GREATER_THAN_OR_EQUAL (≥</option>
                    <option value="GREATER_THAN">GREATER_THAN (&gt;)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#64748b' }}>REQUIRED VALUE (INR)</label>
                  <input className="input" type="number" value={eligibility.minTurnover} onChange={e => setEligibility({ ...eligibility, minTurnover: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#64748b' }}>EVIDENCE TYPE</label>
                  <input className="input" value={eligibility.turnoverEvidence} onChange={e => setEligibility({ ...eligibility, turnoverEvidence: e.target.value })} style={{ width: '100%' }} />
                </div>
              </div>
            </div>

            {/* Prior Experience */}
            <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--bg-border)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f0f4ff', marginBottom: 8 }}>
                2. Prior Past Performance Experience
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#64748b' }}>MINIMUM YEARS REQUIRED</label>
                  <input className="input" type="number" value={eligibility.minExperience} onChange={e => setEligibility({ ...eligibility, minExperience: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#64748b' }}>EVIDENCE TYPE</label>
                  <input className="input" value={eligibility.experienceEvidence} onChange={e => setEligibility({ ...eligibility, experienceEvidence: e.target.value })} style={{ width: '100%' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
              <button className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
              <button className="btn-primary" onClick={() => setStep(3)}>Next: Mandatory Documents →</button>
            </div>
          </div>
        )}

        {/* ── STEP 3: MANDATORY DOCUMENTS CHECKLIST ────────────────────────── */}
        {step === 3 && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span className="section-title">Step 3 — Mandatory Submission Documents Checklist</span>
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Select mandatory documents that bidders must submit for automated OCR and RAG extraction.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { key: 'panCard', label: 'Permanent Account Number (PAN Card)', desc: 'Required for Income Tax Department verification' },
                { key: 'gstCertificate', label: 'GST Registration Certificate', desc: 'Required for state registration & active status' },
                { key: 'udyamCertificate', label: 'Udyam / MSME Certificate', desc: 'Required for MSME purchase preference' },
                { key: 'financialStatements', label: 'Audited Financial Statements (3 Years)', desc: 'CA-certified balance sheets & P&L statements' },
                { key: 'technicalCompliance', label: 'Technical Compliance Specification Sheet', desc: 'Detailed parameter-by-parameter compliance' },
                { key: 'oemAuthorization', label: 'Manufacturer OEM Authorization Certificate', desc: 'Valid authorization specifying tender scope' },
                { key: 'blacklistingDeclaration', label: 'Non-Blacklisting & Non-Debarment Affidavit', desc: 'Self-declaration under oath on non-judicial stamp' },
                { key: 'experienceProof', label: 'Past Experience Work Order Completion Copies', desc: 'Satisfactory completion certificates from PSUs/Govt' },
              ].map(doc => (
                <div
                  key={doc.key}
                  onClick={() => setMandatoryDocs({ ...mandatoryDocs, [doc.key]: !mandatoryDocs[doc.key] })}
                  style={{
                    padding: 12, borderRadius: 8, cursor: 'pointer',
                    background: mandatoryDocs[doc.key] ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${mandatoryDocs[doc.key] ? '#3b82f6' : 'var(--bg-border)'}`,
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={mandatoryDocs[doc.key]}
                    onChange={() => {}}
                    style={{ marginTop: 3, cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: mandatoryDocs[doc.key] ? '#f0f4ff' : '#94a3b8' }}>
                      {doc.label}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>{doc.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
              <button className="btn-secondary" onClick={() => setStep(2)}>← Back</button>
              <button className="btn-primary" onClick={() => setStep(4)}>Next: Additional Preferences →</button>
            </div>
          </div>
        )}

        {/* ── STEP 4: ADDITIONAL PREFERENCES ──────────────────────────────── */}
        {step === 4 && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span className="section-title">Step 4 — Statutory & Public Procurement Policy Preferences</span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--bg-border)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#f0f4ff' }}>MSME Purchase Preference (PPP 2012)</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Exemption from prior turnover and experience for MSEs</div>
                </div>
                <input type="checkbox" checked={additionalReqs.msmePreference} onChange={e => setAdditionalReqs({ ...additionalReqs, msmePreference: e.target.checked })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--bg-border)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#f0f4ff' }}>DPIIT Startup Exemption</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Exemption from prior experience/turnover for recognized DPIIT startups</div>
                </div>
                <input type="checkbox" checked={additionalReqs.startupExemption} onChange={e => setAdditionalReqs({ ...additionalReqs, startupExemption: e.target.checked })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--bg-border)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#f0f4ff' }}>Make in India (Class-I / Class-II Local Content)</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Minimum local content requirement percentage</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input className="input" type="number" value={additionalReqs.makeInIndiaPercentage} onChange={e => setAdditionalReqs({ ...additionalReqs, makeInIndiaPercentage: e.target.value })} style={{ width: 70, textAlign: 'center' }} />
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>%</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
              <button className="btn-secondary" onClick={() => setStep(3)}>← Back</button>
              <button className="btn-primary" onClick={() => setStep(5)}>Next: Review & Publish →</button>
            </div>
          </div>
        )}

        {/* ── STEP 5: REVIEW & PUBLISH ────────────────────────────────────── */}
        {step === 5 && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span className="section-title">Step 5 — Review Tender Specification & Publish</span>

            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 16, border: '1px solid var(--bg-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>{basicInfo.referenceNo}</span>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#f0f4ff' }}>{basicInfo.title}</div>
                </div>
                <span className="badge badge-active">Ready to Publish</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, borderTop: '1px solid var(--bg-border)', paddingTop: 12, fontSize: '0.78rem' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Department:</span>
                  <div style={{ color: '#f0f4ff', fontWeight: 600 }}>{basicInfo.department}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Estimated Value:</span>
                  <div style={{ color: '#10b981', fontWeight: 700 }}>₹{(parseFloat(basicInfo.estimatedValue) / 10000000).toFixed(2)} Crore</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Closing Deadline:</span>
                  <div style={{ color: '#fbbf24', fontWeight: 600 }}>{basicInfo.closingDate}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <button className="btn-secondary" onClick={() => setStep(4)}>← Back to Preferences</button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-secondary" onClick={() => handleCreateAndPublish(true)} disabled={loading}>
                  Save Draft
                </button>
                <button className="btn-primary" onClick={() => handleCreateAndPublish(false)} disabled={loading} style={{ background: '#10b981' }}>
                  {loading ? 'Publishing...' : '🚀 Publish Tender to GeM'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
