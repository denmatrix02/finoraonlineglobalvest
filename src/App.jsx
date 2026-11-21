import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AppLoader from './components/shared/AppLoader';
import SuccessModal from './components/user/SuccessModal';

// Public Pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import SecurityPage from './pages/SecurityPage';
import VerifyEmailPage from './pages/VerifyEmailPage';

// Admin Suite
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminLoansPage from './pages/admin/AdminLoansPage';
import AdminTransactionsPage from './pages/admin/AdminTransactionsPage';
import AdminInboxPage from './pages/admin/AdminInboxPage';

// User Portal
import UserDashboardPage from './pages/user/UserDashboardPage';
import UserTransferPage from './pages/user/UserTransferPage';
import UserReceivePage from './pages/user/UserReceivePage';
import UserLoansPage from './pages/user/UserLoansPage';
import UserSavingsPage from './pages/user/UserSavingsPage';
import UserStatementsPage from './pages/user/UserStatementsPage';
import UserNotificationsPage from './pages/user/UserNotificationsPage';
import UserProfilePage from './pages/user/UserProfilePage';
import UserSupportPage from './pages/user/UserSupportPage';

// Auth + Banking context (for protected route logic and loading states)
import { useAuth } from './context/AuthContext';
import { useBanking } from './context/BankingContext';

// ── Scroll-to-top + animation observer ──────────────────────────────────────
function ScrollAnimator() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => {
      const elements = document.querySelectorAll('[data-animate]');
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
      );
      elements.forEach((el) => observer.observe(el));
      return () => observer.disconnect();
    }, 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);
  return null;
}

// ── Route guards ─────────────────────────────────────────────────────────────
function ProtectedUserRoute({ children }) {
  const { currentUser, isLoggedIn, authLoading } = useAuth();
  if (authLoading) return null; // AppLoader handles this at top level
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (currentUser?.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
}

function ProtectedAdminRoute({ children }) {
  const { currentUser, isLoggedIn, authLoading } = useAuth();
  if (authLoading) return null; // AppLoader handles this at top level
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (currentUser?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

// ── Main layout wrapper ───────────────────────────────────────────────────────
function MainLayout() {
  const location = useLocation();
  const [rollbackError, setRollbackError] = useState(null);

  useEffect(() => {
    const handleRollback = (e) => {
      setRollbackError(e.detail || "An unexpected error occurred. Your changes were reverted.");
    };
    window.addEventListener('finora:rollback', handleRollback);
    return () => window.removeEventListener('finora:rollback', handleRollback);
  }, []);

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isPortalRoute = [
    '/dashboard', '/transfers', '/receive', '/loans',
    '/savings', '/statements', '/notifications', '/profile', '/support',
  ].some((p) => location.pathname.startsWith(p));

  // Hide public navbar + footer on admin and portal routes
  const hidePublicChrome = isAdminRoute || isPortalRoute;

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F14] text-[#F0F4FF]">
      {!hidePublicChrome && <Navbar />}
      <main className={`flex-grow ${!hidePublicChrome ? 'pt-16' : ''}`}>
        <Routes>
          {/* ── Public ── */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* ── Admin Suite ── */}
          <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboardPage /></ProtectedAdminRoute>} />
          <Route path="/admin/users" element={<ProtectedAdminRoute><AdminUsersPage /></ProtectedAdminRoute>} />
          <Route path="/admin/loans" element={<ProtectedAdminRoute><AdminLoansPage /></ProtectedAdminRoute>} />
          <Route path="/admin/transactions" element={<ProtectedAdminRoute><AdminTransactionsPage /></ProtectedAdminRoute>} />
          <Route path="/admin/inbox" element={<ProtectedAdminRoute><AdminInboxPage /></ProtectedAdminRoute>} />

          {/* ── User Portal ── */}
          <Route path="/dashboard" element={<ProtectedUserRoute><UserDashboardPage /></ProtectedUserRoute>} />
          <Route path="/user" element={<ProtectedUserRoute><UserDashboardPage /></ProtectedUserRoute>} />
          <Route path="/user/dashboard" element={<ProtectedUserRoute><UserDashboardPage /></ProtectedUserRoute>} />
          <Route path="/transfers" element={<ProtectedUserRoute><UserTransferPage /></ProtectedUserRoute>} />
          <Route path="/receive" element={<ProtectedUserRoute><UserReceivePage /></ProtectedUserRoute>} />
          <Route path="/loans" element={<ProtectedUserRoute><UserLoansPage /></ProtectedUserRoute>} />
          <Route path="/savings" element={<ProtectedUserRoute><UserSavingsPage /></ProtectedUserRoute>} />
          <Route path="/statements" element={<ProtectedUserRoute><UserStatementsPage /></ProtectedUserRoute>} />
          <Route path="/notifications" element={<ProtectedUserRoute><UserNotificationsPage /></ProtectedUserRoute>} />
          <Route path="/profile" element={<ProtectedUserRoute><UserProfilePage /></ProtectedUserRoute>} />
          <Route path="/support" element={<ProtectedUserRoute><UserSupportPage /></ProtectedUserRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!hidePublicChrome && <Footer />}

      {/* Global Rollback Modal */}
      {rollbackError && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1A1A1A] border border-[#FF5555]/30 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-[#FF5555] mb-4">
              <div className="p-2 bg-[#FF5555]/10 rounded-lg">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-[16px] font-bold font-['Poppins']">Sync Failed</h3>
            </div>
            <p className="text-[13px] text-[#DDD] leading-relaxed font-['Inter'] mb-6">
              {rollbackError}
            </p>
            <button
              onClick={() => setRollbackError(null)}
              className="w-full py-3 rounded-full bg-[#FF5555]/10 hover:bg-[#FF5555]/20 border border-[#FF5555]/30 text-[#FF5555] font-semibold transition-colors"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}

      {/* Global Bottom-Right Success Toast Modal */}
      <SuccessModal />
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
function AppGate() {
  const { authLoading } = useAuth();
  const { bankingLoading } = useBanking();

  if (authLoading || bankingLoading) {
    return (
      <AppLoader
        message={
          authLoading
            ? 'Verifying your session…'
            : 'Fetching your account data…'
        }
      />
    );
  }

  return (
    <>
      <ScrollAnimator />
      <MainLayout />
    </>
  );
}

function App() {
  return (
    <Router>
      <AppGate />
    </Router>
  );
}

export default App;
