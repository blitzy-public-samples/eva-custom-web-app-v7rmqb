/**
 * Estate Kit - Private Route Component
 * 
 * Requirements addressed:
 * - Account creation and authentication (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Implements route-level access control for authenticated users.
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Ensures consistent navigation and routing structure for private routes.
 * 
 * Human Tasks:
 * 1. Verify Auth0 configuration in auth.config.ts is properly set up
 * 2. Test authentication flow with configured Auth0 tenant
 * 3. Validate redirect behavior for unauthenticated users
 */

// react version ^18.2.0
import React, { useEffect, useState } from 'react';
// react-router-dom version ^6.4.0
import { Navigate, useLocation } from 'react-router-dom';

// Internal imports
import useAuth from '../hooks/useAuth';
import { selectAuthState } from '../redux/slices/authSlice';
import Loading from '../components/common/Loading/Loading';
import { getAuthConfig } from '../config/auth.config';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin' | 'delegate';
}

/**
 * PrivateRoute component that ensures routes are only accessible to authenticated users.
 * Implements route protection and role-based access control.
 * 
 * @param props - Component props containing children and optional required role
 * @returns JSX.Element - Protected route component or redirect
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requiredRole }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const location = useLocation();

  // Get authentication utilities and state
  const { getToken, getUserRole } = useAuth();
  
  useEffect(() => {
    const validateAccess = async () => {
      try {
        // Verify authentication configuration
        getAuthConfig();

        // Check for valid authentication token
        const token = getToken();
        if (!token) {
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        // If role check is required, verify user role
        if (requiredRole) {
          const userRole = await getUserRole();
          setHasAccess(userRole === requiredRole);
        } else {
          setHasAccess(true);
        }
      } catch (error) {
        console.error('Access validation error:', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    validateAccess();
  }, [getToken, getUserRole, requiredRole]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <Loading isVisible={true} />;
  }

  // Redirect to login if not authenticated or lacking required role
  if (!hasAccess) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Render protected route content
  return <>{children}</>;
};

export default PrivateRoute;