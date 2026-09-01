import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/Sidebar';
import { verificationAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function CrossDocumentComparisonPage() {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState('SCENARIO-01-COMPLIANT');
  const [activeResult, setActiveResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const res = await verificationAPI.getScenarios();
        if (res.data?.scenarios) {
          setScenarios(res.data.scenarios);
          // Run initial verification on first scenario
          const first = res.data.scenarios[0];
          if (first) {
            runTriangulation(first);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchScenarios();
  }, []);

  const runTriangulation = async (scenario) => {
    setLoading(true);
    try {
      const res = await verificationAPI.verifyBidderUnified({
        bidder: scenario.bidderProfile,
        tenderRequirements: { minLocalContent: 50.0 }
      });
      setActiveResult(res.data);
    } catch (err) {
      toast.error('Failed to run triangulation.');
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioChange = (id) => {
    setSelectedScenarioId(id);
    const target = scenarios.find(s => s.scenarioId === id);
    if (target) {
      runTriangulation(target);
    }
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <div style={{ fontSize: '0.75rem', color: '#06b6d4', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            CROSS-DOCUMENT ENTITY VERIFICATION
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f0f4ff', marginBottom: 4 }}>
            Cross-Document Consistency Matrix & Entity Graph
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Multi-source entity triangulation comparing PAN, GSTIN, Legal Name, Udyam, MCA, and Blacklist registries
          </p>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Scenario Selector for Auditors / Judges */}
        <div className="card" style={{ marginBottom: 20, padding: 18, borderLeft: '3px solid #06b6d4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#f0f4ff' }}>
              🔍 Select Entity Triangulation Test Case:
            </span>
            <span style={{ fontSize: '0.7rem', color: '#06b6d4', fontWeight: 700 }}>
              ● PROTOTYPE VERIFICATION: SYNTHETIC REGULATORY DATASET
            </span>
          </div>
          <select
            className="input"
            value={selectedScenarioId}
            onChange={e => handleScenarioChange(e.target.value)}
            style={{ width: '100%', fontSize: '0.82rem', background: '#091322', color: '#f0f4ff' }}
          >
            {scenarios.map(s => (
              <option key={s.scenarioId} value={s.scenarioId}>
                {s.title} — Expected: {s.expectedOutcome?.riskLevel} RISK ({s.expectedOutcome?.complianceScore}%)
              </option>
            ))}
          </select>
        </div>

        {/* Live Triangulation Matrix */}
        {activeResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Top Score Banner */}
            <div className="card" style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px',
              border: `1px solid ${activeResult.riskLevel === 'LOW' ? '#10b98150' : activeResult.riskLevel === 'MEDIUM' ? '#f59e0b50' : '#ef444450'}`,
              background: activeResult.riskLevel === 'LOW' ? 'rgba(16,185,129,0.05)' : activeResult.riskLevel === 'MEDIUM' ? 'rgba(245,158,11,0.05)' : 'rgba(239,68,68,0.05)',
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>VERIFIED BIDDER ENTITY</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f0f4ff', marginTop: 2 }}>
                  {activeResult.bidder?.organizationName}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                  PAN: <span style={{ fontFamily: 'monospace', color: '#60a5fa' }}>{activeResult.bidder?.pan || 'N/A'}</span> ·
                  GSTIN: <span style={{ fontFamily: 'monospace', color: '#60a5fa' }}>{activeResult.bidder?.gstin || 'N/A'}</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>TRIANGULATION SCORE</div>
                <div style={{
                  fontSize: '2rem', fontWeight: 900,
                  color: activeResult.riskLevel === 'LOW' ? '#10b981' : activeResult.riskLevel === 'MEDIUM' ? '#f59e0b' : '#ef4444'
                }}>
                  {activeResult.overallScore}%
                </div>
                <span style={{
                  padding: '2px 10px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 800,
                  background: activeResult.riskLevel === 'LOW' ? 'rgba(16,185,129,0.2)' : activeResult.riskLevel === 'MEDIUM' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                  color: activeResult.riskLevel === 'LOW' ? '#10b981' : activeResult.riskLevel === 'MEDIUM' ? '#f59e0b' : '#ef4444',
                }}>
                  {activeResult.riskLevel} RISK
                </span>
              </div>
            </div>

            {/* Inconsistencies Spotlight */}
            {activeResult.entityDiscrepancies?.length > 0 && (
              <div className="card" style={{ border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.06)', padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f87171' }}>
                    {activeResult.entityDiscrepancies.length} Cross-Portal Discrepancy Flag(s) Identified:
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {activeResult.entityDiscrepancies.map((d, i) => (
                    <div key={i} style={{ padding: '8px 12px', background: 'rgba(15,22,41,0.8)', borderRadius: 6, fontSize: '0.78rem' }}>
                      <span style={{ fontWeight: 700, color: d.severity === 'CRITICAL' ? '#f87171' : '#fbbf24' }}>
                        [{d.field}] {d.issue}
                      </span>
                      <div style={{ color: '#cbd5e1', fontSize: '0.72rem', marginTop: 2 }}>{d.details}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Statutory Check Matrix Table */}
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="section-title">Multi-Source Verification Findings ({activeResult.verificationChecks?.length || 0})</span>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                  Source: Synthetic Regulatory Dataset (API-Ready Interface)
                </span>
              </div>
              <div className="table-container" style={{ border: 'none' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Regulatory Agency / Gateway</th>
                      <th>Submitted Identifier</th>
                      <th>Reference Registry Value</th>
                      <th>Verification Status</th>
                      <th>Confidence</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeResult.verificationChecks?.map((vc, i) => {
                      const isSuccess = vc.status === 'VERIFIED' || vc.status === 'VERIFIED_CLEAR' || vc.result === 'MATCH' || vc.result === 'COMPLIANT';

                      return (
                        <tr key={i}>
                          <td>
                            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#f0f4ff' }}>
                              {vc.verificationType}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{vc.source}</div>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#cbd5e1' }}>
                            {vc.inputValue || 'N/A'}
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: vc.referenceValue ? '#60a5fa' : '#64748b' }}>
                            {vc.referenceValue || 'Not Found'}
                          </td>
                          <td>
                            <span style={{
                              padding: '2px 8px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 800,
                              background: isSuccess ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                              color: isSuccess ? '#10b981' : '#ef4444',
                            }}>
                              {vc.status}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f0f4ff' }}>
                            {Math.round((vc.confidence || 0.95) * 100)}%
                          </td>
                          <td style={{ fontSize: '0.75rem', fontWeight: 600, color: isSuccess ? '#10b981' : '#f87171' }}>
                            {vc.result}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
