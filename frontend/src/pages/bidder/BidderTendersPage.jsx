import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/Sidebar';
import { tenderAPI } from '../../services/api';
import { format } from 'date-fns';

export default function BidderTendersPage() {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [filterMSME, setFilterMSME] = useState(false);
  const [filterStartup, setFilterStartup] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await tenderAPI.list({ search });
        if (res.data?.tenders) {
          setTenders(res.data.tenders.map(t => ({
            id: t.id,
            referenceNo: t.referenceNo,
            title: t.title,
            organization: t.organization,
            department: t.department || 'Procurement Wing',
            estimatedValue: t.estimatedValue || 0,
            closingDate: t.closingDate || new Date(Date.now() + 14 * 86400000),
            category: t.category || 'General',
            msmePreference: true,
            startupExemption: true,
            makeInIndiaPercentage: 50,
            eligibilitySummary: t.requirements?.map(r => r.title) || [
              'Valid GST Registration',
              'Valid PAN Card',
              'Turnover Requirement',
            ],
            status: t.status,
          })));
        } else {
          setTenders([]);
        }
      } catch {
        setTenders([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [search]);

  const filtered = tenders.filter(t => {
    const matchesSearch = !search ||
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.referenceNo?.toLowerCase().includes(search.toLowerCase()) ||
      t.organization?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
    const matchesMSME = !filterMSME || t.msmePreference;
    const matchesStartup = !filterStartup || t.startupExemption;

    return matchesSearch && matchesCategory && matchesMSME && matchesStartup;
  });

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            SUPPLIER BIDDING PORTAL
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>
            Browse Open Government Tenders
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Discover tenders matching your organization profile, verify eligibility criteria, and submit bids
          </p>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Search & Filter Bar */}
        <div style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--bg-border)', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              className="input"
              placeholder="Search tenders by keyword, tender reference ID, ministry..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, fontSize: '0.85rem' }}
            />
            <select
              className="input"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{ width: 220, fontSize: '0.82rem' }}
            >
              <option value="ALL">All Categories</option>
              <option value="Safety Equipment">Safety Equipment</option>
              <option value="IT & Cloud Infrastructure">IT & Cloud Infrastructure</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 20, alignItems: 'center', fontSize: '0.78rem', color: '#cbd5e1' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={filterMSME} onChange={e => setFilterMSME(e.target.checked)} />
              <span>MSME Purchase Preference (PPP 2012)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={filterStartup} onChange={e => setFilterStartup(e.target.checked)} />
              <span>DPIIT Startup Exemption Eligible</span>
            </label>
          </div>
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔎</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f0f4ff', marginBottom: 6 }}>No Active Tenders Available</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: 420, margin: '0 auto' }}>
              There are currently no open procurement tenders published on the platform. Once procurement officers publish tenders, they will be listed here.
            </p>
          </div>
        )}

        {/* Tenders Grid */}
        {filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            {filtered.map(t => (
              <div key={t.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#8b5cf6', fontWeight: 800 }}>
                      {t.referenceNo}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
                      ● OPEN FOR BIDDING
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f0f4ff', marginBottom: 4 }}>
                    {t.title}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 12 }}>
                    {t.organization} · {t.department}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--bg-border)', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>ESTIMATED VALUE</div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#10b981' }}>
                        ₹{(t.estimatedValue / 10000000).toFixed(2)} Crore
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>SUBMISSION DEADLINE</div>
                      <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#fbbf24' }}>
                        {format(new Date(t.closingDate), 'dd MMM yyyy')}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, borderTop: '1px solid var(--bg-border)', paddingTop: 14 }}>
                  <button
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem' }}
                    onClick={() => navigate(`/bidder/tenders/${t.id}`)}
                  >
                    View Details
                  </button>
                  <button
                    className="btn-primary"
                    style={{ flex: 1.2, justifyContent: 'center', fontSize: '0.78rem', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                    onClick={() => navigate(`/bidder/submit/${t.id}`)}
                  >
                    🚀 Start Bid Submission
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
