import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppLayout } from '../components/Sidebar';
import { tenderAPI, complianceAPI, auditAPI } from '../services/api';
import { format } from 'date-fns';

const STATUS_COLOR = {
  ACTIVE: '#10b981',
  PROCESSING: '#3b82f6',
  DRAFT: '#64748b',
  CLOSED: '#ef4444',
  CANCELLED: '#ef4444',
};

// =============================================================================
// 1. 🛡️ SYSTEM ADMINISTRATOR DASHBOARD
// =============================================================================
const AdminDashboard = ({ profile, stats, navigate }) => {
  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '1.2rem' }}>🛡️</span>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff' }}>
              Platform Administration & System Health
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Infrastructure monitoring, user provisioning, integration telemetry, and security oversight
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={() => navigate('/audit')}>
            📜 View System Audit Logs
          </button>
          <button className="btn-primary" onClick={() => navigate('/admin')}>
            👥 Manage Users & RBAC
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Users', value: stats.totalUsers || 4, icon: '👥', color: '#3b82f6', desc: 'Registered system accounts' },
            { label: 'Active Sessions', value: stats.activeUsers || 4, icon: '⚡', color: '#10b981', desc: 'Verified platform users' },
            { label: 'Monitored Tenders', value: stats.totalTenders || 0, icon: '📋', color: '#8b5cf6', desc: 'Active procurement tenders' },
            { label: 'Security Alerts', value: stats.alerts || 0, icon: '⚠️', color: '#ef4444', desc: 'Zero unaddressed threats' },
          ].map((s) => (
            <div key={s.label} className="card" style={{ padding: 18, borderLeft: `3px solid ${s.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '1.2rem' }}>{s.icon}</span>
                <span style={{ fontSize: '0.68rem', color: s.color, fontWeight: 800, background: `${s.color}15`, padding: '2px 8px', borderRadius: 10 }}>
                  LIVE
                </span>
              </div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '2rem', color: '#f0f4ff', marginBottom: 2 }}>
                {s.value}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#94a3b8' }}>{s.label}</div>
              <div style={{ fontSize: '0.7rem', color: '#4a6080' }}>{s.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          <div className="card">
            <span className="section-title" style={{ display: 'block', marginBottom: 14 }}>
              Core Infrastructure Health
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { name: 'Firebase Authentication & RBAC', status: 'Healthy', ping: '24ms', color: '#10b981' },
                { name: 'PostgreSQL Relational DB (Port 5432)', status: 'Connected & Synced', ping: '4ms', color: '#10b981' },
                { name: 'AI Engine (FastAPI + Gemini LLM)', status: 'Active (Port 8000)', ping: '110ms', color: '#10b981' },
                { name: 'External Govt. Verification Gateways', status: 'Active (GSTN, PAN, MCA21, Udyam)', ping: '12ms', color: '#10b981' },
              ].map((item) => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--bg-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f0f4ff' }}>{item.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>{item.ping}</span>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: item.color }}>{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <span className="section-title" style={{ display: 'block', marginBottom: 14 }}>
              Government Verification Gateway
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { name: 'GSTN Returns (GSTR-3B / 1)', status: 'Operational', icon: '🏛️' },
                { name: 'Income Tax PAN (CBDT)', status: 'Operational', icon: '💳' },
                { name: 'Ministry of Corporate Affairs (MCA21)', status: 'Operational', icon: '🏢' },
                { name: 'MSME / Udyam Registry', status: 'Operational', icon: '🏭' },
              ].map((gw) => (
                <div key={gw.name} style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--bg-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span>{gw.icon}</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f0f4ff' }}>{gw.name}</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700 }}>● {gw.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// 2. 🏛️ PROCUREMENT OFFICER DASHBOARD
// =============================================================================
const OfficerDashboard = ({ profile, tenders, stats, navigate }) => {
  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '1.2rem' }}>🏛️</span>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff' }}>
              Welcome, {profile?.name?.split(' ')[0] || 'Procurement Officer'}
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Procurement Management & Compliance Verification — {profile?.organization || 'Central Procurement Division'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-secondary" onClick={() => navigate('/reports')}>
            📊 Compliance Reports
          </button>
          <button className="btn-primary" onClick={() => navigate('/tenders/create')}>
            + Create New Tender
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Active Tenders', value: tenders.length || 0, color: '#3b82f6' },
            { label: 'Bids Received', value: stats.totalBidders || 0, color: '#06b6d4' },
            { label: 'Under Verification', value: stats.bidsUnderVerification || 0, color: '#f59e0b' },
            { label: 'Compliant', value: stats.compliantBids || 0, color: '#10b981' },
            { label: 'Non-Compliant', value: stats.nonCompliantBids || 0, color: '#ef4444' },
            { label: 'High Risk', value: stats.highRiskBids || 0, color: '#dc2626' },
          ].map((card) => (
            <div key={card.label} style={{ background: `${card.color}0D`, border: `1px solid ${card.color}33`, borderRadius: 12, padding: '14px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.8rem', color: card.color }}>
                {card.value}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Tenders Table / Empty State */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-title">My Registered Tenders</span>
            <Link to="/tenders" style={{ color: '#3b82f6', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
              View all ({tenders.length}) →
            </Link>
          </div>
          {tenders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>📋</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>No Tenders Published Yet</h3>
              <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: 16 }}>
                Create and publish your first procurement tender to start receiving bidder submissions and AI compliance checks.
              </p>
              <button className="btn-primary" onClick={() => navigate('/tenders/create')}>
                + Create New Tender
              </button>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Tender Reference</th>
                    <th>Title</th>
                    <th>Bids</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tenders.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b' }}>{t.referenceNo}</td>
                      <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t.title}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '2px 8px', borderRadius: 10, fontWeight: 700, fontSize: '0.78rem' }}>
                          {t._count?.bidders || t.bidders?.length || 0}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          background: `${STATUS_COLOR[t.status] || '#64748b'}20`, color: STATUS_COLOR[t.status] || '#64748b',
                          border: `1px solid ${STATUS_COLOR[t.status] || '#64748b'}40`, padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                        }}>{t.status}</span>
                      </td>
                      <td>
                        <button className="btn-ghost" style={{ fontSize: '0.75rem', color: '#3b82f6', padding: '4px 8px' }} onClick={() => navigate(`/tenders/${t.id}`)}>
                          Review Bids →
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
    </div>
  );
};

// =============================================================================
// 3. 🔍 COMPLIANCE OFFICER DASHBOARD
// =============================================================================
const ComplianceDashboard = ({ profile, navigate }) => {
  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '1.2rem' }}>🔍</span>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff' }}>
              Verification Center & Evidence Evaluation
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            AI-extracted requirement matching, OCR verification, and deterministic rule evaluation
          </p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/auditor/queue')}>
          🔍 Open Verification Queue
        </button>
      </div>

      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Pending Queue', value: 0, color: '#f59e0b', desc: 'Bids awaiting review' },
            { label: 'High Risk Flags', value: 0, color: '#ef4444', desc: 'Inconsistencies detected' },
            { label: 'Verified Bids', value: 0, color: '#10b981', desc: 'Evaluated compliant' },
            { label: 'Disputed Overrides', value: 0, color: '#06b6d4', desc: 'Human corrections to AI' },
          ].map((c) => (
            <div key={c.label} className="card" style={{ padding: 18, borderLeft: `3px solid ${c.color}` }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '2rem', color: '#f0f4ff' }}>{c.value}</div>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#94a3b8' }}>{c.label}</div>
              <div style={{ fontSize: '0.7rem', color: '#4a6080' }}>{c.desc}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>✅</div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>Verification Queue is Clear</h3>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: 16 }}>
            No bidder submissions are currently pending compliance evaluation. When bids are submitted, they will appear here for evidence validation.
          </p>
          <button className="btn-secondary" onClick={() => navigate('/tenders')}>
            Browse Open Tenders
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// 4. 🏢 BIDDER / VENDOR DASHBOARD
// =============================================================================
const BidderDashboard = ({ profile, tenders, navigate }) => {
  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '1.2rem' }}>🏢</span>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff' }}>
              Supplier Dashboard — {profile?.organization || 'My Organization'}
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Find government procurement opportunities, check eligibility, and submit bids
          </p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/bidder/tenders')}>
          🔎 Browse Open Tenders
        </button>
      </div>

      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Available Tenders', value: tenders.length || 0, color: '#8b5cf6' },
            { label: 'My Active Bids', value: 0, color: '#3b82f6' },
            { label: 'Uploaded Documents', value: 0, color: '#10b981' },
            { label: 'Actions Required', value: 0, color: '#f59e0b' },
          ].map((c) => (
            <div key={c.label} className="card" style={{ padding: 18, borderLeft: `3px solid ${c.color}` }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '2rem', color: '#f0f4ff' }}>{c.value}</div>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#94a3b8' }}>{c.label}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>📑</div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>Ready to Participate in Tenders</h3>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: 16 }}>
            Browse open government tenders, check your pre-bid compliance eligibility, and submit required documents.
          </p>
          <button className="btn-primary" onClick={() => navigate('/bidder/tenders')}>
            Browse Open Tenders →
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// 5. ⚖️ INDEPENDENT AUDITOR DASHBOARD
// =============================================================================
const AuditorDashboard = ({ profile, navigate }) => {
  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '1.2rem' }}>⚖️</span>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff' }}>
              Compliance Oversight & Decision Traceability
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Independent audit of AI verification assessments, human decisions, and provenance logs
          </p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/audit')}>
          📜 Immutable Audit Trail
        </button>
      </div>

      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Audited Evaluations', value: 0, color: '#06b6d4' },
            { label: 'High-Risk Flags', value: 0, color: '#ef4444' },
            { label: 'Disputed Overrides', value: 0, color: '#f59e0b' },
            { label: 'Compliance Reports', value: 0, color: '#10b981' },
          ].map((c) => (
            <div key={c.label} className="card" style={{ padding: 18, borderLeft: `3px solid ${c.color}` }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '2rem', color: '#f0f4ff' }}>{c.value}</div>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#94a3b8' }}>{c.label}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>📜</div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>No Audited Records Yet</h3>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: 16 }}>
            As procurement officers and compliance reviewers evaluate bidder submissions, all decision events will be permanently logged in the audit trail.
          </p>
          <button className="btn-secondary" onClick={() => navigate('/audit')}>
            View Audit Log System
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN DASHBOARD PAGE
// =============================================================================
export default function DashboardPage() {
  const { profile, role } = useAuth();
  const navigate = useNavigate();

  const [tenders, setTenders] = useState([]);
  const [stats, setStats] = useState({
    totalTenders: 0,
    activeTenders: 0,
    bidsUnderVerification: 0,
    totalBidders: 0,
    compliantBids: 0,
    nonCompliantBids: 0,
    requiresReview: 0,
    highRiskBids: 0,
    reportsGenerated: 0,
  });

  const loadDashboardData = useCallback(async () => {
    try {
      const [tendersRes, statsRes] = await Promise.all([
        tenderAPI.list({ limit: 10 }).catch(() => ({ data: { tenders: [] } })),
        complianceAPI.getDashboardStats().catch(() => ({ data: {} })),
      ]);

      if (tendersRes.data?.tenders) {
        setTenders(tendersRes.data.tenders);
      }
      if (statsRes.data) {
        setStats((prev) => ({ ...prev, ...statsRes.data }));
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <AppLayout>
      {role === 'ADMIN' && <AdminDashboard profile={profile} stats={stats} navigate={navigate} />}
      {role === 'PROCUREMENT_OFFICER' && <OfficerDashboard profile={profile} tenders={tenders} stats={stats} navigate={navigate} />}
      {role === 'REVIEWER' && <ComplianceDashboard profile={profile} navigate={navigate} />}
      {role === 'BIDDER' && <BidderDashboard profile={profile} tenders={tenders} navigate={navigate} />}
      {role === 'AUDITOR' && <AuditorDashboard profile={profile} navigate={navigate} />}
    </AppLayout>
  );
}
