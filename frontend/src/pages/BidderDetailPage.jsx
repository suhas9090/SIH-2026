import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/Sidebar';
import { bidderAPI, complianceAPI } from '../services/api';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

const DOC_TYPES = [
  { value: 'GST_CERTIFICATE', label: 'GST Certificate' },
  { value: 'PAN_CARD', label: 'PAN Card' },
  { value: 'UDYAM_CERTIFICATE', label: 'Udyam Certificate' },
  { value: 'FINANCIAL_STATEMENT', label: 'Financial Statement' },
  { value: 'OEM_AUTHORIZATION', label: 'OEM Authorization' },
  { value: 'EXPERIENCE_CERTIFICATE', label: 'Experience Certificate' },
  { value: 'INCOME_TAX_RETURN', label: 'Income Tax Return' },
  { value: 'MCA_CERTIFICATE', label: 'MCA Certificate' },
  { value: 'OTHER', label: 'Other Document' },
];

const STATUS_BADGE = {
  COMPLIANT: { label: '✓ Compliant', cls: 'badge-compliant' },
  NON_COMPLIANT: { label: '✗ Non-Compliant', cls: 'badge-non-compliant' },
  MISSING: { label: '⚠ Missing', cls: 'badge-missing' },
  INCONSISTENT: { label: '≠ Inconsistent', cls: 'badge-inconsistent' },
  PENDING_VERIFICATION: { label: '⟳ Pending', cls: 'badge-pending' },
  REQUIRES_HUMAN_REVIEW: { label: '👁 Review', cls: 'badge-review' },
};

const DEMO_BIDDER = {
  id: 'b1', organizationName: 'ABC Industries Pvt Ltd', gstin: '29AABCA1234C1Z5', pan: 'AABCA1234C',
  udyamNo: 'UDYAM-KA-01-0000001', contactName: 'Ramesh Kumar', contactEmail: 'ramesh@abc.com',
  tender: { title: 'Supply of Industrial Safety Equipment', referenceNo: 'TND-2026-001' },
  documents: [
    { id: 'd1', documentType: 'GST_CERTIFICATE', originalName: 'GST_Certificate.pdf', processingStatus: 'DONE' },
    { id: 'd2', documentType: 'PAN_CARD', originalName: 'PAN_Card.pdf', processingStatus: 'DONE' },
    { id: 'd3', documentType: 'FINANCIAL_STATEMENT', originalName: 'Financial_Statement_2025-26.pdf', processingStatus: 'DONE' },
  ]
};

