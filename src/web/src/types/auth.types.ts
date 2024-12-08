/**
 * @fileoverview Authentication type definitions for Estate Kit frontend application
 * 
 * Requirements addressed:
 * - Account creation and authentication (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Provides type definitions for authentication data structures such as tokens, roles, and user credentials.
 */

/**
 * Interface defining the structure of authentication-related data.
 * Used for managing user authentication, session tokens, and role-based access control.
 */
export interface AuthTypes {
    /** The email address of the user */
    email: string;
    
    /** The password of the user */
    password: string;
    
    /** The authentication token for the user */
    token: string;
    
    /** The role assigned to the user - determines access levels and permissions */
    role: 'user' | 'admin' | 'delegate';
}