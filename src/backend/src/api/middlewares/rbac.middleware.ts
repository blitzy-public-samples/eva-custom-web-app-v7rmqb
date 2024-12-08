/**
 * Estate Kit - RBAC Middleware
 * 
 * This middleware implements Role-Based Access Control (RBAC) for the Estate Kit backend system.
 * 
 * Requirements Addressed:
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Enforces role-based access control (RBAC) by validating user roles and permissions.
 * 
 * Human Tasks:
 * 1. Configure role mappings in Auth0 dashboard to match system roles
 * 2. Set up permission policies for each resource type
 * 3. Review and update access control matrix periodically
 */

import { Request, Response, NextFunction } from 'express';
import { validatePermission } from '../../utils/validation.util';
import { logError } from '../../utils/logger.util';
import { validateUserToken } from '../../services/auth.service';
import { UserTypes, PermissionTypes } from '../../types/user.types';

/**
 * Interface for RBAC configuration options
 */
interface RBACOptions {
  requiredRole?: 'owner' | 'delegate' | 'admin';
  requiredPermissions?: PermissionTypes[];
}

/**
 * Middleware factory function that creates an RBAC middleware instance
 * with specified role and permission requirements
 * 
 * @param options - Configuration options for RBAC validation
 * @returns Express middleware function
 */
export const rbacMiddleware = (options: RBACOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract JWT token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No authorization token provided' });
        return;
      }

      const token = authHeader.split(' ')[1];

      // Validate token and get user roles/permissions
      const validationResult = await validateUserToken(token);
      const userRole = validationResult.roles as UserTypes['role'];
      const userPermissions = validationResult.permissions as PermissionTypes[];

      // Check if user has required role
      if (options.requiredRole && userRole !== options.requiredRole) {
        logError(new Error(`Insufficient role. Required: ${options.requiredRole}, Found: ${userRole}`));
        res.status(403).json({ error: 'Insufficient role permissions' });
        return;
      }

      // Check if user has required permissions
      if (options.requiredPermissions) {
        const hasRequiredPermissions = options.requiredPermissions.every(requiredPerm => {
          // Validate the required permission structure
          if (!validatePermission(requiredPerm)) {
            throw new Error('Invalid permission structure in requirements');
          }

          // Check if user has matching permission
          return userPermissions.some(userPerm => 
            userPerm.resourceType === requiredPerm.resourceType &&
            userPerm.accessLevel === requiredPerm.accessLevel
          );
        });

        if (!hasRequiredPermissions) {
          logError(new Error('Insufficient permissions for requested resource'));
          res.status(403).json({ error: 'Insufficient resource permissions' });
          return;
        }
      }

      // Store user role and permissions in request for downstream use
      req.user = {
        ...req.user,
        role: userRole,
        permissions: userPermissions
      };

      // Proceed to next middleware/route handler
      next();
    } catch (error) {
      logError(error as Error);
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};
```

This implementation:

1. Creates a middleware factory function that accepts RBAC configuration options
2. Validates JWT tokens using the auth service
3. Checks user roles against required roles
4. Validates user permissions against required permissions
5. Uses the validation utility to ensure permission objects are valid
6. Logs errors using the logger utility
7. Stores validated user information in the request object for downstream use
8. Implements proper error handling and status codes
9. Follows the TypeScript interfaces defined in the types files
10. Maintains proper relative imports from dependent files

The middleware can be used in routes like this:
```typescript
router.get('/protected-resource', 
  rbacMiddleware({ 
    requiredRole: 'owner',
    requiredPermissions: [{ 
      resourceType: 'document',
      accessLevel: 'read'
    }]
  }),
  resourceController.getResource
);