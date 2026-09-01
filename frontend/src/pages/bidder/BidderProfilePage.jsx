import React from 'react';
import { AppLayout } from '../../components/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function BidderProfilePage() {
  const { profile } = useAuth();

  const company = {
    legalName: profile?.organization || 'ABC Industries Pvt Ltd',
    gstin: '29AABCA1234C1Z5',
    pan: 'AABCA1234C',
    udyamNo: 'UDYAM-KA-01-0000001',
    cinNo: 'U72200KA2015PTC081234',
    registeredAddress: 'Plot 42, Peenya 2nd Stage, Industrial Area, Bengaluru, Karnataka 560058',
    contactPerson: profile?.name || 'Vikram Mehta',
    contactEmail: profile?.email || 'vikram@abc-industries.com',
    contactPhone: '+91 9876543210',
    entityType: 'Private Limited Company',
    incorporationDate: '14 May 2015',
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            SUPPLIER REPOSITORY
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>
            Company Profile & Statutory Registrations
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Single source of reusable company profile information and government registry verifications
          </p>
        </div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Verification Status Overview */}
        <div className="card" style={{ padding: 22, borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>CORPORATE IDENTITY</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f0f4ff', marginTop: 2 }}>
                {company.legalName}
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                {company.entityType} · Incorporated {company.incorporationDate}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 12px', borderRadius: 20 }}>
                ● 100% STATUTORY VERIFIED
              </span>
            </div>
          </div>

          {/* 4 Government Registration Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, borderTop: '1px solid var(--bg-border)', paddingTop: 14 }}>
            <div style={{ padding: 10, background: 'rgba(16,185,129,0.04)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>GST REGISTRATION</div>
              <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#10b981', marginTop: 2 }}>✓ Verified Active</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: 2 }}>{company.gstin}</div>
            </div>
            <div style={{ padding: 10, background: 'rgba(16,185,129,0.04)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>INCOME TAX PAN</div>
              <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#10b981', marginTop: 2 }}>✓ Verified Active</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: 2 }}>{company.pan}</div>
            </div>
            <div style={{ padding: 10, background: 'rgba(16,185,129,0.04)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>UDYAM / MSME</div>
              <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#10b981', marginTop: 2 }}>✓ Small Enterprise</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: 2 }}>{company.udyamNo}</div>
            </div>
            <div style={{ padding: 10, background: 'rgba(16,185,129,0.04)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>MCA21 DATABASE</div>
              <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#10b981', marginTop: 2 }}>✓ Active Company</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: 2 }}>{company.cinNo}</div>
            </div>
          </div>
        </div>

        {/* Detailed Information Form */}
        <div className="card" style={{ padding: 22 }}>
          <span className="section-title" style={{ display: 'block', marginBottom: 14 }}>
            Registered Office & Communication Details
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>REGISTERED CORPORATE ADDRESS</label>
              <input className="input" value={company.registeredAddress} readOnly style={{ width: '100%', marginTop: 2 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>PRIMARY CONTACT PERSON</label>
                <input className="input" value={company.contactPerson} readOnly style={{ width: '100%', marginTop: 2 }} />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>OFFICIAL EMAIL</label>
                <input className="input" value={company.contactEmail} readOnly style={{ width: '100%', marginTop: 2 }} />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>PHONE NUMBER</label>
                <input className="input" value={company.contactPhone} readOnly style={{ width: '100%', marginTop: 2 }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button className="btn-secondary" onClick={() => toast.success('Profile edit requested')}>
                Edit Company Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
