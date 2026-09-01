import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/Sidebar';

export default function DisputedResultsPage() {
  const navigate = useNavigate();
  const [disputed, setDisputed] = useState([]);

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ fontSize: '0.75rem', color: '#06b6d4', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            HUMAN-IN-THE-LOOP FEEDBACK & OVERRIDE LOG
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>
            Disputed Results & AI Feedback Repository
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Cases where authorized human reviewers corrected or clarified AI recommendations, feeding the continuous learning loop
          </p>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {disputed.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💡</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f0f4ff', marginBottom: 6 }}>No Disputed Results Logged</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: 420, margin: '0 auto 20px' }}>
              Whenever an auditor manually overrides an AI compliance recommendation with custom justifications, the event is permanently preserved here for quality monitoring.
            </p>
            <button className="btn-secondary" onClick={() => navigate('/auditor/queue')}>
              Check Verification Queue
            </button>
          </div>
        ) : (
          <div>Disputed List</div>
        )}
      </div>
    </AppLayout>
  );
}
