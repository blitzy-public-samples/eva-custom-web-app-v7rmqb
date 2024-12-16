/**
 * Delegates Page Component
 * Version: 1.0.0
 * 
 * Implements comprehensive delegate management with enhanced security,
 * accessibility features, and senior-friendly UI patterns for the
 * Estate Kit platform.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Stack, Typography, Button, Dialog, Alert, CircularProgress } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import DelegateList from '../../components/delegates/DelegateList/DelegateList';
import DelegateForm from '../../components/delegates/DelegateForm/DelegateForm';
import { useDelegate } from '../../hooks/useDelegate';

// Analytics event constants
const ANALYTICS_EVENTS = {
  PAGE_VIEW: 'delegates_page_view',
  ADD_DELEGATE: 'add_delegate_click',
  EDIT_DELEGATE: 'edit_delegate_click',
  DELETE_DELEGATE: 'delete_delegate_click',
  DIALOG_OPEN: 'delegate_dialog_open',
  DIALOG_CLOSE: 'delegate_dialog_close'
} as const;

/**
 * Enhanced delegate management page component with comprehensive security
 * and accessibility features optimized for senior users.
 */
const Delegates: React.FC = React.memo(() => {
  // State management
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDelegateId, setSelectedDelegateId] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [error, setError] = useState<string | null>(null);

  // Refs for accessibility
  const dialogTitleRef = useRef<HTMLHeadingElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Custom hook for delegate management
  const {
    status,
    error: delegateError,
    fetchDelegates,
    removeDelegate,
    refreshCache,
    getDelegateById
  } = useDelegate();

  // Track page view for analytics
  useEffect(() => {
    (window as any).analytics?.track(ANALYTICS_EVENTS.PAGE_VIEW);
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchDelegates().catch(error => {
      setError('Failed to load delegates. Please try again.');
      console.error('Delegate fetch error:', error);
    });
  }, [fetchDelegates]);

  /**
   * Handles opening the delegate form dialog
   */
  const handleAddDelegate = useCallback(() => {
    setDialogMode('add');
    setSelectedDelegateId(null);
    setIsDialogOpen(true);
    (window as any).analytics?.track(ANALYTICS_EVENTS.ADD_DELEGATE);
  }, []);

  /**
   * Handles delegate edit action with security validation
   */
  const handleEditDelegate = useCallback((delegateId: string) => {
    setDialogMode('edit');
    setSelectedDelegateId(delegateId);
    setIsDialogOpen(true);
    (window as any).analytics?.track(ANALYTICS_EVENTS.EDIT_DELEGATE, { delegateId });
  }, []);

  /**
   * Handles delegate deletion with security confirmation
   */
  const handleDeleteDelegate = useCallback(async (delegateId: string) => {
    try {
      if (window.confirm('Are you sure you want to remove this delegate\'s access?')) {
        (window as any).analytics?.track(ANALYTICS_EVENTS.DELETE_DELEGATE, { delegateId });
        await removeDelegate(delegateId);
        await refreshCache();
      }
    } catch (error) {
      setError('Failed to remove delegate. Please try again.');
      console.error('Delegate removal error:', error);
    }
  }, [removeDelegate, refreshCache]);

  /**
   * Handles dialog close with cleanup
   */
  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedDelegateId(null);
    (window as any).analytics?.track(ANALYTICS_EVENTS.DIALOG_CLOSE);
  }, []);

  /**
   * Handles successful delegate operation
   */
  const handleSuccess = useCallback(() => {
    handleDialogClose();
    refreshCache();
  }, [handleDialogClose, refreshCache]);

  /**
   * Handles operation errors with user feedback
   */
  const handleError = useCallback((error: Error) => {
    setError(error.message);
    console.error('Delegate operation error:', error);
  }, []);

  // Loading state
  if (status === 'loading') {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
        role="status"
        aria-label="Loading delegates"
      >
        <CircularProgress size={48} thickness={4} />
      </Box>
    );
  }

  // Get delegate data for the form
  const selectedDelegate = selectedDelegateId ? getDelegateById(selectedDelegateId) : undefined;

  return (
    <Box
      ref={mainContentRef}
      component="main"
      role="main"
      aria-label="Delegate Management"
      sx={{ p: { xs: 2, sm: 3, md: 4 } }}
    >
      {/* Page Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        mb={4}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontSize: { xs: '1.5rem', sm: '2rem' },
            fontWeight: 600,
            color: 'text.primary'
          }}
        >
          Manage Delegates
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddDelegate}
          size="large"
          aria-label="Add new delegate"
          sx={{ minHeight: '48px' }}
        >
          Add Delegate
        </Button>
      </Stack>

      {/* Error Display */}
      {(error || delegateError) && (
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          sx={{ mb: 3 }}
        >
          {error || delegateError}
        </Alert>
      )}

      {/* Delegate List */}
      <DelegateList
        onEdit={handleEditDelegate}
        onDelete={handleDeleteDelegate}
        onRetry={fetchDelegates}
        ariaLabel="List of delegates and their permissions"
      />

      {/* Delegate Form Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        aria-labelledby="delegate-dialog-title"
      >
        <Box sx={{ p: 3 }}>
          <Typography
            id="delegate-dialog-title"
            ref={dialogTitleRef}
            variant="h5"
            component="h2"
            sx={{ mb: 3 }}
          >
            {dialogMode === 'add' ? 'Add New Delegate' : 'Edit Delegate'}
          </Typography>

          <DelegateForm
            delegate={selectedDelegate}
            onSuccess={handleSuccess}
            onCancel={handleDialogClose}
            onError={handleError}
          />
        </Box>
      </Dialog>
    </Box>
  );
});

Delegates.displayName = 'Delegates';

export default Delegates;