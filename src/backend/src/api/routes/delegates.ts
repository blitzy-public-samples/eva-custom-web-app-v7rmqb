/**
 * Estate Kit - Delegate Routes
 * 
 * Requirements Addressed:
 * - Delegate Access Management (Technical Specifications/1.3 Scope/In-Scope)
 *   Implements API routes for managing delegate relationships, permissions, and roles.
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Enforces role-based access control (RBAC) for delegate-related operations.
 * - Authentication (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Ensures that only authenticated users can access delegate-related API routes.
 * - Data Validation (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Validates delegate-related data in API requests to ensure compliance with business rules.
 * 
 * Human Tasks:
 * 1. Configure rate limiting for delegate API endpoints
 * 2. Set up monitoring for delegate operations
 * 3. Review and update delegate permission policies periodically
 * 4. Configure audit logging for delegate management actions
 */

// @package express v4.18.2
import { Router } from 'express';
import {
  createDelegateHandler,
  getDelegateHandler,
  updateDelegateHandler,
  deleteDelegateHandler
} from '../controllers/delegates.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { rbacMiddleware } from '../middlewares/rbac.middleware';
import { validateDelegateData } from '../validators/delegates.validator';

// Initialize express router
const delegateRoutes = Router();

/**
 * POST /api/delegates
 * Create a new delegate
 * Requires: Authentication, 'owner' role, and 'write' permission for delegates
 */
delegateRoutes.post(
  '/',
  authMiddleware,
  rbacMiddleware({
    requiredRole: 'owner',
    requiredPermissions: [{
      resourceType: 'delegate',
      accessLevel: 'write'
    }]
  }),
  validateDelegateData,
  createDelegateHandler
);

/**
 * GET /api/delegates/:delegateId
 * Retrieve a specific delegate by ID
 * Requires: Authentication and either 'owner' role or delegate access
 */
delegateRoutes.get(
  '/:delegateId',
  authMiddleware,
  rbacMiddleware({
    requiredPermissions: [{
      resourceType: 'delegate',
      accessLevel: 'read'
    }]
  }),
  getDelegateHandler
);

/**
 * PUT /api/delegates/:delegateId
 * Update an existing delegate
 * Requires: Authentication, 'owner' role, and 'write' permission for delegates
 */
delegateRoutes.put(
  '/:delegateId',
  authMiddleware,
  rbacMiddleware({
    requiredRole: 'owner',
    requiredPermissions: [{
      resourceType: 'delegate',
      accessLevel: 'write'
    }]
  }),
  validateDelegateData,
  updateDelegateHandler
);

/**
 * DELETE /api/delegates/:delegateId
 * Delete a delegate
 * Requires: Authentication, 'owner' role, and 'manage' permission for delegates
 */
delegateRoutes.delete(
  '/:delegateId',
  authMiddleware,
  rbacMiddleware({
    requiredRole: 'owner',
    requiredPermissions: [{
      resourceType: 'delegate',
      accessLevel: 'manage'
    }]
  }),
  deleteDelegateHandler
);

// Export the router with configured routes
export default delegateRoutes;