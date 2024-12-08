/**
 * Estate Kit - Frontend Delegate Service
 * Version: 1.0.0
 * 
 * Requirements Addressed:
 * - Delegate Access Management (Technical Specifications/1.3 Scope/In-Scope)
 *   Implements frontend logic for managing delegate access control and API integration
 * - Role-Based Access Control (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Ensures role-based access control through delegate API interactions
 * 
 * Human Tasks:
 * 1. Verify API endpoint configurations match backend routes
 * 2. Test error handling scenarios for API responses
 * 3. Validate delegate permission mapping with backend
 */

// axios version ^1.3.4
import { DelegateTypes } from '../types/delegate.types';
import { API_BASE_URL, makeRequest } from '../config/api.config';
import { validateDelegate } from '../utils/validation.util';
import { formatDate } from '../utils/format.util';

/**
 * Fetches a list of delegates for the authenticated user
 * @returns Promise<DelegateTypes[]> Array of delegate objects
 */
export async function getDelegates(): Promise<DelegateTypes[]> {
  try {
    const response = await makeRequest({
      method: 'GET',
      url: `${API_BASE_URL}/delegates`,
    });

    // Format dates in the response data
    const delegates = response.data.map((delegate: DelegateTypes) => ({
      ...delegate,
      expiresAt: new Date(delegate.expiresAt)
    }));

    return delegates;
  } catch (error) {
    console.error('Error fetching delegates:', error);
    throw error;
  }
}

/**
 * Creates a new delegate with the provided data
 * @param delegate - The delegate object to create
 * @returns Promise<DelegateTypes> The created delegate object
 */
export async function createDelegate(delegate: DelegateTypes): Promise<DelegateTypes> {
  // Validate delegate data before sending to API
  if (!validateDelegate(delegate)) {
    throw new Error('Invalid delegate data provided');
  }

  try {
    const response = await makeRequest({
      method: 'POST',
      url: `${API_BASE_URL}/delegates`,
      data: {
        ...delegate,
        expiresAt: formatDate(delegate.expiresAt)
      }
    });

    // Format the response data
    return {
      ...response.data,
      expiresAt: new Date(response.data.expiresAt)
    };
  } catch (error) {
    console.error('Error creating delegate:', error);
    throw error;
  }
}

/**
 * Updates an existing delegate with the provided data
 * @param delegateId - ID of the delegate to update
 * @param updates - Partial delegate object containing the updates
 * @returns Promise<DelegateTypes> The updated delegate object
 */
export async function updateDelegate(
  delegateId: string,
  updates: Partial<DelegateTypes>
): Promise<DelegateTypes> {
  // Validate update data
  if (updates && !validateDelegate({ ...updates, delegateId } as DelegateTypes)) {
    throw new Error('Invalid delegate update data provided');
  }

  try {
    const response = await makeRequest({
      method: 'PUT',
      url: `${API_BASE_URL}/delegates/${delegateId}`,
      data: {
        ...updates,
        expiresAt: updates.expiresAt ? formatDate(updates.expiresAt) : undefined
      }
    });

    // Format the response data
    return {
      ...response.data,
      expiresAt: new Date(response.data.expiresAt)
    };
  } catch (error) {
    console.error('Error updating delegate:', error);
    throw error;
  }
}

/**
 * Deletes a delegate by their ID
 * @param delegateId - ID of the delegate to delete
 * @returns Promise<void>
 */
export async function deleteDelegate(delegateId: string): Promise<void> {
  if (!delegateId || typeof delegateId !== 'string') {
    throw new Error('Invalid delegateId provided');
  }

  try {
    await makeRequest({
      method: 'DELETE',
      url: `${API_BASE_URL}/delegates/${delegateId}`,
    });
  } catch (error) {
    console.error('Error deleting delegate:', error);
    throw error;
  }
}