import React, { useState } from 'react';
import { AppLayout } from '../../components/Sidebar';
import toast from 'react-hot-toast';

export default function BidderDocumentsPage() {
  const [docs, setDocs] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDoc, setNewDoc] = useState({ name: '', type: 'GST Certificate', expiryDate: '' });

  const handleUpload = (e) => {
    e.preventDefault();
    if (!newDoc.name) return toast.error('Enter document name');
    setDocs(prev => [...prev, {
      id: `d-${Date.now()}`,
      name: `${newDoc.name}.pdf`,
      type: newDoc.type,
      size: '1.5 MB',
      expiryDate: newDoc.expiryDate || 'Permanent',
      status: 'VALID',
      ocrStatus: 'EXTRACTED',
    }]);
    toast.success('Document uploaded to organization repository!');
    setShowUploadModal(false);
  };

  const validCount = docs.filter(d => d.status === 'VALID').length;
  const expiringCount = docs.filter(d => d.status === 'EXPIRING_SOON').length;
  const expiredCount = docs.filter(d => d.status === 'EXPIRED').length;

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            DOCUMENT REPOSITORY & COMPLIANCE VAULT
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>
            Company Document Repository & Expiry Tracking
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Store reusable corporate documents, monitor validity expiration deadlines, and view OCR extractions
          </p>
        </div>
        <button
          className="btn-primary"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          onClick={() => setShowUploadModal(true)}
        >
          + Upload New Document
        </button>
      </div>

      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: 18, borderLeft: '3px solid #10b981' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>ACTIVE & VALID DOCUMENTS</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981', margin: '4px 0' }}>{validCount}</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>GST, PAN, Audited Financials</div>
          </div>
          <div className="card" style={{ padding: 18, borderLeft: '3px solid #f59e0b' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>EXPIRING SOON (≤ 15 DAYS)</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f59e0b', margin: '4px 0' }}>{expiringCount}</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Upcoming expiration deadlines</div>
          </div>
          <div className="card" style={{ padding: 18, borderLeft: '3px solid #ef4444' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>EXPIRED CERTIFICATIONS</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ef4444', margin: '4px 0' }}>{expiredCount}</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Requires re-upload / renewal</div>
          </div>
        </div>

        {docs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📁</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f0f4ff', marginBottom: 6 }}>Document Repository is Empty</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: 420, margin: '0 auto 20px' }}>
              Upload your company registrations, tax IDs, and financial certificates once to reuse them across all your tender bids.
            </p>
            <button className="btn-primary" style={{ background: '#7c3aed' }} onClick={() => setShowUploadModal(true)}>
              + Upload First Document
            </button>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg-border)' }}>
              <span className="section-title">Stored Organization Documents ({docs.length})</span>
            </div>
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Document Name</th>
                    <th>Document Type</th>
                    <th>File Size</th>
                    <th>Validity Expiry</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f0f4ff' }}>{doc.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#10b981' }}>OCR: {doc.ocrStatus}</div>
                      </td>
                      <td style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>{doc.type}</td>
                      <td style={{ color: '#64748b', fontSize: '0.78rem' }}>{doc.size}</td>
                      <td style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1' }}>{doc.expiryDate}</td>
                      <td>
                        <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.1)' }}>
                          {doc.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '4px 8px' }} onClick={() => toast.success(`Viewing ${doc.name}`)}>
                          View Document
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowUploadModal(false)}>
          <div className="card" style={{ maxWidth: 480, width: '100%', background: '#091322', border: '1px solid #7c3aed', padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f0f4ff' }}>Upload Corporate Document</h2>
              <button className="btn-ghost" onClick={() => setShowUploadModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>DOCUMENT LABEL *</label>
                <input className="input" placeholder="e.g. GST_Registration_Certificate" value={newDoc.name} onChange={e => setNewDoc({ ...newDoc, name: e.target.value })} required style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>DOCUMENT CATEGORY</label>
                <select className="input" value={newDoc.type} onChange={e => setNewDoc({ ...newDoc, type: e.target.value })} style={{ width: '100%' }}>
                  <option value="GST Certificate">GST Certificate</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Financial Statements">Financial Statements</option>
                  <option value="OEM Authorization">OEM Authorization</option>
                  <option value="Quality Certification">Quality Certification</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>VALIDITY EXPIRATION DATE</label>
                <input className="input" type="date" value={newDoc.expiryDate} onChange={e => setNewDoc({ ...newDoc, expiryDate: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowUploadModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1.5, justifyContent: 'center', background: '#7c3aed' }}>Upload to Vault</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
