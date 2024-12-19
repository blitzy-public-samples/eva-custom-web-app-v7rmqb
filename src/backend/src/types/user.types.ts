// @ts-check
import { UUID } from 'crypto'; // Version: latest - Used for unique identifier types

/**
 * Enum defining possible user roles in the system.
 * Maps to authorization matrix defined in security specifications.
 */
export enum UserRole {
    OWNER = 'OWNER',                     // Full system access
    EXECUTOR = 'EXECUTOR',               // Limited access to financial and legal documents
    HEALTHCARE_PROXY = 'HEALTHCARE_PROXY', // Access to medical and limited legal documents
    FINANCIAL_ADVISOR = 'FINANCIAL_ADVISOR', // Access to financial documents only
    LEGAL_ADVISOR = 'LEGAL_ADVISOR'      // Access to legal documents and limited financial data
}

/**
 * Enum defining possible user account statuses.
 * Used for account lifecycle management and security controls.
 */
export enum UserStatus {
    ACTIVE = 'ACTIVE',         // Account is active and can access the system
    INACTIVE = 'INACTIVE',     // Account exists but access is temporarily disabled
    PENDING = 'PENDING',       // Account created but pending verification/activation
    SUSPENDED = 'SUSPENDED'    // Account suspended due to security concerns
}

/**
 * Interface for user profile data including security and preference settings.
 * Contains extended user attributes and configuration options.
 */
export interface UserProfile {
    phoneNumber: string | null;      // Optional phone number for SMS notifications
    province: string;                // Canadian province for jurisdiction-specific features
    mfaEnabled: boolean;             // Multi-factor authentication status
    emailNotifications: boolean;     // Email notification preferences
    smsNotifications: boolean;       // SMS notification preferences
    timezone: string;                // User's preferred timezone
    language: string;                // User's preferred language
    lastLoginAt: Date | null;        // Timestamp of last successful login
    auditEnabled: boolean;           // Whether detailed audit logging is enabled
}

/**
 * Core interface representing a user in the system with enhanced security tracking.
 * Implements PIPEDA-compliant user data structure with security features.
 */
export interface User {
    id: UUID;                        // Unique identifier
    email: string;                   // Primary email address (unique)
    name: string;                    // Full name
    profile: UserProfile;            // Extended profile information
    role: UserRole;                  // User's system role
    status: UserStatus;              // Account status
    createdAt: Date;                 // Account creation timestamp
    updatedAt: Date;                 // Last update timestamp
    lastPasswordChangeAt: Date;      // Password security tracking
    failedLoginAttempts: number;     // Security monitoring
    currentSessionId: string | null; // Active session tracking
}

/**
 * Data transfer object for creating new users.
 * Contains minimum required fields for user creation.
 */
export interface CreateUserDTO {
    email: string;                   // Required email address
    name: string;                    // Required full name
    province: string;                // Required province selection
    password: string;                // Required password for account creation
}

/**
 * Data transfer object for updating user information.
 * Supports partial updates with optional fields.
 */
export interface UpdateUserDTO {
    name?: string;                   // Optional name update
    profile: Partial<UserProfile>;   // Optional profile updates
    status?: UserStatus;             // Optional status update
}