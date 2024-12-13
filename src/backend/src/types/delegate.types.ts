// @ts-check
import { UUID } from 'crypto'; // Version: latest - Used for unique identifiers
import { User, UserRole } from './user.types';

/**
 * Enum defining types of resources that can be accessed by delegates.
 * Maps to authorization matrix defined in security specifications.
 */
export enum ResourceType {
    PERSONAL_INFO = 'PERSONAL_INFO',   // Basic personal information
    FINANCIAL_DATA = 'FINANCIAL_DATA', // Financial documents and records
    MEDICAL_DATA = 'MEDICAL_DATA',     // Medical records and directives
    LEGAL_DOCS = 'LEGAL_DOCS'         // Legal documents and estate plans
}

/**
 * Enum defining possible access levels for delegate permissions.
 * Implements granular access control as per security requirements.
 */
export enum AccessLevel {
    READ = 'READ',   // Read-only access to resources
    WRITE = 'WRITE', // Read and write access to resources
    NONE = 'NONE'    // No access to resources
}

/**
 * Enum defining possible delegate access statuses for lifecycle management.
 * Supports comprehensive delegate access tracking and security controls.
 */
export enum DelegateStatus {
    ACTIVE = 'ACTIVE',     // Delegate has active access
    PENDING = 'PENDING',   // Invitation sent, awaiting acceptance
    EXPIRED = 'EXPIRED',   // Access period has expired
    REVOKED = 'REVOKED'    // Access explicitly revoked by owner
}

/**
 * Core interface representing a delegate relationship with audit capabilities.
 * Implements secure delegate access management with temporal controls.
 */
export interface Delegate {
    id: UUID;                    // Unique identifier for delegate relationship
    ownerId: UUID;               // Reference to the estate owner
    delegateId: UUID;            // Reference to the delegate user
    role: UserRole;              // Delegate's role (EXECUTOR, HEALTHCARE_PROXY, etc.)
    status: DelegateStatus;      // Current status of delegate access
    expiresAt: Date;             // Access expiration timestamp
    createdAt: Date;             // Relationship creation timestamp
    updatedAt: Date;             // Last update timestamp
    lastAccessAt: Date | null;   // Last resource access timestamp
}

/**
 * Data transfer object for creating new delegate relationships.
 * Enforces strict validation and security controls for delegate creation.
 */
export interface CreateDelegateDTO {
    email: string & { __emailBrand: never }; // Branded type for validated email
    role: UserRole;                          // Required delegate role
    expiresAt: Date;                         // Required expiration date
    permissions: Array<{                     // Required permission set
        resourceType: ResourceType;
        accessLevel: AccessLevel;
    }>;
}

/**
 * Data transfer object for updating delegate relationships.
 * Supports partial updates with security-conscious field validation.
 */
export interface UpdateDelegateDTO {
    role?: UserRole;                         // Optional role update
    status?: DelegateStatus;                 // Optional status update
    expiresAt?: Date;                        // Optional expiration update
    permissions?: Array<{                    // Optional permissions update
        resourceType: ResourceType;
        accessLevel: AccessLevel;
    }>;
}

/**
 * Type guard to check if a role has access to a specific resource type
 */
export const hasResourceAccess = (
    role: UserRole,
    resourceType: ResourceType
): boolean => {
    const accessMatrix: Record<UserRole, ResourceType[]> = {
        [UserRole.EXECUTOR]: [
            ResourceType.PERSONAL_INFO,
            ResourceType.FINANCIAL_DATA,
            ResourceType.LEGAL_DOCS
        ],
        [UserRole.HEALTHCARE_PROXY]: [
            ResourceType.PERSONAL_INFO,
            ResourceType.MEDICAL_DATA,
            ResourceType.LEGAL_DOCS
        ],
        [UserRole.FINANCIAL_ADVISOR]: [
            ResourceType.FINANCIAL_DATA
        ],
        [UserRole.LEGAL_ADVISOR]: [
            ResourceType.PERSONAL_INFO,
            ResourceType.LEGAL_DOCS,
            ResourceType.FINANCIAL_DATA
        ]
    };

    return accessMatrix[role]?.includes(resourceType) ?? false;
};