/**
 * Enhanced Private Route Component
 * Version: 1.0.0
 * 
 * Implements secure route protection with comprehensive authentication checks,
 * MFA verification, session validation, and role-based access control.
 * 
 * @package react ^18.2.0
 * @package react-router-dom ^6.8.0
 */

import { FC, ReactNode, memo, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Interface for enhanced PrivateRoute props with security options
interface PrivateRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
  requireMFA?: boolean;
}

/**
 * Enhanced PrivateRoute component implementing comprehensive security checks
 * and route protection with MFA and role-based access control.
 */
const PrivateRoute: FC<PrivateRouteProps> = memo(({
  children,
  requiredRoles = [],
  requireMFA = true
}) => {
  const location = useLocation();
  const {
    isAuthenticated,
    loading,
    user,
    mfaVerified,
    isSessionValid,
    sessionToken,
    refreshSession
  } = useAuth();

  // Security audit logging
  useEffect(() => {
    console.info('Route access attempt:', {
      timestamp: new Date().toISOString(),
      path: location.pathname,
      authenticated: isAuthenticated,
      mfaVerified: mfaVerified,
      sessionValid: isSessionValid,
      userRole: user?.roles?.[0]
    });
  }, [location.pathname, isAuthenticated, mfaVerified, isSessionValid, user]);

  // Show loading state while performing security checks
  if (loading) {
    return (
      <div className="secure-loading" role="alert" aria-busy="true">
        Verifying security credentials...
      </div>
    );
  }

  // Authentication check
  if (!isAuthenticated) {
    console.warn('Unauthorized access attempt:', {
      timestamp: new Date().toISOString(),
      path: location.pathname
    });

    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Session validation check
  if (!isSessionValid) {
    console.warn('Invalid session detected:', {
      timestamp: new Date().toISOString(),
      path: location.pathname
    });

    // Attempt to refresh session
    refreshSession().catch(() => {
      return (
        <Navigate
          to="/login"
          state={{ 
            from: location.pathname,
            reason: 'session_expired'
          }}
          replace
        />
      );
    });
  }

  // MFA verification check
  if (requireMFA && !mfaVerified) {
    console.warn('MFA verification required:', {
      timestamp: new Date().toISOString(),
      path: location.pathname
    });

    return (
      <Navigate
        to="/mfa-verify"
        state={{ 
          from: location.pathname,
          reason: 'mfa_required'
        }}
        replace
      />
    );
  }

  // Role-based access control
  if (requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.some(role => user.roles?.includes(role));

    if (!hasRequiredRole) {
      console.warn('Insufficient permissions:', {
        timestamp: new Date().toISOString(),
        path: location.pathname,
        requiredRoles,
        userRole: user.roles?.[0]
      });

      return (
        <Navigate
          to="/unauthorized"
          state={{ 
            from: location.pathname,
            reason: 'insufficient_permissions'
          }}
          replace
        />
      );
    }
  }

  // Log successful route access
  console.info('Route access granted:', {
    timestamp: new Date().toISOString(),
    path: location.pathname,
    userRole: user?.roles?.[0]
  });

  // Render protected route content
  return <>{children}</>;
});

// Display name for debugging
PrivateRoute.displayName = 'PrivateRoute';

export { PrivateRoute };