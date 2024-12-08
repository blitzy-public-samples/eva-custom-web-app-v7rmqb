/**
 * Estate Kit - Public Route Component
 * 
 * Requirements addressed:
 * - Account creation and authentication (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Implements route-level access control for unauthenticated users.
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Ensures consistent navigation and routing structure for public routes.
 * 
 * Human Tasks:
 * 1. Verify redirect paths align with application routing structure
 * 2. Test authentication state handling across different user roles
 * 3. Validate route protection behavior with security team
 */

// react version ^18.2.0
import React, { useEffect } from 'react';
// react-router-dom version ^6.4.0
import { Navigate, useLocation } from 'react-router-dom';

// Internal imports
import useAuth from '../hooks/useAuth';
import Button from '../components/common/Button/Button';
import Dialog from '../components/common/Dialog/Dialog';
import { getAuthConfig } from '../config/auth.config';

interface PublicRouteProps {
  /** Child components to render when access is granted */
  children: React.ReactNode;
  /** Optional custom redirect path for authenticated users */
  redirectPath?: string;
}

/**
 * PublicRoute component that handles routing logic for unauthenticated routes.
 * Redirects authenticated users to their appropriate dashboard while allowing
 * unauthenticated users to access public content.
 */
const PublicRoute: React.FC<PublicRouteProps> = ({ 
  children, 
  redirectPath 
}) => {
  const { getToken, getUserRole } = useAuth();
  const location = useLocation();
  const [showDialog, setShowDialog] = React.useState<boolean>(false);
  const [userRole, setUserRole] = React.useState<string | null>(null);

  // Effect to check user role when token exists
  useEffect(() => {
    const checkUserRole = async () => {
      const token = getToken();
      if (token) {
        try {
          const role = await getUserRole();
          setUserRole(role);
        } catch (error) {
          console.error('Error getting user role:', error);
          setShowDialog(true);
        }
      }
    };

    checkUserRole();
  }, [getToken, getUserRole]);

  // Get authentication token
  const token = getToken();

  // If user is authenticated, determine redirect path based on role
  if (token && userRole) {
    // Use custom redirect path if provided, otherwise determine based on role
    const finalRedirectPath = redirectPath || (() => {
      switch (userRole) {
        case 'admin':
          return '/admin/dashboard';
        case 'delegate':
          return '/delegate/dashboard';
        case 'user':
        default:
          return '/dashboard';
      }
    })();

    return <Navigate to={finalRedirectPath} state={{ from: location }} replace />;
  }

  // Error Dialog for authentication issues
  const AuthErrorDialog = () => (
    <Dialog
      title="Authentication Error"
      open={showDialog}
      onClose={() => setShowDialog(false)}
      actions={
        <Button
          label="Close"
          variant="primary"
          onClick={() => setShowDialog(false)}
          ariaLabel="Close authentication error dialog"
        />
      }
      maxWidth="sm"
      ariaLabel="Authentication error dialog"
    >
      <p>There was an error verifying your authentication status. Please try logging in again.</p>
    </Dialog>
  );

  // Render children (public route content) for unauthenticated users
  return (
    <>
      {children}
      {showDialog && <AuthErrorDialog />}
    </>
  );
};

export default PublicRoute;