import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TendersPage from './pages/TendersPage';
import CreateTenderPage from './pages/CreateTenderPage';
import TenderDetailPage from './pages/TenderDetailPage';
import BidderDetailPage from './pages/BidderDetailPage';
import ComplianceDashboardPage from './pages/ComplianceDashboardPage';
import ReportsPage from './pages/ReportsPage';
import AuditPage from './pages/AuditPage';
import AdminPage from './pages/AdminPage';
import { PendingApprovalPage, AccountSuspendedPage, Forbidden403Page } from './pages/SecurityStatusPages';

// Role-to-Dashboard route resolver
const getRoleDashboardPath = (role) => {
  switch (role) {
    case 'PROCUREMENT_OFFICER': return '/procurement/dashboard';
    case 'REVIEWER':            return '/reviewer/dashboard';
    case 'BIDDER':              return '/bidder/dashboard';
    case 'ADMIN':               return '/admin/dashboard';
    default:                    return '/dashboard';
  }
};

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, role, profile, loading } = useAuth();
  
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-dark)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, border: '3px solid var(--bg-border)',
          borderTop: '3px solid #3b82f6', borderRadius: '50%',
          animation: 'spin-slow 1s linear infinite', margin: '0 auto 16px'
        }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Verifying Authentication & Custom Claims...</p>
      </div>
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Account Status Checks
  if (profile?.approvalStatus === 'PENDING' && role !== 'BIDDER' && role !== 'ADMIN') {
    return <Navigate to="/pending-approval" replace />;
  }

  if (profile?.isActive === false) {
    return <Navigate to="/account-suspended" replace />;
  }

  // RBAC Permission Check
  if (roles && !roles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { isAuthenticated, role } = useAuth();

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={isAuthenticated ? <Navigate to={getRoleDashboardPath(role)} /> : <LandingPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to={getRoleDashboardPath(role)} /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to={getRoleDashboardPath(role)} /> : <RegisterPage />} />

      {/* Security Status Pages */}
      <Route path="/pending-approval" element={<PendingApprovalPage />} />
      <Route path="/account-suspended" element={<AccountSuspendedPage />} />
      <Route path="/403" element={<Forbidden403Page />} />

      {/* Central & Role-Specific Dashboard Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/procurement/dashboard" element={<ProtectedRoute roles={['PROCUREMENT_OFFICER', 'ADMIN']}><DashboardPage /></ProtectedRoute>} />
      <Route path="/reviewer/dashboard" element={<ProtectedRoute roles={['REVIEWER', 'ADMIN']}><DashboardPage /></ProtectedRoute>} />
      <Route path="/bidder/dashboard" element={<ProtectedRoute roles={['BIDDER', 'ADMIN']}><DashboardPage /></ProtectedRoute>} />
      <Route path="/admin/dashboard" element={<ProtectedRoute roles={['ADMIN']}><DashboardPage /></ProtectedRoute>} />

      {/* Operational Pages */}
      <Route path="/tenders" element={<ProtectedRoute><TendersPage /></ProtectedRoute>} />
      <Route path="/tenders/create" element={<ProtectedRoute roles={['ADMIN','PROCUREMENT_OFFICER']}><CreateTenderPage /></ProtectedRoute>} />
      <Route path="/tenders/:id" element={<ProtectedRoute><TenderDetailPage /></ProtectedRoute>} />
      <Route path="/tenders/:tenderId/bidders/:bidderId" element={<ProtectedRoute><BidderDetailPage /></ProtectedRoute>} />
      <Route path="/compliance/:bidderId" element={<ProtectedRoute roles={['ADMIN', 'PROCUREMENT_OFFICER', 'REVIEWER']}><ComplianceDashboardPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute roles={['ADMIN', 'PROCUREMENT_OFFICER', 'REVIEWER', 'BIDDER']}><ReportsPage /></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute roles={['ADMIN', 'PROCUREMENT_OFFICER', 'REVIEWER']}><AuditPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0f1629',
              color: '#f0f4ff',
              border: '1px solid #1e2d4a',
              borderRadius: '12px',
              fontSize: '0.875rem'
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#0f1629' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#0f1629' } }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
