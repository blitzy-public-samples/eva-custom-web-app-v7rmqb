/**
 * Estate Kit - Frontend Delegate Hook
 * Version: 1.0.0
 * 
 * Requirements Addressed:
 * - Delegate Access Management (Technical Specifications/1.3 Scope/In-Scope)
 *   Implements frontend logic for managing delegate access control, including integration with Redux and API services.
 * - State Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Provides a centralized state management solution for delegate-related data using Redux Toolkit.
 * 
 * Human Tasks:
 * 1. Verify error handling behavior meets UX requirements
 * 2. Test loading states trigger appropriate UI feedback
 * 3. Confirm delegate operations update Redux state correctly
 */

// react-redux version ^8.0.5
import { useDispatch, useSelector } from 'react-redux';
import { DelegateTypes } from '../types/delegate.types';
import {
  fetchDelegates,
  addDelegate,
  editDelegate,
  removeDelegate,
} from '../redux/slices/delegateSlice';
import { validateDelegate } from '../utils/validation.util';

/**
 * Custom hook for managing delegate-related operations in the Estate Kit frontend.
 * Provides a unified interface for delegate CRUD operations and state management.
 * 
 * @returns Object containing delegate state and operations
 */
const useDelegate = () => {
  // Initialize Redux dispatch
  const dispatch = useDispatch();

  // Select delegate-related state from Redux store
  const delegates = useSelector((state: any) => state.delegate.delegates);
  const status = useSelector((state: any) => state.delegate.status);
  const error = useSelector((state: any) => state.delegate.error);

  /**
   * Fetches all delegates from the backend
   * @returns Promise that resolves when delegates are fetched
   */
  const getDelegatesList = async () => {
    try {
      await dispatch(fetchDelegates()).unwrap();
    } catch (error) {
      console.error('Error fetching delegates:', error);
      throw error;
    }
  };

  /**
   * Creates a new delegate
   * @param delegate - The delegate object to create
   * @returns Promise that resolves with the created delegate
   */
  const createNewDelegate = async (delegate: DelegateTypes) => {
    try {
      // Validate delegate data before dispatching
      if (!validateDelegate(delegate)) {
        throw new Error('Invalid delegate data provided');
      }
      const result = await dispatch(addDelegate(delegate)).unwrap();
      return result;
    } catch (error) {
      console.error('Error creating delegate:', error);
      throw error;
    }
  };

  /**
   * Updates an existing delegate
   * @param delegateId - ID of the delegate to update
   * @param updates - Partial delegate object containing updates
   * @returns Promise that resolves with the updated delegate
   */
  const updateExistingDelegate = async (
    delegateId: string,
    updates: Partial<DelegateTypes>
  ) => {
    try {
      const result = await dispatch(
        editDelegate({ delegateId, updates })
      ).unwrap();
      return result;
    } catch (error) {
      console.error('Error updating delegate:', error);
      throw error;
    }
  };

  /**
   * Deletes a delegate
   * @param delegateId - ID of the delegate to delete
   * @returns Promise that resolves when the delegate is deleted
   */
  const deleteExistingDelegate = async (delegateId: string) => {
    try {
      await dispatch(removeDelegate(delegateId)).unwrap();
    } catch (error) {
      console.error('Error deleting delegate:', error);
      throw error;
    }
  };

  /**
   * Finds a delegate by ID
   * @param delegateId - ID of the delegate to find
   * @returns The found delegate or undefined
   */
  const findDelegateById = (delegateId: string) => {
    return delegates.find(
      (delegate: DelegateTypes) => delegate.delegateId === delegateId
    );
  };

  /**
   * Checks if a delegate exists
   * @param delegateId - ID of the delegate to check
   * @returns Boolean indicating if the delegate exists
   */
  const doesDelegateExist = (delegateId: string) => {
    return delegates.some(
      (delegate: DelegateTypes) => delegate.delegateId === delegateId
    );
  };

  return {
    // State
    delegates,
    status,
    error,
    isLoading: status === 'loading',
    isError: status === 'failed',
    
    // Operations
    getDelegatesList,
    createNewDelegate,
    updateExistingDelegate,
    deleteExistingDelegate,
    findDelegateById,
    doesDelegateExist,
  };
};

export default useDelegate;