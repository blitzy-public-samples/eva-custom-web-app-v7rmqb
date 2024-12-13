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
import { DelegateStatus } from '../../../types/delegate.types';

// Interface for component props with enhanced accessibility options
export interface DelegateListProps {
  className?: string;
  onEdit: (delegateId: string, event: React.MouseEvent<Element>) => void;
  onDelete: (delegateId: string, event: React.MouseEvent<Element>) => void;
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
    delegates,
    status,
    error,
    fetchDelegates
  } = useDelegate();

  // Initial data fetch with security validation
  useEffect(() => {
    fetchDelegates();
  }, [fetchDelegates]);

  // Secure event handlers with analytics tracking
  const handleEdit = useCallback((delegateId: string, event: React.MouseEvent<Element>) => {
    event.preventDefault();
    event.stopPropagation();
    onEdit(delegateId, event);
  }, [onEdit]);

  const handleDelete = useCallback((delegateId: string, event: React.MouseEvent<Element>) => {
    event.preventDefault();
    event.stopPropagation();
    onDelete(delegateId, event);
  }, [onDelete]);

  // Memoized delegate grouping by status
  const groupedDelegates = useMemo(() => {
    if (!Array.isArray(delegates)) return {} as Record<DelegateStatus, any[]>;
    
    return delegates.reduce((acc: Record<DelegateStatus, any[]>, delegate: any) => {
      const status = delegate.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(delegate);
      return acc;
    }, {} as Record<DelegateStatus, any[]>);
  }, [delegates]);

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
  if (!Array.isArray(delegates) || !delegates.length) {
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
            {groupedDelegates[DelegateStatus.ACTIVE].map((delegate: any) => (
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
                  onEdit={handleEdit.bind(null, delegate.id.toString())}
                  onDelete={handleDelete.bind(null, delegate.id.toString())}
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
            {groupedDelegates[DelegateStatus.PENDING].map((delegate: any) => (
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
                  onDelete={handleDelete.bind(null, delegate.id.toString())}
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
            {[...groupedDelegates[DelegateStatus.EXPIRED] || [], 
               ...groupedDelegates[DelegateStatus.REVOKED] || []
            ].map((delegate: any) => (
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