/**
 * Estate Kit - Main Routing Structure
 * 
 * Requirements addressed:
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Ensures consistent navigation and routing structure across the web application.
 * - Account creation and authentication (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Implements route-level access control for authenticated and unauthenticated users.
 * - Critical User Flows (Technical Specifications/3.1 User Interface Design/Critical User Flows)
 *   Supports navigation through key user flows such as dashboard, documents, and settings.
 */

// react version ^18.2.0
import React from 'react';
// react-router-dom version ^6.4.0
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Route components for access control
import PublicRoute from './PublicRoute';
import PrivateRoute from './PrivateRoute';

// Page components
import Login from '../pages/Auth/Login';
import RegisterPage from '../pages/Auth/Register';
import SubscriptionPage from '../pages/Subscription/Subscription';
import Settings from '../pages/Settings/Settings';
import Profile from '../pages/Profile/Profile';
import DocumentsPage from '../pages/Documents/Documents';
import DelegatesPage from '../pages/Delegates/Delegates';

/**
 * AppRoutes component that defines the main routing structure for the application.
 * Maps routes to their respective components and applies access control.
 */
const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes - Accessible without authentication */}
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
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Private Routes - Require authentication */}
        <Route
          path="/subscription"
          element={
            <PrivateRoute>
              <SubscriptionPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <PrivateRoute>
              <DocumentsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/delegates"
          element={
            <PrivateRoute>
              <DelegatesPage />
            </PrivateRoute>
          }
        />

        {/* Default redirect to login */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Catch-all route for unmatched paths */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </Router>
  );
};

export default AppRoutes;