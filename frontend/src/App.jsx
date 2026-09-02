import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Public & Security Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { PendingApprovalPage, AccountSuspendedPage, Forbidden403Page } from './pages/SecurityStatusPages';

// Shared & Officer Pages
import DashboardPage from './pages/DashboardPage';
import TendersPage from './pages/TendersPage';
import CreateTenderPage from './pages/CreateTenderPage';
import TenderDetailPage from './pages/TenderDetailPage';
import BidderDetailPage from './pages/BidderDetailPage';
import BidsPage from './pages/BidsPage';
import RiskAlertsPage from './pages/RiskAlertsPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import ComplianceDashboardPage from './pages/ComplianceDashboardPage';
import ReportsPage from './pages/ReportsPage';
import AuditPage from './pages/AuditPage';
import AdminPage from './pages/AdminPage';

// Dedicated Bidder / Supplier Pages
import BidderTendersPage from './pages/bidder/BidderTendersPage';
import BidderTenderDetailPage from './pages/bidder/BidderTenderDetailPage';
import BidSubmissionPage from './pages/bidder/BidSubmissionPage';
import BidderMyBidsPage from './pages/bidder/BidderMyBidsPage';
import BidderDocumentsPage from './pages/bidder/BidderDocumentsPage';
import BidderCompliancePage from './pages/bidder/BidderCompliancePage';
import BidderClarificationsPage from './pages/bidder/BidderClarificationsPage';
import BidderProfilePage from './pages/bidder/BidderProfilePage';
import BidderOnboardingPage from './pages/bidder/BidderOnboardingPage';
import BidderVerificationStatusPage from './pages/bidder/BidderVerificationStatusPage';

// Verification Officer Pages
import VerificationQueuePage from './pages/reviewer/VerificationQueuePage';
import BidVerificationPage from './pages/officer/BidVerificationPage';
import BidderDossierPage from './pages/reviewer/BidderDossierPage';
import VerifyCompanyProfilesPage from './pages/officer/VerifyCompanyProfilesPage';

// Dedicated Compliance & Auditor Pages
import AuditorQueuePage from './pages/auditor/AuditorQueuePage';
import CrossDocumentComparisonPage from './pages/auditor/CrossDocumentComparisonPage';
import DisputedResultsPage from './pages/auditor/DisputedResultsPage';
import CompletedReviewsPage from './pages/auditor/CompletedReviewsPage';

// Role-to-Dashboard route resolver
const getRoleDashboardPath = (role, isBidderApproved) => {
  switch (role) {
    case 'ADMIN':               return '/admin/dashboard';
    case 'PROCUREMENT_OFFICER': return '/procurement/dashboard';
    case 'REVIEWER':            return '/reviewer/dashboard';
    case 'BIDDER':              return isBidderApproved ? '/bidder/dashboard' : '/bidder/onboarding';
    case 'AUDITOR':             return '/auditor/dashboard';
    default:                    return '/dashboard';
  }
};

