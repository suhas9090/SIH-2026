import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../components/Sidebar';
import { reportAPI } from '../services/api';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const RISK_COLOR = {
  LOW:      { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  MEDIUM:   { color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  HIGH:     { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  CRITICAL: { color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' },
};

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);
  const navigate = useNavigate();

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportAPI.listReports();
      if (Array.isArray(res.data)) {
        setReports(res.data);
      } else {
        setReports([]);
      }
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleDownloadPdf = async (bidderId, orgName, e) => {
    e?.stopPropagation();
    if (downloadingId) return;

    setDownloadingId(bidderId);
    try {
      const response = await reportAPI.download(bidderId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ComplyGeM_Report_${(orgName || 'Bidder').replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF report downloaded successfully!');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download PDF report: ' + (err.response?.data?.error || err.message));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRecalculateReport = async (bidderId, e) => {
    e?.stopPropagation();
    if (generatingId) return;

    setGeneratingId(bidderId);
    try {
      await reportAPI.generate(bidderId);
      toast.success('Report recalculated and updated!');
      await fetchReports();
    } catch (err) {
      console.error('Generate error:', err);
      toast.error('Failed to recalculate report: ' + (err.response?.data?.error || err.message));
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.45rem', color: '#0f172a', marginBottom: 4 }}>
            Compliance & Risk Reports
          </h1>
          <p style={{ color: '#475569', fontSize: '0.88rem' }}>
            Authoritative assessment records generated from deterministic rules and RAG evidence
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={fetchReports} disabled={loading}>
            {loading ? '⟳ Refreshing...' : '⟳ Refresh List'}
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚙️</div>
            <p>Loading compliance reports from database...</p>
          </div>
        ) : reports.length > 0 ? (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Bidder / Organization</th>
                    <th>Tender Document</th>
                    <th>Compliance Score</th>
                    <th>Risk Level</th>
                    <th>Generated Date</th>
                    <th>Summary</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => {
                    const bidder = r.bidder || {};
                    const tender = bidder.tender || {};
                    const bidderId = r.bidderId || bidder.id || r.id;
                    const score = Math.round(r.overallScore || 0);
                    const riskLevel = r.riskLevel || 'MEDIUM';
                    const riskStyle = RISK_COLOR[riskLevel] || RISK_COLOR.MEDIUM;
                    const isDownloading = downloadingId === bidderId;
                    const isGenerating = generatingId === bidderId;

                    return (
                      <tr
                        key={r.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/compliance/${bidderId}`)}
                      >
                        <td>
                          <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                            {bidder.organizationName || 'Bidder Entity'}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b', fontFamily: 'monospace', marginTop: 2 }}>
                            {bidder.gstin ? `GST: ${bidder.gstin}` : bidder.pan ? `PAN: ${bidder.pan}` : ''}
                          </div>
                        </td>

                        <td>
                          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>
                            {tender.title || 'Tender'}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#2563eb', fontFamily: 'monospace', marginTop: 2 }}>
                            {tender.referenceNo || 'N/A'}
                          </div>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{
                                fontFamily: 'Outfit, sans-serif',
                                fontWeight: 900,
                                fontSize: '1.15rem',
                                color: score >= 75 ? '#059669' : score >= 50 ? '#d97706' : '#dc2626',
                              }}
                            >
                              {score}%
                            </span>
                          </div>
                        </td>

                        <td>
                          <span
                            style={{
                              color: riskStyle.color,
                              fontWeight: 800,
                              fontSize: '0.72rem',
                              background: riskStyle.bg,
                              padding: '4px 10px',
                              borderRadius: 20,
                              border: `1px solid ${riskStyle.border}`,
                            }}
                          >
                            {riskLevel}
                          </span>
                        </td>

                        <td style={{ color: '#475569', fontSize: '0.8rem', fontWeight: 600 }}>
                          {r.generatedAt ? format(new Date(r.generatedAt), 'dd MMM yyyy HH:mm') : 'Recently'}
                        </td>

                        <td style={{ maxWidth: 220, color: '#64748b', fontSize: '0.76rem' }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.summary || 'Compliant evaluation complete.'}
                          </div>
                        </td>

                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn-secondary"
                              style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/compliance/${bidderId}`);
                              }}
                            >
                              Dashboard →
                            </button>

                            <button
                              className="btn-primary"
                              style={{ fontSize: '0.74rem', padding: '4px 10px', background: '#059669' }}
                              disabled={isDownloading}
                              onClick={(e) => handleDownloadPdf(bidderId, bidder.organizationName, e)}
                            >
                              {isDownloading ? '⟳ PDF...' : '📥 PDF'}
                            </button>

                            <button
                              className="btn-ghost"
                              style={{ fontSize: '0.74rem', padding: '4px 8px', color: '#d97706' }}
                              disabled={isGenerating}
                              onClick={(e) => handleRecalculateReport(bidderId, e)}
                              title="Recalculate score from latest rules"
                            >
                              {isGenerating ? '⟳' : '⚡ Update'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>📊</div>
            <h3 style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.15rem', marginBottom: 6 }}>No Compliance Reports Generated Yet</h3>
            <p style={{ maxWidth: 450, margin: '0 auto 20px', fontSize: '0.88rem', color: '#64748b' }}>
              Run compliance verification on a bidder submission to generate an authoritative evaluation report with risk flags and PDF export.
            </p>
            <button className="btn-primary" onClick={() => navigate('/tenders')}>
              Go to Tenders →
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
