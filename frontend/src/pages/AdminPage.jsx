import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/Sidebar';
import api from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const DEMO_USERS = [
  { id: 'u1', name: 'Ramesh Kumar', email: 'ramesh@labour.gov.in', role: 'PROCUREMENT_OFFICER', organization: 'Ministry of Labour', approvalStatus: 'APPROVED', isActive: true, createdAt: new Date(Date.now() - 86400000 * 3) },
  { id: 'u2', name: 'Suresh Evaluator', email: 'suresh@nic.gov.in', role: 'REVIEWER', organization: 'NIC', approvalStatus: 'APPROVED', isActive: true, createdAt: new Date(Date.now() - 86400000 * 2) },
  { id: 'u3', name: 'Admin User', email: 'admin@complygem.gov.in', role: 'ADMIN', organization: 'ComplyGeM', approvalStatus: 'APPROVED', isActive: true, createdAt: new Date(Date.now() - 86400000 * 7) },
];

const DEMO_PENDING = [
  { id: 'p1', name: 'Priya Sharma', email: 'priya@pwd.gov.in', role: 'PROCUREMENT_OFFICER', organization: 'Public Works Department', organizationId: 'PWD/DELHI/2026', createdAt: new Date(Date.now() - 3600000) },
  { id: 'p2', name: 'Arjun Reviewer', email: 'arjun@dgft.gov.in', role: 'REVIEWER', organization: 'DGFT', organizationId: null, createdAt: new Date(Date.now() - 7200000) },
];

const ROLE_COLOR = { ADMIN: '#ef4444', PROCUREMENT_OFFICER: '#3b82f6', REVIEWER: '#10b981', BIDDER: '#8b5cf6' };
const APPROVAL_COLOR = { APPROVED: '#10b981', PENDING: '#f59e0b', REJECTED: '#ef4444' };

