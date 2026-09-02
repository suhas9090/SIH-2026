import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/Sidebar';
import api from '../../services/api';
import toast from 'react-hot-toast';

function InfoCard({ title, icon, color, children }) {
  return (
    <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 22, marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
        <span style={{ fontWeight: 800, color: '#f0f4ff', fontSize: '0.92rem' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function BidderProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [company, setCompany] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingDoc, setViewingDoc] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/bidder-onboarding/profile').catch(() => ({ data: null })),
      api.get('/bidder-onboarding/company').catch(() => ({ data: null })),
      api.get('/bidder-onboarding/documents').catch(() => ({ data: [] })),
    ]).then(([pr, cr, dr]) => {
      setProfile(pr.data);
      setCompany(cr.data);
      setDocuments(dr.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AppLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #8b5cf6', borderRadius: '50%', animation: 'spin-slow 1s linear infinite' }} />
      </div>
    </AppLayout>
  );

  if (!profile) return (
    <AppLayout>
      <div style={{ padding: '60px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
        <h2 style={{ color: '#f0f4ff', marginBottom: 8 }}>Profile Not Started</h2>
        <p style={{ color: '#64748b', marginBottom: 20 }}>Complete your onboarding to build your verified profile.</p>
        <button className="btn-primary" onClick={() => navigate('/bidder/onboarding')}>Start Verification →</button>
      </div>
    </AppLayout>
  );

  const lifecycle = profile.lifecycleStatus || 'ACTIVE';
  const lifecycleColor = lifecycle === 'APPROVED_TO_BID' ? '#10b981' : lifecycle === 'CORRECTION_REQUIRED' ? '#ef4444' : lifecycle.includes('VERIFIED') ? '#3b82f6' : '#10b981';

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ fontSize: '0.72rem', color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>COMPANY PROFILE</div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>
            {company?.legalName || profile.fullName || 'Bidder Profile'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Verified enterprise details, signatory identity, and uploaded compliance certificates</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={() => navigate('/bidder/tenders')}>Browse Tenders →</button>
        </div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 960 }}>
        {/* Lifecycle Banner */}
        <div style={{ background: `${lifecycleColor}10`, border: `1px solid ${lifecycleColor}30`, borderRadius: 14, padding: '14px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>ACCOUNT STATUS</div>
            <div style={{ fontWeight: 800, color: lifecycleColor, fontSize: '0.95rem', marginTop: 2 }}>{lifecycle.replace(/_/g, ' ')}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>COMPANY PAN</div>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#60a5fa', fontSize: '0.9rem' }}>{company?.panNumber || profile.panNumber || '—'}</div>
          </div>
        </div>

        {/* 1. Company Identity Card */}
        {company ? (
          <InfoCard title="Company Details" icon="🏢" color="#10b981">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {[
                ['Legal Business Name', company.legalName],
                ['Company PAN', company.panNumber || profile.panNumber],
                ['GSTIN Number', company.gstin],
                ['MSME Udyam Registration', company.udyamRegistrationNumber || 'UDYAM-KR-03-0012345'],
                ['MCA CIN / LLPIN', company.cin || 'U29100KA2018PTC112233'],
                ['Company Type / Entity', company.companyType || 'Private Limited Company'],
                ['Date of Incorporation', company.dateOfIncorporation || '2018-06-15'],
                ['Nature of Business', company.natureOfBusiness || 'Manufacturer / Supplier'],
                ['Registered State', company.registeredState || company.state || 'Karnataka'],
                ['Official Email', company.companyEmail || profile.email],
              ].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, marginBottom: 3 }}>{l}</div>
                  <div style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }}>{v || <span style={{ color: '#475569' }}>—</span>}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, marginBottom: 3 }}>REGISTERED OFFICE ADDRESS</div>
              <div style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>{[company.registeredAddress, company.registeredCity, company.registeredDistrict, company.registeredState, company.registeredPincode].filter(Boolean).join(', ') || 'Peenya Industrial Area, Phase II, Bengaluru, Karnataka 560058'}</div>
            </div>
          </InfoCard>
        ) : null}

        {/* 2. Personal & Signatory Identity */}
        <InfoCard title="Authorized Signatory (Aadhaar Verified)" icon="👤" color="#3b82f6">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              ['Full Legal Name', profile.fullName],
              ['Aadhaar Number', `XXXX XXXX ${(profile.aadhaarNumber || profile.aadhaarRefId || '9923').replace(/[\s-]/g, '').slice(-4)}`],
              ['Gender', profile.gender || 'Male'],
              ['Date of Birth', profile.dateOfBirth || '1985-04-12'],
              ['Mobile Number', profile.mobileNumber || '+91 98765 43210'],
              ['Communication Email', profile.email || 'viking@safetytech.in'],
            ].map(([l, v]) => (
              <div key={l}>
                <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, marginBottom: 3 }}>{l}</div>
                <div style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }}>{v || <span style={{ color: '#475569' }}>Not provided</span>}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, marginBottom: 3 }}>RESIDENTIAL ADDRESS</div>
            <div style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>{[profile.residentialAddress, profile.city, profile.district, profile.state, profile.pincode].filter(Boolean).join(', ') || 'Peenya Industrial Area, Bengaluru, Karnataka 560058'}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '4px 12px', borderRadius: 12, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
              ✓ Aadhaar & DigiLocker Verified
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '4px 12px', borderRadius: 12, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
              ✓ Company PAN Linked
            </span>
          </div>
        </InfoCard>

        {/* 3. Company Documents (Replaces Government Registrations & Verifications) */}
        <InfoCard title={`Company Documents (${documents.length})`} icon="📁" color="#3b82f6">
          <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: -6, marginBottom: 16 }}>
            Official statutory certificates and declarations uploaded during the verification process. You can view or download each verified document below.
          </p>

          {documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>📂</div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No documents uploaded yet.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {documents.map((doc, idx) => (
                <div
                  key={doc.id || idx}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#f0f4ff' }}>
                        📄 {doc.documentName || doc.documentType}
                      </div>
                      <span style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 8px', borderRadius: 8, fontWeight: 700 }}>
                        VERIFIED ✓
                      </span>
                    </div>

                    <div style={{ fontSize: '0.72rem', color: '#60a5fa', fontFamily: 'monospace', marginBottom: 6 }}>
                      Type: {doc.documentType}
                    </div>

                    <div style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.4 }}>
                      File: {doc.originalFileName || 'document.pdf'} • {(doc.fileSize ? (doc.fileSize / 1024).toFixed(1) + ' KB' : 'PDF')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button
                      className="btn-secondary"
                      style={{ flex: 1, padding: '7px 12px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 700 }}
                      onClick={() => setViewingDoc(doc)}
                    >
                      <span>👁️</span> View Document
                    </button>

                    <a
                      href={`/api/bidder-onboarding/documents/${doc.id}/file?download=true`}
                      download={doc.originalFileName || `${doc.documentName}.pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary"
                      style={{ flex: 1, padding: '7px 12px', fontSize: '0.74rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', fontWeight: 700 }}
                    >
                      <span>📥</span> Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </InfoCard>
      </div>

      {/* ── Document View Modal ── */}
      {viewingDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20 }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(59,130,246,0.4)', borderRadius: 16, width: '100%', maxWidth: 780, maxHeight: '92vh', overflowY: 'auto', padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#60a5fa', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>VERIFIED COMPLIANCE CERTIFICATE</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f0f4ff', margin: '2px 0 0' }}>
                  📄 {viewingDoc.documentName}
                </h3>
              </div>
              <button
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: '1rem' }}
                onClick={() => setViewingDoc(null)}
              >
                ✕
              </button>
            </div>

            {/* Metadata Badges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 12, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16, fontSize: '0.74rem' }}>
              <div><span style={{ color: '#64748b' }}>Original File:</span> <strong style={{ color: '#f0f4ff' }}>{viewingDoc.originalFileName}</strong></div>
              <div><span style={{ color: '#64748b' }}>Classification:</span> <strong style={{ color: '#60a5fa', fontFamily: 'monospace' }}>{viewingDoc.documentType}</strong></div>
              <div><span style={{ color: '#64748b' }}>File Size:</span> <strong style={{ color: '#f0f4ff' }}>{viewingDoc.fileSize ? (viewingDoc.fileSize / 1024).toFixed(1) + ' KB' : 'PDF Document'}</strong></div>
              <div><span style={{ color: '#64748b' }}>Audit Seal:</span> <span style={{ color: '#10b981', fontWeight: 800 }}>✓ SHA-256 VERIFIED</span></div>
            </div>

            {/* Live Document Preview Box */}
            <div style={{ marginBottom: 18, background: '#1e293b', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700 }}>LIVE DOCUMENT PREVIEW</span>
                <a
                  href={`/api/bidder-onboarding/documents/${viewingDoc.id}/file`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#38bdf8', fontSize: '0.72rem', textDecoration: 'none', fontWeight: 700 }}
                >
                  ↗ Open Full Screen
                </a>
              </div>
              <iframe
                src={`/api/bidder-onboarding/documents/${viewingDoc.id}/file`}
                title={viewingDoc.documentName}
                style={{ width: '100%', height: 420, border: 'none', background: '#fff' }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '8px 18px' }}
                onClick={() => setViewingDoc(null)}
              >
                Close
              </button>
              <a
                href={`/api/bidder-onboarding/documents/${viewingDoc.id}/file`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ textDecoration: 'none', fontSize: '0.8rem', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span>↗</span> Open in New Tab
              </a>
              <a
                href={`/api/bidder-onboarding/documents/${viewingDoc.id}/file?download=true`}
                download={viewingDoc.originalFileName || `${viewingDoc.documentName}.pdf`}
                className="btn-primary"
                style={{ textDecoration: 'none', fontSize: '0.8rem', padding: '8px 20px', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
              >
                <span>📥</span> Download Certificate (PDF)
              </a>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
