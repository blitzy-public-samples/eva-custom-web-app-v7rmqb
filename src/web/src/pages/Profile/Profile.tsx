/**
 * Profile Page Component
 * Version: 1.0.0
 * 
 * Implements a secure, accessible, and senior-friendly interface for managing user profile
 * information in the Estate Kit application. Features enhanced validation for Canadian-specific
 * data and WCAG 2.1 Level AA compliance.
 * 
 * @package react ^18.2.0
 * @package @mui/material ^5.11.0
 */

import React, { useCallback, useState } from 'react';
import { Container, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout/MainLayout';
import ProfileForm, { ProfileFormData } from '../../components/profile/ProfileForm/ProfileForm';
import { useAuth } from '../../hooks/useAuth';

// Constants for accessibility and user feedback
const PAGE_TITLE = 'Profile Settings';
const SUCCESS_MESSAGE = 'Your profile has been updated successfully';
const ERROR_MESSAGE = 'Unable to update profile. Please check your information and try again.';
const LOADING_MESSAGE = 'Updating your profile...';

/**
 * Profile page component providing secure profile management with enhanced
 * accessibility features and senior-friendly design.
 */
const Profile: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize profile data from authenticated user
  const initialProfileData: ProfileFormData | null = user ? {
    name: user.name,
    email: user.email,
    phone: user.phoneNumber || '',
    province: user.province || ''
  } : null;

  /**
   * Handles profile update with enhanced security and validation
   */
  const handleProfileUpdate = useCallback(async (formData: ProfileFormData) => {
    try {
      setIsSubmitting(true);
      setUpdateError(null);
      setUpdateSuccess(false);

      // Log profile update attempt (sanitized)
      console.info('Profile update attempt:', {
        timestamp: new Date().toISOString(),
        userId: user?.id,
        fields: Object.keys(formData)
      });

      // Validate Canadian-specific data
      if (!formData.province || !['ALBERTA', 'BRITISH_COLUMBIA', 'ONTARIO'].includes(formData.province)) {
        throw new Error('Please select a valid Canadian province');
      }

      // Phone number validation for Canadian format
      const phoneRegex = /^(\+?1-?)?(\([0-9]{3}\)|[0-9]{3})[-. ]?[0-9]{3}[-. ]?[0-9]{4}$/;
      if (!phoneRegex.test(formData.phone)) {
        throw new Error('Please enter a valid Canadian phone number');
      }

      // Simulate API call - Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update success state and provide feedback
      setUpdateSuccess(true);
      setUpdateError(null);

      // Announce success to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'alert');
      announcement.setAttribute('aria-live', 'polite');
      announcement.textContent = SUCCESS_MESSAGE;
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);

      // Log successful update
      console.info('Profile update successful:', {
        timestamp: new Date().toISOString(),
        userId: user?.id
      });

    } catch (error) {
      // Handle errors with user-friendly messages
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGE;
      setUpdateError(errorMessage);
      setUpdateSuccess(false);

      // Log error (sanitized)
      console.error('Profile update failed:', {
        timestamp: new Date().toISOString(),
        userId: user?.id,
        error: errorMessage
      });

    } finally {
      setIsSubmitting(false);
    }
  }, [user]);

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <MainLayout>
        <Container maxWidth="lg">
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="50vh"
            role="status"
            aria-label={LOADING_MESSAGE}
          >
            <CircularProgress size={48} />
          </Box>
        </Container>
      </MainLayout>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  return (
    <MainLayout>
      <Container maxWidth="lg">
        <Box
          component="main"
          role="main"
          aria-label={PAGE_TITLE}
          sx={{
            py: { xs: 3, md: 4 },
            px: { xs: 2, md: 3 }
          }}
        >
          {/* Page Header */}
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 700,
              mb: 4,
              color: 'text.primary'
            }}
          >
            {PAGE_TITLE}
          </Typography>

          {/* Status Messages */}
          {updateSuccess && (
            <Alert 
              severity="success"
              sx={{ mb: 3 }}
              role="alert"
            >
              {SUCCESS_MESSAGE}
            </Alert>
          )}

          {updateError && (
            <Alert 
              severity="error"
              sx={{ mb: 3 }}
              role="alert"
            >
              {updateError}
            </Alert>
          )}

          {/* Profile Form */}
          <Box
            sx={{
              backgroundColor: 'background.paper',
              borderRadius: 'var(--border-radius-lg)',
              boxShadow: 'var(--box-shadow-sm)',
              p: { xs: 2, md: 4 }
            }}
          >
            <ProfileForm
              onSubmit={handleProfileUpdate}
              isSubmitting={isSubmitting}
              initialData={initialProfileData}
            />
          </Box>
        </Box>
      </Container>
    </MainLayout>
  );
});

Profile.displayName = 'Profile';

export default Profile;