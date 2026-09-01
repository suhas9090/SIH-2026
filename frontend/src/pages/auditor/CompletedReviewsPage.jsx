import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/Sidebar';
import { reportAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function CompletedReviewsPage() {
  const navigate = useNavigate();
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await reportAPI.list();
        setCompleted(res.data && Array.isArray(res.data) ? res.data : []);
      } catch {
        setCompleted([]);
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
          <div style={{ fontSize: '0.75rem', color: '#06b6d4', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            AUDIT ARCHIVE & COMPLIANCE RECORDS
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>
            Completed Verification Reviews
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Permanent record of finalized evaluations, human auditor sign-offs, and multi-page official PDF reports
          </p>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {completed.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✓</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f0f4ff', marginBottom: 6 }}>No Completed Reviews Yet</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: 420, margin: '0 auto 20px' }}>
              When compliance reviewers and procurement officers verify bidder submissions, finalized assessments will be archived here.
            </p>
            <button className="btn-secondary" onClick={() => navigate('/auditor/queue')}>
              Check Verification Queue
            </button>
          </div>
        ) : (
          <div className="card">
            <span className="section-title">Completed Assessments ({completed.length})</span>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
