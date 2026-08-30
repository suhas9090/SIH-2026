import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// Preset demo identities for hackathon evaluation across all 4 primary roles
const DEMO_PROFILES = {
  PROCUREMENT_OFFICER: {
    id: 'demo-officer-id',
    name: 'Rajesh Sharma (Officer)',
    email: 'rajesh.officer@gem.gov.in',
    role: 'PROCUREMENT_OFFICER',
    organization: 'Ministry of Labour & Employment',
    approvalStatus: 'APPROVED',
  },
  REVIEWER: {
    id: 'demo-reviewer-id',
    name: 'Dr. Anita Desai (Reviewer)',
    email: 'anita.reviewer@nic.gov.in',
    role: 'REVIEWER',
    organization: 'National Informatics Centre (NIC)',
    approvalStatus: 'APPROVED',
  },
  BIDDER: {
    id: 'demo-bidder-id',
    name: 'Vikram Mehta (Bidder)',
    email: 'vikram@abc-industries.com',
    role: 'BIDDER',
    organization: 'ABC Industries Pvt Ltd',
    approvalStatus: 'APPROVED',
  },
  ADMIN: {
    id: 'demo-admin-id',
    name: 'System Administrator',
    email: 'admin@complygem.gov.in',
    role: 'ADMIN',
    organization: 'ComplyGeM Central Authority',
    approvalStatus: 'APPROVED',
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('authToken', token);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Fetch user profile from backend
          const res = await api.get('/auth/me');
          setProfile(res.data);
          setUser(firebaseUser);
          setIsDemoUser(false);
        } catch (err) {
          console.error('Auth profile fetch error:', err);
          setUser(firebaseUser);
        }
      } else {
        const savedDemo = localStorage.getItem('demoRole');
        if (savedDemo && DEMO_PROFILES[savedDemo]) {
          setProfile(DEMO_PROFILES[savedDemo]);
          setUser({ email: DEMO_PROFILES[savedDemo].email, displayName: DEMO_PROFILES[savedDemo].name, uid: 'demo' });
          setIsDemoUser(true);
        } else {
          setUser(null);
          setProfile(null);
          setIsDemoUser(false);
          localStorage.removeItem('authToken');
          delete api.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const token = await cred.user.getIdToken();
    localStorage.setItem('authToken', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setIsDemoUser(false);
    localStorage.removeItem('demoRole');
    return cred;
  };

  const register = async (email, password, name, organization, phone, role, organizationId) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const token = await cred.user.getIdToken();
    localStorage.setItem('authToken', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Register profile in backend — backend enforces role policy
    const res = await api.post('/auth/register-profile', {
      name, organization, organizationId, phone,
      role: role || 'BIDDER',
    });

    // Send email verification
    try {
      const { sendEmailVerification } = await import('firebase/auth');
      await sendEmailVerification(cred.user);
    } catch (verifyErr) {
      console.warn('Email verification send failed:', verifyErr.message);
    }

    return { cred, backendResponse: res.data };
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch { /* ignore */ }
    localStorage.removeItem('authToken');
    localStorage.removeItem('demoRole');
    setUser(null);
    setProfile(null);
    setIsDemoUser(false);
  };

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  // Demo login (for testing / judging without Firebase setup)
  const demoLogin = async (targetRole = 'PROCUREMENT_OFFICER') => {
    const demoProfile = DEMO_PROFILES[targetRole] || DEMO_PROFILES.PROCUREMENT_OFFICER;
    api.defaults.headers.common['Authorization'] = 'Bearer demo-token';
    localStorage.setItem('authToken', 'demo-token');
    localStorage.setItem('demoRole', targetRole);
    setProfile(demoProfile);
    setUser({ email: demoProfile.email, displayName: demoProfile.name, uid: 'demo' });
    setIsDemoUser(true);
  };

  // Switch demo persona on the fly to demonstrate RBAC during hackathon judging
  const switchDemoRole = (newRole) => {
    if (DEMO_PROFILES[newRole]) {
      const demoProfile = DEMO_PROFILES[newRole];
      localStorage.setItem('demoRole', newRole);
      setProfile(demoProfile);
      setUser({ email: demoProfile.email, displayName: demoProfile.name, uid: 'demo' });
    }
  };

  const value = {
    user,
    profile,
    loading,
    login,
    register,
    logout,
    resetPassword,
    demoLogin,
    switchDemoRole,
    isDemoUser,
    isAuthenticated: !!user,
    role: profile?.role || 'PROCUREMENT_OFFICER',
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