export default function AdminPage() {
  const [activeTab, setActiveTab]     = useState('approvals');
  const [users, setUsers]             = useState(DEMO_USERS);
  const [pending, setPending]         = useState(DEMO_PENDING);
  const [rejectionRemarks, setRejectionRemarks] = useState({});
  const [loading, setLoading]         = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, pendingRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/auth/pending-approvals'),
        ]);
        if (usersRes.data?.length)   setUsers(usersRes.data);
        if (pendingRes.data?.length) setPending(pendingRes.data);
      } catch { /* demo data */ }
    };
    fetchData();
  }, []);

  const handleApproval = async (userId, decision, name) => {
    setLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await api.post(`/auth/approve/${userId}`, {
        decision,
        remarks: rejectionRemarks[userId] || null,
      });
      toast.success(`${name} has been ${decision.toLowerCase()}.`);
      setPending(prev => prev.filter(u => u.id !== userId));
      if (decision === 'APPROVED') {
        // Refresh users list
        setUsers(prev => [...prev, {
          id: userId, name, approvalStatus: 'APPROVED', isActive: true,
        }]);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed.');
    } finally {
      setLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const toggleUser = async (userId, isActive, name) => {
    try {
      await api.put(`/admin/users/${userId}/toggle`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !isActive } : u));
      toast.success(`${name} has been ${isActive ? 'deactivated' : 'activated'}.`);
    } catch { toast.error('Update failed.'); }
  };

  const TABS = [
    { key: 'approvals', label: `⏳ Pending Approvals`, badge: pending.length },
    { key: 'users',     label: '👥 All Users',          badge: null },
    { key: 'rbac',      label: '🛡 RBAC Permissions',    badge: null },
  ];

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>
            Administration
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            User management, role approval, and access control
          </p>
        </div>
        {pending.length > 0 && (
          <div style={{
            padding: '10px 16px', background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10,
            fontSize: '0.875rem', color: '#f59e0b', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            ⚠ {pending.length} account{pending.length > 1 ? 's' : ''} awaiting your approval
          </div>
        )}
      </div>

      <div style={{ padding: '28px 32px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--bg-border)', paddingBottom: 1 }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.2s',
                color: activeTab === tab.key ? '#3b82f6' : '#64748b',
                borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
                marginBottom: -1, display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span style={{
                  background: '#f59e0b', color: '#0f1629', borderRadius: '50%',
                  width: 20, height: 20, fontSize: '0.7rem', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Pending Approvals Tab ── */}
        {activeTab === 'approvals' && (
          <div>
            {pending.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#4a6080' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
                <p style={{ color: '#64748b' }}>No pending approvals. All accounts are reviewed.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {pending.map(user => (
                  <div key={user.id} className="card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                      {/* User info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: `${ROLE_COLOR[user.role] || '#64748b'}20`,
                            border: `2px solid ${ROLE_COLOR[user.role] || '#64748b'}40`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, color: ROLE_COLOR[user.role], fontSize: '0.875rem',
                          }}>
                            {user.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#f0f4ff' }}>{user.name}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace' }}>{user.email}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                          {[
                            { label: 'Requested Role', value: user.role?.replace(/_/g, ' '), color: ROLE_COLOR[user.role] },
                            { label: 'Organization',   value: user.organization || '—' },
                            { label: 'Org ID',         value: user.organizationId || 'Not provided' },
                            { label: 'Submitted',      value: format(new Date(user.createdAt), 'dd MMM yyyy HH:mm') },
                          ].map(field => (
                            <div key={field.label}>
                              <div style={{ fontSize: '0.65rem', color: '#4a6080', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>
                                {field.label}
                              </div>
                              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: field.color || '#94a3b8' }}>
                                {field.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action panel */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 260 }}>
                        <textarea
                          className="input"
                          placeholder="Remarks (required for rejection)..."
                          value={rejectionRemarks[user.id] || ''}
                          onChange={e => setRejectionRemarks(prev => ({ ...prev, [user.id]: e.target.value }))}
                          style={{ height: 56, resize: 'none', fontSize: '0.8rem' }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn-primary"
                            disabled={loading[user.id]}
                            style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg, #059669, #10b981)', fontSize: '0.82rem', padding: '10px 12px' }}
                            onClick={() => handleApproval(user.id, 'APPROVED', user.name)}
                          >
                            {loading[user.id] ? '⟳' : '✓ Approve'}
                          </button>
                          <button
                            className="btn-secondary"
                            disabled={loading[user.id]}
                            style={{ flex: 1, justifyContent: 'center', borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444', fontSize: '0.82rem', padding: '10px 12px' }}
                            onClick={() => handleApproval(user.id, 'REJECTED', user.name)}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── All Users Tab ── */}
        {activeTab === 'users' && (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Organization</th>
                    <th>Approval</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td style={{ fontWeight: 600 }}>{user.name}</td>
                      <td style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '0.8rem' }}>{user.email}</td>
                      <td>
                        <span style={{
                          color: ROLE_COLOR[user.role], fontWeight: 700, fontSize: '0.72rem',
                          background: `${ROLE_COLOR[user.role] || '#64748b'}15`,
                          padding: '2px 10px', borderRadius: 20, border: `1px solid ${ROLE_COLOR[user.role] || '#64748b'}30`,
                        }}>{user.role?.replace(/_/g, ' ')}</span>
                      </td>
                      <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{user.organization || '—'}</td>
                      <td>
                        <span style={{
                          color: APPROVAL_COLOR[user.approvalStatus], fontWeight: 600, fontSize: '0.75rem',
                          display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: APPROVAL_COLOR[user.approvalStatus], display: 'inline-block' }} />
                          {user.approvalStatus}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          color: user.isActive ? '#10b981' : '#ef4444', fontWeight: 700, fontSize: '0.75rem',
                          display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: user.isActive ? '#10b981' : '#ef4444', display: 'inline-block' }} />
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.78rem' }}>
                        {user.createdAt ? format(new Date(user.createdAt), 'dd MMM yy') : '—'}
                      </td>
                      <td>
                        {user.role !== 'ADMIN' && (
                          <button
                            className="btn-ghost"
                            style={{ fontSize: '0.75rem', color: user.isActive ? '#ef4444' : '#10b981' }}
                            onClick={() => toggleUser(user.id, user.isActive, user.name)}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── RBAC Permissions Tab ── */}
        {activeTab === 'rbac' && (
          <div>
            <div className="mock-banner" style={{ marginBottom: 20 }}>
              🛡 These permissions are enforced server-side in the backend middleware — not just hidden on the frontend.
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Action / Permission</th>
                    <th style={{ textAlign: 'center' }}>🏢 Bidder</th>
                    <th style={{ textAlign: 'center' }}>👔 Officer</th>
                    <th style={{ textAlign: 'center' }}>🔍 Reviewer</th>
                    <th style={{ textAlign: 'center' }}>🛡 Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Upload bid documents',      true,  false, false, true  ],
                    ['Create tender',             false, true,  false, true  ],
                    ['Upload tender document',    false, true,  false, true  ],
                    ['Extract requirements (AI)', false, true,  false, true  ],
                    ['Add bidder to tender',      false, true,  false, true  ],
                    ['Run compliance verify',     false, true,  true,  true  ],
                    ['View compliance results',   'Own', true,  true,  true  ],
                    ['Review flagged items',      false, true,  true,  true  ],
                    ['Generate reports',          false, true,  false, true  ],
                    ['View all audit logs',       false, false, false, true  ],
                    ['View relevant audit logs',  false, true,  true,  true  ],
                    ['Approve user accounts',     false, false, false, true  ],
                    ['Manage knowledge base',     false, false, false, true  ],
                    ['Invite administrators',     false, false, false, true  ],
                    ['Deactivate accounts',       false, false, false, true  ],
                  ].map(([action, ...perms]) => (
                    <tr key={action}>
                      <td style={{ fontWeight: 500 }}>{action}</td>
                      {perms.map((p, i) => (
                        <td key={i} style={{ textAlign: 'center' }}>
                          {p === true  && <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span>}
                          {p === false && <span style={{ color: '#4a6080' }}>—</span>}
                          {p === 'Own' && <span style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 700 }}>Own only</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
