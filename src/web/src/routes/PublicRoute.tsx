/**
 * Public Route Component
 * Version: 1.0.0
 * 
 * Implements secure public route protection with enhanced type safety and
 * authentication state management. Ensures proper redirection for authenticated users
 * while maintaining secure access control for public routes.
 * 
 * @package react ^18.2.0
 * @package react-router-dom ^6.8.0
 */

import { FC, ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Interface defining props for PublicRoute component with type safety
 */
interface PublicRouteProps {
  children: ReactElement;
}

/**
 * PublicRoute component that implements secure route protection for unauthenticated access.
 * Redirects authenticated users to dashboard while allowing public access to non-authenticated users.
 *
 * @param {PublicRouteProps} props - Component props containing child elements
 * @returns {ReactElement} Protected route component or redirect
 */
const PublicRoute: FC<PublicRouteProps> = ({ children }): ReactElement => {
  // Get authentication state from secure auth hook
  const { isAuthenticated, isInitializing } = useAuth();

  // Only show loading during initial auth state check
  if (isInitializing) {
    return (
      <div className="secure-loading" role="alert" aria-busy="true">
        {/* Loading... */}
      </div>
    );
  }

  /**
   * Security check and redirection logic
   * - If user is authenticated, securely redirect to dashboard
   * - If user is not authenticated, safely render public route
   */
  if (isAuthenticated) {
    // Log public route access attempt by authenticated user
    console.info('Authenticated user attempted to access public route:', {
      timestamp: new Date().toISOString(),
      path: window.location.pathname
    });

    // Securely redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // Always render children (login form) unless redirecting
  return children;
};

// Export the component for use in route configuration
export default PublicRoute;