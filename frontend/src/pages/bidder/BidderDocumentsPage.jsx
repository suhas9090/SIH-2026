import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/Sidebar';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DOC_CATEGORIES = [
  { key: 'ALL', label: 'All Documents', color: '#94a3b8' },
  { key: 'PERSONAL', label: 'Personal', color: '#3b82f6' },
  { key: 'COMPANY', label: 'Company', color: '#10b981' },
  { key: 'FINANCIAL', label: 'Financial', color: '#f59e0b' },
  { key: 'COMPLIANCE', label: 'Compliance', color: '#8b5cf6' },
];

const DOC_TYPES_BY_CAT = {
  PERSONAL: [
    { value: 'PAN_CARD', label: 'PAN Card' },
    { value: 'IDENTITY_PROOF', label: 'Identity Proof' },
    { value: 'ADDRESS_PROOF', label: 'Address Proof' },
    { value: 'AUTH_REP_ID', label: 'Authorized Rep ID' },
  ],
  COMPANY: [
    { value: 'GST_CERTIFICATE', label: 'GST Registration Certificate' },
    { value: 'PAN_COMPANY', label: 'Company PAN Card' },
    { value: 'UDYAM_CERTIFICATE', label: 'Udyam / MSME Certificate' },
    { value: 'MCA_CERTIFICATE', label: 'Certificate of Incorporation' },
    { value: 'STARTUP_CERTIFICATE', label: 'DPIIT Startup Certificate' },
    { value: 'NSIC_CERTIFICATE', label: 'NSIC Registration Certificate' },
    { value: 'PARTNERSHIP_DEED', label: 'Partnership Deed / LLP Agreement' },
  ],
  FINANCIAL: [
    { value: 'FINANCIAL_STATEMENT', label: 'Audited Financial Statements' },
    { value: 'INCOME_TAX_RETURN', label: 'Income Tax Returns' },
    { value: 'BANK_STATEMENT', label: 'Bank Statement' },
    { value: 'EPFO_CERTIFICATE', label: 'EPFO Registration Certificate' },
    { value: 'ESIC_CERTIFICATE', label: 'ESIC Registration Certificate' },
  ],
  COMPLIANCE: [
    { value: 'OEM_AUTHORIZATION', label: 'OEM Authorization Letter' },
    { value: 'EXPERIENCE_CERTIFICATE', label: 'Experience Certificate' },
    { value: 'BIS_CERTIFICATE', label: 'BIS / ISI Certification' },
    { value: 'MAKE_IN_INDIA', label: 'Make in India Declaration' },
    { value: 'OTHER', label: 'Other Supporting Document' },
  ],
};

const STATUS_CONFIG = {
  PENDING: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: '⏳ Pending', icon: '⏳' },
  UNDER_REVIEW: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: '🔍 Under Review', icon: '🔍' },
  VERIFIED: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: '✓ Verified', icon: '✓' },
  REJECTED: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: '✗ Rejected', icon: '✗' },
  MISMATCH_DETECTED: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: '⚠ Mismatch', icon: '⚠' },
  EXPIRED: { color: '#64748b', bg: 'rgba(100,116,139,0.12)', label: '⏰ Expired', icon: '⏰' },
  REUPLOAD_REQUIRED: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: '↑ Re-upload Required', icon: '↑' },
};

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: status };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: '0.68rem', fontWeight: 800, color: s.color, background: s.bg, border: `1px solid ${s.color}30`, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

