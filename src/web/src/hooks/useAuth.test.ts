// jest version ^29.0.0
import { renderHook, act } from '@testing-library/react-hooks'; // version ^8.0.1
import useAuth from './useAuth';
import { initializeAuth0 } from '../config/auth.config';
import { mockApiRequest } from '../utils/test.util';

/**
 * Unit tests for the useAuth custom React hook
 * 
 * Requirements addressed:
 * - Testing Framework (Technical Specifications/4.5 Development & Deployment/Testing)
 *   Implements unit tests to validate the functionality of the useAuth hook,
 *   ensuring secure and reliable authentication workflows.
 */

// Mock the auth.config module
jest.mock('../config/auth.config', () => ({
  initializeAuth0: jest.fn(),
  getAuthConfig: jest.fn(() => ({
    domain: 'test-domain',
    clientId: 'test-client-id'
  }))
}));

// Mock the auth.service module
jest.mock('../services/auth.service', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  getToken: jest.fn(),
  getUserRole: jest.fn()
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.userRole).toBeNull();
    });

    it('should check authentication state on mount', async () => {
      const mockToken = 'test-token';
      const mockRole = 'user';

      // Mock getToken and getUserRole to simulate authenticated state
      const { getToken, getUserRole } = require('../services/auth.service');
      getToken.mockResolvedValue(mockToken);
      getUserRole.mockResolvedValue(mockRole);

      const { result, waitForNextUpdate } = renderHook(() => useAuth());

      await waitForNextUpdate();

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.userRole).toBe(mockRole);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle initialization errors', async () => {
      const { getToken } = require('../services/auth.service');
      getToken.mockRejectedValue(new Error('Failed to get token'));

      const { result, waitForNextUpdate } = renderHook(() => useAuth());

      await waitForNextUpdate();

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe('Failed to initialize authentication');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Login Functionality', () => {
    it('should successfully log in user', async () => {
      const mockCredentials = {
        email: 'test@example.com',
        password: 'password123'
      };
      const mockToken = 'test-token';
      const mockRole = 'user';

      // Mock login and getUserRole to simulate successful login
      const { login, getUserRole } = require('../services/auth.service');
      login.mockResolvedValue(mockToken);
      getUserRole.mockResolvedValue(mockRole);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const success = await result.current.login(mockCredentials);
        expect(success).toBe(true);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.userRole).toBe(mockRole);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle login failure', async () => {
      const mockCredentials = {
        email: 'test@example.com',
        password: 'wrong-password'
      };

      // Mock login to simulate failure
      const { login } = require('../services/auth.service');
      login.mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const success = await result.current.login(mockCredentials);
        expect(success).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe('Login failed');
      expect(result.current.isLoading).toBe(false);
    });

    it('should validate credentials before login', async () => {
      const invalidCredentials = {
        email: 'invalid-email',
        password: ''
      };

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const success = await result.current.login(invalidCredentials);
        expect(success).toBe(false);
      });

      expect(result.current.error).toBe('Invalid credentials format');
    });
  });

  describe('Logout Functionality', () => {
    it('should successfully log out user', async () => {
      // Mock logout to simulate successful logout
      const { logout } = require('../services/auth.service');
      logout.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth());

      // Set initial authenticated state
      result.current.isAuthenticated = true;
      result.current.userRole = 'user';

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.userRole).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle logout failure', async () => {
      // Mock logout to simulate failure
      const { logout } = require('../services/auth.service');
      logout.mockRejectedValue(new Error('Logout failed'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.error).toBe('Logout failed');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Token and Role Management', () => {
    it('should get current token', () => {
      const mockToken = 'test-token';
      const { getToken } = require('../services/auth.service');
      getToken.mockReturnValue(mockToken);

      const { result } = renderHook(() => useAuth());

      expect(result.current.getToken()).toBe(mockToken);
    });

    it('should get current user role', async () => {
      const mockRole = 'admin';
      const { getUserRole } = require('../services/auth.service');
      getUserRole.mockResolvedValue(mockRole);

      const { result } = renderHook(() => useAuth());

      // Set authenticated state
      result.current.isAuthenticated = true;

      await act(async () => {
        const role = await result.current.getUserRole();
        expect(role).toBe(mockRole);
      });

      expect(result.current.userRole).toBe(mockRole);
    });

    it('should return null role when not authenticated', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const role = await result.current.getUserRole();
        expect(role).toBeNull();
      });
    });
  });
});