const ProtectedRoute = ({ children, roles, allowUnverifiedBidder = false }) => {
  const { isAuthenticated, role, profile, loading, isBidderApproved } = useAuth();
  const location = useLocation();
  
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-dark)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, border: '3px solid var(--bg-border)',
          borderTop: '3px solid #3b82f6', borderRadius: '50%',
          animation: 'spin-slow 1s linear infinite', margin: '0 auto 16px'
        }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Verifying Authentication & Role Permissions...</p>
      </div>
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Account Status Checks
  if (profile?.approvalStatus === 'PENDING' && role !== 'BIDDER' && role !== 'ADMIN' && role !== 'AUDITOR') {
    return <Navigate to="/pending-approval" replace />;
  }

  if (profile?.isActive === false) {
    return <Navigate to="/account-suspended" replace />;
  }

  // RBAC Permission Check
  if (roles && !roles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  // Bidder Verification Gate: Unverified bidders are restricted to onboarding & verification-status pages
  const isBidderOnboardingRoute = location.pathname.startsWith('/bidder/onboarding') ||
                                  location.pathname.startsWith('/bidder/verification-status') ||
                                  allowUnverifiedBidder;
  if (role === 'BIDDER' && !isBidderApproved && !isBidderOnboardingRoute) {
    return <Navigate to="/bidder/onboarding" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { isAuthenticated, role, isBidderApproved } = useAuth();

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={isAuthenticated ? <Navigate to={getRoleDashboardPath(role, isBidderApproved)} /> : <LandingPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to={getRoleDashboardPath(role, isBidderApproved)} /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to={getRoleDashboardPath(role, isBidderApproved)} /> : <RegisterPage />} />

      {/* Security Status Pages */}
      <Route path="/pending-approval" element={<PendingApprovalPage />} />
      <Route path="/account-suspended" element={<AccountSuspendedPage />} />
      <Route path="/403" element={<Forbidden403Page />} />

      {/* Central & 5 Role-Specific Dashboard Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/admin/dashboard" element={<ProtectedRoute roles={['ADMIN']}><DashboardPage /></ProtectedRoute>} />
      <Route path="/procurement/dashboard" element={<ProtectedRoute roles={['PROCUREMENT_OFFICER', 'ADMIN']}><DashboardPage /></ProtectedRoute>} />
      <Route path="/reviewer/dashboard" element={<ProtectedRoute roles={['REVIEWER', 'ADMIN']}><DashboardPage /></ProtectedRoute>} />
      <Route path="/bidder/dashboard" element={<ProtectedRoute roles={['BIDDER', 'ADMIN']}><DashboardPage /></ProtectedRoute>} />
      <Route path="/auditor/dashboard" element={<ProtectedRoute roles={['AUDITOR', 'ADMIN']}><DashboardPage /></ProtectedRoute>} />

      {/* Operational Pages */}
      <Route path="/tenders" element={<ProtectedRoute><TendersPage /></ProtectedRoute>} />
      <Route path="/tenders/create" element={<ProtectedRoute roles={['ADMIN', 'PROCUREMENT_OFFICER']}><CreateTenderPage /></ProtectedRoute>} />
      <Route path="/tenders/:id" element={<ProtectedRoute><TenderDetailPage /></ProtectedRoute>} />
      <Route path="/tenders/:tenderId/bidders/:bidderId" element={<ProtectedRoute><BidderDetailPage /></ProtectedRoute>} />
      <Route path="/bids" element={<ProtectedRoute roles={['ADMIN', 'PROCUREMENT_OFFICER', 'REVIEWER', 'AUDITOR']}><BidsPage /></ProtectedRoute>} />
      <Route path="/risk-alerts" element={<ProtectedRoute roles={['ADMIN', 'PROCUREMENT_OFFICER', 'REVIEWER', 'AUDITOR']}><RiskAlertsPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/compliance/:bidderId" element={<ProtectedRoute roles={['ADMIN', 'PROCUREMENT_OFFICER', 'REVIEWER', 'AUDITOR']}><ComplianceDashboardPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute roles={['ADMIN', 'PROCUREMENT_OFFICER', 'REVIEWER', 'BIDDER', 'AUDITOR']}><ReportsPage /></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute roles={['ADMIN', 'PROCUREMENT_OFFICER', 'REVIEWER', 'AUDITOR']}><AuditPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminPage /></ProtectedRoute>} />

      {/* Dedicated Bidder / Supplier Workflows */}
      <Route path="/bidder/onboarding" element={<ProtectedRoute roles={['BIDDER', 'ADMIN']} allowUnverifiedBidder={true}><BidderOnboardingPage /></ProtectedRoute>} />
      <Route path="/bidder/verification-status" element={<ProtectedRoute roles={['BIDDER', 'ADMIN']} allowUnverifiedBidder={true}><BidderVerificationStatusPage /></ProtectedRoute>} />
      <Route path="/bidder/tenders" element={<ProtectedRoute roles={['BIDDER', 'ADMIN']}><BidderTendersPage /></ProtectedRoute>} />
      <Route path="/bidder/tenders/:id" element={<ProtectedRoute roles={['BIDDER', 'ADMIN']}><BidderTenderDetailPage /></ProtectedRoute>} />
      <Route path="/bidder/submit/:tenderId" element={<ProtectedRoute roles={['BIDDER', 'ADMIN']}><BidSubmissionPage /></ProtectedRoute>} />
      <Route path="/bidder/my-bids" element={<ProtectedRoute roles={['BIDDER', 'ADMIN']}><BidderMyBidsPage /></ProtectedRoute>} />
      <Route path="/bidder/documents" element={<ProtectedRoute roles={['BIDDER', 'ADMIN']}><BidderDocumentsPage /></ProtectedRoute>} />
      <Route path="/bidder/compliance" element={<ProtectedRoute roles={['BIDDER', 'ADMIN']}><BidderCompliancePage /></ProtectedRoute>} />
      <Route path="/bidder/clarifications" element={<ProtectedRoute roles={['BIDDER', 'ADMIN']}><BidderClarificationsPage /></ProtectedRoute>} />
      <Route path="/bidder/profile" element={<ProtectedRoute roles={['BIDDER', 'ADMIN']}><BidderProfilePage /></ProtectedRoute>} />

      {/* Dedicated Compliance & Auditor Workflows */}
      <Route path="/auditor/queue" element={<ProtectedRoute roles={['REVIEWER', 'AUDITOR', 'ADMIN', 'PROCUREMENT_OFFICER']}><AuditorQueuePage /></ProtectedRoute>} />
      <Route path="/auditor/comparison" element={<ProtectedRoute roles={['REVIEWER', 'AUDITOR', 'ADMIN', 'PROCUREMENT_OFFICER']}><CrossDocumentComparisonPage /></ProtectedRoute>} />
      <Route path="/auditor/disputed" element={<ProtectedRoute roles={['REVIEWER', 'AUDITOR', 'ADMIN', 'PROCUREMENT_OFFICER']}><DisputedResultsPage /></ProtectedRoute>} />
      <Route path="/auditor/completed" element={<ProtectedRoute roles={['REVIEWER', 'AUDITOR', 'ADMIN', 'PROCUREMENT_OFFICER']}><CompletedReviewsPage /></ProtectedRoute>} />

      {/* Verification Officer Workflows */}
      <Route path="/reviewer/verification-queue" element={<ProtectedRoute roles={['REVIEWER', 'ADMIN', 'PROCUREMENT_OFFICER']}><VerificationQueuePage /></ProtectedRoute>} />
      <Route path="/reviewer/bidder/:profileId" element={<ProtectedRoute roles={['REVIEWER', 'ADMIN', 'PROCUREMENT_OFFICER']}><BidderDossierPage /></ProtectedRoute>} />
      <Route path="/procurement/verify-company-profiles" element={<ProtectedRoute roles={['PROCUREMENT_OFFICER', 'ADMIN', 'REVIEWER']}><VerifyCompanyProfilesPage /></ProtectedRoute>} />
      <Route path="/verify-bid/:bidderId" element={<ProtectedRoute roles={['ADMIN', 'PROCUREMENT_OFFICER', 'REVIEWER', 'AUDITOR']}><BidVerificationPage /></ProtectedRoute>} />

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
