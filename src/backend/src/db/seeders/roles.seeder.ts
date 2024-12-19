// @ts-check
import { DataSource } from 'typeorm'; // Version: ^0.3.0
import { UserRole } from '../../types/user.types';
import { ResourceType, AccessLevel } from '../../types/permission.types';
import { Logger } from '../../utils/logger.util'; // Updated logger path

/**
 * Default role permission matrix defining access levels and metadata for each role
 * Based on the authorization matrix from technical specifications section 7.1
 */
const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Array<{
    resourceType: ResourceType;
    accessLevel: AccessLevel;
    metadata?: {
        limitations?: string[];
        conditions?: string[];
    }
}>> = {
    [UserRole.OWNER]: [
        { resourceType: ResourceType.PERSONAL_INFO, accessLevel: AccessLevel.WRITE },
        { resourceType: ResourceType.FINANCIAL_DATA, accessLevel: AccessLevel.WRITE },
        { resourceType: ResourceType.MEDICAL_DATA, accessLevel: AccessLevel.WRITE },
        { resourceType: ResourceType.LEGAL_DOCS, accessLevel: AccessLevel.WRITE }
    ],
    [UserRole.EXECUTOR]: [
        { resourceType: ResourceType.PERSONAL_INFO, accessLevel: AccessLevel.READ },
        { 
            resourceType: ResourceType.FINANCIAL_DATA, 
            accessLevel: AccessLevel.READ,
            metadata: {
                conditions: ['Owner deceased or incapacitated']
            }
        },
        { resourceType: ResourceType.MEDICAL_DATA, accessLevel: AccessLevel.NONE },
        { resourceType: ResourceType.LEGAL_DOCS, accessLevel: AccessLevel.READ }
    ],
    [UserRole.HEALTHCARE_PROXY]: [
        { resourceType: ResourceType.PERSONAL_INFO, accessLevel: AccessLevel.READ },
        { resourceType: ResourceType.FINANCIAL_DATA, accessLevel: AccessLevel.NONE },
        { 
            resourceType: ResourceType.MEDICAL_DATA, 
            accessLevel: AccessLevel.READ,
            metadata: {
                limitations: ['Current medical information only']
            }
        },
        { 
            resourceType: ResourceType.LEGAL_DOCS, 
            accessLevel: AccessLevel.READ,
            metadata: {
                limitations: ['Healthcare directives only']
            }
        }
    ],
    [UserRole.FINANCIAL_ADVISOR]: [
        { resourceType: ResourceType.PERSONAL_INFO, accessLevel: AccessLevel.NONE },
        { 
            resourceType: ResourceType.FINANCIAL_DATA, 
            accessLevel: AccessLevel.READ,
            metadata: {
                limitations: ['Financial planning documents only']
            }
        },
        { resourceType: ResourceType.MEDICAL_DATA, accessLevel: AccessLevel.NONE },
        { resourceType: ResourceType.LEGAL_DOCS, accessLevel: AccessLevel.NONE }
    ],
    [UserRole.LEGAL_ADVISOR]: [
        { resourceType: ResourceType.PERSONAL_INFO, accessLevel: AccessLevel.READ },
        { 
            resourceType: ResourceType.FINANCIAL_DATA, 
            accessLevel: AccessLevel.READ,
            metadata: {
                limitations: ['Estate-related financial documents only']
            }
        },
        { resourceType: ResourceType.MEDICAL_DATA, accessLevel: AccessLevel.NONE },
        { resourceType: ResourceType.LEGAL_DOCS, accessLevel: AccessLevel.READ }
    ]
};

/**
 * Seeds the default roles and their associated permission matrices into the database
 * Implements RBAC system according to security specifications section 7.1
 * 
 * @param dataSource - TypeORM DataSource instance for database operations
 * @returns Promise resolving when seeding is complete
 * @throws Error if seeding fails with detailed error information
 */
export async function seedRoles(dataSource: DataSource): Promise<void> {
    const queryRunner = dataSource.createQueryRunner();
    const logger = new Logger('RolesSeeder');

    try {
        // Start transaction with serializable isolation for consistency
        await queryRunner.startTransaction('SERIALIZABLE');
        logger.info('Starting roles and permissions seeding process');

        // Clear existing role permissions with cascade
        await queryRunner.query('DELETE FROM role_permissions');
        await queryRunner.query('DELETE FROM roles');

        // Create roles
        for (const role of Object.values(UserRole)) {
            await queryRunner.query(`
                INSERT INTO roles (name, created_at, updated_at)
                VALUES ($1, NOW(), NOW())
                ON CONFLICT (name) DO NOTHING
            `, [role]);
        }

        // Generate permission matrices
        const permissionValues = [];
        for (const [role, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
            for (const permission of permissions) {
                permissionValues.push({
                    role_name: role,
                    resource_type: permission.resourceType,
                    access_level: permission.accessLevel,
                    metadata: permission.metadata || {},
                    created_at: new Date(),
                    updated_at: new Date()
                });
            }
        }

        // Batch insert permissions
        if (permissionValues.length > 0) {
            await queryRunner.query(`
                INSERT INTO role_permissions (
                    role_name, resource_type, access_level, metadata, created_at, updated_at
                )
                SELECT 
                    v.role_name, v.resource_type, v.access_level, 
                    v.metadata::jsonb, v.created_at, v.updated_at
                FROM jsonb_to_recordset($1::jsonb) AS v(
                    role_name text,
                    resource_type text,
                    access_level text,
                    metadata jsonb,
                    created_at timestamp,
                    updated_at timestamp
                )
            `, [JSON.stringify(permissionValues)]);
        }

        // Verify seeding results
        const [{ count }] = await queryRunner.query(
            'SELECT COUNT(*) as count FROM role_permissions'
        );

        const expectedCount = Object.values(DEFAULT_ROLE_PERMISSIONS)
            .reduce((acc, permissions) => acc + permissions.length, 0);

        if (parseInt(count) !== expectedCount) {
            throw new Error(
                `Permission seeding verification failed. Expected ${expectedCount} permissions, found ${count}`
            );
        }

        await queryRunner.commitTransaction();
        logger.info('Successfully completed roles and permissions seeding');

    } catch (error: unknown) {
        await queryRunner.rollbackTransaction();
        logger.error('Failed to seed roles and permissions', { error });
        throw new Error(`Failed to seed roles and permissions: ${(error as Error).message}`);

    } finally {
        await queryRunner.release();
    }
}

export default seedRoles;