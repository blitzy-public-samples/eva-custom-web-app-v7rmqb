/**
 * Estate Kit - Authentication Hook
 * 
 * Requirements addressed:
 * - Account creation and authentication (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Implements a custom hook to manage authentication state and operations.
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Provides role-based access control (RBAC) by exposing user roles and permissions.
 * - Data Security (Technical Specifications/1.3 Scope/In-Scope/Data Security)
 *   Ensures secure handling of authentication tokens and sensitive user data.
 * 
 * Human Tasks:
 * 1. Verify Auth0 configuration in the Auth0 dashboard
 * 2. Test role-based access control scenarios
 * 3. Review token storage security with security team
 * 4. Validate error handling and user feedback mechanisms
 */

// react version ^18.2.0
import { useState, useEffect, useCallback } from 'react';

// Internal imports
import { AuthTypes } from '../types/auth.types';
import { initializeAuth0, getAuthConfig } from '../config/auth.config';
import { validateAuth } from '../utils/validation.util';
import { 
  login as authLogin,
  logout as authLogout,
  getToken as getAuthToken,
  getUserRole as getAuthUserRole
} from '../services/auth.service';

/**
 * Custom hook for managing authentication state and operations
 * @returns Object containing authentication state and functions
 */
const useAuth = () => {
  // Initialize state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<AuthTypes['role'] | null>(null);

  /**
   * Initialize authentication state
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await getAuthToken();
        if (token) {
          const role = await getAuthUserRole();
          setUserRole(role);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError('Failed to initialize authentication');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Handle user login
   * @param credentials - User credentials containing email and password
   * @returns Promise resolving to authentication success
   */
  const login = useCallback(async (credentials: Pick<AuthTypes, 'email' | 'password'>): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate credentials
      if (!validateAuth({ ...credentials, token: '', role: 'user' })) {
        throw new Error('Invalid credentials format');
      }

      // Perform login
      const token = await authLogin(credentials);
      if (!token) {
        throw new Error('Authentication failed');
      }

      // Get user role
      const role = await getAuthUserRole();
      setUserRole(role);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Handle user logout
   */
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await authLogout();
      setIsAuthenticated(false);
      setUserRole(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get current authentication token
   * @returns Current authentication token or null
   */
  const getToken = useCallback((): string | null => {
    try {
      return getAuthToken();
    } catch (err) {
      console.error('Get token error:', err);
      return null;
    }
  }, []);

  /**
   * Get current user role
   * @returns Promise resolving to current user role
   */
  const getUserRole = useCallback(async (): Promise<AuthTypes['role'] | null> => {
    try {
      if (!isAuthenticated) {
        return null;
      }
      const role = await getAuthUserRole();
      setUserRole(role);
      return role;
    } catch (err) {
      console.error('Get user role error:', err);
      return null;
    }
  }, [isAuthenticated]);

  return {
    isAuthenticated,
    isLoading,
    error,
    userRole,
    login,
    logout,
    getToken,
    getUserRole
  };
};

export default useAuth;