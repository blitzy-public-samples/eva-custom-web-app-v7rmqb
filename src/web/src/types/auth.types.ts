// @auth0/auth0-spa-js version: ^2.1.0
import { Auth0Client } from '@auth0/auth0-spa-js';

/**
 * Basic user interface for frontend usage
 */
export interface User {
    id: string;
    email: string;
    name: string;
    province: Province;
    phone: string;
    mfaEnabled: boolean;
    profile?: Record<string, unknown>;
}

/**
 * Configuration interface for Auth0 authentication settings.
 * Required for initializing Auth0 client with proper OIDC/OAuth2 parameters.
 */
export interface Auth0Config {
    domain: string;          // Auth0 tenant domain
    clientId: string;        // Application client ID
    audience: string;        // API identifier
    redirectUri: string;     // Post-authentication redirect URI
}

/**
 * Login request payload interface with enhanced security tracking.
 * Used for initiating authentication process with credentials.
 */
export interface LoginPayload {
    email: string;          // User email address
    password: string;       // User password (never stored)
}

/**
 * Registration payload interface with comprehensive security options.
 * Includes required fields for account creation with security preferences.
 */
export interface RegisterPayload {
    email: string;          // User email address
    password: string;       // User password (never stored)
    name: string;          // User's full name
    province: Province;     // Canadian province selection
    acceptedTerms: boolean; // Terms acceptance flag
    mfaPreference: boolean; // MFA opt-in preference
}

/**
 * Authentication state interface for Redux store.
 * Tracks comprehensive authentication status including MFA state.
 */
export interface AuthState {
    isAuthenticated: boolean;     // Primary authentication status
    user: User | null;           // Current user information
    loading: boolean;            // Authentication process status
    error: string | null;        // Authentication error message
    mfaPending: boolean;         // MFA verification pending
    mfaVerified: boolean;        // MFA verification complete
    mfaRequired: boolean;        // MFA requirement flag
    sessionExpiry: number | null; // Session expiration timestamp
    lastActivity: number;        // Last user activity timestamp
}

/**
 * Authentication tokens interface for session management.
 * Implements JWT token structure with expiration tracking.
 */
export interface AuthToken {
    accessToken: string;         // JWT access token
    idToken: string;            // OpenID Connect ID token
    expiresAt: number;          // Token expiration timestamp
}

/**
 * Supported Canadian provinces enum.
 * Used for jurisdiction-specific features and requirements.
 */
export enum Province {
    ALBERTA = 'ALBERTA',
    BRITISH_COLUMBIA = 'BRITISH_COLUMBIA',
    ONTARIO = 'ONTARIO'
}

/**
 * MFA verification status enum.
 * Tracks the state of multi-factor authentication process.
 */
export enum MFAStatus {
    NOT_STARTED = 'NOT_STARTED',
    PENDING = 'PENDING',
    VERIFIED = 'VERIFIED',
    FAILED = 'FAILED'
}

/**
 * Auth0 client configuration options interface.
 * Extends base Auth0 configuration with application-specific settings.
 */
export interface Auth0ClientOptions {
    client: Auth0Client;
    config: Auth0Config;
    audience: string;
    scope: string;
}

/**
 * Session security options interface.
 * Defines security parameters for user sessions.
 */
export interface SessionSecurityOptions {
    requireMFA: boolean;         // MFA requirement flag
    sessionTimeout: number;      // Session timeout in minutes
    maxFailedAttempts: number;   // Maximum failed login attempts
    passwordExpiry: number;      // Password expiry in days
}

/**
 * Authentication error types enum.
 * Categorizes possible authentication failure scenarios.
 */
export enum AuthErrorType {
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
    MFA_REQUIRED = 'MFA_REQUIRED',
    MFA_FAILED = 'MFA_FAILED',
    SESSION_EXPIRED = 'SESSION_EXPIRED',
    ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
    NETWORK_ERROR = 'NETWORK_ERROR'
}

/**
 * Authentication error interface.
 * Provides structured error information for authentication failures.
 */
export interface AuthError {
    type: AuthErrorType;
    message: string;
    code?: string;
    details?: Record<string, unknown>;
}

/**
 * User role enum for authorization.
 * Defines available user roles and permissions.
 */
export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER',
    DELEGATE = 'DELEGATE',
    OWNER = 'OWNER'
}

/**
 * Auth0 context interface for React context usage
 */
export interface Auth0Context {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
    error: AuthError | null;
    loginWithRedirect: () => Promise<void>;
    logout: () => void;
}

/**
 * Subscription interface for managing user subscriptions
 */
export interface ISubscription {
    id: string;
    userId: string;
    planType: string;
    status: string;
    startDate: string;
    endDate: string;
    autoRenew: boolean;
    features: string[];
    price: number;
    billingCycle: string;
}

/**
 * Document types enum for document management
 */
export enum DocumentType {
    MEDICAL = 'MEDICAL',
    LEGAL = 'LEGAL',
    FINANCIAL = 'FINANCIAL',
    PERSONAL = 'PERSONAL',
    OTHER = 'OTHER'
}