import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/Sidebar';
import api from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ROLE_COLOR = {
  ADMIN: '#dc2626',
  PROCUREMENT_OFFICER: '#2563eb',
  REVIEWER: '#059669',
  BIDDER: '#7c3aed',
};

const ROLE_LABELS = {
  ADMIN: 'System Administrator',
  PROCUREMENT_OFFICER: 'Procurement Officer',
  REVIEWER: 'Compliance Reviewer',
  BIDDER: 'Registered Supplier / Bidder',
};

export default function AdminPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'companies' ? 'companies' : 'gem_users';

  const [activeTab, setActiveTab] = useState(initialTab);

  // ── GeM Users State ──
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'PROCUREMENT_OFFICER',
    organization: '',
    phone: '',
    password: 'Admin@123456'
  });

  // ── Registered Companies State ──
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [companySearch, setCompanySearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('ALL');

  // Load GeM and System Users
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await api.get('/admin/users');
      if (Array.isArray(res.data)) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load Registered Companies / Bidder Profiles
  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const res = await api.get('/bidder-onboarding/all-company-profiles');
      if (Array.isArray(res.data)) {
        setCompanies(res.data);
      }
    } catch (err) {
      console.error('Failed to load company profiles:', err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, []);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };

  // Filter GeM Users (Government Officers & Platform Staff)
  const gemUsers = users.filter(u => u.role !== 'BIDDER');
  const pendingGemUsers = gemUsers.filter(u => u.approvalStatus === 'PENDING');
  const activeGemUsers = gemUsers.filter(u => u.approvalStatus !== 'PENDING');

  // Filter and Sort Registered Companies
  const filteredCompanies = companies
    .filter(c => {
      const name = (c.company?.legalName || c.fullName || '').toLowerCase();
      const pan = (c.company?.panNumber || c.panNumber || '').toLowerCase();
      const gstin = (c.company?.gstin || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const q = companySearch.toLowerCase();

      const matchesSearch = name.includes(q) || pan.includes(q) || gstin.includes(q) || email.includes(q);
      const matchesFilter = companyFilter === 'ALL' || c.lifecycleStatus === companyFilter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const timeA = new Date(a.createdAt || a.submittedAt || 0).getTime();
      const timeB = new Date(b.createdAt || b.submittedAt || 0).getTime();
      return timeB - timeA;
    });

  // User Approval & Suspension Handlers
  const handleApprove = async (id, name) => {
    try {
      await api.post(`/admin/users/${id}/approve`, { remarks: 'Approved by administrator' });
      toast.success(`Account approved for ${name}`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to approve account');
    }
  };

  const handleReject = async (id, name) => {
    try {
      await api.post(`/admin/users/${id}/reject`, { remarks: 'Rejected by administrator' });
      toast.error(`Account registration rejected for ${name}`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to reject account');
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      if (currentStatus) {
        await api.post(`/admin/users/${id}/suspend`, { remarks: 'Suspended by administrator' });
        toast.success('User account suspended');
      } else {
        await api.post(`/admin/users/${id}/reactivate`, {});
        toast.success('User account reactivated');
      }
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return toast.error('Please enter name and email');
    try {
      await api.post('/auth/register', {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        organization: newUser.organization || 'GeM Administration Authority',
        phone: newUser.phone,
        password: newUser.password || 'Admin@123456'
      });
      toast.success(`GeM account for ${newUser.name} provisioned successfully!`);
      setShowCreateUser(false);
      setNewUser({ name: '', email: '', role: 'PROCUREMENT_OFFICER', organization: '', phone: '', password: 'Admin@123456' });
      fetchUsers();
    } catch (err) {
      toast.error('Failed to provision user: ' + (err.response?.data?.error || err.message));
    }
  };

  // Download Official PDF Audit Report for Company
  const handleDownloadCompanyPdf = async (profileId, compName) => {
    try {
      toast.loading('Generating Official Statutory Audit Report PDF...', { id: 'admin-pdf-toast' });
      const res = await api.get(`/bidder-onboarding/verification-report/pdf/${profileId}`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ComplyGeM_Company_Audit_${(compName || 'Supplier').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('✓ PDF downloaded successfully!', { id: 'admin-pdf-toast' });
    } catch (err) {
      toast.error('Failed to generate PDF audit report.', { id: 'admin-pdf-toast' });
    }
  };

  return (
    <AppLayout>
      {/* ── Page Header ── */}
      <div className="page-header" style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '24px 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '1.3rem' }}>🛡️</span>
              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.5rem', color: '#0f172a', margin: 0 }}>
                User Management & Platform Directory
              </h1>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
              Centrally manage authorized GeM personnel and inspect registered vendor companies with statutory details.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '8px 16px' }}
              onClick={() => navigate('/tenders')}
            >
              📋 Tender Monitoring
            </button>
            <button
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '8px 16px' }}
              onClick={() => navigate('/profile')}
            >
              👤 Administrator Profile
            </button>
            <button
              className="btn-primary"
              style={{ fontSize: '0.82rem', padding: '8px 18px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
              onClick={() => setShowCreateUser(true)}
            >
              + Provision GeM Officer
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '24px auto', padding: '0 24px' }}>
        {/* ── Dual Primary User Management Tabs ── */}
        <div style={{ display: 'flex', gap: 12, borderBottom: '2px solid #e2e8f0', paddingBottom: 14, marginBottom: 24 }}>
          <button
            onClick={() => handleTabChange('gem_users')}
            style={{
              padding: '10px 22px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'gem_users' ? '#eff6ff' : '#ffffff',
              color: activeTab === 'gem_users' ? '#1d4ed8' : '#64748b',
              fontWeight: 800,
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: activeTab === 'gem_users' ? '0 1px 3px rgba(37,99,235,0.15)' : 'none',
              borderBottom: activeTab === 'gem_users' ? '3px solid #2563eb' : '3px solid transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <span>🏛️</span>
            <span>GeM Users & Staff ({gemUsers.length})</span>
            {pendingGemUsers.length > 0 && (
              <span style={{ fontSize: '0.7rem', background: '#f59e0b', color: '#fff', padding: '2px 8px', borderRadius: 12, fontWeight: 900 }}>
                {pendingGemUsers.length} Pending
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('companies')}
            style={{
              padding: '10px 22px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'companies' ? '#eff6ff' : '#ffffff',
              color: activeTab === 'companies' ? '#1d4ed8' : '#64748b',
              fontWeight: 800,
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: activeTab === 'companies' ? '0 1px 3px rgba(37,99,235,0.15)' : 'none',
              borderBottom: activeTab === 'companies' ? '3px solid #2563eb' : '3px solid transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <span>🏢</span>
            <span>Registered Companies with Details ({companies.length})</span>
          </button>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* 1. 🏛️ GeM USERS & GOVERNMENT PERSONNEL VIEW                         */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'gem_users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Pending Approvals Table */}
            {pendingGemUsers.length > 0 && (
              <div className="card" style={{ border: '1px solid #fde68a', background: '#fffbeb', padding: 0 }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #fef3c7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>⏳</span> Officer Registration Requests Awaiting Admin Approval ({pendingGemUsers.length})
                  </span>
                </div>
                <div className="table-container" style={{ border: 'none', background: '#ffffff' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Officer Name</th>
                        <th>Official Email</th>
                        <th>Ministry / Department</th>
                        <th>Requested Role</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingGemUsers.map((p) => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 800, color: '#0f172a' }}>{p.name}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#2563eb' }}>{p.email}</td>
                          <td style={{ color: '#475569' }}>{p.organization || 'Ministry of Commerce & Industry'}</td>
                          <td>
                            <span style={{
                              padding: '3px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 800,
                              background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe'
                            }}>
                              {p.role.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                              <button
                                className="btn-primary"
                                style={{ fontSize: '0.74rem', padding: '5px 12px', background: '#10b981' }}
                                onClick={() => handleApprove(p.id, p.name)}
                              >
                                ✓ Approve
                              </button>
                              <button
                                className="btn-secondary"
                                style={{ fontSize: '0.74rem', padding: '5px 12px', color: '#dc2626', borderColor: '#fecaca' }}
                                onClick={() => handleReject(p.id, p.name)}
                              >
                                ✕ Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Active Platform Users Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                  Authorized GeM Procurement Officers & Administrators ({activeGemUsers.length})
                </span>
                <button
                  className="btn-primary"
                  style={{ fontSize: '0.76rem', padding: '6px 14px' }}
                  onClick={() => setShowCreateUser(true)}
                >
                  + Add Officer
                </button>
              </div>

              {loadingUsers ? (
                <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>Loading authorized users...</div>
              ) : activeGemUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>No GeM users provisioned.</div>
              ) : (
                <div className="table-container" style={{ border: 'none' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Officer / User Name</th>
                        <th>Official Email</th>
                        <th>Ministry / Department</th>
                        <th>Assigned Role</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeGemUsers.map((u) => (
                        <tr key={u.id}>
                          <td>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{u.name}</div>
                            {u.phone && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>📞 {u.phone}</div>}
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#2563eb' }}>{u.email}</td>
                          <td style={{ color: '#475569', fontSize: '0.82rem' }}>{u.organization || 'Government Procurement Authority'}</td>
                          <td>
                            <span style={{
                              padding: '3px 10px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 800,
                              background: u.role === 'ADMIN' ? '#fef2f2' : '#eff6ff',
                              color: u.role === 'ADMIN' ? '#dc2626' : '#2563eb',
                              border: `1px solid ${u.role === 'ADMIN' ? '#fecaca' : '#bfdbfe'}`
                            }}>
                              {ROLE_LABELS[u.role] || u.role.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              padding: '3px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 800,
                              color: u.isActive ? '#059669' : '#dc2626',
                              background: u.isActive ? '#ecfdf5' : '#fef2f2',
                              border: `1px solid ${u.isActive ? '#a7f3d0' : '#fecaca'}`
                            }}>
                              {u.isActive ? '● Active' : '○ Suspended'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="btn-secondary"
                              style={{
                                fontSize: '0.74rem', padding: '5px 12px',
                                color: u.isActive ? '#dc2626' : '#059669',
                                borderColor: u.isActive ? '#fecaca' : '#a7f3d0'
                              }}
                              onClick={() => handleToggleActive(u.id, u.isActive)}
                            >
                              {u.isActive ? 'Suspend' : 'Reactivate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* 2. 🏢 REGISTERED COMPANIES WITH DETAILS VIEW                         */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'companies' && (
          <div>
            {/* Search and Filters Bar */}
            <div className="card" style={{ padding: 18, marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 280, maxWidth: 500 }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Search by Company Name, Signatory, PAN, or GSTIN..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { key: 'ALL', label: 'All Companies' },
                    { key: 'APPROVED_TO_BID', label: 'Approved to Bid' },
                    { key: 'UNDER_OFFICER_REVIEW', label: 'Under Review' },
                    { key: 'REGISTERED', label: 'Newly Registered' },
                    { key: 'REJECTED', label: 'Rejected' },
                  ].map(f => (
                    <button
                      key={f.key}
                      onClick={() => setCompanyFilter(f.key)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: companyFilter === f.key ? '#eff6ff' : '#ffffff',
                        color: companyFilter === f.key ? '#1d4ed8' : '#64748b',
                        border: `1px solid ${companyFilter === f.key ? '#bfdbfe' : '#cbd5e1'}`
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Companies Details Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                  Registered Supplier Enterprises & Companies ({filteredCompanies.length})
                </span>
                <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                  Ordered with newly registered companies at the top
                </span>
              </div>

              {loadingCompanies ? (
                <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>Loading registered companies...</div>
              ) : filteredCompanies.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>🏢</div>
                  <div>No company profiles found matching your search.</div>
                </div>
              ) : (
                <div className="table-container" style={{ border: 'none' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Company Name & Signatory</th>
                        <th>PAN & GSTIN</th>
                        <th>Statutory Registrations</th>
                        <th>Registered Address</th>
                        <th>Registration Date</th>
                        <th>Compliance Status</th>
                        <th style={{ textAlign: 'right' }}>Audit Report</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCompanies.map((c) => {
                        const compName = c.company?.legalName || c.fullName || 'Registered Enterprise';
                        const isApproved = c.lifecycleStatus === 'APPROVED_TO_BID';
                        const isRejected = c.lifecycleStatus === 'REJECTED';

                        let formattedDate = 'Recent';
                        try {
                          if (c.createdAt) {
                            formattedDate = format(new Date(c.createdAt), 'dd MMM yyyy');
                          }
                        } catch (_) {}

                        return (
                          <tr key={c.id}>
                            {/* Company & Signatory */}
                            <td>
                              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>{compName}</div>
                              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>
                                👤 {c.fullName || 'Authorized Signatory'} • ✉️ {c.email || 'N/A'}
                              </div>
                              {c.mobileNumber && (
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                  📞 {c.mobileNumber}
                                </div>
                              )}
                            </td>

                            {/* PAN & GSTIN */}
                            <td>
                              <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#2563eb', fontSize: '0.82rem' }}>
                                PAN: {c.company?.panNumber || c.panNumber || '—'}
                              </div>
                              <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#475569', marginTop: 2 }}>
                                GSTIN: {c.company?.gstin || '—'}
                              </div>
                            </td>

                            {/* Statutory IDs (Udyam, CIN) */}
                            <td>
                              <div style={{ fontSize: '0.75rem', color: '#334155' }}>
                                <span style={{ color: '#64748b', fontWeight: 600 }}>Udyam:</span> {c.company?.udyamRegistrationNumber || 'N/A'}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: 2 }}>
                                <span style={{ color: '#64748b', fontWeight: 600 }}>CIN:</span> {c.company?.cin || 'N/A'}
                              </div>
                            </td>

                            {/* Registered Address */}
                            <td style={{ fontSize: '0.76rem', color: '#475569', maxWidth: 220 }}>
                              {c.company?.registeredAddress || c.residentialAddress || (c.city ? `${c.city}, ${c.state || ''}` : 'Verified Registered Office')}
                            </td>

                            {/* Registration Date */}
                            <td style={{ fontSize: '0.76rem', color: '#475569', whiteSpace: 'nowrap' }}>
                              {formattedDate}
                            </td>

                            {/* Compliance Status */}
                            <td>
                              <span style={{
                                padding: '3px 10px',
                                borderRadius: 12,
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                background: isApproved ? '#ecfdf5' : isRejected ? '#fef2f2' : '#eff6ff',
                                color: isApproved ? '#059669' : isRejected ? '#dc2626' : '#2563eb',
                                border: `1px solid ${isApproved ? '#a7f3d0' : isRejected ? '#fecaca' : '#bfdbfe'}`
                              }}>
                                {c.lifecycleStatus || 'DRAFT'}
                              </span>
                            </td>

                            {/* Action: PDF Audit Report */}
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '0.74rem', fontWeight: 700 }}
                                title="Download Official Company Audit Report PDF"
                                onClick={() => handleDownloadCompanyPdf(c.id, compName)}
                              >
                                📥 PDF Report
                              </button>
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
      </div>

      {/* ── Modal: Provision GeM User ── */}
      {showCreateUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowCreateUser(false)}>
          <div className="card" style={{ maxWidth: 520, width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', padding: 28, borderRadius: 16, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                🏛️ Provision New GeM Officer Account
              </h2>
              <button style={{ background: '#f1f5f9', border: 'none', color: '#64748b', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontWeight: 800 }} onClick={() => setShowCreateUser(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 800, display: 'block', marginBottom: 4 }}>OFFICER FULL NAME *</label>
                <input className="input" placeholder="e.g. Rajesh Kumar" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} required style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 800, display: 'block', marginBottom: 4 }}>GOVERNMENT EMAIL ADDRESS *</label>
                <input className="input" type="email" placeholder="e.g. rajesh.kumar@labour.gov.in" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 800, display: 'block', marginBottom: 4 }}>ASSIGNED ROLE *</label>
                <select className="input" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} style={{ width: '100%', fontWeight: 700 }}>
                  <option value="PROCUREMENT_OFFICER">🏛️ Procurement Officer</option>
                  <option value="REVIEWER">🔍 Compliance & Review Officer</option>
                  <option value="ADMIN">🛡️ Platform Administrator</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 800, display: 'block', marginBottom: 4 }}>MINISTRY / DEPARTMENT</label>
                <input className="input" placeholder="e.g. Ministry of Labour & Employment" value={newUser.organization} onChange={e => setNewUser({ ...newUser, organization: e.target.value })} style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 800, display: 'block', marginBottom: 4 }}>CONTACT PHONE NUMBER</label>
                <input className="input" placeholder="e.g. +91 98450 12345" value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button type="button" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowCreateUser(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>Provision GeM Account →</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
