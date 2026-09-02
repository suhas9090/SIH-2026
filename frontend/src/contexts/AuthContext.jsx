import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// Preset demo identities for SIH26100 across all 5 distinct platform roles
export const DEMO_PROFILES = {
  ADMIN: {
    id: 'user-admin-001',
    name: 'Chief Platform Administrator',
    email: 'admin@complygem.gov.in',
    role: 'ADMIN',
    organization: 'GeM Administration Portal',
    approvalStatus: 'APPROVED',
  },
  PROCUREMENT_OFFICER: {
    id: 'user-officer-001',
    name: 'Rajesh Sharma (Officer)',
    email: 'officer@complygem.gov.in',
    role: 'PROCUREMENT_OFFICER',
    organization: 'Ministry of Labour & Employment',
    approvalStatus: 'APPROVED',
  },
  REVIEWER: {
    id: 'user-auditor-001',
    name: 'Priya Iyer (Auditor)',
    email: 'auditor@complygem.gov.in',
    role: 'REVIEWER',
    organization: 'Comptroller & Auditor General (CAG)',
    approvalStatus: 'APPROVED',
  },
  BIDDER: {
    id: 'demo-bidder',
    name: 'Suresh Patil (Bidder)',
    email: 'vendor@abcindustries.com',
    role: 'BIDDER',
    organization: 'ABC Safety Technologies Private Limited',
    approvalStatus: 'APPROVED',
  },
  AUDITOR: {
    id: 'user-auditor-001',
    name: 'Priya Iyer (Auditor)',
    email: 'auditor@complygem.gov.in',
    role: 'AUDITOR',
    organization: 'Comptroller & Auditor General (CAG)',
    approvalStatus: 'APPROVED',
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [bidderLifecycleStatus, setBidderLifecycleStatus] = useState(null);

  const refreshBidderStatus = async () => {
    try {
      const res = await api.get('/bidder-onboarding/verification-status');
      const status = res.data?.lifecycleStatus || 'REGISTERED';
      setBidderLifecycleStatus(status);
      return status;
    } catch {
      setBidderLifecycleStatus('REGISTERED');
      return 'REGISTERED';
    }
  };

  // Restore authenticated session on initial app load
  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem('authToken');
      if (savedToken) {
        api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
        try {
          const res = await api.get('/auth/me');
          if (res.data && res.data.id) {
            setUser(res.data);
            setProfile(res.data);
            setIsDemoUser(false);
            if (res.data.role === 'BIDDER') {
              await refreshBidderStatus();
            }
          } else {
            throw new Error('Session invalid');
          }
        } catch (err) {
          console.warn('Session verification failed, clearing credentials:', err.message);
          localStorage.removeItem('authToken');
          delete api.defaults.headers.common['Authorization'];
          setUser(null);
          setProfile(null);
          setBidderLifecycleStatus(null);
        }
      } else {
        setUser(null);
        setProfile(null);
        setBidderLifecycleStatus(null);
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  // ── REAL-TIME DATABASE LOGIN ──
  const login = async (email, password, portal) => {
    setLoading(true);
    const cleanEmail = (email || '').toLowerCase().trim();

    try {
      const res = await api.post('/auth/login', { email: cleanEmail, password, portal });
      
      if (res.data.success && res.data.token) {
        const { token, user: loggedInUser } = res.data;
        localStorage.setItem('authToken', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser(loggedInUser);
        setProfile(loggedInUser);
        setIsDemoUser(false);
        if (loggedInUser.role === 'BIDDER') {
          await refreshBidderStatus();
        }
        return loggedInUser;
      } else {
        throw new Error(res.data.error || 'Authentication failed.');
      }
    } catch (err) {
      if (err.response?.data?.code === 'ROLE_PORTAL_MISMATCH') {
        const customErr = new Error(err.response.data.error);
        customErr.code = 'ROLE_PORTAL_MISMATCH';
        customErr.data = err.response.data;
        throw customErr;
      }
      const errorMsg = err.response?.data?.error || err.message || 'Login failed. Please check your credentials.';
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ── REAL-TIME DATABASE REGISTRATION ──
  const register = async (email, password, { name, role, organization, phone, organizationId } = {}) => {
    setLoading(true);
    const cleanEmail = (email || '').toLowerCase().trim();

    try {
      const res = await api.post('/auth/register', {
        email: cleanEmail,
        password,
        name,
        role: role || 'BIDDER',
        organization,
        phone,
        organizationId
      });

      if (res.data.success) {
        const { token, user: newUser } = res.data;
        if (token) {
          localStorage.setItem('authToken', token);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser(newUser);
          setProfile(newUser);
          if (newUser.role === 'BIDDER') {
            await refreshBidderStatus();
          }
        }
        return newUser;
      } else {
        throw new Error(res.data.error || 'Registration failed.');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Registration failed.';
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ── SIGN OUT ──
  const logout = async () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('demoRole');
    delete api.defaults.headers.common['Authorization'];
    delete api.defaults.headers.common['x-demo-role'];
    setUser(null);
    setProfile(null);
    setIsDemoUser(false);
    setBidderLifecycleStatus(null);
    toast.success('Signed out successfully.');
  };

  const resetPassword = async (email) => {
    toast.success('Password reset link sent to ' + email + ' (simulated gateway)');
  };

  const role = profile?.role || user?.role || null;
  const isAuthenticated = !!user;
  const isBidderApproved = role === 'BIDDER' ? (bidderLifecycleStatus === 'APPROVED_TO_BID') : true;

  const value = {
    user,
    profile,
    loading,
    isAuthenticated,
    role,
    isDemoUser,
    bidderLifecycleStatus,
    refreshBidderStatus,
    isBidderApproved,
    login,
    register,
    logout,
    resetPassword,
    isAdmin: role === 'ADMIN',
    isOfficer: role === 'PROCUREMENT_OFFICER',
    isReviewer: role === 'REVIEWER',
    isBidder: role === 'BIDDER',
    isAuditor: role === 'AUDITOR' || role === 'REVIEWER',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
