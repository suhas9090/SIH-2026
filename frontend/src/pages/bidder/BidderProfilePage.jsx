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

function RegBadge({ label, value, verified, source }) {
  return (
    <div style={{ padding: '12px 14px', background: verified ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${verified ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10 }}>
      <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 700, marginBottom: 2, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700, color: verified ? '#10b981' : '#94a3b8', letterSpacing: '0.04em' }}>{value || '— Not provided'}</div>
      <div style={{ fontSize: '0.62rem', color: verified ? '#10b981' : '#475569', marginTop: 3 }}>{verified ? `✓ Verified · ${source}` : source}</div>
    </div>
  );
}

export default function BidderProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/bidder-onboarding/profile').catch(() => ({ data: null })),
      api.get('/bidder-onboarding/company').catch(() => ({ data: null })),
    ]).then(([pr, cr]) => {
      setProfile(pr.data);
      setCompany(cr.data);
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

  const lifecycle = profile.lifecycleStatus;
  const lifecycleColor = lifecycle === 'APPROVED_TO_BID' ? '#10b981' : lifecycle === 'CORRECTION_REQUIRED' ? '#ef4444' : lifecycle.includes('VERIFIED') ? '#3b82f6' : '#f59e0b';

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ fontSize: '0.72rem', color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>MY PROFILE</div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>Bidder Profile & Statutory Registrations</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Government-verified identity and company profile for tender participation</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={() => navigate('/bidder/verification-status')}>Verification Status</button>
          <button className="btn-primary" onClick={() => navigate('/bidder/onboarding')}>Update Profile</button>
        </div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 900 }}>
        {/* Lifecycle Banner */}
        <div style={{ background: `${lifecycleColor}10`, border: `1px solid ${lifecycleColor}30`, borderRadius: 14, padding: '14px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>ACCOUNT STATUS</div>
            <div style={{ fontWeight: 800, color: lifecycleColor, fontSize: '0.95rem', marginTop: 2 }}>{lifecycle.replace(/_/g, ' ')}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>PAN (Masked)</div>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#94a3b8', fontSize: '0.85rem' }}>{profile.panNumber || '—'}</div>
          </div>
        </div>

        <InfoCard title="Personal Identity" icon="👤" color="#3b82f6">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              ['Full Legal Name', profile.fullName], ["Father's Name", profile.fatherName],
              ['Date of Birth', profile.dateOfBirth], ['Gender', profile.gender],
              ['Mobile Number', profile.mobileNumber], ['Alternate Phone', profile.alternatePhone],
            ].map(([l, v]) => (
              <div key={l}>
                <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, marginBottom: 3 }}>{l}</div>
                <div style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }}>{v || <span style={{ color: '#475569' }}>Not provided</span>}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, marginBottom: 3 }}>RESIDENTIAL ADDRESS</div>
            <div style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>{[profile.residentialAddress, profile.city, profile.district, profile.state, profile.pincode].filter(Boolean).join(', ') || 'Not provided'}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            {[
              { label: 'PAN Verified', ok: profile.panVerified },
              { label: 'Aadhaar / OTP Verified', ok: profile.aadhaarVerified },
              { label: 'Mobile Verified', ok: profile.mobileVerified },
            ].map(({ label, ok }) => (
              <span key={label} style={{ fontSize: '0.72rem', fontWeight: 800, padding: '4px 12px', borderRadius: 12, color: ok ? '#10b981' : '#ef4444', background: ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.2)'}` }}>
                {ok ? '✓' : '✗'} {label}
              </span>
            ))}
          </div>
        </InfoCard>

        {company ? (
          <>
            <InfoCard title="Company Identity" icon="🏢" color="#10b981">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                {[
                  ['Legal Name', company.legalName], ['Trade Name', company.tradeName],
                  ['Company Type', company.companyType], ['Date of Incorporation', company.dateOfIncorporation],
                  ['Nature of Business', company.natureOfBusiness], ['Business Category', company.businessCategory],
                  ['Company Email', company.companyEmail], ['Company Phone', company.companyPhone],
                  ['Website', company.website], ['Authorized Representative', company.authorizedRepName],
                ].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, marginBottom: 3 }}>{l}</div>
                    <div style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }}>{v || <span style={{ color: '#475569' }}>—</span>}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, marginBottom: 3 }}>REGISTERED OFFICE ADDRESS</div>
                <div style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>{[company.registeredAddress, company.registeredCity, company.registeredDistrict, company.registeredState, company.registeredPincode].filter(Boolean).join(', ') || '—'}</div>
              </div>
            </InfoCard>

            <InfoCard title="Government Registrations & Verifications" icon="🔗" color="#8b5cf6">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <RegBadge label="Company PAN" value={company.companyPan} verified={company.companyPanVerified} source="CBDT / Income Tax Dept." />
                <RegBadge label="GSTIN" value={company.gstin} verified={company.gstVerified} source="GSTN Database" />
                <RegBadge label="Udyam / MSME" value={company.udyamNumber} verified={company.udyamVerified} source="Ministry of MSME" />
                <RegBadge label="CIN / LLPIN (MCA)" value={company.cinNumber} verified={company.mcaVerified} source="MCA21 Registry" />
                <RegBadge label="Startup India (DPIIT)" value={company.startupRegNumber} verified={company.startupVerified} source="DPIIT Startup Portal" />
                <RegBadge label="NSIC Registration" value={company.nsicNumber} verified={company.nsicVerified} source="National Small Industries Corp" />
              </div>
              <div style={{ marginTop: 14, padding: '12px 16px', background: company.blacklistClear === true ? 'rgba(16,185,129,0.06)' : company.blacklistClear === false ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${company.blacklistClear === true ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>CENTRAL DEBARMENT / BLACKLIST CHECK</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>CVC · GeM Portal · CPPP Debarment Registry</div>
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: company.blacklistClear === true ? '#10b981' : company.blacklistClear === false ? '#ef4444' : '#64748b', padding: '4px 12px', borderRadius: 10, background: `${company.blacklistClear === true ? '#10b981' : company.blacklistClear === false ? '#ef4444' : '#64748b'}15` }}>
                  {company.blacklistClear === true ? '✓ CLEAR' : company.blacklistClear === false ? '⚠ FLAGGED' : '— NOT CHECKED'}
                </span>
              </div>
            </InfoCard>
          </>
        ) : (
          <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>🏢</div>
            <p style={{ color: '#64748b', marginBottom: 14 }}>Company profile not yet completed.</p>
            <button className="btn-primary" onClick={() => navigate('/bidder/onboarding')}>Complete Company Verification →</button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