export default function BidderDetailPage() {
  const { tenderId, bidderId } = useParams();
  const navigate = useNavigate();
  const [bidder, setBidder] = useState(DEMO_BIDDER);
  const [files, setFiles] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [verifying, setVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState('documents');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.png', '.jpeg'] },
    onDrop: (accepted) => {
      setFiles(prev => [...prev, ...accepted]);
      setDocTypes(prev => [...prev, ...accepted.map(() => 'OTHER')]);
    }
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await bidderAPI.get(bidderId);
        setBidder(res.data);
      } catch { /* demo */ }
    };
    fetch();
  }, [bidderId]);

  const handleUpload = async () => {
    if (!files.length) return toast.error('No files selected.');
    const formData = new FormData();
    files.forEach(f => formData.append('documents', f));
    formData.append('documentTypes', JSON.stringify(docTypes));

    try {
      const res = await bidderAPI.uploadDocuments(bidderId, formData);
      toast.success(`${res.data.documents.length} document(s) uploaded. AI processing started.`);
      setBidder(prev => ({ ...prev, documents: [...(prev.documents || []), ...res.data.documents] }));
      setFiles([]);
      setDocTypes([]);
    } catch (err) {
      toast.error('Upload failed.');
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await bidderAPI.verify(bidderId);
      toast.success('Compliance verification complete!');
      navigate(`/compliance/${bidderId}`);
    } catch (err) {
      toast.error('Verification failed. Using demo data...');
      navigate(`/compliance/${bidderId}`);
    } finally {
      setVerifying(false);
    }
  };

  const PROC_COLOR = { DONE: '#10b981', PROCESSING: '#3b82f6', PENDING: '#f59e0b', FAILED: '#ef4444' };

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ fontSize: '0.75rem', color: '#4a6080', marginBottom: 4 }}>
            {bidder.tender?.referenceNo} — Bidder Analysis
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: '#f0f4ff', marginBottom: 4 }}>
            {bidder.organizationName}
          </h1>
          <div style={{ display: 'flex', gap: 16, color: '#64748b', fontSize: '0.8rem' }}>
            {bidder.gstin && <span>GSTIN: <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{bidder.gstin}</span></span>}
            {bidder.pan && <span>PAN: <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{bidder.pan}</span></span>}
            {bidder.udyamNo && <span>Udyam: <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{bidder.udyamNo}</span></span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={() => navigate(`/tenders/${tenderId}`)}>← Back to Tender</button>
          <button
            className="btn-primary"
            onClick={handleVerify}
            disabled={verifying}
            style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
          >
            {verifying ? '⟳ Verifying...' : '🔍 Run Compliance Verification →'}
          </button>
        </div>
      </div>

      <div style={{ padding: '28px 32px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--bg-border)', paddingBottom: 1 }}>
          {[
            { key: 'documents', label: '📄 Documents' },
            { key: 'upload', label: '⬆ Upload Documents' },
            { key: 'info', label: '🏢 Bidder Info' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.2s',
                color: activeTab === tab.key ? '#3b82f6' : '#64748b',
                borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
                marginBottom: -1
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div>
            {bidder.documents?.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {bidder.documents.map(doc => (
                  <div key={doc.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: '1.5rem' }}>📄</span>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                        color: PROC_COLOR[doc.processingStatus] || '#64748b',
                        background: `${PROC_COLOR[doc.processingStatus] || '#64748b'}20`
                      }}>{doc.processingStatus}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#f0f4ff', marginBottom: 4 }}>
                      {DOC_TYPES.find(d => d.value === doc.documentType)?.label || doc.documentType}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.originalName}
                    </div>
                    {doc.processingStatus === 'DONE' && (
                      <div style={{ marginTop: 10, padding: '6px 10px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 8, fontSize: '0.72rem', color: '#10b981' }}>
                        ✓ AI extraction complete
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#4a6080' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>📄</div>
                <p>No documents uploaded yet.</p>
                <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setActiveTab('upload')}>Upload Documents →</button>
              </div>
            )}
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div style={{ maxWidth: 640 }}>
            <div className="mock-banner" style={{ marginBottom: 20 }}>
              <span>🧠</span> Documents will be processed by OCR + Gemini AI to extract compliance evidence
            </div>

            <div {...getRootProps()} className={`dropzone${isDragActive ? ' active' : ''}`} style={{ marginBottom: 20 }}>
              <input {...getInputProps()} />
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📁</div>
              <div style={{ fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>
                {isDragActive ? 'Drop files here...' : 'Drag & drop bidder documents'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#4a6080' }}>PDF, JPG, PNG • Max 50MB each</div>
            </div>

            {files.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                {files.map((file, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(30,45,74,0.4)' }}>
                    <span>📄</span>
                    <span style={{ flex: 1, fontSize: '0.875rem', color: '#94a3b8' }}>{file.name}</span>
                    <select
                      className="select"
                      value={docTypes[i] || 'OTHER'}
                      onChange={e => setDocTypes(prev => prev.map((t, j) => j === i ? e.target.value : t))}
                      style={{ width: 180, fontSize: '0.8rem', padding: '6px 10px' }}
                    >
                      {DOC_TYPES.map(dt => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
                    </select>
                    <button className="btn-ghost" style={{ color: '#ef4444', padding: '4px 8px' }} onClick={() => {
                      setFiles(prev => prev.filter((_, j) => j !== i));
                      setDocTypes(prev => prev.filter((_, j) => j !== i));
                    }}>✕</button>
                  </div>
                ))}
                <button className="btn-primary" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }} onClick={handleUpload}>
                  ⬆ Upload {files.length} Document(s) for AI Processing
                </button>
              </div>
            )}
          </div>
        )}

        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="card" style={{ maxWidth: 560 }}>
            {[
              { label: 'Organization', value: bidder.organizationName },
              { label: 'GSTIN', value: bidder.gstin, mono: true },
              { label: 'PAN', value: bidder.pan, mono: true },
              { label: 'Udyam No.', value: bidder.udyamNo, mono: true },
              { label: 'CIN', value: bidder.cinNo, mono: true },
              { label: 'Contact Name', value: bidder.contactName },
              { label: 'Contact Email', value: bidder.contactEmail },
              { label: 'Contact Phone', value: bidder.contactPhone },
            ].map(row => row.value && (
              <div key={row.label} style={{ display: 'flex', gap: 20, padding: '10px 0', borderBottom: '1px solid rgba(30,45,74,0.4)' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', width: 140, flexShrink: 0 }}>{row.label}</span>
                <span style={{ fontSize: '0.875rem', color: '#f0f4ff', fontFamily: row.mono ? 'monospace' : undefined }}>{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
