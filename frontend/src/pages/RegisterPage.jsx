import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { verificationAPI } from '../services/api';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ACCOUNT_TYPES = [
  {
    type: 'BIDDER',
    icon: '🏢',
    title: 'Bidder / Supplier',
    desc: 'Register corporate profile to find tenders and submit bids with automated regulatory verification',
    badge: 'Self-Service & Verification',
    badgeColor: '#10b981',
  },
  {
    type: 'PROCUREMENT_OFFICER',
    icon: '🏛️',
    title: 'Procurement Officer',
    desc: 'Publish tenders, manage submissions, and make authorized compliance decisions',
    badge: 'Requires Admin Approval',
    badgeColor: '#3b82f6',
  },
  {
    type: 'COMPLIANCE_AUDITOR',
    icon: '🔍',
    title: 'Compliance Auditor',
    desc: 'Independent evaluation of AI findings, evidence inspection, and decision sign-offs',
    badge: 'Requires Admin Approval',
    badgeColor: '#06b6d4',
  },
  {
    type: 'ADMIN',
    icon: '🔒',
    title: 'System Administrator',
    desc: 'Platform management, security monitoring, and RBAC governance',
    badge: 'Invitation Only',
    badgeColor: '#ef4444',
    disabled: true,
  },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [selectedRole, setSelectedRole] = useState(null);
  const [step, setStep] = useState(1); // 1=Role, 2=Personal+OTP, 3=Company/Org, 4=Verification, 5=Done
  const [loading, setLoading] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Step 2: Personal Details
  const [personal, setPersonal] = useState({
    name: '',
    designation: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    otp: '', // Keep empty
    otpSent: false,
    otpVerified: false,
  });

  // Step 3: Company Details (for Bidder)
  const [company, setCompany] = useState({
    organizationName: 'ABC Safety Technologies Private Limited',
    tradeName: 'ABC Safety Solutions',
    entityType: 'Private Limited Company',
    pan: 'SYNPA0001C',
    gstin: '29SYNPA0001C1Z5',
    udyamNo: 'UDYAM-KR-03-0012345',
    cinNo: 'U29100KA2018PTC112233',
    address: 'Plot 42, Peenya Industrial Area, Phase II',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    pincode: '560058',
    businessCategory: 'Manufacturing',
    yearOfEstablishment: 2018,
  });

  // Step 3: Organization Details (for Officer/Auditor)
  const [officialOrg, setOfficialOrg] = useState({
    organization: 'Central Public Works Department (CPWD)',
    department: 'Procurement & Tendering Wing',
    employeeId: 'EMP-PWD-101',
    designation: 'Senior Procurement Officer',
  });

  // Step 4: Verification Results
  const [verificationResult, setVerificationResult] = useState(null);

  // Quick fill helper for testing
  const handleQuickFillScenario = (scenario) => {
    if (scenario === 'COMPLIANT') {
      setCompany({
        organizationName: 'ABC Safety Technologies Private Limited',
        tradeName: 'ABC Safety Solutions',
        entityType: 'Private Limited Company',
        pan: 'SYNPA0001C',
        gstin: '29SYNPA0001C1Z5',
        udyamNo: 'UDYAM-KR-03-0012345',
        cinNo: 'U29100KA2018PTC112233',
        address: 'Plot 42, Peenya Industrial Area, Phase II',
        state: 'Karnataka',
        district: 'Bengaluru Urban',
        pincode: '560058',
        businessCategory: 'Manufacturing',
        yearOfEstablishment: 2018,
      });
      toast.success('Auto-filled Scenario 1 (Compliant)');
    } else if (scenario === 'MISMATCH') {
      setCompany({
        organizationName: 'Apex Safety Solutions LLP',
        tradeName: 'Apex Protect',
        entityType: 'Limited Liability Partnership',
        pan: 'SYNPA0002L',
        gstin: '27SYNPA0002L1Z2',
        udyamNo: 'UDYAM-MH-01-0023456',
        cinNo: 'AAQ-1234',
        address: 'Unit 104, MIDC Industrial Zone',
        state: 'Maharashtra',
        district: 'Mumbai',
        pincode: '400093',
        businessCategory: 'Trading',
        yearOfEstablishment: 2019,
      });
      toast.success('Auto-filled Scenario 2 (Name Mismatch)');
    }
  };

  const handleSendOtp = () => {
    if (!personal.phone.trim()) return toast.error('Please enter your mobile phone number first.');
    setPersonal(prev => ({ ...prev, otpSent: true, otp: '' })); // Clean, empty input
    toast.success('OTP sent to ' + personal.phone + '. (Use test OTP: 123456)');
  };

  const handleVerifyOtp = async () => {
    if (!personal.otp || personal.otp.trim().length !== 6) {
      return toast.error('Please enter the 6-digit OTP code.');
    }

    setVerifyingOtp(true);
    try {
      const res = await axios.post(`${API_URL}/auth/verify-otp`, {
        type: 'PHONE',
        target: personal.phone,
        otp: personal.otp.trim(),
      });

      if (res.data.verified) {
        setPersonal(prev => ({ ...prev, otpVerified: true }));
        toast.success('Mobile Phone & Identity Verified!');
      } else {
        toast.error('Invalid OTP code. Please try again.');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP code. For demo, use 123456.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleRunCompanyVerification = async () => {
    if (!personal.otpVerified) {
      return toast.error('Please verify your mobile number OTP before proceeding.');
    }
    setLoading(true);
    try {
      const res = await verificationAPI.verifyBidderUnified({
        bidder: company,
        tenderRequirements: {}
      });
      setVerificationResult(res.data);
      setStep(4);
    } catch (err) {
      toast.error('Synthetic verification check failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      if (selectedRole === 'BIDDER') {
        await axios.post(`${API_URL}/auth/register-bidder`, {
          ...personal,
          ...company,
        });
      } else if (selectedRole === 'PROCUREMENT_OFFICER') {
        await axios.post(`${API_URL}/auth/register-officer`, {
          ...personal,
          ...officialOrg,
        });
      } else if (selectedRole === 'COMPLIANCE_AUDITOR') {
        await axios.post(`${API_URL}/auth/register-auditor`, {
          ...personal,
          ...officialOrg,
          auditorId: officialOrg.employeeId || 'AUD-CAG-001',
        });
      }
      toast.success('Registration submitted successfully!');
      setStep(5);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--gradient-hero)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 16px', position: 'relative',
    }}>
      {/* Floating Top-Left Back Button */}
      <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 20 }}>
        <button
          type="button"
          onClick={() => {
            if (step > 1 && step < 5) {
              setStep(s => s - 1);
            } else {
              navigate('/login');
            }
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '8px 16px',
            color: '#f0f4ff',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#38bdf8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#f0f4ff'; }}
        >
          <span>←</span> {step > 1 && step < 5 ? 'Previous Step' : 'Back to Sign In'}
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: step === 3 || step === 4 ? 760 : 560, position: 'relative', zIndex: 1 }}>
        {/* Header Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <img
              src="/complygem_logo.png"
              alt="ComplyGeM Logo"
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                margin: '0 auto 10px',
                objectFit: 'contain',
                boxShadow: '0 6px 20px rgba(2, 132, 199, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'block',
              }}
            />
          </Link>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#f0f4ff', marginBottom: 2 }}>
            Secure Platform Registration
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.82rem' }}>ComplyGeM AI Verification Portal — SIH2026</p>
        </div>

        {/* STEP 1: Select User Role */}
        {step === 1 && (
          <div className="card" style={{ padding: 28 }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 16 }}>
              Select Registration Role
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ACCOUNT_TYPES.map(type => (
                <div
                  key={type.type}
                  onClick={() => {
                    if (type.disabled) return;
                    setSelectedRole(type.type);
                    setStep(2);
                  }}
                  style={{
                    padding: '16px 18px', borderRadius: 12, cursor: type.disabled ? 'not-allowed' : 'pointer',
                    border: `1px solid ${type.disabled ? 'rgba(30,45,74,0.4)' : 'var(--bg-border)'}`,
                    background: type.disabled ? 'rgba(30,45,74,0.2)' : 'var(--bg-input)',
                    opacity: type.disabled ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', gap: 14,
                  }}
                >
                  <span style={{ fontSize: '1.6rem' }}>{type.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: type.disabled ? '#4a6080' : '#f0f4ff' }}>
                        {type.title}
                      </span>
                      {type.badge && (
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                          color: type.badgeColor, background: `${type.badgeColor}18`,
                          border: `1px solid ${type.badgeColor}30`,
                        }}>
                          {type.badge}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{type.desc}</span>
                  </div>
                  {!type.disabled && <span style={{ color: '#4a6080', fontSize: '1.2rem' }}>›</span>}
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.8rem', color: '#64748b' }}>
              Already registered? <Link to="/login" style={{ color: '#3b82f6', fontWeight: 700 }}>Sign In</Link>
            </div>
          </div>
        )}

        {/* STEP 2: Personal Details + Phone OTP */}
        {step === 2 && (
          <div className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className="section-title">Step 1: Personal & Identity Details</span>
              <span style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: 700 }}>
                {selectedRole.replace(/_/g, ' ')}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>FULL NAME *</label>
                  <input className="input" placeholder="e.g. Rajesh Kumar" value={personal.name} onChange={e => setPersonal({ ...personal, name: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>OFFICIAL DESIGNATION</label>
                  <input className="input" placeholder="e.g. Managing Director" value={personal.designation} onChange={e => setPersonal({ ...personal, designation: e.target.value })} style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>OFFICIAL EMAIL ADDRESS *</label>
                <input className="input" type="email" placeholder="name@company.com" value={personal.email} onChange={e => setPersonal({ ...personal, email: e.target.value })} style={{ width: '100%' }} />
              </div>

              {/* Mobile Phone with OTP verification */}
              <div>
                <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>MOBILE PHONE NUMBER *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="input"
                    placeholder="+91 98801 12345"
                    value={personal.phone}
                    onChange={e => setPersonal({ ...personal, phone: e.target.value, otpVerified: false })}
                    disabled={personal.otpVerified}
                    style={{ flex: 1 }}
                  />
                  {!personal.otpVerified ? (
                    <button type="button" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 12px' }} onClick={handleSendOtp}>
                      {personal.otpSent ? 'Resend OTP' : 'Send OTP'}
                    </button>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 12px', background: 'rgba(16,185,129,0.15)', color: '#10b981', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800 }}>
                      ✓ Verified
                    </span>
                  )}
                </div>
              </div>

              {/* OTP Input Box - Clean and Empty */}
              {personal.otpSent && !personal.otpVerified && (
                <div style={{ padding: 14, background: 'rgba(59,130,246,0.06)', borderRadius: 10, border: '1px solid rgba(59,130,246,0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: 700 }}>ENTER 6-DIGIT OTP CODE *</label>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Demo Code: 123456</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="input"
                      type="text"
                      maxLength={6}
                      placeholder="Type 6-digit OTP code"
                      value={personal.otp}
                      onChange={e => setPersonal({ ...personal, otp: e.target.value })}
                      style={{ flex: 1, fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '0.2em', textAlign: 'center' }}
                    />
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ fontSize: '0.78rem', padding: '6px 16px', background: '#3b82f6' }}
                      onClick={handleVerifyOtp}
                      disabled={verifyingOtp || personal.otp.length !== 6}
                    >
                      {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>PASSWORD *</label>
                  <input className="input" type="password" value={personal.password} onChange={e => setPersonal({ ...personal, password: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>CONFIRM PASSWORD *</label>
                  <input className="input" type="password" value={personal.confirmPassword} onChange={e => setPersonal({ ...personal, confirmPassword: e.target.value })} style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                <button className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    if (!personal.name || !personal.email) return toast.error('Please fill in all required fields.');
                    if (!personal.phone) return toast.error('Please enter a mobile phone number.');
                    if (!personal.otpVerified) return toast.error('Please verify your mobile phone OTP first.');
                    if (!personal.password) return toast.error('Please enter a password.');
                    if (personal.password !== personal.confirmPassword) return toast.error('Passwords do not match.');
                    setStep(3);
                  }}
                >
                  {selectedRole === 'BIDDER' ? 'Next: Company Details →' : 'Next: Organization Details →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Company Details (Bidder) or Organization Details (Officer/Auditor) */}
        {step === 3 && (
          <div className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className="section-title">
                {selectedRole === 'BIDDER' ? 'Step 2: Corporate & Regulatory Details' : 'Step 2: Department Credentials'}
              </span>
              {selectedRole === 'BIDDER' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className="btn-ghost" style={{ fontSize: '0.7rem', color: '#10b981' }} onClick={() => handleQuickFillScenario('COMPLIANT')}>
                    ⚡ Scenario 1 (Compliant)
                  </button>
                  <button type="button" className="btn-ghost" style={{ fontSize: '0.7rem', color: '#f59e0b' }} onClick={() => handleQuickFillScenario('MISMATCH')}>
                    ⚡ Scenario 2 (Mismatch)
                  </button>
                </div>
              )}
            </div>

            {selectedRole === 'BIDDER' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>LEGAL COMPANY NAME *</label>
                  <input className="input" value={company.organizationName} onChange={e => setCompany({ ...company, organizationName: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>PAN CARD NUMBER *</label>
                  <input className="input" value={company.pan} onChange={e => setCompany({ ...company, pan: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>GSTIN NUMBER *</label>
                  <input className="input" value={company.gstin} onChange={e => setCompany({ ...company, gstin: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>UDYAM REGISTRATION NO (MSME)</label>
                  <input className="input" value={company.udyamNo} onChange={e => setCompany({ ...company, udyamNo: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>CORPORATE CIN / LLPIN (MCA)</label>
                  <input className="input" value={company.cinNo} onChange={e => setCompany({ ...company, cinNo: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>STATE</label>
                  <input className="input" value={company.state} onChange={e => setCompany({ ...company, state: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>DISTRICT / PIN CODE</label>
                  <input className="input" value={company.district} onChange={e => setCompany({ ...company, district: e.target.value })} style={{ width: '100%' }} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>GOVERNMENT MINISTRY / ORGANIZATION *</label>
                  <input className="input" value={officialOrg.organization} onChange={e => setOfficialOrg({ ...officialOrg, organization: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>OFFICIAL EMPLOYEE / OFFICER ID *</label>
                    <input className="input" value={officialOrg.employeeId} onChange={e => setOfficialOrg({ ...officialOrg, employeeId: e.target.value })} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>DEPARTMENT / WING</label>
                    <input className="input" value={officialOrg.department} onChange={e => setOfficialOrg({ ...officialOrg, department: e.target.value })} style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
              <button className="btn-secondary" onClick={() => setStep(2)}>← Back</button>
              {selectedRole === 'BIDDER' ? (
                <button className="btn-primary" style={{ background: '#10b981' }} onClick={handleRunCompanyVerification} disabled={loading}>
                  {loading ? '⟳ Triangulating...' : 'Run Synthetic Gateway Verification →'}
                </button>
              ) : (
                <button className="btn-primary" onClick={handleFinalSubmit} disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit for Administrative Approval →'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: Synthetic Regulatory Triangulation (Bidder) */}
        {step === 4 && verificationResult && (
          <div className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <span className="section-title">Synthetic Regulatory Triangulation Summary</span>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                  Source: Synthetic Demo Regulatory Dataset (Prototype Gateway)
                </div>
              </div>
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800,
                background: verificationResult.riskLevel === 'LOW' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                color: verificationResult.riskLevel === 'LOW' ? '#10b981' : '#f59e0b',
              }}>
                {verificationResult.riskLevel} RISK ({verificationResult.overallScore}%)
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {verificationResult.verificationChecks?.slice(0, 5).map((vc, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: vc.status.includes('VERIFIED') || vc.status === 'MATCH' ? '#10b981' : '#ef4444' }} />
                    <span style={{ fontWeight: 700, color: '#f0f4ff' }}>{vc.verificationType}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: vc.status.includes('VERIFIED') || vc.status === 'MATCH' ? '#10b981' : '#f87171' }}>
                    {vc.result || vc.status}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn-secondary" onClick={() => setStep(3)}>← Edit Company Info</button>
              <button className="btn-primary" style={{ background: '#10b981' }} onClick={handleFinalSubmit} disabled={loading}>
                {loading ? 'Submitting...' : 'Register Company Profile →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Registration Submitted & Pending Approval */}
        {step === 5 && (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>⏳</div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f0f4ff', marginBottom: 6 }}>
              Registration Submitted Successfully!
            </h2>
            <div style={{
              display: 'inline-block', padding: '4px 14px', borderRadius: 20,
              background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 800, fontSize: '0.8rem',
              marginBottom: 16, border: '1px solid rgba(245,158,11,0.3)',
            }}>
              ACCOUNT STATUS: PENDING ADMINISTRATIVE APPROVAL
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', maxWidth: 440, margin: '0 auto 24px', lineHeight: 1.5 }}>
              Your credentials and regulatory verification records have been submitted for administrator review.
              You will be notified once platform access is authorized.
            </p>
            <button className="btn-primary" onClick={() => navigate('/login')}>
              Return to Login Screen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
