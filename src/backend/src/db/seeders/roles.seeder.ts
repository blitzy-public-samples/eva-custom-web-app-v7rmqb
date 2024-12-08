// @package sequelize v6.31.0
import { UserModel } from '../models/user.model';
import { PermissionModel } from '../models/permission.model';
import { logInfo } from '../utils/logger.util';
import { initializeDatabase } from '../config/database';

/**
 * Human Tasks:
 * 1. Verify that the predefined roles match the business requirements
 * 2. Ensure database connection is properly configured for seeding
 * 3. Review permission assignments for each role
 * 4. Confirm that the seeding process is included in the deployment pipeline
 */

// Predefined roles for the Estate Kit system
const ROLES = ['admin', 'owner', 'delegate'];

/**
 * Seeds the database with predefined roles.
 * Requirements Addressed:
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Implements predefined roles to enable secure and granular access control.
 */
export const seedRoles = async (): Promise<void> => {
  try {
    // Initialize database connection
    await initializeDatabase();
    logInfo('Starting role seeding process...');

    // Define default permissions for each role
    const rolePermissions = {
      admin: [
        { resourceType: 'document', accessLevel: 'admin' },
        { resourceType: 'profile', accessLevel: 'admin' },
        { resourceType: 'medical', accessLevel: 'admin' },
        { resourceType: 'financial', accessLevel: 'admin' },
        { resourceType: 'legal', accessLevel: 'admin' }
      ],
      owner: [
        { resourceType: 'document', accessLevel: 'manage' },
        { resourceType: 'profile', accessLevel: 'manage' },
        { resourceType: 'medical', accessLevel: 'manage' },
        { resourceType: 'financial', accessLevel: 'manage' },
        { resourceType: 'legal', accessLevel: 'manage' }
      ],
      delegate: [
        { resourceType: 'document', accessLevel: 'read' },
        { resourceType: 'profile', accessLevel: 'read' },
        { resourceType: 'medical', accessLevel: 'read' },
        { resourceType: 'financial', accessLevel: 'read' },
        { resourceType: 'legal', accessLevel: 'read' }
      ]
    };

    // Seed roles and their associated permissions
    for (const role of ROLES) {
      logInfo(`Processing role: ${role}`);

      // Check if role already exists in the database
      const existingRole = await UserModel.findOne({
        where: { role }
      });

      if (!existingRole) {
        // Create permissions for the role
        const permissions = rolePermissions[role as keyof typeof rolePermissions];
        
        for (const permission of permissions) {
          await PermissionModel.create({
            resourceType: permission.resourceType,
            accessLevel: permission.accessLevel,
            role: role
          });
        }

        logInfo(`Created permissions for role: ${role}`);
      } else {
        logInfo(`Role ${role} already exists, skipping...`);
      }
    }

    logInfo('Role seeding process completed successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during role seeding';
    throw new Error(`Failed to seed roles: ${errorMessage}`);
  }
};