/**
 * Estate Kit - DelegateList Component
 * 
 * Requirements addressed:
 * - Delegate Access Management (Technical Specifications/1.3 Scope/In-Scope)
 *   Implements the frontend interface for managing delegate access control
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Uses reusable components and consistent styling
 * - State Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Integrates with Redux for delegate state management
 * 
 * Human Tasks:
 * 1. Verify accessibility of delegate list items with screen readers
 * 2. Test responsive layout across different viewport sizes
 * 3. Validate loading states provide appropriate user feedback
 */

// react version ^18.2.0
import React, { useEffect } from 'react';
// clsx version ^1.2.1
import clsx from 'clsx';

// Internal imports
import { DelegateTypes } from '../../../types/delegate.types';
import useDelegate from '../../hooks/useDelegate';
import Card from '../../common/Card/Card';
import Button from '../../common/Button/Button';
import { formatDate } from '../../../utils/format.util';

const DelegateList: React.FC = () => {
  // Get delegate state and actions from custom hook
  const {
    delegates,
    status,
    error,
    isLoading,
    getDelegatesList,
    deleteExistingDelegate
  } = useDelegate();

  // Fetch delegates on component mount
  useEffect(() => {
    getDelegatesList();
  }, [getDelegatesList]);

  // Handle delegate deletion
  const handleDelete = async (delegateId: string) => {
    try {
      await deleteExistingDelegate(delegateId);
    } catch (error) {
      console.error('Error deleting delegate:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div
        className={clsx('delegate-list-loading')}
        role="status"
        aria-label="Loading delegates"
      >
        <p>Loading delegates...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={clsx('delegate-list-error')}
        role="alert"
        aria-label="Error loading delegates"
      >
        <p>Error loading delegates: {error}</p>
        <Button
          label="Retry"
          variant="primary"
          onClick={() => getDelegatesList()}
          ariaLabel="Retry loading delegates"
        />
      </div>
    );
  }

  // Empty state
  if (!delegates.length) {
    return (
      <Card title="No Delegates">
        <p>No delegates have been assigned yet.</p>
        <Button
          label="Add Delegate"
          variant="primary"
          onClick={() => {/* Handle add delegate */}}
          ariaLabel="Add new delegate"
        />
      </Card>
    );
  }

  // Render delegate list
  return (
    <div
      className={clsx('delegate-list')}
      role="region"
      aria-label="List of delegates"
    >
      {delegates.map((delegate: DelegateTypes) => (
        <Card
          key={delegate.delegateId}
          title={`Delegate: ${delegate.delegateId}`}
        >
          <div className={clsx('delegate-info')}>
            {/* Delegate Details */}
            <div className={clsx('delegate-details')}>
              <p>
                <strong>Owner ID:</strong> {delegate.ownerId}
              </p>
              <p>
                <strong>Role:</strong> {delegate.role}
              </p>
              <p>
                <strong>Expires:</strong> {formatDate(delegate.expiresAt)}
              </p>
            </div>

            {/* Permissions Section */}
            <div className={clsx('delegate-permissions')}>
              <h3>Permissions</h3>
              <ul>
                {delegate.permissions.map((permission) => (
                  <li key={permission.permissionId}>
                    {permission.resourceType} - {permission.accessLevel}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className={clsx('delegate-actions')}>
              <Button
                label="Edit"
                variant="secondary"
                onClick={() => {/* Handle edit delegate */}}
                ariaLabel={`Edit delegate ${delegate.delegateId}`}
              />
              <Button
                label="Delete"
                variant="outlined"
                onClick={() => handleDelete(delegate.delegateId)}
                ariaLabel={`Delete delegate ${delegate.delegateId}`}
              />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default DelegateList;