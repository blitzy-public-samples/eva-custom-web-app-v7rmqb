/**
 * Enhanced Authentication Hook
 * Version: 1.0.0
 * 
 * Custom React hook for managing authentication state and operations with comprehensive
 * security features including MFA support, session management, and audit logging.
 * 
 * @package react ^18.2.0
 * @package react-redux ^8.0.5
 */

import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  login, 
  verifyMFA,
  refreshSession,
  register as registerAction
} from '../redux/slices/authSlice';
import type { 
  AuthState, 
  AuthError,
  Province
} from '../types/auth.types';
import { auth0Client } from '../config/auth.config';
import { AppDispatch } from '../redux/store';

// Security constants
const SESSION_CHECK_INTERVAL = 60000; // 1 minute
const SESSION_EXPIRY_BUFFER = 300000; // 5 minutes before expiry

/**
 * Enhanced authentication hook providing secure authentication state and operations
 * with comprehensive security features including MFA and session management.
 */
export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const authState = useSelector((state: { auth: AuthState }) => state.auth);

  /**
   * Session refresh effect with security monitoring
   * Implements automatic token refresh and session validation
   */
  useEffect(() => {
    let sessionCheckInterval: NodeJS.Timeout;

    const checkAndRefreshSession = async () => {
      try {
        // Check if session is active and needs refresh
        if (authState.isAuthenticated && authState.sessionToken?.expiresAt) {
          const timeUntilExpiry = new Date(authState.sessionToken.expiresAt).getTime() - Date.now();
          
          if (timeUntilExpiry <= SESSION_EXPIRY_BUFFER) {
            await handleSessionRefresh();
          }
        }
      } catch (error) {
        console.error('Session refresh failed:', {
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        // Force re-authentication on session error
        await handleLogout();
      }
    };

    if (authState.isAuthenticated) {
      // Initial session check
      checkAndRefreshSession();
      
      // Setup interval for continuous session monitoring
      sessionCheckInterval = setInterval(checkAndRefreshSession, SESSION_CHECK_INTERVAL);
    }

    return () => {
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
      }
    };
  }, [authState.isAuthenticated, authState.sessionToken?.expiresAt]);

  /**
   * Enhanced login handler with MFA support and security logging
   */
  const handleLogin = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      // Log login attempt (sanitized)
      console.info('Login attempt:', {
        timestamp: new Date().toISOString(),
        email: credentials.email.replace(/[^@\w.-]/g, '')
      });

      // Dispatch login action
      const result = await dispatch(login(credentials)).unwrap();

      // Handle MFA requirement
      if (result.requiresMFA && !result.isMFAVerified) {
        console.info('MFA required for:', {
          timestamp: new Date().toISOString(),
          email: credentials.email.replace(/[^@\w.-]/g, '')
        });
        return { requiresMFA: true };
      }

      return result;
    } catch (error) {
      // Log login failure (sanitized)
      console.error('Login failed:', {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }, [dispatch]);

  /**
   * Registration handler with security logging
   */
  const handleRegister = useCallback(async (userData: { 
    email: string; 
    password: string; 
    name: string;
    province: Province;
    acceptedTerms: boolean;
    mfaPreference: string;
  }) => {
    try {
      // Log registration attempt (sanitized)
      console.info('Registration attempt:', {
        timestamp: new Date().toISOString(),
        email: userData.email.replace(/[^@\w.-]/g, '')
      });

      // Dispatch registration action
      const result = await dispatch(registerAction(userData)).unwrap();

      // Log successful registration
      console.info('Registration successful:', {
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      // Log registration failure
      console.error('Registration failed:', {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }, [dispatch]);

  /**
   * MFA verification handler with security logging
   */
  const handleMfaVerification = useCallback(async (mfaCode: string) => {
    try {
      // Log MFA attempt
      console.info('MFA verification attempt:', {
        timestamp: new Date().toISOString()
      });

      // Dispatch MFA verification
      const result = await dispatch(verifyMFA(mfaCode)).unwrap();

      // Log successful MFA verification
      console.info('MFA verification successful:', {
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      // Log MFA failure
      console.error('MFA verification failed:', {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }, [dispatch]);

  /**
   * Secure session refresh handler with error handling
   */
  const handleSessionRefresh = useCallback(async () => {
    try {
      // Log refresh attempt
      console.info('Session refresh attempt:', {
        timestamp: new Date().toISOString()
      });

      // Dispatch session refresh
      await dispatch(refreshSession()).unwrap();

      // Log successful refresh
      console.info('Session refresh successful:', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Log refresh failure
      console.error('Session refresh failed:', {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }, [dispatch]);

  /**
   * Secure logout handler with cleanup
   */
  const handleLogout = useCallback(async () => {
    try {
      // Log logout attempt
      console.info('Logout initiated:', {
        timestamp: new Date().toISOString()
      });

      // Perform Auth0 logout
      await auth0Client.logout({
        logoutParams: {
          returnTo: window.location.origin
        }
      });

      // Clear local storage and session storage
      localStorage.clear();
      sessionStorage.clear();

      // Clear cookies
      document.cookie.split(';').forEach(cookie => {
        document.cookie = cookie
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
      });

      // Log successful logout
      console.info('Logout successful:', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Log logout failure
      console.error('Logout failed:', {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }, []);

  return {
    // Authentication state
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    loading: authState.loading,
    error: authState.error as AuthError | null,
    mfaRequired: authState.mfaRequired,
    isMFAVerified: authState.mfaVerified, // Updated to match expected casing
    requiresMFA: authState.mfaRequired && !authState.mfaVerified, // Added requiresMFA property
    isSessionValid: authState.isAuthenticated && !!authState.sessionToken,
    sessionToken: authState.sessionToken,
    role: authState.user?.role, // Added role property

    // Authentication operations
    login: handleLogin,
    register: handleRegister,
    verifyMfa: handleMfaVerification,
    refreshSession: handleSessionRefresh,
    logout: handleLogout
  };
};