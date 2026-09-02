import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/Sidebar';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DOC_STATUS_CONFIG = {
  PENDING: { color: '#f59e0b', label: '⏳ Pending' },
  UNDER_REVIEW: { color: '#3b82f6', label: '🔍 Under Review' },
  VERIFIED: { color: '#10b981', label: '✓ Verified' },
  REJECTED: { color: '#ef4444', label: '✗ Rejected' },
  MISMATCH_DETECTED: { color: '#f59e0b', label: '⚠ Mismatch' },
  REUPLOAD_REQUIRED: { color: '#ef4444', label: '↑ Re-upload Required' },
  EXPIRED: { color: '#64748b', label: '⏰ Expired' },
};

function GovtVerificationRow({ v }) {
  const isVerified = v.status === 'VERIFIED';
  return (
    <div style={{ padding: '10px 14px', background: isVerified ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)', border: `1px solid ${isVerified ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)'}`, borderRadius: 10, marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#f0f4ff' }}>{v.source}</span>
          <span style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: 10, fontFamily: 'monospace' }}>{v.inputIdentifier || '—'}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {v.confidence && <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{Math.round(v.confidence * 100)}% conf.</span>}
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: isVerified ? '#10b981' : '#ef4444', background: `${isVerified ? '#10b981' : '#ef4444'}15`, padding: '2px 10px', borderRadius: 10 }}>
            {v.result || v.status}
          </span>
        </div>
      </div>
      {v.isSynthetic && <div style={{ fontSize: '0.62rem', color: '#475569', marginTop: 4 }}>🔬 {v.disclaimer || 'Synthetic regulatory dataset (prototype)'}</div>}
    </div>
  );
}

export default function BidderDossierPage() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const [bidder, setBidder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(null); // { docId, docName }
  const [reviewForm, setReviewForm] = useState({ action: '', remarks: '' });
  const [submitting, setSubmitting] = useState(false);
  const [finalModal, setFinalModal] = useState(null); // 'approve' | 'reject'
  const [finalRemarks, setFinalRemarks] = useState('');
  const [activeSection, setActiveSection] = useState('identity');

  const fetchDossier = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/verification-officer/bidder/${profileId}`);
      setBidder(res.data);
    } catch (e) {
      toast.error('Failed to load bidder dossier.');
    }
    setLoading(false);
  };

  useEffect(() => { fetchDossier(); }, [profileId]);

  const handleDocReview = async () => {
    if (!reviewForm.action) return toast.error('Select an action.');
    if (reviewForm.action !== 'APPROVED' && !reviewForm.remarks) return toast.error('Remarks are required for rejection or correction request.');
    setSubmitting(true);
    try {
      await api.post(`/verification-officer/document/${reviewModal.docId}/review`, reviewForm);
      toast.success(`Document ${reviewForm.action.toLowerCase().replace('_', ' ')} successfully.`);
      setReviewModal(null);
      setReviewForm({ action: '', remarks: '' });
      fetchDossier();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Review action failed.');
    }
    setSubmitting(false);
  };

  const handleFinalAction = async () => {
    if (finalModal === 'reject' && !finalRemarks) return toast.error('Rejection reason is required.');
    setSubmitting(true);
    try {
      if (finalModal === 'approve') {
        await api.post(`/verification-officer/bidder/${profileId}/approve`, { remarks: finalRemarks });
        toast.success('🎉 Bidder approved! They are now eligible to bid.');
      } else {
        await api.post(`/verification-officer/bidder/${profileId}/reject`, { reason: finalRemarks });
        toast.success('Bidder marked for correction with reason.');
      }
      setFinalModal(null);
      setFinalRemarks('');
      fetchDossier();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Action failed.');
    }
    setSubmitting(false);
  };

  if (loading) return (
    <AppLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
        <div style={{ width: 44, height: 44, border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin-slow 1s linear infinite' }} />
      </div>
    </AppLayout>
  );

  if (!bidder) return (
    <AppLayout>
      <div style={{ padding: 60, textAlign: 'center' }}>
        <p style={{ color: '#ef4444' }}>Bidder dossier not found.</p>
        <button className="btn-secondary" onClick={() => navigate('/reviewer/verification-queue')}>← Back to Queue</button>
      </div>
    </AppLayout>
  );

  const lc = bidder.lifecycleStatus;
  const lcColor = lc === 'APPROVED_TO_BID' ? '#10b981' : lc === 'CORRECTION_REQUIRED' ? '#ef4444' : '#3b82f6';
  const allDocsVerified = bidder.documents?.every(d => d.verificationStatus === 'VERIFIED');
  const pendingDocs = bidder.documents?.filter(d => ['PENDING', 'UNDER_REVIEW'].includes(d.verificationStatus));
  const sections = [
    { key: 'identity', label: '👤 Identity' },
    { key: 'company', label: '🏢 Company' },
    { key: 'govtVerifications', label: '🔗 Govt. Checks' },
    { key: 'documents', label: `📁 Documents (${bidder.documents?.length || 0})` },
    { key: 'auditLog', label: '📋 Audit Log' },
  ];

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <button style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.8rem', marginBottom: 8, padding: 0 }} onClick={() => navigate('/reviewer/verification-queue')}>← Back to Queue</button>
          <div style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>BIDDER DOSSIER</div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>
            {bidder.company?.legalName || bidder.user?.name || 'Unknown Bidder'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{bidder.user?.email} · Profile ID: {bidder.id?.slice(0, 12)}...</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ padding: '6px 16px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 800, color: lcColor, background: `${lcColor}15`, border: `1px solid ${lcColor}30`, alignSelf: 'center' }}>
            {lc.replace(/_/g, ' ')}
          </span>
          {lc !== 'APPROVED_TO_BID' && (
            <>
              <button className="btn-secondary" style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444' }} onClick={() => setFinalModal('reject')}>Request Correction</button>
              <button className="btn-primary" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }} onClick={() => setFinalModal('approve')} disabled={!allDocsVerified}>
                {allDocsVerified ? '✓ Approve Bidder' : `⏳ ${pendingDocs?.length} docs pending`}
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Section tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {sections.map(s => (
            <button key={s.key} onClick={() => setActiveSection(s.key)}
              style={{ padding: '7px 16px', borderRadius: 20, border: `1px solid ${activeSection === s.key ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`, background: activeSection === s.key ? 'rgba(59,130,246,0.15)' : 'transparent', color: activeSection === s.key ? '#3b82f6' : '#64748b', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Identity Section */}
        {activeSection === 'identity' && (
          <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontWeight: 800, color: '#f0f4ff', fontSize: '0.95rem', marginBottom: 16 }}>👤 Personal Identity</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
              {[
                ['Full Name', bidder.fullName], ['Date of Birth', bidder.dateOfBirth], ['Gender', bidder.gender],
                ["Father's Name", bidder.fatherName], ['Mobile', bidder.mobileNumber], ['Email', bidder.user?.email],
                ['PAN (Masked)', bidder.panNumber], ['Aadhaar Ref (Masked)', bidder.aadhaarMasked], ['Nationality', bidder.nationality],
              ].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, marginBottom: 3 }}>{l}</div>
                  <div style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }}>{v || <span style={{ color: '#475569' }}>—</span>}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, marginBottom: 3 }}>ADDRESS</div>
              <div style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>{[bidder.residentialAddress, bidder.city, bidder.district, bidder.state, bidder.pincode].filter(Boolean).join(', ') || '—'}</div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[['PAN Verified', bidder.panVerified], ['Aadhaar Verified', bidder.aadhaarVerified], ['Mobile Verified', bidder.mobileVerified]].map(([l, ok]) => (
                <span key={l} style={{ fontSize: '0.72rem', fontWeight: 800, padding: '4px 12px', borderRadius: 12, color: ok ? '#10b981' : '#ef4444', background: `${ok ? '#10b981' : '#ef4444'}15`, border: `1px solid ${ok ? '#10b981' : '#ef4444'}25` }}>
                  {ok ? '✓' : '✗'} {l}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Company Section */}
        {activeSection === 'company' && bidder.company && (
          <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontWeight: 800, color: '#f0f4ff', fontSize: '0.95rem', marginBottom: 16 }}>🏢 Company Profile</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 16 }}>
              {[
                ['Legal Name', bidder.company.legalName], ['Trade Name', bidder.company.tradeName],
                ['Company Type', bidder.company.companyType], ['Incorporation Date', bidder.company.dateOfIncorporation],
                ['Email', bidder.company.companyEmail], ['Phone', bidder.company.companyPhone],
                ['GSTIN', bidder.company.gstin], ['Company PAN', bidder.company.companyPan],
                ['Udyam No.', bidder.company.udyamNumber], ['CIN / LLPIN', bidder.company.cinNumber],
                ['Startup No.', bidder.company.startupRegNumber], ['NSIC No.', bidder.company.nsicNumber],
                ['Auth. Rep Name', bidder.company.authorizedRepName], ['Auth. Rep Designation', bidder.company.authorizedRepDesignation],
              ].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, marginBottom: 3 }}>{l}</div>
                  <div style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600, fontFamily: l.includes('TIN') || l.includes('PAN') || l.includes('No') || l.includes('CIN') ? 'monospace' : 'inherit' }}>{v || <span style={{ color: '#475569' }}>—</span>}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[['PAN', bidder.company.companyPanVerified], ['GST', bidder.company.gstVerified], ['Udyam', bidder.company.udyamVerified], ['MCA', bidder.company.mcaVerified], ['Startup', bidder.company.startupVerified], ['NSIC', bidder.company.nsicVerified]].map(([l, ok]) => (
                <span key={l} style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 10px', borderRadius: 10, color: ok ? '#10b981' : '#475569', background: `${ok ? '#10b981' : '#475569'}15`, border: `1px solid ${ok ? '#10b981' : '#47556920'}` }}>
                  {ok ? '✓' : '○'} {l}
                </span>
              ))}
              <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 10px', borderRadius: 10, color: bidder.company.blacklistClear === true ? '#10b981' : bidder.company.blacklistClear === false ? '#ef4444' : '#64748b', background: `${bidder.company.blacklistClear === true ? '#10b981' : bidder.company.blacklistClear === false ? '#ef4444' : '#64748b'}15` }}>
                {bidder.company.blacklistClear === true ? '✓ Blacklist Clear' : bidder.company.blacklistClear === false ? '⚠ BLACKLISTED' : '○ Blacklist Not Checked'}
              </span>
            </div>
          </div>
        )}

        {/* Govt Verifications */}
        {activeSection === 'govtVerifications' && (
          <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontWeight: 800, color: '#f0f4ff', fontSize: '0.95rem', marginBottom: 16 }}>🔗 Government Data Verification Results</div>
            {(bidder.govtVerifications || []).length === 0 ? (
              <p style={{ color: '#64748b' }}>No government verifications run yet.</p>
            ) : (
              bidder.govtVerifications.map(v => <GovtVerificationRow key={v.id} v={v} />)
            )}
          </div>
        )}

        {/* Documents Section */}
        {activeSection === 'documents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(bidder.documents || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No documents uploaded by this bidder.</div>
            ) : (
              bidder.documents.map(doc => {
                const s = DOC_STATUS_CONFIG[doc.verificationStatus] || { color: '#94a3b8', label: doc.verificationStatus };
                const canReview = !['VERIFIED', 'EXPIRED'].includes(doc.verificationStatus);
                return (
                  <div key={doc.id} style={{ background: 'rgba(15,23,42,0.8)', border: `1px solid ${s.color}25`, borderRadius: 14, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, color: '#f0f4ff', fontSize: '0.92rem', marginBottom: 4 }}>📄 {doc.documentName}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {doc.documentType?.replace(/_/g,' ')} · {doc.documentCategory} · {doc.originalFileName}
                          {doc.fileSize ? ` · ${Math.round(doc.fileSize/1024)} KB` : ''}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: 2 }}>
                          Uploaded {new Date(doc.uploadedAt).toLocaleString('en-IN')}
                          {doc.expiryDate && ` · Expires ${new Date(doc.expiryDate).toLocaleDateString('en-IN')}`}
                        </div>
                        {doc.rejectionReason && (
                          <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: '0.72rem', color: '#ef4444' }}>
                            ⚠ Previous remarks: {doc.rejectionReason}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: s.color, background: `${s.color}15`, padding: '4px 12px', borderRadius: 12, border: `1px solid ${s.color}30` }}>{s.label}</span>
                        {canReview && (
                          <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '6px 14px' }} onClick={() => { setReviewModal({ docId: doc.id, docName: doc.documentName }); setReviewForm({ action: '', remarks: '' }); }}>
                            Review
                          </button>
                        )}
                      </div>
                    </div>
                    {doc.extractedData && Object.keys(doc.extractedData).length > 0 && (
                      <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10 }}>
                        <div style={{ fontSize: '0.65rem', color: '#3b82f6', fontWeight: 800, marginBottom: 6 }}>OCR EXTRACTED DATA</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                          {Object.entries(doc.extractedData).slice(0, 8).map(([k, v]) => (
                            <span key={k} style={{ fontSize: '0.68rem', color: '#94a3b8' }}><span style={{ color: '#64748b' }}>{k}:</span> {String(v)}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Audit Log */}
        {activeSection === 'auditLog' && (
          <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontWeight: 800, color: '#f0f4ff', fontSize: '0.95rem', marginBottom: 16 }}>📋 Audit Log</div>
            {(bidder.bidderAuditLogs || []).length === 0 ? (
              <p style={{ color: '#64748b' }}>No audit events yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {bidder.bidderAuditLogs.map(log => (
                  <div key={log.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: '0.65rem', color: '#475569', whiteSpace: 'nowrap', minWidth: 110 }}>{new Date(log.timestamp).toLocaleString('en-IN')}</div>
                    <div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#3b82f6' }}>{log.action}</span>
                      {log.entityType && <span style={{ fontSize: '0.68rem', color: '#64748b', marginLeft: 8 }}>{log.entityType}</span>}
                      {log.details && <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 2 }}>{JSON.stringify(log.details).slice(0, 120)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Document Review Modal */}
      {reviewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setReviewModal(null)}>
          <div style={{ background: '#091322', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 20, padding: 32, maxWidth: 500, width: '100%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 900, color: '#f0f4ff', marginBottom: 6 }}>Review Document</h3>
            <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: 22 }}>📄 {reviewModal.docName}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {[['APPROVED','✓ Approve','#10b981'], ['REJECTED','✗ Reject','#ef4444'], ['REQUESTED_CORRECTION','↑ Request Correction','#f59e0b']].map(([action, label, color]) => (
                  <button key={action} type="button" onClick={() => setReviewForm(f => ({ ...f, action }))}
                    style={{ padding: '10px 8px', borderRadius: 10, border: `2px solid ${reviewForm.action === action ? color : 'rgba(255,255,255,0.08)'}`, background: reviewForm.action === action ? `${color}18` : 'transparent', color: reviewForm.action === action ? color : '#64748b', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>
                    {label}
                  </button>
                ))}
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                  OFFICER REMARKS {reviewForm.action !== 'APPROVED' ? '*' : '(optional)'}
                </label>
                <textarea className="input" rows={3} placeholder={reviewForm.action === 'APPROVED' ? 'Optional notes...' : 'Specify reason for rejection or correction required...'} value={reviewForm.remarks} onChange={e => setReviewForm(f => ({ ...f, remarks: e.target.value }))} style={{ width: '100%', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setReviewModal(null)}>Cancel</button>
                <button className="btn-primary" style={{ flex: 1.5, justifyContent: 'center', background: reviewForm.action === 'APPROVED' ? 'linear-gradient(135deg,#10b981,#059669)' : reviewForm.action === 'REJECTED' ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#f59e0b,#d97706)' }} onClick={handleDocReview} disabled={submitting || !reviewForm.action}>
                  {submitting ? '⟳ Submitting...' : 'Confirm Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Final Approve/Reject Modal */}
      {finalModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setFinalModal(null)}>
          <div style={{ background: '#091322', border: `1px solid ${finalModal === 'approve' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 20, padding: 32, maxWidth: 460, width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '2rem', textAlign: 'center', marginBottom: 10 }}>{finalModal === 'approve' ? '✅' : '⚠'}</div>
            <h3 style={{ fontWeight: 900, color: '#f0f4ff', textAlign: 'center', marginBottom: 8 }}>
              {finalModal === 'approve' ? 'Approve Bidder' : 'Request Correction'}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.82rem', textAlign: 'center', marginBottom: 22 }}>
              {finalModal === 'approve' ? 'This bidder will be marked as APPROVED TO BID and can participate in tenders.' : 'The bidder will be notified to correct their submission.'}
            </p>
            <textarea className="input" rows={3} placeholder={finalModal === 'approve' ? 'Optional approval notes...' : 'Reason for requesting correction *'} value={finalRemarks} onChange={e => setFinalRemarks(e.target.value)} style={{ width: '100%', resize: 'vertical', marginBottom: 18 }} />
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setFinalModal(null)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1.5, justifyContent: 'center', background: finalModal === 'approve' ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#f59e0b,#d97706)' }} onClick={handleFinalAction} disabled={submitting}>
                {submitting ? '⟳ ...' : finalModal === 'approve' ? '✓ Approve & Activate' : '↩ Send for Correction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
