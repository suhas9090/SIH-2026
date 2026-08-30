import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/Sidebar';
import { tenderAPI } from '../services/api';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

const CATEGORIES = ['IT Equipment', 'Office Supplies', 'Safety Equipment', 'Construction', 'Medical', 'Transport', 'Services', 'Other'];

export default function CreateTenderPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', organization: '', department: '', category: '', estimatedValue: '', publishedDate: '', closingDate: '', description: '' });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [step, setStep] = useState(1);
  const [createdTender, setCreatedTender] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 50 * 1024 * 1024,
    onDrop: (files) => { if (files[0]) setUploadedFile(files[0]); }
  });

  const handleChange = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleCreateTender = async (e) => {
    e.preventDefault();
    if (!form.title || !form.organization) return toast.error('Title and organization are required.');
    setLoading(true);
    try {
      const res = await tenderAPI.create(form);
      setCreatedTender(res.data);
      toast.success('Tender created successfully!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create tender.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAndExtract = async () => {
    if (!uploadedFile || !createdTender) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('document', uploadedFile);
      await tenderAPI.upload(createdTender.id, formData);
      toast.success('Document uploaded! Processing started...');
      setStep(3);
      setExtracting(true);

      // Trigger AI extraction
      setTimeout(async () => {
        try {
          await tenderAPI.extractRequirements(createdTender.id);
          toast.success('Requirements extracted by Gemini AI!');
          setExtracting(false);
        } catch {
          toast.error('AI extraction failed. You can retry from the tender page.');
          setExtracting(false);
        }
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: 'Tender Details' },
    { num: 2, label: 'Upload Document' },
    { num: 3, label: 'AI Processing' },
  ];

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>Create Tender</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Add a new procurement tender and let AI extract requirements</p>
        </div>
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 700 }}>
        {/* Steps */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
          {steps.map((s, i) => (
            <React.Fragment key={s.num}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.85rem',
                  background: step >= s.num ? 'linear-gradient(135deg, #1e40af, #0891b2)' : 'var(--bg-border)',
                  color: step >= s.num ? 'white' : '#64748b'
                }}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: step >= s.num ? '#f0f4ff' : '#4a6080' }}>{s.label}</span>
              </div>
              {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: 'var(--bg-border)', alignSelf: 'center' }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Tender Details */}
        {step === 1 && (
          <div className="card">
            <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#f0f4ff', marginBottom: 24 }}>Tender Information</h2>
            <form onSubmit={handleCreateTender}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="label">Tender Title *</label>
                  <input className="input" placeholder="e.g., Supply of Industrial Safety Equipment" value={form.title} onChange={e => handleChange('title', e.target.value)} />
                </div>
                <div>
                  <label className="label">Procuring Organization *</label>
                  <input className="input" placeholder="Ministry / Department Name" value={form.organization} onChange={e => handleChange('organization', e.target.value)} />
                </div>
                <div>
                  <label className="label">Department</label>
                  <input className="input" placeholder="Specific department" value={form.department} onChange={e => handleChange('department', e.target.value)} />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select className="select" value={form.category} onChange={e => handleChange('category', e.target.value)} style={{ width: '100%' }}>
                    <option value="">Select category...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Estimated Value (₹)</label>
                  <input className="input" type="number" placeholder="e.g., 5000000" value={form.estimatedValue} onChange={e => handleChange('estimatedValue', e.target.value)} />
                </div>
                <div>
                  <label className="label">Published Date</label>
                  <input className="input" type="date" value={form.publishedDate} onChange={e => handleChange('publishedDate', e.target.value)} />
                </div>
                <div>
                  <label className="label">Closing Date</label>
                  <input className="input" type="date" value={form.closingDate} onChange={e => handleChange('closingDate', e.target.value)} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="label">Description</label>
                  <textarea className="input" placeholder="Brief description of the tender..." value={form.description} onChange={e => handleChange('description', e.target.value)} style={{ height: 80, resize: 'vertical' }} />
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                {loading ? '⟳ Creating...' : 'Create Tender & Continue →'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Upload */}
        {step === 2 && createdTender && (
          <div className="card">
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 10, padding: 16, marginBottom: 24 }}>
              <div style={{ fontWeight: 600, color: '#10b981', fontSize: '0.875rem' }}>✓ Tender Created: {createdTender.referenceNo}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>{createdTender.title}</div>
            </div>

            <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#f0f4ff', marginBottom: 8 }}>Upload Tender Document</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 20 }}>Upload the tender PDF. AI will automatically extract all eligibility and compliance requirements using Gemini.</p>

            <div {...getRootProps()} className={`dropzone${isDragActive ? ' active' : ''}`} style={{ marginBottom: 20 }}>
              <input {...getInputProps()} />
              {uploadedFile ? (
                <div>
                  <div style={{ fontSize: '2rem', marginBottom: 12 }}>📄</div>
                  <div style={{ fontWeight: 600, color: '#10b981' }}>{uploadedFile.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📁</div>
                  <div style={{ fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>
                    {isDragActive ? 'Drop the PDF here...' : 'Drag & drop tender PDF here'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#4a6080' }}>or click to browse (PDF, max 50MB)</div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-secondary" onClick={() => navigate(`/tenders/${createdTender.id}`)}>
                Skip for now
              </button>
              <button
                className="btn-primary"
                onClick={handleUploadAndExtract}
                disabled={!uploadedFile || loading}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {loading ? '⟳ Uploading...' : '🧠 Upload & Extract Requirements with AI →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Processing */}
        {step === 3 && (
          <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
            {extracting ? (
              <>
                <div style={{ fontSize: '3rem', marginBottom: 20 }}>🧠</div>
                <h2 style={{ fontWeight: 700, fontSize: '1.2rem', color: '#f0f4ff', marginBottom: 12 }}>AI Extracting Requirements...</h2>
                <div style={{ marginBottom: 16 }}>
                  {['OCR/PDF parsing complete...', 'NLP analysis running...', 'Gemini LLM extracting requirements...', 'FAISS indexing chunks...'].map((msg, i) => (
                    <div key={i} className="step-indicator done" style={{ marginBottom: 8, justifyContent: 'center', display: 'flex' }}>
                      ✓ {msg}
                    </div>
                  ))}
                  <div className="step-indicator active" style={{ justifyContent: 'center', display: 'flex' }}>
                    ⟳ Structuring requirements to JSON...
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '3rem', marginBottom: 20 }}>✅</div>
                <h2 style={{ fontWeight: 700, fontSize: '1.2rem', color: '#10b981', marginBottom: 12 }}>Requirements Extracted Successfully!</h2>
                <p style={{ color: '#64748b', marginBottom: 24 }}>Gemini AI has extracted and structured all compliance requirements from your tender document.</p>
                <button className="btn-primary" style={{ justifyContent: 'center' }} onClick={() => navigate(`/tenders/${createdTender.id}`)}>
                  View Tender & Add Bidders →
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
