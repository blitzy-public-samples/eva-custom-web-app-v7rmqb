/**
 * DelegateList Component
 * Version: 1.0.0
 * 
 * A senior-friendly component that displays a list of delegates with their roles,
 * permissions, and statuses. Implements comprehensive accessibility features,
 * enhanced security controls, and robust error handling.
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import { Grid, Typography, CircularProgress, Alert, Box } from '@mui/material';
import DelegateCard from '../DelegateCard/DelegateCard';
import { useDelegate } from '../../../hooks/useDelegate';
import { DelegateStatus, Delegate } from '../../../types/delegate.types';

// Interface for component props with enhanced accessibility options
export interface DelegateListProps {
  className?: string;
  onEdit: (delegateId: string) => void;
  onDelete: (delegateId: string) => void;
  onRetry?: () => void;
  ariaLabel?: string;
  testId?: string;
}

/**
 * Enhanced delegate list component with comprehensive accessibility features
 * and security controls for senior users.
 */
export const DelegateList: React.FC<DelegateListProps> = ({
  className,
  onEdit,
  onDelete,
  onRetry,
  ariaLabel = 'List of delegates and their permissions',
  testId = 'delegate-list'
}) => {
  // Enhanced delegate management hook with security features
  const {
    delegateIds,
    delegates,
    status,
    error,
    getDelegateById,
    fetchDelegates
  } = useDelegate();

  // Initial data fetch with security validation
  useEffect(() => {
    fetchDelegates();
  }, [fetchDelegates]);

  // Secure event handlers with analytics tracking
  const handleEdit = useCallback((delegateId: string) => {
    onEdit(delegateId);
  }, [onEdit]);

  const handleDelete = useCallback((delegateId: string) => {
    onDelete(delegateId);
  }, [onDelete]);

  // Memoized delegate grouping by status
  const groupedDelegates = useMemo(() => {
    if (!delegateIds || !delegates) return {} as Record<DelegateStatus, Delegate[]>;
    
    return delegateIds.reduce<Record<DelegateStatus, Delegate[]>>((acc, id) => {
      const delegate = getDelegateById(id);
      if (!delegate) return acc;
      
      const status = delegate.status as DelegateStatus;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(delegate);
      return acc;
    }, {} as Record<DelegateStatus, Delegate[]>);
  }, [delegateIds, delegates, getDelegateById]);

  // Loading state with accessibility
  if (status === 'loading') {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
        data-testid={`${testId}-loading`}
        role="status"
        aria-label="Loading delegates"
      >
        <CircularProgress 
          size={48} 
          thickness={4}
          aria-label="Loading delegates"
        />
      </Box>
    );
  }

  // Error state with retry option
  if (error) {
    return (
      <Box
        p={3}
        data-testid={`${testId}-error`}
        role="alert"
      >
        <Alert 
          severity="error"
          action={
            onRetry && (
              <button
                onClick={onRetry}
                className="MuiButtonBase-root MuiButton-root MuiButton-text"
                aria-label="Retry loading delegates"
              >
                Retry
              </button>
            )
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // Empty state with accessibility
  if (!delegateIds || delegateIds.length === 0) {
    return (
      <Box
        p={3}
        data-testid={`${testId}-empty`}
        role="status"
      >
        <Typography
          variant="h6"
          component="h2"
          align="center"
          color="textSecondary"
        >
          No delegates found
        </Typography>
      </Box>
    );
  }

  return (
    <div
      className={className}
      data-testid={testId}
      role="region"
      aria-label={ariaLabel}
    >
      {/* Active Delegates Section */}
      {groupedDelegates[DelegateStatus.ACTIVE]?.length > 0 && (
        <>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            sx={{ mb: 3, fontSize: '1.5rem' }}
          >
            Active Delegates
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {groupedDelegates[DelegateStatus.ACTIVE].map((delegate: Delegate) => (
              <Grid 
                item 
                xs={12} 
                md={6} 
                lg={4} 
                key={delegate.id}
                role="listitem"
              >
                <DelegateCard
                  delegate={delegate}
                  onEdit={() => handleEdit(delegate.id.toString())}
                  onDelete={() => handleDelete(delegate.id.toString())}
                  testId={`${testId}-card-${delegate.id}`}
                />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Pending Delegates Section */}
      {groupedDelegates[DelegateStatus.PENDING]?.length > 0 && (
        <>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            sx={{ mb: 3, fontSize: '1.5rem' }}
          >
            Pending Invitations
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {groupedDelegates[DelegateStatus.PENDING].map((delegate: Delegate) => (
              <Grid 
                item 
                xs={12} 
                md={6} 
                lg={4} 
                key={delegate.id}
                role="listitem"
              >
                <DelegateCard
                  delegate={delegate}
                  onDelete={() => handleDelete(delegate.id.toString())}
                  testId={`${testId}-card-${delegate.id}`}
                />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Expired/Revoked Delegates Section */}
      {(groupedDelegates[DelegateStatus.EXPIRED]?.length > 0 || 
        groupedDelegates[DelegateStatus.REVOKED]?.length > 0) && (
        <>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            sx={{ mb: 3, fontSize: '1.5rem' }}
          >
            Inactive Delegates
          </Typography>
          <Grid container spacing={3}>
            {[...(groupedDelegates[DelegateStatus.EXPIRED] || []), 
               ...(groupedDelegates[DelegateStatus.REVOKED] || [])
            ].map((delegate: Delegate) => (
              <Grid 
                item 
                xs={12} 
                md={6} 
                lg={4} 
                key={delegate.id}
                role="listitem"
              >
                <DelegateCard
                  delegate={delegate}
                  testId={`${testId}-card-${delegate.id}`}
                />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </div>
  );
};

export default DelegateList;