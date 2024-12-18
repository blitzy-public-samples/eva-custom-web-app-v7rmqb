// @ts-check
import { UUID } from './user.types'; // Internal import for UUID type
import { UUID as CryptoUUID } from 'crypto'; // Version: latest - Used for unique identifier types

/**
 * Enum defining types of resources that can be accessed in the system.
 * Maps to different categories of sensitive information managed by Estate Kit.
 */
export enum ResourceType {
    PERSONAL_INFO = 'PERSONAL_INFO',   // Basic personal information
    FINANCIAL_DATA = 'FINANCIAL_DATA', // Financial documents and records
    MEDICAL_DATA = 'MEDICAL_DATA',     // Healthcare and medical information
    LEGAL_DOCS = 'LEGAL_DOCS'         // Legal documents and directives
}

/**
 * Enum defining possible access levels for permissions.
 * Implements granular access control for RBAC implementation.
 */
export enum AccessLevel {
    READ = 'READ',   // Read-only access to resources
    WRITE = 'WRITE', // Full read and write access
    NONE = 'NONE'    // No access granted
}

/**
 * Core interface representing a permission record in the system.
 * Implements RBAC and audit requirements for security compliance.
 */
export interface Permission {
    id: UUID;                    // Unique identifier for the permission
    delegateId: UUID;            // Reference to delegate user
    resourceType: ResourceType;   // Type of resource being accessed
    accessLevel: AccessLevel;     // Level of access granted
    createdAt: Date;             // Permission creation timestamp
    updatedAt: Date;             // Last modification timestamp
}

/**
 * Data transfer object for creating new permissions.
 * Contains required fields for permission creation.
 */
export interface CreatePermissionDTO {
    delegateId: UUID;            // Required delegate user reference
    resourceType: ResourceType;   // Required resource type
    accessLevel: AccessLevel;    // Required access level
}

/**
 * Data transfer object for updating existing permissions.
 * Supports modification of access levels only for security.
 */
export interface UpdatePermissionDTO {
    accessLevel: AccessLevel;    // New access level to be set
}

/**
 * Type definition for permission matrices used in role definitions.
 * Maps resource types to their corresponding access levels.
 */
export type PermissionMatrix = {
    [key in ResourceType]: AccessLevel;
};

/**
 * Utility function to check if a permission grants required access level.
 * Implements hierarchical access level validation.
 * 
 * @param permission - The permission to check
 * @param requiredLevel - The required access level
 * @returns boolean indicating if permission grants required access
 */
export function hasPermission(permission: Permission, requiredLevel: AccessLevel): boolean {
    // WRITE permission implies READ access
    if (permission.accessLevel === AccessLevel.WRITE) {
        return true;
    }
    
    // READ permission only grants READ access
    if (permission.accessLevel === AccessLevel.READ && requiredLevel === AccessLevel.READ) {
        return true;
    }
    
    // NONE permission grants no access
    return false;
}

/**
 * Predefined permission matrices for different delegate roles.
 * Implements the authorization matrix from security specifications.
 */
export const DEFAULT_PERMISSION_MATRICES: Record<string, PermissionMatrix> = {
    EXECUTOR: {
        [ResourceType.PERSONAL_INFO]: AccessLevel.READ,
        [ResourceType.FINANCIAL_DATA]: AccessLevel.READ,
        [ResourceType.MEDICAL_DATA]: AccessLevel.NONE,
        [ResourceType.LEGAL_DOCS]: AccessLevel.READ
    },
    HEALTHCARE_PROXY: {
        [ResourceType.PERSONAL_INFO]: AccessLevel.READ,
        [ResourceType.FINANCIAL_DATA]: AccessLevel.NONE,
        [ResourceType.MEDICAL_DATA]: AccessLevel.READ,
        [ResourceType.LEGAL_DOCS]: AccessLevel.READ
    },
    FINANCIAL_ADVISOR: {
        [ResourceType.PERSONAL_INFO]: AccessLevel.NONE,
        [ResourceType.FINANCIAL_DATA]: AccessLevel.READ,
        [ResourceType.MEDICAL_DATA]: AccessLevel.NONE,
        [ResourceType.LEGAL_DOCS]: AccessLevel.NONE
    },
    LEGAL_ADVISOR: {
        [ResourceType.PERSONAL_INFO]: AccessLevel.READ,
        [ResourceType.FINANCIAL_DATA]: AccessLevel.READ,
        [ResourceType.MEDICAL_DATA]: AccessLevel.NONE,
        [ResourceType.LEGAL_DOCS]: AccessLevel.READ
    }
};