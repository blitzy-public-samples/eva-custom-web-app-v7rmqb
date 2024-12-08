// @package sequelize v6.31.0
import { DelegateModel, validateDelegateData } from '../db/models/delegate.model';
import { PermissionModel } from '../db/models/permission.model';
import { validateDelegate } from '../utils/validation.util';
import { logError } from '../utils/logger.util';
import { handleError } from '../utils/error.util';
import { DelegateTypes } from '../types/delegate.types';
import { Sequelize } from 'sequelize';

/**
 * Human Tasks:
 * 1. Ensure database connection is properly configured for transaction support
 * 2. Verify that error monitoring is set up to track delegate-related errors
 * 3. Review and update delegate permission policies periodically
 * 4. Configure audit logging for delegate operations
 */

/**
 * Creates a new delegate with the specified permissions and role.
 * 
 * Requirements Addressed:
 * - Delegate Access Management (Technical Specifications/1.3 Scope/In-Scope)
 *   Implements creation of delegates with proper validation and permission assignment
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Enforces role-based access control during delegate creation
 * 
 * @param delegateData - The data for creating a new delegate
 * @returns Promise resolving to the created delegate entity
 * @throws Error if validation fails or database operation fails
 */
export const createDelegate = async (delegateData: DelegateTypes): Promise<DelegateModel> => {
  try {
    // Validate delegate data structure
    if (!validateDelegate(delegateData)) {
      throw new Error('Invalid delegate data structure');
    }

    // Validate delegate data using model validation
    validateDelegateData(delegateData);

    // Create delegate with transaction to ensure data consistency
    const result = await sequelize.transaction(async (transaction) => {
      // Create the delegate record
      const delegate = await DelegateModel.create(delegateData, { transaction });

      // Create permission records for the delegate
      const permissionPromises = delegateData.permissions.map(permission =>
        PermissionModel.create({
          permissionId: permission.permissionId,
          resourceType: permission.resourceType,
          accessLevel: permission.accessLevel,
          delegateId: delegate.delegateId
        }, { transaction })
      );

      await Promise.all(permissionPromises);
      return delegate;
    });

    return result;
  } catch (error) {
    logError(error as Error);
    handleError(error as Error);
    throw error;
  }
};

/**
 * Retrieves a delegate by their ID.
 * 
 * Requirements Addressed:
 * - Delegate Access Management (Technical Specifications/1.3 Scope/In-Scope)
 *   Implements secure retrieval of delegate information
 * 
 * @param delegateId - The ID of the delegate to retrieve
 * @returns Promise resolving to the delegate entity if found, null otherwise
 * @throws Error if database operation fails
 */
export const getDelegateById = async (delegateId: string): Promise<DelegateModel | null> => {
  try {
    const delegate = await DelegateModel.findByPk(delegateId, {
      include: [{
        model: PermissionModel,
        as: 'permissions',
        attributes: ['permissionId', 'resourceType', 'accessLevel']
      }]
    });

    return delegate;
  } catch (error) {
    logError(error as Error);
    handleError(error as Error);
    throw error;
  }
};

/**
 * Updates an existing delegate's information and permissions.
 * 
 * Requirements Addressed:
 * - Delegate Access Management (Technical Specifications/1.3 Scope/In-Scope)
 *   Implements secure update of delegate information and permissions
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Maintains role-based access control during delegate updates
 * 
 * @param delegateId - The ID of the delegate to update
 * @param updateData - The data to update the delegate with
 * @returns Promise resolving to the updated delegate entity
 * @throws Error if delegate not found, validation fails, or database operation fails
 */
export const updateDelegate = async (
  delegateId: string,
  updateData: Partial<DelegateTypes>
): Promise<DelegateModel> => {
  try {
    const delegate = await getDelegateById(delegateId);
    if (!delegate) {
      throw new Error('Delegate not found');
    }

    // Validate update data
    if (!validateDelegate({ ...delegate.toJSON(), ...updateData })) {
      throw new Error('Invalid update data structure');
    }

    // Update delegate with transaction to ensure data consistency
    const result = await sequelize.transaction(async (transaction) => {
      // Update the delegate record
      await delegate.update(updateData, { transaction });

      // If permissions are being updated, handle permission updates
      if (updateData.permissions) {
        // Delete existing permissions
        await PermissionModel.destroy({
          where: { delegateId },
          transaction
        });

        // Create new permissions
        const permissionPromises = updateData.permissions.map(permission =>
          PermissionModel.create({
            permissionId: permission.permissionId,
            resourceType: permission.resourceType,
            accessLevel: permission.accessLevel,
            delegateId
          }, { transaction })
        );

        await Promise.all(permissionPromises);
      }

      return delegate;
    });

    return result;
  } catch (error) {
    logError(error as Error);
    handleError(error as Error);
    throw error;
  }
};

/**
 * Deletes a delegate by their ID.
 * 
 * Requirements Addressed:
 * - Delegate Access Management (Technical Specifications/1.3 Scope/In-Scope)
 *   Implements secure deletion of delegate records
 * 
 * @param delegateId - The ID of the delegate to delete
 * @returns Promise resolving to void
 * @throws Error if delegate not found or database operation fails
 */
export const deleteDelegate = async (delegateId: string): Promise<void> => {
  try {
    const delegate = await getDelegateById(delegateId);
    if (!delegate) {
      throw new Error('Delegate not found');
    }

    // Delete delegate with transaction to ensure data consistency
    await sequelize.transaction(async (transaction) => {
      // Delete associated permissions first
      await PermissionModel.destroy({
        where: { delegateId },
        transaction
      });

      // Delete the delegate record
      await delegate.destroy({ transaction });
    });
  } catch (error) {
    logError(error as Error);
    handleError(error as Error);
    throw error;
  }
};