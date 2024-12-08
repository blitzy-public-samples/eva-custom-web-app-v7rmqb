/**
 * Estate Kit - Delegates Page Component
 * 
 * Requirements addressed:
 * - Delegate Access Management (Technical Specifications/1.3 Scope/In-Scope)
 *   Implements the frontend interface for managing delegate access control, including listing, adding, editing, and deleting delegates.
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Ensures consistent design and theming across the web application by using reusable components like DelegateList and DelegateForm.
 * - State Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Integrates with Redux to manage delegate-related state and actions.
 * 
 * Human Tasks:
 * 1. Verify accessibility of delegate management interface with screen readers
 * 2. Test responsive layout across different viewport sizes
 * 3. Validate loading states provide appropriate user feedback
 * 4. Review error handling behavior with UX team
 */

// react version ^18.2.0
import React, { useEffect, useState } from 'react';

// Internal imports
import DelegateList from '../components/delegates/DelegateList/DelegateList';
import DelegateForm from '../components/delegates/DelegateForm/DelegateForm';
import useDelegate from '../hooks/useDelegate';
import { fetchDelegates, addDelegate, editDelegate, removeDelegate } from '../redux/slices/delegateSlice';
import { DelegateTypes } from '../types/delegate.types';

/**
 * DelegatesPage component provides a user interface for managing delegates,
 * including viewing, adding, editing, and removing delegate access.
 */
const DelegatesPage: React.FC = () => {
  // Local state for managing form visibility and edit mode
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingDelegate, setEditingDelegate] = useState<DelegateTypes | null>(null);

  // Get delegate-related state and actions from custom hook
  const {
    delegates,
    status,
    error,
    isLoading,
    getDelegatesList,
    createNewDelegate,
    updateExistingDelegate,
    deleteExistingDelegate
  } = useDelegate();

  // Fetch delegates on component mount
  useEffect(() => {
    getDelegatesList();
  }, [getDelegatesList]);

  /**
   * Handles the creation of a new delegate
   * @param delegate - The delegate object to create
   */
  const handleAddDelegate = async (delegate: DelegateTypes) => {
    try {
      await createNewDelegate(delegate);
      setShowForm(false);
    } catch (error) {
      console.error('Error adding delegate:', error);
    }
  };

  /**
   * Handles updating an existing delegate
   * @param delegate - The updated delegate object
   */
  const handleEditDelegate = async (delegate: DelegateTypes) => {
    try {
      await updateExistingDelegate(delegate.delegateId, delegate);
      setShowForm(false);
      setEditingDelegate(null);
    } catch (error) {
      console.error('Error updating delegate:', error);
    }
  };

  /**
   * Handles delegate deletion
   * @param delegateId - ID of the delegate to delete
   */
  const handleDeleteDelegate = async (delegateId: string) => {
    try {
      await deleteExistingDelegate(delegateId);
    } catch (error) {
      console.error('Error deleting delegate:', error);
    }
  };

  /**
   * Initiates delegate editing
   * @param delegate - The delegate to edit
   */
  const handleStartEdit = (delegate: DelegateTypes) => {
    setEditingDelegate(delegate);
    setShowForm(true);
  };

  /**
   * Handles form cancellation
   */
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingDelegate(null);
  };

  return (
    <div 
      className="delegates-page"
      role="main"
      aria-label="Delegate Management"
    >
      <header className="delegates-header">
        <h1>Manage Delegates</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="add-delegate-button"
            aria-label="Add new delegate"
          >
            Add Delegate
          </button>
        )}
      </header>

      {error && (
        <div 
          className="error-message" 
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      {showForm ? (
        <DelegateForm
          delegate={editingDelegate || undefined}
          onSubmit={editingDelegate ? handleEditDelegate : handleAddDelegate}
          onCancel={handleCancelForm}
        />
      ) : (
        <DelegateList
          delegates={delegates}
          isLoading={isLoading}
          onEdit={handleStartEdit}
          onDelete={handleDeleteDelegate}
        />
      )}
    </div>
  );
};

export default DelegatesPage;