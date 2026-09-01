import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/Sidebar';
import { bidderAPI } from '../../services/api';

export default function BidderCompliancePage() {
  const navigate = useNavigate();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await bidderAPI.list();
        setBids(res.data && Array.isArray(res.data) ? res.data : []);
      } catch {
        setBids([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            SUPPLIER COMPLIANCE VERIFICATION
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>
            My Bid Compliance Assessment
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Official requirement satisfaction status for submitted procurement bids
          </p>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {bids.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📊</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f0f4ff', marginBottom: 6 }}>No Compliance Assessments Yet</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: 420, margin: '0 auto 20px' }}>
              Once you submit a bid for a tender, your automated criteria verification, document status, and evaluation findings will appear here.
            </p>
            <button className="btn-primary" style={{ background: '#7c3aed' }} onClick={() => navigate('/bidder/tenders')}>
              Browse Open Tenders →
            </button>
          </div>
        ) : (
          <div className="card">
            <span className="section-title">Submitted Bids ({bids.length})</span>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
