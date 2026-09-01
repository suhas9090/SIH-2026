import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/Sidebar';

export default function BidderClarificationsPage() {
  const navigate = useNavigate();
  const [clarifications, setClarifications] = useState([]);

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            CLARIFICATION & EVALUATOR QUERIES
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>
            Clarification Requests & Responses
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Respond to official evaluator queries, attach revised documentation, and record audit responses
          </p>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {clarifications.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✍️</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f0f4ff', marginBottom: 6 }}>No Clarification Requests</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: 420, margin: '0 auto 20px' }}>
              You have no pending queries or clarification requests from procurement officers.
            </p>
            <button className="btn-secondary" onClick={() => navigate('/bidder/my-bids')}>
              View My Submitted Bids
            </button>
          </div>
        ) : (
          <div>Clarifications List</div>
        )}
      </div>
    </AppLayout>
  );
}
