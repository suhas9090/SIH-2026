import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/Sidebar';
import { reportAPI } from '../services/api';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const DEMO_REPORTS = [
  { id: 'r1', bidder: { organizationName: 'ABC Industries Pvt Ltd', tender: { title: 'Supply of Industrial Safety Equipment', referenceNo: 'TND-2026-001' } }, overallScore: 72, riskLevel: 'MEDIUM', generatedAt: new Date(Date.now() - 3600000) },
  { id: 'r2', bidder: { organizationName: 'XYZ Technologies Ltd', tender: { title: 'Supply of Industrial Safety Equipment', referenceNo: 'TND-2026-001' } }, overallScore: 88, riskLevel: 'LOW', generatedAt: new Date(Date.now() - 7200000) },
];

const RISK_COLOR = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#ef4444', CRITICAL: '#dc2626' };

export default function ReportsPage() {
  const [reports, setReports] = useState(DEMO_REPORTS);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await reportAPI.listReports();
        if (res.data?.length) setReports(res.data);
      } catch { /* demo */ }
    };
    fetch();
  }, []);

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>Compliance Reports</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Generated compliance assessment reports for all bidders</p>
        </div>
      </div>
      <div style={{ padding: '28px 32px' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Bidder</th>
                <th>Tender</th>
                <th>Score</th>
                <th>Risk Level</th>
                <th>Generated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.bidder?.organizationName}</td>
                  <td>
                    <div style={{ fontSize: '0.875rem' }}>{r.bidder?.tender?.title}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>{r.bidder?.tender?.referenceNo}</div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: r.overallScore >= 75 ? '#10b981' : r.overallScore >= 50 ? '#f59e0b' : '#ef4444' }}>
                      {r.overallScore}%
                    </span>
                  </td>
                  <td>
                    <span style={{ color: RISK_COLOR[r.riskLevel], fontWeight: 700, fontSize: '0.8rem', background: `${RISK_COLOR[r.riskLevel]}15`, padding: '3px 10px', borderRadius: 20, border: `1px solid ${RISK_COLOR[r.riskLevel]}30` }}>
                      {r.riskLevel}
                    </span>
                  </td>
                  <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{format(new Date(r.generatedAt), 'dd MMM yyyy HH:mm')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-ghost" style={{ fontSize: '0.75rem', color: '#3b82f6' }} onClick={() => navigate(`/compliance/${r.id}`)}>
                        View Dashboard →
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!reports.length && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#4a6080' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>📊</div>
            <p>No reports generated yet. Run compliance verification on a bidder to generate a report.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