export default function BidderDocumentsPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [expandedDoc, setExpandedDoc] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    documentName: '', documentType: '', documentCategory: 'COMPANY', expiryDate: ''
  });
  const [uploadFile, setUploadFile] = useState(null);

  const fetchDocs = async () => {
    try {
      const res = await api.get('/bidder-onboarding/documents');
      setDocuments(res.data || []);
    } catch {
      setDocuments([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return toast.error('Please select a file.');
    if (!uploadForm.documentName || !uploadForm.documentType) return toast.error('Document name and type are required.');
    setUploading(true);
    const fd = new FormData();
    fd.append('file', uploadFile);
    fd.append('documentName', uploadForm.documentName);
    fd.append('documentType', uploadForm.documentType);
    fd.append('documentCategory', uploadForm.documentCategory);
    if (uploadForm.expiryDate) fd.append('expiryDate', uploadForm.expiryDate);
    try {
      await api.post('/bidder-onboarding/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Document uploaded successfully! Verification processing started.');
      setShowUploadModal(false);
      setUploadForm({ documentName: '', documentType: '', documentCategory: 'COMPANY', expiryDate: '' });
      setUploadFile(null);
      fetchDocs();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Upload failed. Max file size is 10 MB.');
    }
    setUploading(false);
  };

  const handleDelete = async (docId, docName) => {
    if (!window.confirm(`Delete "${docName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/bidder-onboarding/documents/${docId}`);
      toast.success('Document deleted.');
      fetchDocs();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Cannot delete this document (already under review or verified).');
    }
  };

  const filtered = activeTab === 'ALL' ? documents : documents.filter(d => d.documentCategory === activeTab);

  // Summary stats
  const stats = {
    total: documents.length,
    verified: documents.filter(d => d.verificationStatus === 'VERIFIED').length,
    pending: documents.filter(d => ['PENDING', 'UNDER_REVIEW'].includes(d.verificationStatus)).length,
    rejected: documents.filter(d => ['REJECTED', 'REUPLOAD_REQUIRED', 'MISMATCH_DETECTED'].includes(d.verificationStatus)).length,
    expiringSoon: documents.filter(d => {
      if (!d.expiryDate) return false;
      const daysLeft = (new Date(d.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
      return daysLeft > 0 && daysLeft <= 30;
    }).length
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ fontSize: '0.72rem', color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>DOCUMENT VAULT</div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>Company Document Repository</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Secure vault with verification lifecycle tracking and expiry monitoring</p>
        </div>
        <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }} onClick={() => setShowUploadModal(true)}>
          + Upload Document
        </button>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'TOTAL DOCUMENTS', val: stats.total, color: '#94a3b8' },
            { label: 'VERIFIED', val: stats.verified, color: '#10b981' },
            { label: 'UNDER REVIEW / PENDING', val: stats.pending, color: '#3b82f6' },
            { label: 'REJECTED / ACTION NEEDED', val: stats.rejected, color: '#ef4444' },
            { label: 'EXPIRING ≤ 30 DAYS', val: stats.expiringSoon, color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(15,23,42,0.8)', border: `1px solid ${s.color}20`, borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 700, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {DOC_CATEGORIES.map(cat => {
            const count = cat.key === 'ALL' ? documents.length : documents.filter(d => d.documentCategory === cat.key).length;
            return (
              <button key={cat.key} onClick={() => setActiveTab(cat.key)}
                style={{ padding: '7px 16px', borderRadius: 20, border: `1px solid ${activeTab === cat.key ? cat.color : 'rgba(255,255,255,0.1)'}`, background: activeTab === cat.key ? `${cat.color}18` : 'transparent', color: activeTab === cat.key ? cat.color : '#64748b', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                {cat.label}
                <span style={{ background: activeTab === cat.key ? `${cat.color}30` : 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 8, fontSize: '0.65rem' }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Documents list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #7c3aed', borderRadius: '50%', animation: 'spin-slow 1s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: '#64748b' }}>Loading document vault...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '52px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📂</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f0f4ff', marginBottom: 8 }}>No {activeTab === 'ALL' ? '' : DOC_CATEGORIES.find(c => c.key === activeTab)?.label} Documents</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: 400, margin: '0 auto 20px' }}>
              Upload your verification documents to the secure vault. Documents are reviewed by authorized officers.
            </p>
            <button className="btn-primary" style={{ background: '#7c3aed' }} onClick={() => setShowUploadModal(true)}>+ Upload First Document</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(doc => {
              const isExpanded = expandedDoc === doc.id;
              const expiry = doc.expiryDate ? new Date(doc.expiryDate) : null;
              const daysLeft = expiry ? Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)) : null;
              const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 30;
              const isExpired = daysLeft !== null && daysLeft <= 0;
              return (
                <div key={doc.id} style={{ background: 'rgba(15,23,42,0.8)', border: `1px solid ${doc.verificationStatus === 'VERIFIED' ? 'rgba(16,185,129,0.2)' : doc.verificationStatus === 'REJECTED' || doc.verificationStatus === 'REUPLOAD_REQUIRED' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, overflow: 'hidden' }}>
                  {/* Main row */}
                  <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', cursor: 'pointer' }} onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 200 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: DOC_CATEGORIES.find(c => c.key === doc.documentCategory)?.color + '18' || 'rgba(148,163,184,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                        {doc.mimeType?.includes('pdf') ? '📄' : doc.mimeType?.includes('image') ? '🖼️' : '📋'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#f0f4ff', fontSize: '0.9rem' }}>{doc.documentName}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 2 }}>
                          {doc.documentType?.replace(/_/g, ' ')} · {doc.documentCategory} · {doc.originalFileName}
                          {doc.fileSize ? ` · ${Math.round(doc.fileSize / 1024)} KB` : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      {isExpiringSoon && <span style={{ fontSize: '0.65rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 8, fontWeight: 700 }}>⚠ {daysLeft}d left</span>}
                      {isExpired && <span style={{ fontSize: '0.65rem', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: 8, fontWeight: 700 }}>EXPIRED</span>}
                      {expiry && !isExpired && !isExpiringSoon && <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Expires {expiry.toLocaleDateString('en-IN')}</span>}
                      <StatusBadge status={doc.verificationStatus} />
                      <span style={{ color: '#475569', fontSize: '0.8rem' }}>{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Rejection banner */}
                  {doc.rejectionReason && (
                    <div style={{ padding: '8px 18px', background: 'rgba(239,68,68,0.06)', borderTop: '1px solid rgba(239,68,68,0.15)' }}>
                      <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}>⚠ Officer Remarks: </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{doc.rejectionReason}</span>
                    </div>
                  )}

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{ padding: '16px 18px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700 }}>UPLOADED AT</div>
                          <div style={{ fontSize: '0.8rem', color: '#e2e8f0', marginTop: 2 }}>{new Date(doc.uploadedAt).toLocaleString('en-IN')}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700 }}>OCR STATUS</div>
                          <div style={{ fontSize: '0.8rem', color: doc.ocrStatus === 'DONE' ? '#10b981' : '#f59e0b', marginTop: 2, fontWeight: 700 }}>{doc.ocrStatus}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700 }}>GOVERNMENT MATCH</div>
                          <div style={{ fontSize: '0.8rem', color: doc.governmentMatch === 'MATCHED' ? '#10b981' : doc.governmentMatch === 'MISMATCH' ? '#ef4444' : '#64748b', marginTop: 2, fontWeight: 700 }}>{doc.governmentMatch || '— Pending'}</div>
                        </div>
                      </div>
                      {doc.extractedData && Object.keys(doc.extractedData).length > 0 && (
                        <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                          <div style={{ fontSize: '0.68rem', color: '#3b82f6', fontWeight: 800, marginBottom: 8 }}>📊 OCR EXTRACTED DATA</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                            {Object.entries(doc.extractedData).slice(0, 6).map(([k, v]) => (
                              <div key={k}><span style={{ fontSize: '0.65rem', color: '#64748b' }}>{k}: </span><span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>{String(v)}</span></div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        {['PENDING', 'REJECTED', 'REUPLOAD_REQUIRED'].includes(doc.verificationStatus) && (
                          <button className="btn-secondary" style={{ fontSize: '0.75rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }} onClick={() => handleDelete(doc.id, doc.documentName)}>🗑 Delete</button>
                        )}
                        {['REJECTED', 'REUPLOAD_REQUIRED', 'MISMATCH_DETECTED'].includes(doc.verificationStatus) && (
                          <button className="btn-primary" style={{ fontSize: '0.75rem', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }} onClick={() => { setUploadForm(f => ({ ...f, documentCategory: doc.documentCategory, documentType: doc.documentType })); setShowUploadModal(true); }}>↑ Re-upload</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowUploadModal(false)}>
          <div style={{ background: '#091322', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, padding: 32, maxWidth: 540, width: '100%', maxHeight: '92vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h3 style={{ fontWeight: 900, color: '#f0f4ff', fontSize: '1.1rem', margin: 0 }}>Upload to Document Vault</h3>
                <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 4 }}>Accepted: PDF, JPG, PNG, DOC — Max 10 MB</p>
              </div>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.3rem' }}>✕</button>
            </div>
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 6 }}>DOCUMENT CATEGORY *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {DOC_CATEGORIES.filter(c => c.key !== 'ALL').map(cat => (
                    <button type="button" key={cat.key} onClick={() => setUploadForm(f => ({ ...f, documentCategory: cat.key, documentType: '' }))}
                      style={{ padding: '8px 12px', borderRadius: 10, border: `1px solid ${uploadForm.documentCategory === cat.key ? cat.color : 'rgba(255,255,255,0.08)'}`, background: uploadForm.documentCategory === cat.key ? `${cat.color}18` : 'transparent', color: uploadForm.documentCategory === cat.key ? cat.color : '#64748b', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', textAlign: 'left' }}>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 6 }}>DOCUMENT TYPE *</label>
                <select className="input" value={uploadForm.documentType} onChange={e => setUploadForm(f => ({ ...f, documentType: e.target.value }))} style={{ width: '100%' }} required>
                  <option value="">Select document type</option>
                  {(DOC_TYPES_BY_CAT[uploadForm.documentCategory] || []).map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 6 }}>DOCUMENT LABEL / NAME *</label>
                <input className="input" placeholder="e.g. GST Certificate FY 2025-26" value={uploadForm.documentName} onChange={e => setUploadForm(f => ({ ...f, documentName: e.target.value }))} style={{ width: '100%' }} required />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 6 }}>EXPIRY DATE (if applicable)</label>
                <input className="input" type="date" value={uploadForm.expiryDate} onChange={e => setUploadForm(f => ({ ...f, expiryDate: e.target.value }))} style={{ width: '100%' }} />
              </div>
              {/* File drop zone */}
              <div>
                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 6 }}>FILE *</label>
                <div style={{ border: `2px dashed ${uploadFile ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 14, padding: '24px 20px', textAlign: 'center', background: uploadFile ? 'rgba(124,58,237,0.05)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); setUploadFile(e.dataTransfer.files[0]); }}>
                  {uploadFile ? (
                    <div>
                      <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>📄</div>
                      <div style={{ fontWeight: 700, color: '#7c3aed', fontSize: '0.88rem' }}>{uploadFile.name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: 4 }}>{Math.round(uploadFile.size / 1024)} KB · {uploadFile.type || 'Unknown type'}</div>
                      <button type="button" onClick={e => { e.stopPropagation(); setUploadFile(null); }} style={{ marginTop: 8, background: 'none', border: 'none', color: '#ef4444', fontSize: '0.72rem', cursor: 'pointer' }}>✕ Remove</button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '2rem', marginBottom: 8 }}>📤</div>
                      <div style={{ color: '#64748b', fontSize: '0.82rem' }}>Drag & drop or click to browse</div>
                      <div style={{ color: '#475569', fontSize: '0.68rem', marginTop: 4 }}>PDF · JPG · PNG · DOC · Max 10 MB</div>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display: 'none' }} onChange={e => setUploadFile(e.target.files[0])} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowUploadModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }} disabled={uploading}>
                  {uploading ? '⟳ Uploading...' : '🔒 Upload to Secure Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
