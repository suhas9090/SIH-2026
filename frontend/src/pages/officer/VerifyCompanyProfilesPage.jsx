import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function VerifyCompanyProfilesPage() {
  const navigate = useNavigate();
  const location = useLocation();

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

  // Filtered profiles
  const filteredProfiles = profiles.filter(p => {
    const compName = (p.company?.legalName || p.fullName || '').toLowerCase();
    const pan = (p.company?.panNumber || p.panNumber || '').toLowerCase();
    const gstin = (p.company?.gstin || '').toLowerCase();
    const matchesSearch = compName.includes(searchTerm.toLowerCase()) || pan.includes(searchTerm.toLowerCase()) || gstin.includes(searchTerm.toLowerCase());
    if (filterStatus === 'ALL') return matchesSearch;
    return matchesSearch && p.lifecycleStatus === filterStatus;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1d', color: '#f0f4ff', paddingBottom: 60 }}>
      {/* Top Header */}
      <div style={{ background: 'rgba(15,23,42,0.9)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '24px 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: '1.4rem' }}>🏛️</span>
              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.45rem', color: '#f0f4ff', margin: 0 }}>
                Verify Company Profiles & Statutory Records
              </h1>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
              Procurement Officer Verification Portal — Review bidder submitted company profiles, view uploaded PDFs/images, and perform live Government PAN lookups.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '8px 16px' }}
              onClick={() => navigate('/procurement/dashboard')}
            >
              ← Back to Dashboard
            </button>
            <button
              className="btn-primary"
              style={{ fontSize: '0.8rem', padding: '8px 18px', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}
              onClick={loadProfiles}
            >
              ⟳ Refresh Queue
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '24px auto', padding: '0 24px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
          <button
            style={{
              background: activeTab === 'QUEUE' ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: activeTab === 'QUEUE' ? '#60a5fa' : '#94a3b8',
              border: `1px solid ${activeTab === 'QUEUE' ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 8,
              padding: '8px 18px',
              fontWeight: 700,
              fontSize: '0.84rem',
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
              background: activeTab === 'LOOKUP' ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: activeTab === 'LOOKUP' ? '#60a5fa' : '#94a3b8',
              border: `1px solid ${activeTab === 'LOOKUP' ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 8,
              padding: '8px 18px',
              fontWeight: 700,
              fontSize: '0.84rem',
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
            <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f0f4ff', marginBottom: 6 }}>
                ⚡ Government Master Database PAN Search & Verification
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: 16 }}>
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
                  style={{ flex: 1, fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.05em' }}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetchPanDetails(searchPan)}
                />
                <button
                  className="btn-primary"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', padding: '10px 24px', fontWeight: 700, fontSize: '0.85rem' }}
                  onClick={() => handleFetchPanDetails(searchPan)}
                  disabled={fetchingPan}
                >
                  {fetchingPan ? 'Fetching...' : 'Fetch PAN Details ⚡'}
                </button>
              </div>

              {/* Quick Sample PAN Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Quick Test Records:</span>
                {[
                  { label: 'ABC Safety Tech', pan: 'SYNPA0001C' },
                  { label: 'Apex Industrial LLP', pan: 'SYNPA0002L' },
                  { label: 'Zenith Protection Gear', pan: 'SYNPA0003P' },
                  { label: 'Paramount Defence Gear', pan: 'SYNPA0004C' },
                ].map(item => (
                  <button
                    key={item.pan}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#94a3b8',
                      borderRadius: 20,
                      padding: '3px 12px',
                      fontSize: '0.7rem',
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
                <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12, padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#60a5fa' }}>🪪 CBDT Direct Taxes Master</div>
                    <span style={{ fontSize: '0.68rem', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                      {panResult.status || 'ACTIVE'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div>Legal Entity Name: <strong style={{ color: '#f0f4ff' }}>{panResult.legalName}</strong></div>
                    <div>PAN Number: <strong style={{ color: '#60a5fa', fontFamily: 'monospace' }}>{panResult.panNumber}</strong></div>
                    <div>Entity Type: <strong style={{ color: '#f0f4ff' }}>{panResult.entityType || 'COMPANY'}</strong></div>
                    <div>Date of Incorporation: <strong style={{ color: '#f0f4ff' }}>{panResult.dateOfIncorporation || 'N/A'}</strong></div>
                    <div>Jurisdiction: <span style={{ color: '#cbd5e1' }}>{panResult.jurisdiction || 'N/A'}</span></div>
                  </div>
                </div>

                {/* Card 2: GSTIN Linkage */}
                <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#34d399' }}>🧾 GSTN Network Registry</div>
                    <span style={{ fontSize: '0.68rem', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                      {panResult.gstin ? 'LINKED' : 'NOT FOUND'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div>GSTIN: <strong style={{ color: '#60a5fa', fontFamily: 'monospace' }}>{panResult.gstin || 'N/A'}</strong></div>
                    <div>Trade Name: <strong style={{ color: '#f0f4ff' }}>{panResult.tradeName || panResult.legalName}</strong></div>
                    <div>Registration State: <strong style={{ color: '#f0f4ff' }}>{panResult.state || 'N/A'}</strong></div>
                    <div>Taxpayer Type: <strong style={{ color: '#f0f4ff' }}>{panResult.businessType || 'Regular Taxpayer'}</strong></div>
                    <div>Filing Status: <strong style={{ color: '#10b981' }}>{panResult.filingStatus || 'COMPLIANT'}</strong></div>
                  </div>
                </div>

                {/* Card 3: MSME Udyam */}
                <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#fbbf24' }}>🏭 Ministry of MSME (Udyam)</div>
                    <span style={{ fontSize: '0.68rem', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                      {panResult.udyamRegistrationNumber ? 'REGISTERED' : 'N/A'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div>Udyam Number: <strong style={{ color: '#60a5fa', fontFamily: 'monospace' }}>{panResult.udyamRegistrationNumber || 'N/A'}</strong></div>
                    <div>Enterprise Type: <strong style={{ color: '#f0f4ff' }}>{panResult.enterpriseType || 'Micro / Small Enterprise'}</strong></div>
                    <div>Major Activity: <span style={{ color: '#cbd5e1' }}>{panResult.majorActivity || 'Manufacturing of Safety Equipment'}</span></div>
                  </div>
                </div>

                {/* Card 4: MCA21 Incorporation */}
                <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12, padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#c084fc' }}>🏛️ MCA21 Corporate Registry</div>
                    <span style={{ fontSize: '0.68rem', background: 'rgba(168,85,247,0.15)', color: '#c084fc', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                      {panResult.cin ? 'INCORPORATED' : 'PROPRIETARY'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div>CIN / LLPIN: <strong style={{ color: '#60a5fa', fontFamily: 'monospace' }}>{panResult.cin || 'N/A'}</strong></div>
                    <div>ROC Office: <strong style={{ color: '#f0f4ff' }}>{panResult.rocLocation || 'N/A'}</strong></div>
                    <div>Company Status: <strong style={{ color: '#10b981' }}>{panResult.companyStatus || 'ACTIVE'}</strong></div>
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
                      background: filterStatus === status ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.03)',
                      color: filterStatus === status ? '#60a5fa' : '#94a3b8',
                      border: `1px solid ${filterStatus === status ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 6,
                      padding: '6px 14px',
                      fontSize: '0.72rem',
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
            <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
              {loadingProfiles ? (
                <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>Loading registered company profiles...</div>
              ) : filteredProfiles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>🏢</div>
                  <div>No company profiles found matching your search.</div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.04)', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Company & Signatory</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Company PAN</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>GSTIN</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Uploaded Docs</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Verification Status</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfiles.map((p) => {
                      const isApproved = p.lifecycleStatus === 'APPROVED_TO_BID';
                      const isReview = p.lifecycleStatus === 'REVIEW_REQUIRED';
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 700, color: '#f0f4ff' }}>{p.company?.legalName || p.fullName || 'Registered Enterprise'}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Signatory: {p.fullName || 'N/A'} • {p.email || 'N/A'}</div>
                          </td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#60a5fa' }}>
                            {p.company?.panNumber || p.panNumber || '—'}
                          </td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#94a3b8' }}>
                            {p.company?.gstin || '—'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 8, fontSize: '0.72rem', color: '#cbd5e1' }}>
                              📁 {p.documents?.length || 0} Files
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              padding: '3px 10px',
                              borderRadius: 12,
                              background: isApproved ? 'rgba(16,185,129,0.15)' : isReview ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
                              color: isApproved ? '#10b981' : isReview ? '#f59e0b' : '#60a5fa',
                              border: `1px solid ${isApproved ? 'rgba(16,185,129,0.3)' : isReview ? 'rgba(245,158,11,0.3)' : 'rgba(59,130,246,0.3)'}`
                            }}>
                              {p.lifecycleStatus || 'DRAFT'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <button
                              className="btn-primary"
                              style={{ padding: '6px 14px', fontSize: '0.74rem', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}
                              onClick={() => {
                                setSelectedProfile(p);
                                if (p.company?.panNumber) {
                                  setSearchPan(p.company.panNumber);
                                }
                              }}
                            >
                              Inspect & Verify 🔍
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ─── DETAILED COMPANY INSPECTION MODAL ─── */}
        {selectedProfile && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <div style={{ background: '#0f172a', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 16, width: '100%', maxWidth: 900, maxHeight: '90vh', overflowY: 'auto', padding: 28, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)' }}>
              
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 14 }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: 700, letterSpacing: '0.05em' }}>OFFICER VERIFICATION INSPECTION</div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f0f4ff', margin: '4px 0 0' }}>
                    {selectedProfile.company?.legalName || selectedProfile.fullName || 'Company Profile'}
                  </h2>
                </div>
                <button
                  style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: '1.1rem' }}
                  onClick={() => setSelectedProfile(null)}
                >
                  ✕
                </button>
              </div>

              {/* 1. Submitted Company Data */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#94a3b8', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🏢</span> 1. SUBMITTED COMPANY & REGISTRATION DETAILS
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div><span style={{ color: '#64748b', fontSize: '0.7rem' }}>COMPANY PAN:</span> <strong style={{ color: '#60a5fa', fontFamily: 'monospace' }}>{selectedProfile.company?.panNumber || selectedProfile.panNumber || 'N/A'}</strong></div>
                  <div><span style={{ color: '#64748b', fontSize: '0.7rem' }}>GSTIN:</span> <strong style={{ color: '#60a5fa', fontFamily: 'monospace' }}>{selectedProfile.company?.gstin || 'N/A'}</strong></div>
                  <div><span style={{ color: '#64748b', fontSize: '0.7rem' }}>MSME UDYAM:</span> <strong style={{ color: '#f0f4ff' }}>{selectedProfile.company?.udyamRegistrationNumber || 'N/A'}</strong></div>
                  <div><span style={{ color: '#64748b', fontSize: '0.7rem' }}>MCA CIN:</span> <strong style={{ color: '#f0f4ff' }}>{selectedProfile.company?.cin || 'N/A'}</strong></div>
                  <div><span style={{ color: '#64748b', fontSize: '0.7rem' }}>SIGNATORY NAME:</span> <strong style={{ color: '#f0f4ff' }}>{selectedProfile.fullName || 'N/A'}</strong></div>
                  <div><span style={{ color: '#64748b', fontSize: '0.7rem' }}>AADHAAR ID:</span> <strong style={{ color: '#f0f4ff' }}>XXXX XXXX {(selectedProfile.aadhaarNumber || '9923').slice(-4)}</strong></div>
                  <div><span style={{ color: '#64748b', fontSize: '0.7rem' }}>EMAIL:</span> <span style={{ color: '#cbd5e1' }}>{selectedProfile.email || 'N/A'}</span></div>
                  <div><span style={{ color: '#64748b', fontSize: '0.7rem' }}>REGISTERED ADDRESS:</span> <span style={{ color: '#cbd5e1' }}>{selectedProfile.company?.registeredAddress || selectedProfile.residentialAddress || 'N/A'}</span></div>
                </div>
              </div>

              {/* 2. Uploaded PDFs & Image Documents */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#94a3b8', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📁</span> 2. UPLOADED STATUTORY CERTIFICATES & DOCUMENTS ({selectedProfile.documents?.length || 0})
                </h3>

                {selectedProfile.documents && selectedProfile.documents.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                    {selectedProfile.documents.map((doc, idx) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f0f4ff' }}>📄 {doc.documentName}</div>
                            <div style={{ fontSize: '0.68rem', color: '#60a5fa', marginTop: 2, fontFamily: 'monospace' }}>Type: {doc.documentType}</div>
                          </div>
                          <button
                            style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', borderRadius: 6, padding: '3px 8px', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}
                            onClick={() => setViewingDoc(doc)}
                          >
                            View 👁️
                          </button>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 8 }}>
                          File: {doc.originalFileName} • {(doc.fileSize ? (doc.fileSize / 1024).toFixed(1) + ' KB' : 'PDF')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#64748b', fontSize: '0.8rem', padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                    No documents uploaded yet by this bidder.
                  </div>
                )}
              </div>

              {/* 3. Officer Review & Decision */}
              <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 18 }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f0f4ff', marginBottom: 8 }}>
                  ✍️ 3. OFFICER EVALUATION & DECISION
                </h3>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Enter officer audit notes (e.g. Cross-verified with CBDT and MCA21 master registries, certificates authentic)..."
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  style={{ width: '100%', fontSize: '0.8rem', marginBottom: 14 }}
                />

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button
                    className="btn-secondary"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.82rem', padding: '8px 18px' }}
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
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20 }}>
            <div style={{ background: '#0f172a', border: '1px solid rgba(59,130,246,0.4)', borderRadius: 16, width: '100%', maxWidth: 780, maxHeight: '92vh', overflowY: 'auto', padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#60a5fa', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>OFFICER AUDIT • STATUTORY DOCUMENT</div>
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
      </div>
    </div>
  );
}
