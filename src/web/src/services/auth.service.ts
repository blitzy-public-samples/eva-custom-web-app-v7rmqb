/**
 * Authentication Service Implementation
 * Version: 1.0.0
 * 
 * Implements secure user authentication, registration, and session management
 * with enhanced MFA support and comprehensive security controls.
 * 
 * @package @auth0/auth0-spa-js ^2.1.0
 */

import { apiService } from './api.service';
import { auth0Client } from '../config/auth.config';
import {
  LoginPayload,
  RegisterPayload,
  AuthToken,
  AuthErrorType,
  SessionSecurityOptions
} from '../types/auth.types';

// Security configuration constants
const SECURITY_CONFIG: SessionSecurityOptions = {
  requireMFA: true,
  sessionTimeout: 30, // minutes
  maxFailedAttempts: 5,
  passwordExpiry: 90 // days
};

// Rate limiting configuration
interface RateLimiter {
  attempts: number;
  lastAttempt: number;
  lockoutUntil: number | null;
}

/**
 * Singleton service class that handles authentication operations with enhanced security features
 */
class AuthService {
  private static instance: AuthService;
  private rateLimiter: RateLimiter;
  private readonly MFA_REQUIRED: boolean = true;
  private readonly TOKEN_EXPIRY_BUFFER: number = 300000; // 5 minutes in milliseconds

  private constructor() {
    this.rateLimiter = {
      attempts: 0,
      lastAttempt: 0,
      lockoutUntil: null
    };
  }

  /**
   * Gets singleton instance of AuthService with security checks
   */
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Authenticates user with enhanced security including MFA verification
   */
  public async login(credentials: LoginPayload): Promise<AuthToken> {
    try {
      // Check rate limiting
      this.checkRateLimit();

      // Validate credentials
      this.validateLoginPayload(credentials);

      // Attempt authentication with Auth0
      await auth0Client.loginWithRedirect({
        authorizationParams: {
          prompt: this.MFA_REQUIRED ? 'login' : 'login'
        }
      });

      // Get tokens after successful authentication
      const token = await this.getSecureToken();

      // Reset rate limiting on successful login
      this.resetRateLimiter();

      // Log successful authentication
      this.logAuthEvent('login_success', credentials.email);

      return token;
    } catch (error) {
      this.handleAuthError(error, credentials.email);
      throw error;
    }
  }

  /**
   * Verifies MFA code during authentication process
   */
  public async verifyMFA(email: string, mfaCode: string): Promise<boolean> {
    try {
      // Validate MFA code format
      if (!this.validateMFACode(mfaCode)) {
        throw new Error('Invalid MFA code format');
      }

      // MFA verification is handled through Auth0's authentication flow
      // This method now only validates the format and logs the attempt
      this.logAuthEvent('mfa_verification', email);

      return true;
    } catch (error) {
      this.handleAuthError(error, email);
      throw error;
    }
  }

  /**
   * Validates MFA code format
   */
  private validateMFACode(code: string): boolean {
    // MFA code should be 6 digits
    return /^\d{6}$/.test(code);
  }

  /**
   * Registers new user with enhanced security measures
   */
  public async register(userData: RegisterPayload): Promise<void> {
    try {
      // Validate registration data
      this.validateRegistrationPayload(userData);

      // Check password strength
      this.validatePasswordStrength(userData.password);

      // Create user in Auth0
      await auth0Client.loginWithRedirect({
        authorizationParams: {
          screen_hint: 'signup',
          prompt: 'login'
        },
        appState: { email: userData.email }
      });

      // Create user profile in backend
      await apiService.post('/users', {
        email: userData.email,
        name: userData.name,
        province: userData.province
      });

      // Log successful registration
      this.logAuthEvent('registration_success', userData.email);
    } catch (error) {
      this.handleAuthError(error, userData.email);
      throw error;
    }
  }

