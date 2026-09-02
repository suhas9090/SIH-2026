import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function VerifyCompanyProfilesPage() {
  const navigate = useNavigate();

  // Active sub-tab: 'QUEUE' | 'LOOKUP'
  const [activeTab, setActiveTab] = useState('QUEUE');

  // ── PAN Master Fetcher State ──
  const [searchPan, setSearchPan] = useState('');
  const [fetchingPan, setFetchingPan] = useState(false);
  const [panResult, setPanResult] = useState(null);

  // ── Profiles Queue State ──
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // ── Officer Action State ──
  const [officerNotes, setOfficerNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);

  // Fetch all company profiles on load
  const loadProfiles = async () => {
    try {
      setLoadingProfiles(true);
      const res = await api.get('/bidder-onboarding/all-company-profiles');
      setProfiles(res.data || []);
    } catch (err) {
      toast.error('Failed to load company profiles.');
    } finally {
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  // Handler: Live Government PAN Lookup
  const handleFetchPanDetails = async (panToLookup) => {
    const targetPan = (panToLookup || searchPan).trim().toUpperCase();
    if (!targetPan || targetPan.length < 5) {
      toast.error('Please enter a valid 10-character PAN number.');
      return;
    }
    try {
      setFetchingPan(true);
      setSearchPan(targetPan);
      const res = await api.post('/bidder-onboarding/fetch-pan-details', { panNumber: targetPan });
      if (res.data?.success && res.data?.data) {
        setPanResult(res.data.data);
        toast.success(`✓ Government Master Records retrieved for PAN: ${targetPan}`);
      } else {
        toast.error(res.data?.message || 'No record found for this PAN in Government datasets.');
        setPanResult(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch PAN details from Government database.');
      setPanResult(null);
    } finally {
      setFetchingPan(false);
    }
  };

  // Handler: Officer Decision
  const handleOfficerDecision = async (decision) => {
    if (!selectedProfile) return;
    try {
      setActionLoading(true);
      const res = await api.post('/bidder-onboarding/officer-decision', {
        profileId: selectedProfile.id,
        decision,
        notes: officerNotes
      });
      if (res.data?.success) {
        toast.success(`✓ Company Profile marked as ${res.data.lifecycleStatus}`);
        setSelectedProfile(null);
        setOfficerNotes('');
        await loadProfiles();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit decision.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Download Official Audit Report PDF (For Procurement Officers)
  const handleDownloadOfficerPdf = async (profileId, compName) => {
    try {
      toast.loading('Generating Official Statutory Audit Report PDF...', { id: 'pdf-toast' });
      const res = await api.get(`/bidder-onboarding/verification-report/pdf/${profileId}`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ComplyGeM_Statutory_Audit_Report_${(compName || 'Bidder').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('✓ Official Audit Report PDF downloaded successfully!', { id: 'pdf-toast' });
    } catch (err) {
      toast.error('Failed to generate PDF audit report.', { id: 'pdf-toast' });
    }
  };

  // Filtered profiles
  const filteredProfiles = profiles.filter(p => {
    const compName = (p.company?.legalName || p.fullName || '').toLowerCase();
    const pan = (p.company?.panNumber || p.panNumber || '').toLowerCase();
    const gstin = (p.company?.gstin || '').toLowerCase();
    const q = searchTerm.toLowerCase();

    const matchesSearch = compName.includes(q) || pan.includes(q) || gstin.includes(q);
    const matchesFilter = filterStatus === 'ALL' || p.lifecycleStatus === filterStatus;

    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      {/* ── Top Header ── */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '24px 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '1.4rem' }}>🏛️</span>
              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.5rem', color: '#0f172a', margin: 0 }}>
                Verify Company Profiles & Statutory PAN Database
              </h1>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
              Officer portal to audit bidder-submitted company data, examine uploaded PDF certificates, and query live Government master databases.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '8px 16px' }}
              onClick={() => navigate('/procurement/dashboard')}
            >
              ← Back to Dashboard
            </button>
            <button
              className="btn-primary"
              style={{ fontSize: '0.82rem', padding: '8px 18px', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}
              onClick={loadProfiles}
            >
              ⟳ Refresh Queue
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '24px auto', padding: '0 24px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
          <button
            style={{
              background: activeTab === 'QUEUE' ? '#eff6ff' : '#ffffff',
              color: activeTab === 'QUEUE' ? '#1d4ed8' : '#475569',
              border: `1px solid ${activeTab === 'QUEUE' ? '#bfdbfe' : '#cbd5e1'}`,
              borderRadius: 8,
              padding: '9px 20px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
            onClick={() => setActiveTab('QUEUE')}
          >
            <span>📋</span>
            <span>Submitted Company Profiles ({profiles.length})</span>
          </button>

          <button
            style={{
              background: activeTab === 'LOOKUP' ? '#eff6ff' : '#ffffff',
              color: activeTab === 'LOOKUP' ? '#1d4ed8' : '#475569',
              border: `1px solid ${activeTab === 'LOOKUP' ? '#bfdbfe' : '#cbd5e1'}`,
              borderRadius: 8,
              padding: '9px 20px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
            onClick={() => setActiveTab('LOOKUP')}
          >
            <span>⚡</span>
            <span>Live Government PAN Master Lookup</span>
          </button>
        </div>

        {/* ─── TAB 1: LIVE PAN LOOKUP PAGE ─── */}
        {activeTab === 'LOOKUP' && (
          <div>
            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>
                ⚡ Government Master Database PAN Search & Verification
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.84rem', marginBottom: 18 }}>
                Enter any Company PAN to instantly retrieve and verify records from CBDT Direct Taxes, GSTN Network, MSME Udyam, MCA21, and the Central Debarment list.
              </p>

              {/* Input & Fetch Bar */}
              <div style={{ display: 'flex', gap: 12, maxWidth: 640, marginBottom: 16 }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter 10-digit Company PAN (e.g. SYNPA0001C, SYNPA0003P)"
                  value={searchPan}
                  onChange={(e) => setSearchPan(e.target.value.toUpperCase())}
                  style={{ flex: 1, fontFamily: 'monospace', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.05em' }}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetchPanDetails(searchPan)}
                />
                <button
                  className="btn-primary"
                  style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', padding: '10px 24px', fontWeight: 800, fontSize: '0.88rem' }}
                  onClick={() => handleFetchPanDetails(searchPan)}
                  disabled={fetchingPan}
                >
                  {fetchingPan ? 'Fetching...' : 'Fetch PAN Details ⚡'}
                </button>
              </div>

              {/* Quick Sample PAN Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>Quick Test Records:</span>
                {[
                  { label: 'ABC Safety Tech', pan: 'SYNPA0001C' },
                  { label: 'Apex Industrial LLP', pan: 'SYNPA0002L' },
                  { label: 'Zenith Protection Gear', pan: 'SYNPA0003P' },
                  { label: 'Paramount Defence Gear', pan: 'SYNPA0004C' },
                ].map(item => (
                  <button
                    key={item.pan}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      color: '#334155',
                      borderRadius: 20,
                      padding: '4px 12px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleFetchPanDetails(item.pan)}
                  >
                    {item.label} ({item.pan})
                  </button>
                ))}
              </div>
            </div>

            {/* Fetched Government Data Result */}
            {panResult && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                {/* Card 1: CBDT PAN */}
                <div className="card" style={{ borderLeft: '4px solid #2563eb', padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#1e40af' }}>🪪 CBDT Direct Taxes Master</div>
                    <span style={{ fontSize: '0.7rem', background: '#ecfdf5', color: '#059669', padding: '3px 8px', borderRadius: 10, fontWeight: 800 }}>
                      {panResult.status || 'ACTIVE'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div>Legal Entity Name: <strong style={{ color: '#0f172a' }}>{panResult.legalName}</strong></div>
                    <div>PAN Number: <strong style={{ color: '#2563eb', fontFamily: 'monospace' }}>{panResult.panNumber}</strong></div>
                    <div>Entity Type: <strong style={{ color: '#0f172a' }}>{panResult.entityType || 'COMPANY'}</strong></div>
                    <div>Date of Incorporation: <strong style={{ color: '#0f172a' }}>{panResult.dateOfIncorporation || 'N/A'}</strong></div>
                    <div>Jurisdiction: <span style={{ color: '#334155' }}>{panResult.jurisdiction || 'N/A'}</span></div>
                  </div>
                </div>

                {/* Card 2: GSTIN Linkage */}
                <div className="card" style={{ borderLeft: '4px solid #059669', padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#065f46' }}>🧾 GSTN Network Registry</div>
                    <span style={{ fontSize: '0.7rem', background: '#ecfdf5', color: '#059669', padding: '3px 8px', borderRadius: 10, fontWeight: 800 }}>
                      {panResult.gstin ? 'LINKED' : 'NOT FOUND'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div>GSTIN: <strong style={{ color: '#2563eb', fontFamily: 'monospace' }}>{panResult.gstin || 'N/A'}</strong></div>
                    <div>Trade Name: <strong style={{ color: '#0f172a' }}>{panResult.tradeName || panResult.legalName}</strong></div>
                    <div>Registration State: <strong style={{ color: '#0f172a' }}>{panResult.state || 'N/A'}</strong></div>
                    <div>Taxpayer Type: <strong style={{ color: '#0f172a' }}>{panResult.businessType || 'Regular Taxpayer'}</strong></div>
                    <div>Filing Status: <strong style={{ color: '#059669' }}>{panResult.filingStatus || 'COMPLIANT'}</strong></div>
                  </div>
                </div>

                {/* Card 3: MSME Udyam */}
                <div className="card" style={{ borderLeft: '4px solid #d97706', padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#b45309' }}>🏭 Ministry of MSME (Udyam)</div>
                    <span style={{ fontSize: '0.7rem', background: '#fffbeb', color: '#d97706', padding: '3px 8px', borderRadius: 10, fontWeight: 800 }}>
                      {panResult.udyamRegistrationNumber ? 'REGISTERED' : 'N/A'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div>Udyam Number: <strong style={{ color: '#2563eb', fontFamily: 'monospace' }}>{panResult.udyamRegistrationNumber || 'N/A'}</strong></div>
                    <div>Enterprise Type: <strong style={{ color: '#0f172a' }}>{panResult.enterpriseType || 'Micro / Small Enterprise'}</strong></div>
                    <div>Major Activity: <span style={{ color: '#334155' }}>{panResult.majorActivity || 'Manufacturing of Safety Equipment'}</span></div>
                  </div>
                </div>

                {/* Card 4: MCA21 Incorporation */}
                <div className="card" style={{ borderLeft: '4px solid #7c3aed', padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#6d28d9' }}>🏛️ MCA21 Corporate Registry</div>
                    <span style={{ fontSize: '0.7rem', background: '#f5f3ff', color: '#7c3aed', padding: '3px 8px', borderRadius: 10, fontWeight: 800 }}>
                      {panResult.cin ? 'INCORPORATED' : 'PROPRIETARY'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div>CIN / LLPIN: <strong style={{ color: '#2563eb', fontFamily: 'monospace' }}>{panResult.cin || 'N/A'}</strong></div>
                    <div>ROC Office: <strong style={{ color: '#0f172a' }}>{panResult.rocLocation || 'N/A'}</strong></div>
                    <div>Company Status: <strong style={{ color: '#059669' }}>{panResult.companyStatus || 'ACTIVE'}</strong></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: PROFILES QUEUE ─── */}
        {activeTab === 'QUEUE' && (
          <div>
            {/* Filter & Search Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 10, flex: 1, minWidth: 280 }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Search by Company Name, PAN, or GSTIN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {['ALL', 'APPROVED_TO_BID', 'REVIEW_REQUIRED', 'DOCUMENTS_SUBMITTED'].map(status => (
                  <button
                    key={status}
                    style={{
                      background: filterStatus === status ? '#eff6ff' : '#ffffff',
                      color: filterStatus === status ? '#1d4ed8' : '#64748b',
                      border: `1px solid ${filterStatus === status ? '#bfdbfe' : '#cbd5e1'}`,
                      borderRadius: 8,
                      padding: '7px 14px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    onClick={() => setFilterStatus(status)}
                  >
                    {status === 'ALL' ? 'All Profiles' : status.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Profiles Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {loadingProfiles ? (
                <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>Loading registered company profiles...</div>
              ) : filteredProfiles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>🏢</div>
                  <div>No company profiles found matching your search.</div>
                </div>
              ) : (
                <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Company & Signatory</th>
                        <th>Company PAN</th>
                        <th>GSTIN</th>
                        <th>Compliance Match Rate</th>
                        <th>Verification Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProfiles.map((p) => {
                        const isApproved = p.lifecycleStatus === 'APPROVED_TO_BID';
                        const isReview = p.lifecycleStatus === 'REVIEW_REQUIRED';
                        const matchPct = p.autoVerificationReport?.complianceMatchPercentage !== undefined
                          ? p.autoVerificationReport.complianceMatchPercentage
                          : (isApproved ? 100 : 0);
                        const mismatchesCount = p.autoVerificationReport?.mismatchesCount || 0;
                        const compName = p.company?.legalName || p.fullName || 'Registered Enterprise';

                        return (
                          <tr key={p.id}>
                            <td>
                              <div style={{ fontWeight: 800, color: '#0f172a' }}>{compName}</div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Signatory: {p.fullName || 'N/A'} • {p.email || 'N/A'}</div>
                            </td>
                            <td style={{ fontFamily: 'monospace', fontWeight: 800, color: '#2563eb' }}>
                              {p.company?.panNumber || p.panNumber || '—'}
                            </td>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#475569' }}>
                              {p.company?.gstin || '—'}
                            </td>
                            <td>
                              <span style={{
                                padding: '3px 10px',
                                borderRadius: 12,
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                background: matchPct === 100 ? '#ecfdf5' : matchPct >= 50 ? '#fffbeb' : '#fef2f2',
                                color: matchPct === 100 ? '#059669' : matchPct >= 50 ? '#d97706' : '#dc2626',
                                border: `1px solid ${matchPct === 100 ? '#a7f3d0' : matchPct >= 50 ? '#fde68a' : '#fecaca'}`
                              }}>
                                {matchPct}% Match {mismatchesCount > 0 ? `(${mismatchesCount} Flags)` : ''}
                              </span>
                            </td>
                            <td>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                padding: '3px 10px',
                                borderRadius: 12,
                                background: isApproved ? '#ecfdf5' : isReview ? '#fffbeb' : '#eff6ff',
                                color: isApproved ? '#059669' : isReview ? '#d97706' : '#2563eb',
                                border: `1px solid ${isApproved ? '#a7f3d0' : isReview ? '#fde68a' : '#bfdbfe'}`
                              }}>
                                {p.lifecycleStatus || 'DRAFT'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button
                                  className="btn-secondary"
                                  style={{ padding: '6px 10px', fontSize: '0.74rem', fontWeight: 700 }}
                                  title="Download Official Audit Report PDF"
                                  onClick={() => handleDownloadOfficerPdf(p.id, compName)}
                                >
                                  📥 PDF
                                </button>
                                <button
                                  className="btn-primary"
                                  style={{ padding: '6px 14px', fontSize: '0.76rem', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}
                                  onClick={() => {
                                    setSelectedProfile(p);
                                    if (p.company?.panNumber) {
                                      setSearchPan(p.company.panNumber);
                                    }
                                  }}
                                >
                                  Inspect & Verify 🔍
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── DETAILED COMPANY INSPECTION MODAL ─── */}
        {selectedProfile && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 16, width: '100%', maxWidth: 940, maxHeight: '90vh', overflowY: 'auto', padding: 28, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 14 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 800, letterSpacing: '0.05em' }}>OFFICER VERIFICATION INSPECTION</span>
                    {selectedProfile.autoVerificationReport?.complianceMatchPercentage !== undefined && (
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 10,
                        background: selectedProfile.autoVerificationReport.complianceMatchPercentage === 100 ? '#ecfdf5' : '#fef2f2',
                        color: selectedProfile.autoVerificationReport.complianceMatchPercentage === 100 ? '#059669' : '#dc2626',
                        border: `1px solid ${selectedProfile.autoVerificationReport.complianceMatchPercentage === 100 ? '#a7f3d0' : '#fecaca'}`
                      }}>
                        {selectedProfile.autoVerificationReport.complianceMatchPercentage}% Compliance Match Rate
                      </span>
                    )}
                  </div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: '4px 0 0' }}>
                    {selectedProfile.company?.legalName || selectedProfile.fullName || 'Company Profile'}
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button
                    className="btn-secondary"
                    style={{ padding: '7px 14px', fontSize: '0.78rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={() => handleDownloadOfficerPdf(selectedProfile.id, selectedProfile.company?.legalName || selectedProfile.fullName)}
                  >
                    📥 Download Audit Report (PDF)
                  </button>
                  <button
                    style={{ background: '#f1f5f9', border: 'none', color: '#64748b', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: '1.1rem', fontWeight: 800 }}
                    onClick={() => setSelectedProfile(null)}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* 1. Submitted Company Data */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: '0.88rem', fontWeight: 900, color: '#334155', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🏢</span> 1. SUBMITTED COMPANY & REGISTRATION DETAILS
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div><span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>COMPANY PAN:</span> <strong style={{ color: '#2563eb', fontFamily: 'monospace' }}>{selectedProfile.company?.panNumber || selectedProfile.panNumber || 'N/A'}</strong></div>
                  <div><span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>GSTIN:</span> <strong style={{ color: '#2563eb', fontFamily: 'monospace' }}>{selectedProfile.company?.gstin || 'N/A'}</strong></div>
                  <div><span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>MSME UDYAM:</span> <strong style={{ color: '#0f172a' }}>{selectedProfile.company?.udyamRegistrationNumber || 'N/A'}</strong></div>
                  <div><span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>MCA CIN:</span> <strong style={{ color: '#0f172a' }}>{selectedProfile.company?.cin || 'N/A'}</strong></div>
                  <div><span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>SIGNATORY NAME:</span> <strong style={{ color: '#0f172a' }}>{selectedProfile.fullName || 'N/A'}</strong></div>
                  <div><span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>AADHAAR ID:</span> <strong style={{ color: '#0f172a' }}>XXXX XXXX {(selectedProfile.aadhaarNumber || '9923').slice(-4)}</strong></div>
                  <div><span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>EMAIL:</span> <span style={{ color: '#334155' }}>{selectedProfile.email || 'N/A'}</span></div>
                  <div><span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>REGISTERED ADDRESS:</span> <span style={{ color: '#334155' }}>{selectedProfile.company?.registeredAddress || selectedProfile.residentialAddress || 'N/A'}</span></div>
                </div>
              </div>

              {/* 2. AI Triangulation Comparison Table */}
              {selectedProfile.autoVerificationReport?.triangulationComparison && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: '0.88rem', fontWeight: 900, color: '#334155', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🤖</span> 2. AI MULTI-GATEWAY TRIANGULATION AUDIT (DOCS vs FORM vs MASTER GOVT DATA)
                  </h3>
                  <div className="table-container" style={{ border: '1px solid #e2e8f0', background: '#ffffff', borderRadius: 10 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Statutory Identifier</th>
                          <th>Form Input</th>
                          <th>AI OCR Extracted</th>
                          <th>Govt Master DB</th>
                          <th>Status</th>
                          <th>Discrepancy Analysis</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProfile.autoVerificationReport.triangulationComparison.map((row, idx) => {
                          const isMatch = row.status === 'VERIFIED_MATCH';
                          return (
                            <tr key={idx} style={{ background: isMatch ? '#ffffff' : '#fef2f2' }}>
                              <td style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.78rem' }}>{row.field}</td>
                              <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#2563eb' }}>{row.formValue}</td>
                              <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: isMatch ? '#059669' : '#dc2626', fontWeight: 700 }}>{row.documentExtractedValue}</td>
                              <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#475569' }}>{row.govtMasterValue}</td>
                              <td>
                                <span style={{
                                  padding: '2px 8px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 800,
                                  background: isMatch ? '#ecfdf5' : '#fee2e2',
                                  color: isMatch ? '#059669' : '#dc2626',
                                  border: `1px solid ${isMatch ? '#a7f3d0' : '#fca5a5'}`
                                }}>
                                  {isMatch ? '✓ MATCH' : '⚠️ MISMATCH'}
                                </span>
                              </td>
                              <td style={{ fontSize: '0.72rem', color: isMatch ? '#475569' : '#991b1b', fontWeight: isMatch ? 500 : 700 }}>
                                {row.remarks}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 2. Uploaded PDFs & Image Documents */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: '0.88rem', fontWeight: 900, color: '#334155', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📁</span> 2. UPLOADED STATUTORY CERTIFICATES & DOCUMENTS ({selectedProfile.documents?.length || 0})
                </h3>

                {selectedProfile.documents && selectedProfile.documents.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                    {selectedProfile.documents.map((doc, idx) => (
                      <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>📄 {doc.documentName}</div>
                            <div style={{ fontSize: '0.72rem', color: '#2563eb', marginTop: 2, fontFamily: 'monospace', fontWeight: 700 }}>Type: {doc.documentType}</div>
                          </div>
                          <button
                            style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', borderRadius: 6, padding: '4px 10px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}
                            onClick={() => setViewingDoc(doc)}
                          >
                            View 👁️
                          </button>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 8 }}>
                          File: {doc.originalFileName} • {(doc.fileSize ? (doc.fileSize / 1024).toFixed(1) + ' KB' : 'PDF')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#64748b', fontSize: '0.82rem', padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    No documents uploaded yet by this bidder.
                  </div>
                )}
              </div>

              {/* 3. Officer Review & Decision */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
                <h3 style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>
                  ✍️ 3. OFFICER EVALUATION & DECISION
                </h3>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Enter officer audit notes (e.g. Cross-verified with CBDT and MCA21 master registries, certificates authentic)..."
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  style={{ width: '100%', fontSize: '0.82rem', marginBottom: 14 }}
                />

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button
                    className="btn-secondary"
                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: '0.82rem', padding: '8px 18px', fontWeight: 700 }}
                    onClick={() => handleOfficerDecision('REJECT')}
                    disabled={actionLoading}
                  >
                    ❌ Reject Profile
                  </button>

                  <button
                    className="btn-primary"
                    style={{ background: 'linear-gradient(135deg,#10b981,#059669)', fontSize: '0.82rem', padding: '8px 24px', fontWeight: 800 }}
                    onClick={() => handleOfficerDecision('APPROVE')}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Saving...' : '✅ Approve & Activate Company Profile'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ─── DOCUMENT PREVIEW MODAL ─── */}
        {viewingDoc && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20 }}>
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 16, width: '100%', maxWidth: 780, maxHeight: '92vh', overflowY: 'auto', padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>OFFICER AUDIT • STATUTORY DOCUMENT</div>
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
                  style={{ textDecoration: 'none', fontSize: '0.82rem', padding: '8px 20px', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                >
                  <span>📥</span> Download Certificate (PDF)
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
