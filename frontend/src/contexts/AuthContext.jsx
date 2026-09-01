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
    id: 'demo-admin-id',
    name: 'System Administrator',
    email: 'admin@complygem.gov.in',
    role: 'ADMIN',
    organization: 'ComplyGeM Central Authority',
    approvalStatus: 'APPROVED',
  },
  PROCUREMENT_OFFICER: {
    id: 'demo-officer-id',
    name: 'Rajesh Kumar (Officer)',
    email: 'rajesh.officer@labour.gov.in',
    role: 'PROCUREMENT_OFFICER',
    organization: 'Ministry of Labour & Employment',
    approvalStatus: 'APPROVED',
  },
  REVIEWER: {
    id: 'demo-reviewer-id',
    name: 'Dr. Anita Desai (Compliance Officer)',
    email: 'anita.compliance@nic.gov.in',
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
  AUDITOR: {
    id: 'demo-auditor-id',
    name: 'Justice S. Narayan (Auditor)',
    email: 'auditor.narayan@cag.gov.in',
    role: 'AUDITOR',
    organization: 'Comptroller & Auditor General of India (CAG)',
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
          const demoProf = DEMO_PROFILES[savedDemo];
          setProfile(demoProf);
          setUser({ email: demoProf.email, displayName: demoProf.name, uid: 'demo' });
          setIsDemoUser(true);
          localStorage.setItem('authToken', 'demo-token');
          api.defaults.headers.common['Authorization'] = 'Bearer demo-token';
          api.defaults.headers.common['x-demo-role'] = demoProf.role;
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
    setLoading(true);
    const cleanEmail = email.toLowerCase().trim();
    try {
      const res = await signInWithEmailAndPassword(auth, cleanEmail, password);
      return res.user;
    } catch (err) {
      // Check for known system demo accounts
      let matchedRole = null;
      if (cleanEmail === 'admin@complygem.gov.in') matchedRole = 'ADMIN';
      else if (cleanEmail === 'officer@complygem.gov.in' || cleanEmail.includes('officer') || cleanEmail.includes('labour')) matchedRole = 'PROCUREMENT_OFFICER';
      else if (cleanEmail === 'auditor@complygem.gov.in' || cleanEmail.includes('auditor') || cleanEmail.includes('cag') || cleanEmail.includes('nic')) matchedRole = 'AUDITOR';
      else if (cleanEmail === 'vendor@abcindustries.com' || cleanEmail.includes('vendor') || cleanEmail.includes('bidder') || cleanEmail.includes('abc')) matchedRole = 'BIDDER';

      if (matchedRole && DEMO_PROFILES[matchedRole]) {
        const demoProf = DEMO_PROFILES[matchedRole];
        setProfile(demoProf);
        setUser({ email: demoProf.email, displayName: demoProf.name, uid: 'demo' });
        setIsDemoUser(true);
        localStorage.setItem('demoRole', matchedRole);
        localStorage.setItem('authToken', 'demo-token');
        api.defaults.headers.common['Authorization'] = 'Bearer demo-token';
        api.defaults.headers.common['x-demo-role'] = demoProf.role;
        return demoProf;
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, { name, role, organization, phone, organizationId }) => {
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(res.user, { displayName: name });
      const token = await res.user.getIdToken();

      // Register profile in backend database
      await api.post('/auth/register', {
        firebaseUid: res.user.uid,
        email,
        name,
        role,
        organization,
        phone,
        organizationId,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('demoRole');
    localStorage.removeItem('authToken');
    delete api.defaults.headers.common['Authorization'];
    delete api.defaults.headers.common['x-demo-role'];
    setUser(null);
    setProfile(null);
    setIsDemoUser(false);
    try {
      await signOut(auth);
    } catch { /* ignore if in demo */ }
  };

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const switchDemoRole = (newRole) => {
    if (DEMO_PROFILES[newRole]) {
      const demoProf = DEMO_PROFILES[newRole];
      setProfile(demoProf);
      setUser({ email: demoProf.email, displayName: demoProf.name, uid: 'demo' });
      setIsDemoUser(true);
      localStorage.setItem('demoRole', newRole);
      localStorage.setItem('authToken', 'demo-token');
      api.defaults.headers.common['Authorization'] = 'Bearer demo-token';
      api.defaults.headers.common['x-demo-role'] = demoProf.role;
      toast.success(`Switched role to: ${demoProf.role.replace(/_/g, ' ')} (${demoProf.name})`);
    }
  };

  const value = {
    user,
    profile,
    role: profile?.role || 'PROCUREMENT_OFFICER',
    isAuthenticated: !!profile || !!user,
    loading,
    isDemoUser,
    login,
    register,
    logout,
    resetPassword,
    switchDemoRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
