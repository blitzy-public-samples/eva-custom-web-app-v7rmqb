/**
 * Estate Kit - Delegate Mock Data
 * 
 * Human Tasks:
 * 1. Verify that the mock data aligns with the latest delegate schema changes
 * 2. Ensure mock permissions match the current system permission levels
 * 3. Update mock expiry dates periodically to maintain future dates
 */

import { DelegateTypes } from '../../src/types/delegate.types';
import { validateDelegate } from '../../src/utils/validation.util';
import { createDelegate } from '../../src/services/delegate.service';
import { DelegateModel } from '../../src/db/models/delegate.model';

/**
 * Predefined mock delegate object for testing purposes
 * Requirements Addressed:
 * - Delegate Access Management (Technical Specifications/1.3 Scope/In-Scope)
 *   Provides standardized mock data for testing delegate functionality
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Simulates delegate roles and permissions for testing access control
 */
export const mockDelegate: DelegateTypes = {
  delegateId: 'mock-delegate-id',
  ownerId: 'mock-owner-id',
  permissions: [
    {
      permissionId: 'mock-permission-id',
      resourceType: 'document',
      accessLevel: 'read'
    }
  ],
  role: 'executor',
  expiresAt: new Date('2024-12-31T23:59:59.000Z')
};

/**
 * Returns a predefined mock delegate object for testing purposes.
 * Requirements Addressed:
 * - Delegate Access Management (Technical Specifications/1.3 Scope/In-Scope)
 *   Provides consistent mock data for delegate testing scenarios
 * 
 * @returns A mock delegate object conforming to DelegateTypes interface
 */
export const getMockDelegate = (): DelegateTypes => {
  return {
    ...mockDelegate,
    delegateId: `mock-delegate-${Date.now()}`, // Ensure unique ID for each test
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
  };
};

/**
 * Validates the predefined mock delegate object.
 * Requirements Addressed:
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Ensures mock data complies with validation rules
 * 
 * @returns boolean indicating if the mock delegate object is valid
 */
export const validateMockDelegate = (): boolean => {
  try {
    return validateDelegate(mockDelegate);
  } catch (error) {
    console.error('Mock delegate validation failed:', error);
    return false;
  }
};

/**
 * Simulates the creation of a delegate using the mock data.
 * Requirements Addressed:
 * - Delegate Access Management (Technical Specifications/1.3 Scope/In-Scope)
 *   Provides test utility for delegate creation scenarios
 * 
 * @returns Promise resolving to the created mock delegate entity
 */
export const createMockDelegate = async (): Promise<DelegateModel> => {
  try {
    // Validate the mock data before attempting creation
    if (!validateMockDelegate()) {
      throw new Error('Invalid mock delegate data');
    }

    // Create a new delegate using the service function
    const delegate = await createDelegate(getMockDelegate());
    return delegate;
  } catch (error) {
    console.error('Failed to create mock delegate:', error);
    throw error;
  }
};