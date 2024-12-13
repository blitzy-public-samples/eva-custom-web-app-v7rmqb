/**
 * Test Suite for useAuth Custom Hook
 * Version: 1.0.0
 * 
 * Comprehensive tests for authentication flows, MFA verification,
 * session management and security features.
 * 
 * @package @testing-library/react-hooks ^8.0.1
 * @package @jest/globals ^29.0.0
 */

import { renderHook, act, waitFor } from '@testing-library/react-hooks';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { mockAuth0Client } from '@auth0/auth0-react';
import { useAuth } from './useAuth';
import { renderWithProviders, createMockStore } from '../utils/test.util';
import { AuthErrorType, MFAStatus } from '../types/auth.types';

// Mock configuration
const mockAuthConfig = {
  domain: 'test.auth0.com',
  clientId: 'test-client-id',
  audience: 'https://api.estatekit.com'
};

// Mock user data
const mockUserData = {
  email: 'test@example.com',
  name: 'Test User',
  sub: 'auth0|123',
  email_verified: true
};

// Mock tokens
const mockTokens = {
  accessToken: 'mock-access-token',
  idToken: 'mock-id-token',
  refreshToken: 'mock-refresh-token',
  expiresIn: 3600
};

describe('useAuth Hook Tests', () => {
  // Setup and teardown
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default authentication state', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => renderWithProviders(children)
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.mfaRequired).toBe(false);
      expect(result.current.sessionExpiry).toBeNull();
    });

    it('should handle persisted authentication state', () => {
      const mockStore = createMockStore({
        initialState: {
          auth: {
            isAuthenticated: true,
            user: mockUserData,
            sessionExpiry: Date.now() + 3600000
          }
        }
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => renderWithProviders(children, { store: mockStore })
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUserData);
      expect(result.current.sessionExpiry).toBeTruthy();
    });
  });

  describe('Authentication Flows', () => {
    it('should handle successful login with MFA', async () => {
      const mockStore = createMockStore();
      const credentials = {
        email: 'test@example.com',
        password: 'Test123!@#'
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => renderWithProviders(children, { store: mockStore })
      });

      await act(async () => {
        const loginResult = await result.current.login(credentials);
        expect(loginResult.mfaRequired).toBe(true);
        
        // Verify MFA
        const mfaResult = await result.current.verifyMfa('123456');
        expect(mfaResult.mfaVerified).toBe(true);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.mfaRequired).toBe(false);
      expect(result.current.mfaVerified).toBe(true);
    });

    it('should handle failed authentication attempts', async () => {
      const mockStore = createMockStore();
      const credentials = {
        email: 'test@example.com',
        password: 'wrong-password'
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => renderWithProviders(children, { store: mockStore })
      });

      await act(async () => {
        try {
          await result.current.login(credentials);
        } catch (error) {
          expect(error.type).toBe(AuthErrorType.INVALID_CREDENTIALS);
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeTruthy();
    });

    it('should handle MFA verification failures', async () => {
      const mockStore = createMockStore({
        initialState: {
          auth: {
            mfaRequired: true,
            mfaVerified: false
          }
        }
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => renderWithProviders(children, { store: mockStore })
      });

      await act(async () => {
        try {
          await result.current.verifyMfa('wrong-code');
        } catch (error) {
          expect(error.type).toBe(AuthErrorType.MFA_FAILED);
        }
      });

      expect(result.current.mfaVerified).toBe(false);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Session Management', () => {
    it('should handle session refresh before expiry', async () => {
      const mockStore = createMockStore({
        initialState: {
          auth: {
            isAuthenticated: true,
            sessionExpiry: Date.now() + 300000 // 5 minutes until expiry
          }
        }
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => renderWithProviders(children, { store: mockStore })
      });

      await act(async () => {
        await result.current.refreshSession();
      });

      expect(result.current.sessionExpiry).toBeGreaterThan(Date.now());
    });

    it('should handle session expiration', async () => {
      const mockStore = createMockStore({
        initialState: {
          auth: {
            isAuthenticated: true,
            sessionExpiry: Date.now() - 1000 // Expired session
          }
        }
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => renderWithProviders(children, { store: mockStore })
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.error?.type).toBe(AuthErrorType.SESSION_EXPIRED);
      });
    });

    it('should handle secure logout', async () => {
      const mockStore = createMockStore({
        initialState: {
          auth: {
            isAuthenticated: true,
            user: mockUserData
          }
        }
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => renderWithProviders(children, { store: mockStore })
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);
    });
  });

  describe('Security Features', () => {
    it('should enforce MFA when required', async () => {
      const mockStore = createMockStore({
        initialState: {
          auth: {
            mfaRequired: true
          }
        }
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => renderWithProviders(children, { store: mockStore })
      });

      expect(result.current.mfaRequired).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle token rotation', async () => {
      const mockStore = createMockStore({
        initialState: {
          auth: {
            isAuthenticated: true,
            sessionExpiry: Date.now() + 3600000
          }
        }
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => renderWithProviders(children, { store: mockStore })
      });

      const initialExpiry = result.current.sessionExpiry;

      await act(async () => {
        await result.current.refreshSession();
      });

      expect(result.current.sessionExpiry).toBeGreaterThan(initialExpiry!);
    });

    it('should clear sensitive data on logout', async () => {
      // Set some mock data in storage
      localStorage.setItem('auth_token', 'mock-token');
      sessionStorage.setItem('user_session', 'mock-session');
      document.cookie = 'auth_cookie=mock-cookie;';

      const mockStore = createMockStore({
        initialState: {
          auth: {
            isAuthenticated: true
          }
        }
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => renderWithProviders(children, { store: mockStore })
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(sessionStorage.getItem('user_session')).toBeNull();
      expect(document.cookie).not.toContain('auth_cookie');
    });
  });
});