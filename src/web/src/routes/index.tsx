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

import { FC, Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { useAuth0 } from '@auth0/auth0-react';
import PublicRoute from './PublicRoute';
import { PrivateRoute } from './PrivateRoute';
import Settings from '@/pages/Settings/Settings';
import Help from '@/pages/Help/Help';
import Subscription from '@/pages/Subscription/Subscription';
import { useAuth } from '@/hooks/useAuth';

// Lazy-loaded components for optimized loading
const Login = lazy(() => import('../pages/Auth/Login'));
const Register = lazy(() => import('../pages/Auth/Register'));
const Callback = lazy(() => import('../pages/Auth/Callback'));
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'));
const Documents = lazy(() => import('../pages/Documents/Documents'));
const Delegates = lazy(() => import('../pages/Delegates/Delegates'));
const Profile = lazy(() => import('../pages/Profile/Profile'));
// const MFAVerification = lazy(() => import('../pages/Auth/MFAVerification'));
// const Callback = lazy(() => import('../pages/Auth/Callback'));

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
  const { isAuthenticated, loading, user } = useAuth();
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

  if (loading) {
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
          
          <Route
            path="/callback"
            element={
              <PublicRoute>
                <Callback />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          {/* <Route
            path="/mfa-verify"
            element={
              <PrivateRoute requireMFA={true}>
                <MFAVerification />
              </PrivateRoute>
            }
          /> */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute requireMFA={false}>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/documents/*"
            element={
              <PrivateRoute requireMFA={false}>
                <Documents />
              </PrivateRoute>
            }
          />
          <Route
            path="/delegates/*"
            element={
              <PrivateRoute requireMFA={false} requiredRoles={['OWNER']}>
                <Delegates />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute requireMFA={false}>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute requireMFA={false}>
                <Settings />
              </PrivateRoute>
            }
          />
          <Route
            path="/help"
            element={
              <PrivateRoute requireMFA={false}>
                <Help />
              </PrivateRoute>
            }
          />
          <Route
            path="/subscription/*"
            element={
              <PrivateRoute requireMFA={false}>
                <Subscription />
              </PrivateRoute>
            }
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * Root router component with browser history
 */
export const Router: FC = () => (
    <AppRoutes />
);

export default Router;