/**
 * Estate Kit - Profile Page Component
 * 
 * Human Tasks:
 * 1. Verify Redux store integration with Auth0 authentication flow
 * 2. Test profile update functionality with backend API
 * 3. Validate form accessibility with screen readers
 * 4. Review error handling and user feedback mechanisms
 */

// React v18.2.0
import React, { useEffect } from 'react';
// react-redux v8.0.5
import { useSelector, useDispatch } from 'react-redux';

// Internal dependencies
import ProfileForm from '../components/profile/ProfileForm/ProfileForm';
import { theme } from '../config/theme.config';
import { validateAuth } from '../utils/validation.util';
import { actions } from '../redux/slices/authSlice';
import store from '../redux/store';

/**
 * Profile page component that manages user profile information and updates.
 * 
 * Requirements addressed:
 * - User Profile Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Allows users to update their personal information securely and efficiently.
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Ensures consistent design and theming across the web application.
 * - State Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Implements centralized state management using Redux Toolkit.
 */
const Profile: React.FC = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state: ReturnType<typeof store.getState>) => state.auth);

  // Container styles using theme configuration
  const containerStyles: React.CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: theme.spacing(4),
    backgroundColor: theme.palette.background.default,
    minHeight: '100vh',
  };

  const headerStyles: React.CSSProperties = {
    marginBottom: theme.spacing(4),
    color: theme.palette.text.primary,
    fontFamily: theme.typography.h4.fontFamily,
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
  };

  // Handle profile update success
  const handleProfileUpdateSuccess = (updatedData: any) => {
    if (validateAuth(updatedData)) {
      dispatch(actions.login({
        email: updatedData.email,
        token: authState.token || '',
        role: updatedData.role
      }));
    }
  };

  // Handle profile update error
  const handleProfileUpdateError = (error: Error) => {
    console.error('Profile update failed:', error);
    // Additional error handling logic can be added here
  };

  // Effect to check authentication status
  useEffect(() => {
    if (!authState.isAuthenticated) {
      window.location.href = '/login';
    }
  }, [authState.isAuthenticated]);

  return (
    <div style={containerStyles}>
      <h1 style={headerStyles}>Profile Settings</h1>
      
      {/* Render the profile form with current user data */}
      <ProfileForm
        onSuccess={handleProfileUpdateSuccess}
        onError={handleProfileUpdateError}
      />

      {/* Additional profile sections can be added here */}
      <div style={{ marginTop: theme.spacing(4) }}>
        {/* Profile information display section */}
        <div style={{
          padding: theme.spacing(3),
          backgroundColor: theme.palette.background.paper,
          borderRadius: theme.shape.borderRadius,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            color: theme.palette.text.primary,
            fontSize: theme.typography.h5.fontSize,
            marginBottom: theme.spacing(2)
          }}>
            Account Information
          </h2>
          
          <div style={{
            color: theme.palette.text.secondary,
            fontSize: theme.typography.body1.fontSize
          }}>
            <p>Email: {authState.user}</p>
            <p>Role: {authState.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;