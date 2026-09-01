import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RolePortalSelector from '../components/RolePortalSelector';

// ─── Verification Gateway Nodes Definition ───────────────────────────────────
const GATEWAY_NODES = [
  { id: 'gst',   name: 'GST Portal',  code: 'GST',   sub: 'Registration & Active Filings', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', pos: { top: '-24px', left: '10%' } },
  { id: 'pan',   name: 'Income Tax',  code: 'PAN',   sub: 'Entity & Status Validation',    color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)',  pos: { top: '35%',   left: '-36px' } },
  { id: 'udyam', name: 'MSME Udyam',  code: 'UDYAM', sub: 'Category & Turnover Caps',      color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', pos: { bottom: '-24px', left: '15%' } },
  { id: 'mca',   name: 'MCA21',       code: 'MCA',   sub: 'CIN, Directors & Compliance',  color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', pos: { top: '-24px', right: '10%' } },
  { id: 'epfo',  name: 'EPFO & ESIC', code: 'EPFO',  sub: 'Labour Welfare Compliance',     color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', pos: { top: '35%',   right: '-36px' } },
  { id: 'cvc',   name: 'Debarment',   code: 'CVC',   sub: 'Central Debarment Registry',    color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)',  pos: { bottom: '-24px', right: '15%' } },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeNode, setActiveNode] = useState(GATEWAY_NODES[0]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Handle smooth 3D parallax tilt for hero visual
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth - 0.5) * 16;
    const y = (clientY / window.innerHeight - 0.5) * 16;
    setMousePos({ x, y });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      style={{
        minHeight: '100vh',
        background: 'var(--bg-dark)',
        color: 'var(--text-primary)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Ambient Radial Lighting Background ── */}
      <div style={{
        position: 'fixed', top: '-10%', left: '50%', transform: 'translateX(-50%)',
        width: 1000, height: 600, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(30, 64, 175, 0.18) 0%, rgba(6, 182, 212, 0.05) 40%, transparent 75%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{
        position: 'fixed', bottom: '-15%', right: '-5%',
        width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(16, 185, 129, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ─── 1. NAVBAR ─────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(7, 11, 20, 0.75)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        <div style={{
          maxWidth: 1240, margin: '0 auto', padding: '16px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, #1e40af 0%, #0284c7 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', color: '#ffffff',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}>
              ◈
            </div>
            <div>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#f0f4ff', letterSpacing: '-0.01em' }}>
                COMPLYGEM
              </span>
              <span style={{ color: '#0284c7', fontWeight: 800, fontSize: '1.05rem', marginLeft: 4 }}>AI</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="hidden md:flex">
            <a href="#platform" className="btn-ghost" style={{ fontSize: '0.85rem' }}>Platform</a>
            <a href="#how-it-works" className="btn-ghost" style={{ fontSize: '0.85rem' }}>How It Works</a>
            <a href="#engine" className="btn-ghost" style={{ fontSize: '0.85rem' }}>Compliance Engine</a>
            <a href="#security" className="btn-ghost" style={{ fontSize: '0.85rem' }}>Security</a>
            <a href="#roles" className="btn-ghost" style={{ fontSize: '0.85rem' }}>Roles</a>
          </nav>

          {/* Sign In CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/login" className="btn-secondary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
              Sign In
            </Link>
            <Link to="/register" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
              Get Started →
            </Link>
          </div>
        </div>
      </header>

      {/* ─── 2. HERO SECTION ───────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '70px 24px 60px', maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 48, alignItems: 'center' }}>

          {/* Left Column: Hero Text */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: 30,
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              color: '#60a5fa', fontSize: '0.78rem', fontWeight: 600,
              letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 24,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', display: 'inline-block', boxShadow: '0 0 8px #3b82f6' }} />
              Enterprise Bid Compliance Verification
            </div>

            <h1 style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(2.2rem, 4vw, 3.2rem)',
              lineHeight: 1.15,
              color: '#ffffff',
              letterSpacing: '-0.03em',
              marginBottom: 20,
            }}>
              Intelligent Compliance Verification for Government Procurement
            </h1>

            <p style={{
              fontSize: '1.05rem',
              lineHeight: 1.65,
              color: '#94a3b8',
              maxWidth: 540,
              marginBottom: 32,
            }}>
              Verify bidder eligibility, extract criteria from tender documents, cross-check authoritative government portals, and identify non-compliance risks through one unified platform.
            </p>

            {/* Primary Action Buttons */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 40 }}>
              <Link to="/register" className="btn-primary" style={{ padding: '13px 28px', fontSize: '0.95rem' }}>
                Get Started
              </Link>
              <Link to="/login" className="btn-secondary" style={{ padding: '13px 24px', fontSize: '0.95rem' }}>
                Explore Platform
              </Link>
            </div>

            {/* Quick Metrics Bar */}
            <div style={{ display: 'flex', gap: 32, paddingTop: 20, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              {[
                { val: '100%', label: 'Deterministic Auditing' },
                { val: '6+',   label: 'Gov. Data Gateways' },
                { val: '0',    label: 'Arbitrary AI Decisions' },
              ].map(m => (
                <div key={m.label}>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: '#f0f4ff' }}>
                    {m.val}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: 3D Floating Document & Verification Engine Visual */}
          <div className="perspective-container" style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div
              className="animate-float-3d"
              style={{
                transform: `rotateY(${mousePos.x}deg) rotateX(${-mousePos.y}deg)`,
                transition: 'transform 0.2s ease-out',
                position: 'relative', width: '100%', maxWidth: 440,
              }}
            >
              {/* Central Elevated 3D Document Glass Panel */}
              <div className="glass-panel-3d" style={{ padding: '28px 24px', position: 'relative', zIndex: 10 }}>

                {/* Top Badge: Verified */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '0.85rem',
                    }}>
                      ✓
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f0f4ff' }}>
                      Bid Compliance Dossier
                    </span>
                  </div>
                  <span style={{
                    background: 'rgba(16, 185, 129, 0.12)', color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 800,
                  }}>
                    94% COMPLIANT
                  </span>
                </div>

                {/* Simulated Document Verification Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {[
                    { label: 'GSTIN 29AABCA1234C1Z5', status: 'ACTIVE & VERIFIED', icon: '✓', color: '#10b981', src: 'GST Portal' },
                    { label: 'Permanent Account Number', status: 'MATCH CONFIRMED',  icon: '✓', color: '#10b981', src: 'IT Department' },
                    { label: 'Udyam Registration Certificate', status: 'MICRO ENTERPRISE', icon: '✓', color: '#10b981', src: 'MSME Portal' },
                    { label: 'Audited Turnover Statement', status: 'INR 5.20 CR (PASSED)', icon: '✓', color: '#10b981', src: 'Financial OCR' },
                  ].map((row, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 12px', borderRadius: 10,
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f0f4ff' }}>{row.label}</div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 1 }}>Source: {row.src}</div>
                      </div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: row.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>{row.icon}</span> {row.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Central Engine Indicator Footer */}
                <div style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.2), rgba(2, 132, 199, 0.15))',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Deterministic Rule Engine</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8' }}>AI-ASSISTED</span>
                </div>
              </div>

              {/* Floating Orbiting Data Nodes */}
              {GATEWAY_NODES.map(node => (
                <div
                  key={node.id}
                  onMouseEnter={() => setActiveNode(node)}
                  style={{
                    position: 'absolute',
                    ...node.pos,
                    zIndex: 20,
                    padding: '8px 12px',
                    borderRadius: 12,
                    background: 'rgba(10, 16, 31, 0.85)',
                    backdropFilter: 'blur(16px)',
                    border: `1px solid ${activeNode.id === node.id ? node.color : 'rgba(255, 255, 255, 0.1)'}`,
                    boxShadow: activeNode.id === node.id ? `0 0 20px ${node.color}40` : '0 10px 25px rgba(0,0,0,0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    transform: activeNode.id === node.id ? 'scale(1.08)' : 'scale(1)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: node.color }} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f0f4ff' }}>{node.code}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ─── 3. TRUST & VALUE STRIP ────────────────────────────────────── */}
      <section style={{ maxWidth: 1240, margin: '0 auto 80px', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{
          padding: '20px 32px', borderRadius: 16,
          background: 'rgba(13, 20, 36, 0.4)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 20,
        }}>
          {[
            'DOCUMENT INTELLIGENCE',
            'AUTHORITATIVE DATA VERIFICATION',
            'AI-ASSISTED AUDITING',
            'EXPLAINABLE CITATIONS',
          ].map((text, idx) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{
                fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em',
                color: '#94a3b8', textTransform: 'uppercase',
              }}>{text}</span>
              {idx < 3 && <span style={{ color: 'rgba(255, 255, 255, 0.15)', fontSize: '0.8rem' }}>•</span>}
            </div>
          ))}
        </div>
      </section>

      {/* ─── 4. HOW IT WORKS (5-Step 3D Pipeline) ───────────────────────── */}
      <section id="how-it-works" style={{ maxWidth: 1240, margin: '0 auto 100px', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 50 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            End-to-End Workflow
          </div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '2rem', color: '#ffffff' }}>
            How Verification Operates
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          {[
            { step: '01', title: 'Upload', desc: 'Tender requirements and bidder documents enter the secure system.' },
            { step: '02', title: 'Extract', desc: 'PyMuPDF + OCR and NLP parse clauses, values, and specifications.' },
            { step: '03', title: 'Verify', desc: 'Authoritative data sources (GST, PAN, Udyam) cross-checked via gateways.' },
            { step: '04', title: 'Analyze', desc: 'Deterministic rule engine compares criteria with evidence & scores risk.' },
            { step: '05', title: 'Review', desc: 'Authorized Procurement Officer reviews citations & records final decision.' },
          ].map((s) => (
            <div
              key={s.step}
              className="glass-panel-3d"
              style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{
                fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.6rem',
                color: '#3b82f6', opacity: 0.6, marginBottom: 12,
              }}>
                {s.step}
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f0f4ff', marginBottom: 8 }}>
                {s.title}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 5. CORE PLATFORM FEATURES ──────────────────────────────────── */}
      <section id="platform" style={{ maxWidth: 1240, margin: '0 auto 100px', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 50 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Capability Matrix
          </div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '2rem', color: '#ffffff' }}>
            Built for Procurement Integrity
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { title: 'Document Intelligence', desc: 'Dual-pass extraction combining native PDF parsing with Tesseract OCR for scanned certificates.', icon: '📄' },
            { title: 'Requirement Extraction', desc: 'NLP identifies eligibility thresholds (turnover, experience, certifications) from tender specs.', icon: '🔍' },
            { title: 'Multi-Source Verification', desc: 'Direct connectors to official databases for GSTIN, PAN, Udyam MSME, and Debarment registry.', icon: '🏛️' },
            { title: 'Compliance Rule Engine', desc: 'Deterministic evaluation flags missing certificates, expired authorizations, and turnover deficits.', icon: '⚖️' },
            { title: 'Evidence-Based Citations', desc: 'Every finding points to exact document pages and text excerpts for explainable decisions.', icon: '📌' },
            { title: 'Immutable Audit Trail', desc: 'Cryptographically consistent audit logging of every tender, bid, review, and verification action.', icon: '📜' },
          ].map((f) => (
            <div key={f.title} className="glass-panel-3d" style={{ padding: 28 }}>
              <div style={{ fontSize: '1.6rem', marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#f0f4ff', marginBottom: 8 }}>
                {f.title}
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.65, margin: 0 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 6. 3D COMPLIANCE ENGINE VISUALIZATION ──────────────────────── */}
      <section id="engine" style={{ maxWidth: 1240, margin: '0 auto 100px', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div className="glass-panel-3d" style={{ padding: 48, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Core Technology
          </div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '2rem', color: '#ffffff', marginBottom: 16 }}>
            The AI Verification Engine
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.92rem', maxWidth: 600, margin: '0 auto 36px' }}>
            Interactive inspection of external verification gateways integrated with the deterministic analysis core.
          </p>

          {/* Interactive Gateway Node Selector */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
            {GATEWAY_NODES.map(node => (
              <button
                key={node.id}
                onClick={() => setActiveNode(node)}
                style={{
                  padding: '10px 20px', borderRadius: 12, cursor: 'pointer',
                  background: activeNode.id === node.id ? node.bg : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${activeNode.id === node.id ? node.color : 'rgba(255,255,255,0.08)'}`,
                  color: activeNode.id === node.id ? '#ffffff' : '#94a3b8',
                  fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.2s',
                }}
              >
                {node.name}
              </button>
            ))}
          </div>

          {/* Active Node Detail Card */}
          <div style={{
            maxWidth: 520, margin: '0 auto', padding: '20px 24px', borderRadius: 14,
            background: 'rgba(9, 15, 29, 0.8)', border: `1px solid ${activeNode.color}40`,
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: activeNode.color, fontSize: '0.9rem' }}>
                {activeNode.name} Integration
              </span>
              <span style={{ fontSize: '0.7rem', background: `${activeNode.color}20`, color: activeNode.color, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                CONNECTOR ACTIVE
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#f0f4ff', marginBottom: 4 }}>
              Function: {activeNode.sub}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5 }}>
              Deterministic cross-referencing compares extracted PDF attributes directly against official registry parameters.
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. SECURITY BY DESIGN ──────────────────────────────────────── */}
      <section id="security" style={{ maxWidth: 1240, margin: '0 auto 100px', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 50 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Infrastructure
          </div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '2rem', color: '#ffffff' }}>
            Security by Design
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { title: 'Secure Identity', desc: 'Firebase Authentication with strict email validation, strong password enforcement & MFA.', icon: '🔐' },
            { title: 'Role-Based Control', desc: 'Authoritative custom claims enforced server-side. No self-registered administrators.', icon: '🛡️' },
            { title: 'Auditable Actions', desc: 'Immutable, append-only audit trail logging every document, verification, and decision.', icon: '📜' },
            { title: 'Protected Storage', desc: 'Strict folder isolation. Bidders can only access their own documents & submissions.', icon: '🔒' },
          ].map(s => (
            <div key={s.title} className="glass-panel-3d" style={{ padding: 24 }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 12 }}>{s.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f0f4ff', marginBottom: 8 }}>
                {s.title}
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 8. ROLES SECTION (Government Access Portals) ──────────────── */}
      <section id="roles" style={{ maxWidth: 1240, margin: '0 auto 100px', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Government Access Portals
          </div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '2.2rem', color: '#ffffff', marginBottom: 12 }}>
            One Platform. Dedicated Personas.
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.92rem', maxWidth: 620, margin: '0 auto' }}>
            Select your organization portal to access customized compliance verification, bid management, and evaluation dashboards.
          </p>
        </div>

        <RolePortalSelector />
      </section>

      {/* ─── 9. FINAL CTA ───────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1240, margin: '0 auto 80px', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div className="glass-panel-3d" style={{
          padding: '60px 40px', textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.15) 0%, rgba(2, 132, 199, 0.1) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
        }}>
          <h2 style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '2.2rem',
            color: '#ffffff', marginBottom: 16,
          }}>
            Make compliance verification faster, clearer, and more accountable.
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: 540, margin: '0 auto 32px' }}>
            Empower procurement officers and evaluating committees with explainable AI compliance tools.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link to="/register" className="btn-primary" style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
              Get Started
            </Link>
            <Link to="/login" className="btn-secondary" style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 10. ENTERPRISE FOOTER ──────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        background: 'rgba(7, 11, 20, 0.95)',
        padding: '48px 24px 32px', position: 'relative', zIndex: 1,
      }}>
        <div style={{
          maxWidth: 1240, margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24,
          marginBottom: 32,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ color: '#0284c7', fontSize: '1.1rem' }}>◈</span>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: '#f0f4ff' }}>COMPLYGEM AI</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
              Intelligent Procurement Compliance Verification Platform
            </p>
          </div>

          <div style={{ display: 'flex', gap: 24, fontSize: '0.8rem', color: '#94a3b8' }}>
            <a href="#platform" style={{ color: '#94a3b8', textDecoration: 'none' }}>Platform</a>
            <a href="#how-it-works" style={{ color: '#94a3b8', textDecoration: 'none' }}>How It Works</a>
            <a href="#security" style={{ color: '#94a3b8', textDecoration: 'none' }}>Security</a>
            <Link to="/login" style={{ color: '#94a3b8', textDecoration: 'none' }}>Sign In</Link>
          </div>
        </div>

        <div style={{
          maxWidth: 1240, margin: '0 auto', paddingTop: 20,
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#4a6080',
        }}>
          <span>© 2026 COMPLYGEM AI. All rights reserved.</span>
          <span>Enterprise Procurement Intelligence System</span>
        </div>
      </footer>

    </div>
  );
}
