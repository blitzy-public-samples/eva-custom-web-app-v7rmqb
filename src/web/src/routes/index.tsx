/**
 * Main Routing Configuration Component
 * Version: 1.0.0
 * 
 * Implements secure route protection with comprehensive authentication,
 * MFA verification, session management, and analytics tracking.
 * 
 * @package react ^18.2.0
 * @package react-router-dom ^6.8.0
 * @package react-error-boundary ^4.0.0
 * @package @auth0/auth0-react ^2.0.0
 */

import { FC, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { useAuth } from '@auth0/auth0-react';
import { PublicRoute } from './PublicRoute';
import { PrivateRoute } from './PrivateRoute';

// Lazy-loaded components for optimized loading
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Documents = lazy(() => import('../pages/Documents'));
const Delegates = lazy(() => import('../pages/Delegates'));
const Profile = lazy(() => import('../pages/Profile'));
const MFAVerify = lazy(() => import('../pages/MFAVerify'));
const NotFound = lazy(() => import('../pages/NotFound'));
const Unauthorized = lazy(() => import('../pages/Unauthorized'));

// Error fallback component
const ErrorFallback: FC<{ error: Error }> = ({ error }) => (
  <div role="alert" className="error-boundary">
    <h2>Something went wrong:</h2>
    <pre>{error.message}</pre>
    <button onClick={() => window.location.reload()}>Reload Page</button>
  </div>
);

// Loading component for Suspense
const LoadingFallback: FC = () => (
  <div role="status" className="loading-spinner">
    Loading...
  </div>
);

/**
 * Main routing component implementing secure route protection and analytics
 */
export const AppRoutes: FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Track route changes for analytics
  useEffect(() => {
    console.info('Route change:', {
      timestamp: new Date().toISOString(),
      path: location.pathname,
      authenticated: isAuthenticated,
      userRole: user?.role
    });
  }, [location, isAuthenticated, user]);

  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* MFA Verification Route */}
          <Route
            path="/mfa-verify"
            element={
              <PrivateRoute requireMFA={false}>
                <MFAVerify />
              </PrivateRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute requireMFA={true}>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/documents/*"
            element={
              <PrivateRoute requireMFA={true}>
                <Documents />
              </PrivateRoute>
            }
          />
          <Route
            path="/delegates/*"
            element={
              <PrivateRoute requireMFA={true} requiredRoles={['OWNER']}>
                <Delegates />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute requireMFA={true}>
                <Profile />
              </PrivateRoute>
            }
          />

          {/* Error Routes */}
          <Route
            path="/unauthorized"
            element={
              <PrivateRoute requireMFA={false}>
                <Unauthorized />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * Root router component with browser history
 */
export const Router: FC = () => (
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
);

export default Router;