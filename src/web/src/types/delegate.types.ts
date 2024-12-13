/**
 * @fileoverview TypeScript type definitions for delegate-related data structures
 * @version 1.0.0
 * 
 * This file defines the core types and interfaces for managing delegate access control,
 * permissions, and relationships between estate owners and their delegates in the
 * Estate Kit platform.
 */

// External imports
import { UUID } from 'crypto'; // v18.0.0+

/**
 * Enumeration of possible delegate roles in the system.
 * Based on the authorization matrix defined in the security architecture.
 */
export enum DelegateRole {
    EXECUTOR = 'EXECUTOR',
    HEALTHCARE_PROXY = 'HEALTHCARE_PROXY',
    FINANCIAL_ADVISOR = 'FINANCIAL_ADVISOR',
    LEGAL_ADVISOR = 'LEGAL_ADVISOR'
}

/**
 * Types of resources that delegates can access within the system.
 * Maps to different categories of estate planning documents and information.
 */
export enum ResourceType {
    PERSONAL_INFO = 'PERSONAL_INFO',
    FINANCIAL_DATA = 'FINANCIAL_DATA',
    MEDICAL_DATA = 'MEDICAL_DATA',
    LEGAL_DOCS = 'LEGAL_DOCS'
}

/**
 * Possible access levels for delegate permissions.
 * Determines what actions a delegate can perform on resources.
 */
export enum AccessLevel {
    READ = 'READ',
    WRITE = 'WRITE',
    NONE = 'NONE'
}

/**
 * Interface defining delegate permissions for specific resources.
 * Maps resource types to their corresponding access levels.
 */
export interface DelegatePermission {
    resourceType: ResourceType;
    accessLevel: AccessLevel;
}

/**
 * Enumeration of possible delegate invitation/access statuses.
 * Tracks the lifecycle of delegate relationships.
 */
export enum DelegateStatus {
    PENDING = 'PENDING',
    ACTIVE = 'ACTIVE',
    EXPIRED = 'EXPIRED',
    REVOKED = 'REVOKED'
}

/**
 * Main interface representing a delegate with their permissions and metadata.
 * Contains all information about a delegate's access rights and relationship
 * with the estate owner.
 */
export interface Delegate {
    id: UUID;
    ownerId: UUID;
    delegateId: UUID;
    email: string;
    name: string;
    role: DelegateRole;
    permissions: DelegatePermission[];
    status: DelegateStatus;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Data transfer object for creating new delegate invitations.
 * Contains the minimum required information to create a new delegate relationship.
 */
export interface CreateDelegateDTO {
    email: string;
    name: string;
    role: DelegateRole;
    permissions: DelegatePermission[];
    expiresAt: Date;
}

/**
 * Data transfer object for updating existing delegate permissions.
 * Used to modify delegate access rights and status.
 */
export interface UpdateDelegateDTO {
    role: DelegateRole;
    permissions: DelegatePermission[];
    expiresAt: Date;
    status: DelegateStatus;
}