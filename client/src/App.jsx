import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import StudentDashboard from './pages/StudentDashboard';
import ManagementDashboard from './pages/ManagementDashboard';

// Auth Components
import StudentSignup from './components/auth/StudentSignup';
import ManagementSignup from './components/auth/ManagementSignup';
import StudentLogin from './components/auth/StudentLogin';
import ManagementLogin from './components/auth/ManagementLogin';

import './index.css';

// Redirect component for authenticated users
const AuthRedirect = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    const redirectPath = user?.role === 'student'
      ? '/dashboard/student'
      : '/dashboard/management';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={<LandingPage />}
          />

          {/* Auth Routes - Redirect if already logged in */}
          <Route
            path="/signup/student"
            element={
              <AuthRedirect>
                <StudentSignup />
              </AuthRedirect>
            }
          />
          <Route
            path="/signup/management"
            element={
              <AuthRedirect>
                <ManagementSignup />
              </AuthRedirect>
            }
          />
          <Route
            path="/login/student"
            element={
              <AuthRedirect>
                <StudentLogin />
              </AuthRedirect>
            }
          />
          <Route
            path="/login/management"
            element={
              <AuthRedirect>
                <ManagementLogin />
              </AuthRedirect>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/management"
            element={
              <ProtectedRoute allowedRoles={['management']}>
                <ManagementDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
