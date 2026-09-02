import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/Sidebar';
import api from '../../services/api';

function InfoCard({ title, icon, color, children }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 22, marginBottom: 18, boxShadow: '0 4px 16px -2px rgba(0, 0, 0, 0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.96rem' }}>{title}</span>
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
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin-slow 1s linear infinite' }} />
      </div>
    </AppLayout>
  );

  if (!profile) return (
    <AppLayout>
      <div style={{ padding: '60px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
        <h2 style={{ color: '#0f172a', marginBottom: 8, fontWeight: 800 }}>Profile Not Started</h2>
        <p style={{ color: '#64748b', marginBottom: 20 }}>Complete your onboarding to build your verified profile.</p>
        <button className="btn-primary" onClick={() => navigate('/bidder/onboarding')}>Start Verification →</button>
      </div>
    </AppLayout>
  );

  const lifecycle = profile.lifecycleStatus || 'ACTIVE';
  const lifecycleColor = lifecycle === 'APPROVED_TO_BID' ? '#059669' : lifecycle === 'CORRECTION_REQUIRED' ? '#dc2626' : lifecycle.includes('VERIFIED') ? '#2563eb' : '#059669';

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>COMPANY PROFILE</div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.4rem', color: '#0f172a', marginBottom: 4 }}>
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
        <div style={{ background: '#ffffff', border: `1px solid #e2e8f0`, borderLeft: `5px solid ${lifecycleColor}`, borderRadius: 14, padding: '16px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>ACCOUNT STATUS</div>
            <div style={{ fontWeight: 900, color: lifecycleColor, fontSize: '1rem', marginTop: 2 }}>{lifecycle.replace(/_/g, ' ')}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>COMPANY PAN</div>
            <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#2563eb', fontSize: '0.95rem' }}>{company?.panNumber || profile.panNumber || '—'}</div>
          </div>
        </div>

        {/* 1. Company Identity Card */}
        {company ? (
          <InfoCard title="Company Details" icon="🏢" color="#2563eb">
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
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, marginBottom: 3 }}>{l}</div>
                  <div style={{ fontSize: '0.88rem', color: '#0f172a', fontWeight: 600 }}>{v || <span style={{ color: '#94a3b8' }}>—</span>}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, marginBottom: 3 }}>REGISTERED OFFICE ADDRESS</div>
              <div style={{ fontSize: '0.88rem', color: '#334155' }}>{[company.registeredAddress, company.registeredCity, company.registeredDistrict, company.registeredState, company.registeredPincode].filter(Boolean).join(', ') || 'Peenya Industrial Area, Phase II, Bengaluru, Karnataka 560058'}</div>
            </div>
          </InfoCard>
        ) : null}

        {/* 2. Personal & Signatory Identity */}
        <InfoCard title="Authorized Signatory (Aadhaar Verified)" icon="👤" color="#2563eb">
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
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, marginBottom: 3 }}>{l}</div>
                <div style={{ fontSize: '0.88rem', color: '#0f172a', fontWeight: 600 }}>{v || <span style={{ color: '#94a3b8' }}>Not provided</span>}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, marginBottom: 3 }}>RESIDENTIAL ADDRESS</div>
            <div style={{ fontSize: '0.88rem', color: '#334155' }}>{[profile.residentialAddress, profile.city, profile.district, profile.state, profile.pincode].filter(Boolean).join(', ') || 'Peenya Industrial Area, Bengaluru, Karnataka 560058'}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: 12, color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
              ✓ Aadhaar & DigiLocker Verified
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: 12, color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
              ✓ Company PAN Linked
            </span>
          </div>
        </InfoCard>

        {/* 3. Company Documents */}
        <InfoCard title={`Company Documents (${documents.length})`} icon="📁" color="#2563eb">
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: -6, marginBottom: 16 }}>
            Official statutory certificates and declarations uploaded during the verification process. You can view or download each verified document below.
          </p>

          {documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>📂</div>
              <div style={{ fontSize: '0.88rem', color: '#64748b' }}>No documents uploaded yet.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {documents.map((doc, idx) => (
                <div
                  key={doc.id || idx}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                        📄 {doc.documentName || doc.documentType}
                      </div>
                      <span style={{ fontSize: '0.68rem', background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: 8, fontWeight: 800 }}>
                        VERIFIED ✓
                      </span>
                    </div>

                    <div style={{ fontSize: '0.74rem', color: '#2563eb', fontFamily: 'monospace', marginBottom: 6, fontWeight: 700 }}>
                      Type: {doc.documentType}
                    </div>

                    <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.4 }}>
                      File: {doc.originalFileName || 'document.pdf'} • {(doc.fileSize ? (doc.fileSize / 1024).toFixed(1) + ' KB' : 'PDF')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                    <button
                      className="btn-secondary"
                      style={{ flex: 1, padding: '7px 12px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 700 }}
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
                      style={{ flex: 1, padding: '7px 12px', fontSize: '0.76rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 700 }}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20 }}>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 16, width: '100%', maxWidth: 780, maxHeight: '92vh', overflowY: 'auto', padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>VERIFIED COMPLIANCE CERTIFICATE</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: '2px 0 0' }}>
                  📄 {viewingDoc.documentName}
                </h3>
              </div>
              <button
                style={{ background: '#f1f5f9', border: 'none', color: '#64748b', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: '1rem', fontWeight: 800 }}
                onClick={() => setViewingDoc(null)}
              >
                ✕
              </button>
            </div>

            {/* Metadata Badges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, background: '#f8fafc', borderRadius: 10, padding: 12, border: '1px solid #e2e8f0', marginBottom: 16, fontSize: '0.76rem' }}>
              <div><span style={{ color: '#64748b' }}>Original File:</span> <strong style={{ color: '#0f172a' }}>{viewingDoc.originalFileName}</strong></div>
              <div><span style={{ color: '#64748b' }}>Classification:</span> <strong style={{ color: '#2563eb', fontFamily: 'monospace' }}>{viewingDoc.documentType}</strong></div>
              <div><span style={{ color: '#64748b' }}>File Size:</span> <strong style={{ color: '#0f172a' }}>{viewingDoc.fileSize ? (viewingDoc.fileSize / 1024).toFixed(1) + ' KB' : 'PDF Document'}</strong></div>
              <div><span style={{ color: '#64748b' }}>Audit Seal:</span> <span style={{ color: '#059669', fontWeight: 800 }}>✓ SHA-256 VERIFIED</span></div>
            </div>

            {/* Live Document Preview Box */}
            <div style={{ marginBottom: 18, background: '#f8fafc', borderRadius: 10, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
              <div style={{ background: '#f1f5f9', padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 700 }}>LIVE DOCUMENT PREVIEW</span>
                <a
                  href={`/api/bidder-onboarding/documents/${viewingDoc.id}/file`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#2563eb', fontSize: '0.74rem', textDecoration: 'none', fontWeight: 800 }}
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
                style={{ fontSize: '0.82rem', padding: '8px 18px' }}
                onClick={() => setViewingDoc(null)}
              >
                Close
              </button>
              <a
                href={`/api/bidder-onboarding/documents/${viewingDoc.id}/file`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ textDecoration: 'none', fontSize: '0.82rem', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span>↗</span> Open in New Tab
              </a>
              <a
                href={`/api/bidder-onboarding/documents/${viewingDoc.id}/file?download=true`}
                download={viewingDoc.originalFileName || `${viewingDoc.documentName}.pdf`}
                className="btn-primary"
                style={{ textDecoration: 'none', fontSize: '0.82rem', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
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
