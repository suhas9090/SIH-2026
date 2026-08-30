import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const features = [
  { icon: '🧠', title: 'AI Requirement Extraction', desc: 'Gemini LLM extracts structured eligibility criteria from complex tender documents automatically.' },
  { icon: '📄', title: 'PDF Parsing + OCR', desc: 'Smart pipeline: selectable text extraction first, Tesseract OCR fallback for scanned documents.' },
  { icon: '🔍', title: 'RAG + FAISS Search', desc: 'Retrieval-augmented generation grounds AI responses in authoritative GeM procurement guidelines.' },
  { icon: '🏛', title: 'Government Verification', desc: 'Integrated gateway for GST, PAN, Udyam, MCA, EPFO and blacklist checks (Sandbox mode).' },
  { icon: '⚖', title: 'Compliance Engine', desc: 'Deterministic rule engine evaluates each requirement. LLM assists — rules decide.' },
  { icon: '📊', title: 'Risk Assessment', desc: 'Weighted compliance scoring with LOW/MEDIUM/HIGH/CRITICAL risk levels and recommendations.' },
];

const steps = [
  { num: '01', title: 'Ingest', desc: 'Upload tender and bidder documents (PDF, scanned or digital)' },
  { num: '02', title: 'Understand', desc: 'OCR + NLP + Gemini AI extract and structure all requirements and evidence' },
  { num: '03', title: 'Verify', desc: 'Rules engine + RAG + government API verification against authoritative data' },
  { num: '04', title: 'Assess', desc: 'Compliance score, risk level, and inconsistency detection across all requirements' },
  { num: '05', title: 'Assist', desc: 'Explainable dashboard and report for the procurement officer\'s final review' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', overflowX: 'hidden' }}>
      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(10, 15, 30, 0.8)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(30, 45, 74, 0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'linear-gradient(135deg, #1e40af, #0891b2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
          }}>⚖</div>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#f0f4ff' }}>
            ComplyGeM <span style={{ color: '#0891b2' }}>AI</span>
          </span>
          <span style={{
            fontSize: '0.65rem', color: '#3b82f6', fontWeight: 700,
            background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)',
            padding: '2px 8px', borderRadius: 20, letterSpacing: '0.08em', marginLeft: 4
          }}>SIH26100</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/login" className="btn-secondary" style={{ padding: '8px 20px' }}>Sign In</Link>
          <Link to="/register" className="btn-primary" style={{ padding: '8px 20px' }}>Register</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        background: 'var(--gradient-hero)',
        position: 'relative', overflow: 'hidden', paddingTop: 80
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 800, height: 800, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(30, 64, 175, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', opacity: 0.08 }}>
          {/* Grid pattern */}
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3b82f6" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            <div className="animate-fadeInUp">
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24,
                background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)',
                padding: '6px 14px', borderRadius: 20
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)' }} />
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Smart India Hackathon 2026 — Problem SIH26100</span>
              </div>

              <h1 style={{
                fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '3.5rem',
                lineHeight: 1.05, marginBottom: 20, letterSpacing: '-0.03em',
                color: '#f0f4ff'
              }}>
                AI-Powered<br />
                <span style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Bid Compliance
                </span><br />
                Verification
              </h1>

              <p style={{ color: '#94a3b8', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: 32, maxWidth: 480 }}>
                Automate GeM procurement compliance verification with document AI, OCR, RAG, FAISS vector search, and government data verification — all in one explainable platform.
              </p>

              <div style={{ display: 'flex', gap: 12, marginBottom: 48 }}>
                <button className="btn-primary" style={{ fontSize: '1rem', padding: '14px 28px' }} onClick={() => navigate('/register')}>
                  Get Started →
                </button>
                <button className="btn-secondary" style={{ fontSize: '1rem', padding: '14px 28px' }} onClick={() => navigate('/login')}>
                  View Demo
                </button>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 32 }}>
                {[
                  { value: '90%+', label: 'Manual Effort Reduced' },
                  { value: '15+', label: 'Compliance Checks' },
                  { value: '6+', label: 'Gov API Connectors' },
                ].map(s => (
                  <div key={s.value}>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.8rem', color: '#3b82f6' }}>{s.value}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Visual */}
            <div className="animate-fadeIn" style={{ animationDelay: '0.3s' }}>
              <div style={{
                background: 'var(--gradient-card)', border: '1px solid var(--bg-border)',
                borderRadius: 24, padding: 28, position: 'relative'
              }} className="glow-blue">
                {/* Mock compliance dashboard preview */}
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: '#f0f4ff', fontSize: '0.9rem' }}>ABC Industries Pvt Ltd</span>
                  <span className="risk-medium">MEDIUM RISK</span>
                </div>

                {/* Score circle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
                  <div style={{ position: 'relative', width: 90, height: 90 }}>
                    <svg width="90" height="90" viewBox="0 0 90 90">
                      <circle cx="45" cy="45" r="38" fill="none" stroke="var(--bg-border)" strokeWidth="8"/>
                      <circle cx="45" cy="45" r="38" fill="none" stroke="#3b82f6" strokeWidth="8"
                        strokeDasharray={`${0.72 * 2 * Math.PI * 38} ${2 * Math.PI * 38}`}
                        strokeLinecap="round" transform="rotate(-90 45 45)" />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 900, fontSize: '1.3rem', color: '#3b82f6' }}>72%</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { label: 'Compliant', val: 15, color: '#10b981' },
                      { label: 'Failed', val: 3, color: '#ef4444' },
                      { label: 'Missing', val: 4, color: '#f59e0b' },
                      { label: 'Review', val: 2, color: '#a855f7' },
                    ].map(s => (
                      <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{s.label}: <span style={{ color: s.color, fontWeight: 700 }}>{s.val}</span></span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                {[
                  { req: 'GST Registration', status: 'COMPLIANT' },
                  { req: 'PAN Verification', status: 'COMPLIANT' },
                  { req: 'Annual Turnover ≥ ₹5 Cr', status: 'NON_COMPLIANT' },
                  { req: 'OEM Authorization', status: 'MISSING' },
                  { req: 'Blacklist Check', status: 'PENDING_VERIFICATION' },
                ].map(item => (
                  <div key={item.req} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 0', borderTop: '1px solid rgba(30, 45, 74, 0.5)'
                  }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{item.req}</span>
                    <StatusBadgeSmall status={item.status} />
                  </div>
                ))}

                {/* SANDBOX watermark */}
                <div className="mock-banner" style={{ marginTop: 16 }}>
                  <span>⚠</span> SANDBOX / DEMO MODE — Not real government data
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '100px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '2.5rem', color: '#f0f4ff', marginBottom: 12 }}>
            5-Stage Verification Pipeline
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1rem' }}>End-to-end workflow from document upload to compliance report</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          {steps.map((step, i) => (
            <div key={step.num} className="card" style={{ position: 'relative', textAlign: 'center' }}>
              {i < steps.length - 1 && (
                <div style={{ position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)', color: '#1e40af', zIndex: 10, fontSize: '1.2rem' }}>→</div>
              )}
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.8rem', color: '#1e40af', marginBottom: 8 }}>{step.num}</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f0f4ff', marginBottom: 8 }}>{step.title}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 48px', background: 'rgba(15, 22, 41, 0.5)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '2.5rem', color: '#f0f4ff', marginBottom: 12 }}>
              Core Capabilities
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {features.map(f => (
              <div key={f.title} className="card">
                <div style={{ fontSize: '2rem', marginBottom: 14 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#f0f4ff', marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '100px 48px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '2.5rem', color: '#f0f4ff', marginBottom: 16 }}>
            Ready to transform GeM procurement?
          </h2>
          <p style={{ color: '#94a3b8', marginBottom: 32 }}>
            Built for procurement officers. AI-assisted, human-in-the-loop, fully explainable.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn-primary" style={{ fontSize: '1rem', padding: '14px 32px' }} onClick={() => navigate('/register')}>
              Start Now →
            </button>
            <button className="btn-secondary" style={{ fontSize: '1rem', padding: '14px 32px' }} onClick={() => navigate('/login')}>
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--bg-border)', padding: '24px 48px', textAlign: 'center' }}>
        <p style={{ color: '#4a6080', fontSize: '0.8rem' }}>
          ComplyGeM AI — SIH26100 | AI-Powered Bid Compliance Verification for GeM Procurement | For Decision Support Only
        </p>
      </footer>
    </div>
  );
}

const STATUS_CONFIG = {
  COMPLIANT: { label: '✓ Compliant', cls: 'badge-compliant' },
  NON_COMPLIANT: { label: '✗ Failed', cls: 'badge-non-compliant' },
  MISSING: { label: '⚠ Missing', cls: 'badge-missing' },
  PENDING_VERIFICATION: { label: '⟳ Pending', cls: 'badge-pending' },
  REQUIRES_HUMAN_REVIEW: { label: '👁 Review', cls: 'badge-review' },
};

const StatusBadgeSmall = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, cls: 'badge-pending' };
  return <span className={`badge ${cfg.cls}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{cfg.label}</span>;
};