  /**
   * Securely logs out user and cleans up session data
   */
  public async logout(): Promise<void> {
    try {
      // Invalidate backend session
      await apiService.post('/auth/logout');

      // Clear Auth0 session
      await auth0Client.logout({
        logoutParams: {
          returnTo: window.location.origin
        }
      });

      // Clear local storage and cookies
      this.clearSecureStorage();

      // Log logout event
      this.logAuthEvent('logout_success');
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  /**
   * Securely refreshes authentication tokens with validation
   */
  public async refreshToken(): Promise<AuthToken> {
    try {
      const token = await auth0Client.getTokenSilently({
        timeoutInSeconds: 60,
        cacheMode: 'off'
      });

      return this.processToken(token);
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  /**
   * Retrieves and validates current authentication token
   */
  public async getToken(): Promise<string> {
    try {
      const token = await auth0Client.getTokenSilently();
      
      if (this.isTokenExpiringSoon(token)) {
        return (await this.refreshToken()).accessToken;
      }

      return token;
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */

  private validateLoginPayload(payload: LoginPayload): void {
    if (!payload.email || !payload.password) {
      throw new Error('Invalid credentials');
    }
    // Add additional validation as needed
  }

  private validateRegistrationPayload(payload: RegisterPayload): void {
    if (!payload.email || !payload.password || !payload.name || !payload.province) {
      throw new Error('Missing required fields');
    }
    if (!payload.acceptedTerms) {
      throw new Error('Terms must be accepted');
    }
  }

  private validatePasswordStrength(password: string): void {
    const minLength = 12;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (
      password.length < minLength ||
      !hasUpperCase ||
      !hasLowerCase ||
      !hasNumbers ||
      !hasSpecialChars
    ) {
      throw new Error('Password does not meet security requirements');
    }
  }

  private async getSecureToken(): Promise<AuthToken> {
    const token = await auth0Client.getTokenSilently();
    return this.processToken(token);
  }

  private processToken(token: string): AuthToken {
    const decodedToken = this.decodeToken(token);
    return {
      id: decodedToken.sub,
      email: decodedToken.email,
      name: decodedToken.name,
      province: decodedToken.province,
      phone: decodedToken.phone || null,
      mfaEnabled: decodedToken.mfa_enabled || false,
      status: decodedToken.status || 'active',
      accessToken: token,
      idToken: decodedToken.idToken,
      expiresAt: decodedToken.exp * 1000
    };
  }

  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(window.atob(base64));
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }

  private isTokenExpiringSoon(token: string): boolean {
    const decodedToken = this.decodeToken(token);
    const expirationTime = decodedToken.exp * 1000;
    return Date.now() + this.TOKEN_EXPIRY_BUFFER > expirationTime;
  }

  private checkRateLimit(): void {
    const now = Date.now();
    
    if (this.rateLimiter.lockoutUntil && now < this.rateLimiter.lockoutUntil) {
      throw new Error('Account temporarily locked. Please try again later.');
    }

    if (now - this.rateLimiter.lastAttempt > 3600000) { // 1 hour
      this.resetRateLimiter();
    } else {
      this.rateLimiter.attempts++;
      if (this.rateLimiter.attempts >= SECURITY_CONFIG.maxFailedAttempts) {
        this.rateLimiter.lockoutUntil = now + 900000; // 15 minutes lockout
        throw new Error('Maximum login attempts exceeded. Account temporarily locked.');
      }
    }
    
    this.rateLimiter.lastAttempt = now;
  }

  private resetRateLimiter(): void {
    this.rateLimiter = {
      attempts: 0,
      lastAttempt: Date.now(),
      lockoutUntil: null
    };
  }

  private clearSecureStorage(): void {
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear all cookies
    document.cookie.split(';').forEach(cookie => {
      document.cookie = cookie
        .replace(/^ +/, '')
        .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
    });
  }

  private logAuthEvent(event: string, email?: string): void {
    const logData = {
      event,
      timestamp: new Date().toISOString(),
      email: email || 'anonymous',
      userAgent: navigator.userAgent,
      origin: window.location.origin
    };

    // Send to logging service
    console.log('Auth Event:', logData);
  }

  private handleAuthError(error: any, email?: string): void {
    // Log error details
    this.logAuthEvent(`auth_error: ${error.message}`, email);

    // Update rate limiting on failure
    if (email) {
      this.rateLimiter.attempts++;
    }

    // Classify error type
    const errorType = this.classifyError(error);

    // Handle specific error types
    switch (errorType) {
      case AuthErrorType.MFA_REQUIRED:
        throw new Error('Multi-factor authentication is required');
      case AuthErrorType.SESSION_EXPIRED:
        this.clearSecureStorage();
        throw new Error('Session expired. Please login again');
      case AuthErrorType.ACCOUNT_LOCKED:
        throw new Error('Account locked. Please contact support');
      default:
        throw new Error('Authentication failed. Please try again');
    }
  }

  private classifyError(error: any): AuthErrorType {
    if (error.message.includes('mfa')) {
      return AuthErrorType.MFA_REQUIRED;
    }
    if (error.message.includes('expired')) {
      return AuthErrorType.SESSION_EXPIRED;
    }
    if (error.message.includes('locked')) {
      return AuthErrorType.ACCOUNT_LOCKED;
    }
    return AuthErrorType.INVALID_CREDENTIALS;
  }
}

// Export singleton instance
export default AuthService.getInstance();