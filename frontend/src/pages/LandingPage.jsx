import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RolePortalSelector from '../components/RolePortalSelector';

const GATEWAY_NODES = [
  { id: 'gst',   name: 'GST Portal',  code: 'GST',   sub: 'Registration & Active Filings', color: '#2563eb', bg: '#eff6ff' },
  { id: 'pan',   name: 'Income Tax',  code: 'PAN',   sub: 'Entity & Status Validation',    color: '#0284c7', bg: '#f0f9ff' },
  { id: 'udyam', name: 'MSME Udyam',  code: 'UDYAM', sub: 'Category & Turnover Caps',      color: '#059669', bg: '#ecfdf5' },
  { id: 'mca',   name: 'MCA21',       code: 'MCA',   sub: 'CIN, Directors & Compliance',  color: '#7c3aed', bg: '#f5f3ff' },
  { id: 'epfo',  name: 'EPFO & ESIC', code: 'EPFO',  sub: 'Labour Welfare Compliance',     color: '#d97706', bg: '#fffbeb' },
  { id: 'cvc',   name: 'Debarment',   code: 'CVC',   sub: 'Central Debarment Registry',    color: '#dc2626', bg: '#fef2f2' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeNode, setActiveNode] = useState(GATEWAY_NODES[0]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', position: 'relative' }}>
      
      {/* ─── 1. NAVBAR ─────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
      }}>
        <div style={{
          maxWidth: 1240, margin: '0 auto', padding: '14px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img
              src="/complygem_logo.png"
              alt="ComplyGeM Logo"
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                objectFit: 'contain',
              }}
            />
            <div>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.2rem', color: '#0f172a', letterSpacing: '-0.02em' }}>
                COMPLYGEM
              </span>
              <span style={{ color: '#2563eb', fontWeight: 900, fontSize: '1.2rem', marginLeft: 4 }}>AI</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }} className="hidden md:flex">
            <a href="#portals" className="btn-ghost" style={{ fontSize: '0.85rem' }}>Portals</a>
            <a href="#how-it-works" className="btn-ghost" style={{ fontSize: '0.85rem' }}>How It Works</a>
            <a href="#engine" className="btn-ghost" style={{ fontSize: '0.85rem' }}>Gateways</a>
            <a href="#features" className="btn-ghost" style={{ fontSize: '0.85rem' }}>Features</a>
            <a href="#security" className="btn-ghost" style={{ fontSize: '0.85rem' }}>Security</a>
          </nav>

          {/* Sign In CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link to="/login" className="btn-secondary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
              Sign In
            </Link>
            <Link to="/register" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
              Register →
            </Link>
          </div>
        </div>
      </header>

      {/* ─── 2. HERO SECTION ───────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%)',
        padding: '60px 24px 70px',
        borderBottom: '1px solid #e2e8f0',
      }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 48, alignItems: 'center' }}>

          {/* Left Column */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: 30,
              background: '#dbeafe',
              border: '1px solid #bfdbfe',
              color: '#1d4ed8', fontSize: '0.78rem', fontWeight: 700,
              letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 20,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', display: 'inline-block' }} />
              AI-POWERED PUBLIC PROCUREMENT INTELLIGENCE
            </div>

            <h1 style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 900,
              fontSize: 'clamp(2.2rem, 3.8vw, 3.2rem)',
              lineHeight: 1.15,
              color: '#0f172a',
              letterSpacing: '-0.03em',
              marginBottom: 18,
            }}>
              Intelligent Public Procurement Compliance & Verification
            </h1>

            <p style={{
              fontSize: '1.05rem',
              lineHeight: 1.65,
              color: '#475569',
              maxWidth: 540,
              marginBottom: 32,
            }}>
              Verify bidder eligibility, cross-check statutory registrations against live Government databases, and automate tender pre-qualification audits through one unified platform.
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 36 }}>
              <a href="#portals" className="btn-primary" style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
                Access Your Portal ↗
              </a>
              <Link to="/bidder/tenders" className="btn-secondary" style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
                Browse Open Tenders
              </Link>
            </div>

            {/* Quick Metrics Bar */}
            <div style={{ display: 'flex', gap: 32, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
              {[
                { val: '100%', label: 'Deterministic Audit' },
                { val: '6+',   label: 'Gov. Data Gateways' },
                { val: '0',    label: 'Arbitrary Discrepancies' },
              ].map(m => (
                <div key={m.label}>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.4rem', color: '#2563eb' }}>
                    {m.val}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2, fontWeight: 600 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Clean White Dashboard Card */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 20,
              padding: 28,
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.02)',
              width: '100%',
              maxWidth: 440,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                    ✓
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                    Statutory Verification Dossier
                  </span>
                </div>
                <span style={{ fontSize: '0.68rem', background: '#ecfdf5', color: '#059669', padding: '3px 8px', borderRadius: 10, fontWeight: 700 }}>
                  LIVE VERIFIED
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                {[
                  { label: 'Company PAN', val: 'SYNPA0001C', authority: 'CBDT Direct Taxes', ok: true },
                  { label: 'GST Registration', val: '29SYNPA0001C1Z5', authority: 'GSTN Network', ok: true },
                  { label: 'MSME Udyam', val: 'UDYAM-KR-03-0012345', authority: 'Ministry of MSME', ok: true },
                  { label: 'MCA21 ROC', val: 'U29100KA2018PTC112233', authority: 'Ministry of Corp. Affairs', ok: true },
                  { label: 'Debarment Check', val: '0 Adverse Hits', authority: 'CVC / GeM Blacklist', ok: true },
                ].map((item, idx) => (
                  <div key={idx} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0f172a' }}>{item.label}</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{item.authority}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, fontFamily: 'monospace', color: '#2563eb' }}>{item.val}</div>
                      <div style={{ fontSize: '0.62rem', color: '#059669', fontWeight: 700 }}>✓ 100% MATCH</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#eff6ff', borderRadius: 10, padding: '10px 14px', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af' }}>Risk Score: 0 / 20 (Clean Record)</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#16a34a' }}>APPROVED TO BID</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── 3. ACCESS YOUR PORTAL (REFERENCE IMAGE INSPIRATION) ───────── */}
      <section id="portals" style={{ maxWidth: 1240, margin: '0 auto', padding: '80px 24px 60px' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '2.3rem', color: '#0f172a', marginBottom: 8, letterSpacing: '-0.02em' }}>
            Access Your Portal
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: 540, margin: '0 auto' }}>
            Select your role to log in to the workspace
          </p>
        </div>

        <RolePortalSelector />
      </section>

      {/* ─── 4. HOW IT WORKS ────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ maxWidth: 1240, margin: '0 auto', padding: '60px 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Deterministic Workflow
          </div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '2rem', color: '#0f172a' }}>
            How ComplyGeM Verifies Bids
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {[
            { step: '01', title: 'Tender Parsing', desc: 'AI extracts mandatory statutory criteria and pre-qualification rules from GeM tender specs.', icon: '📑' },
            { step: '02', title: 'Government Cross-Check', desc: 'Real-time validation against CBDT, GSTN, MSME, and MCA21 master government databases.', icon: '🏛️' },
            { step: '03', title: 'AI OCR & Consistency Audit', desc: 'Cross-verifies uploaded PDF/image certificates against entered data and statutory registries.', icon: '🔍' },
            { step: '04', title: 'Official Audit Report', desc: 'Generates verifiable, government-grade PDF audit reports with tamper-proof checksums.', icon: '📜' },
          ].map((item) => (
            <div key={item.step} className="card" style={{ padding: 26, position: 'relative' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 12 }}>{item.icon}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', marginBottom: 4 }}>STEP {item.step}</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{item.title}</h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.55, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 5. GATEWAYS SECTION ───────────────────────────────────────── */}
      <section id="engine" style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '70px 24px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Integrated Regulators
          </div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '2rem', color: '#0f172a', marginBottom: 14 }}>
            Authoritative Government Gateways
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.92rem', maxWidth: 600, margin: '0 auto 32px' }}>
            Seamless connectors verify identity, statutory filings, and debarment status across central regulatory databases.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
            {GATEWAY_NODES.map(node => (
              <button
                key={node.id}
                onClick={() => setActiveNode(node)}
                style={{
                  padding: '10px 20px', borderRadius: 12, cursor: 'pointer',
                  background: activeNode.id === node.id ? node.bg : '#ffffff',
                  border: `1px solid ${activeNode.id === node.id ? node.color : '#cbd5e1'}`,
                  color: activeNode.id === node.id ? node.color : '#475569',
                  fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s',
                }}
              >
                {node.name}
              </button>
            ))}
          </div>

          <div style={{
            maxWidth: 520, margin: '0 auto', padding: '20px 24px', borderRadius: 14,
            background: '#f8fafc', border: `1px solid #cbd5e1`,
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 800, color: activeNode.color, fontSize: '0.95rem' }}>
                {activeNode.name} Integration
              </span>
              <span style={{ fontSize: '0.7rem', background: '#ecfdf5', color: '#059669', padding: '3px 8px', borderRadius: 10, fontWeight: 700 }}>
                CONNECTOR ACTIVE ✓
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 600, marginBottom: 4 }}>
              Function: {activeNode.sub}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
              Deterministic cross-referencing compares extracted statutory attributes directly against live official registries.
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. FOOTER ─────────────────────────────────────────────────── */}
      <footer style={{
        background: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        padding: '48px 24px 32px',
      }}>
        <div style={{
          maxWidth: 1240, margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24,
          marginBottom: 28,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <img
                src="/complygem_logo.png"
                alt="ComplyGeM Logo"
                style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain' }}
              />
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, color: '#0f172a', fontSize: '1.1rem' }}>
                COMPLYGEM AI
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
              Intelligent Procurement Compliance Verification Platform
            </p>
          </div>

          <div style={{ display: 'flex', gap: 20, fontSize: '0.84rem' }}>
            <a href="#portals" style={{ color: '#475569', textDecoration: 'none', fontWeight: 600 }}>Portals</a>
            <a href="#how-it-works" style={{ color: '#475569', textDecoration: 'none', fontWeight: 600 }}>How It Works</a>
            <a href="#engine" style={{ color: '#475569', textDecoration: 'none', fontWeight: 600 }}>Gateways</a>
            <Link to="/login" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 700 }}>Sign In</Link>
          </div>
        </div>

        <div style={{
          maxWidth: 1240, margin: '0 auto', paddingTop: 20,
          borderTop: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#94a3b8',
        }}>
          <span>© 2026 COMPLYGEM AI. All rights reserved.</span>
          <span>Enterprise Public Procurement Intelligence System</span>
        </div>
      </footer>

    </div>
  );
}
