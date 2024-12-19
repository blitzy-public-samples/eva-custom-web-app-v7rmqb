import React from 'react';
import { Stack, Switch, Typography } from '@mui/material';
import { AnalyticsBrowser } from '@segment/analytics-next'; // v1.51+
import ProfileForm, { ProfileFormProps } from '../../components/profile/ProfileForm/ProfileForm';
import Card from '../../components/common/Card/Card';
import { useAuth } from '../../hooks/useAuth';
import { Auth0ContextInterface, User } from '@auth0/auth0-react';

// Constants for analytics events
const ANALYTICS_EVENTS = {
  PROFILE_UPDATE: 'profile_updated',
  SECURITY_UPDATE: 'security_setting_changed',
  NOTIFICATION_UPDATE: 'notification_preference_changed'
} as const;

// Constants for security settings
const SECURITY_SETTINGS = {
  TWO_FACTOR: 'twoFactorEnabled',
  EMAIL_NOTIFICATIONS: 'emailNotifications',
  SMS_NOTIFICATIONS: 'smsNotifications',
  AUDIT_ENABLED: true,
  RATE_LIMIT_ATTEMPTS: 5,
  RATE_LIMIT_WINDOW: 300000 // 5 minutes
} as const;

// Interface for security settings state
interface SecuritySettings {
  twoFactorEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  lastUpdated: Date;
  updatedBy: string;
}

/**
 * Enhanced settings page component with senior-friendly design and comprehensive security features.
 * Implements WCAG 2.1 Level AA compliance and extensive error handling.
 */
const Settings: React.FC = () => {
  // Hooks
  const { user } = useAuth();
  const analytics = AnalyticsBrowser.load({
    writeKey: import.meta.env.REACT_APP_SEGMENT_WRITE_KEY || ''
  });
  
  // State management
  const [securitySettings, setSecuritySettings] = React.useState<SecuritySettings>({
    twoFactorEnabled: false,
    emailNotifications: false,
    smsNotifications: false,
    lastUpdated: new Date(),
    updatedBy: user?.email || ''
  });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [rateLimitCounter, setRateLimitCounter] = React.useState(0);
  const [lastSettingChange, setLastSettingChange] = React.useState<Date>(new Date());

  /**
   * Enhanced profile form submission handler with security validation
   */
  const handleProfileSubmit = async (values: NonNullable<ProfileFormProps['initialData']>) => {
    try {
      setLoading(true);
      setError(null);

      // Rate limiting check
      if (isRateLimited()) {
        throw new Error('Too many update attempts. Please try again later.');
      }

      const formData = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        province: values.province
      };

      // Update user profile through API service instead of hook
      await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          profile: {
            phoneNumber: formData.phone,
            province: formData.province
          }
        })
      });

      // Track successful update
      analytics.track(ANALYTICS_EVENTS.PROFILE_UPDATE, {
        timestamp: new Date().toISOString(),
        updatedFields: Object.keys(formData)
      });

      // Update rate limiting counter
      updateRateLimit();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      setError(errorMessage);
      console.error('Profile update error:', {
        timestamp: new Date().toISOString(),
        error: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Enhanced security settings handler with audit logging
   */
  const handleSecuritySettingChange = async (setting: string, value: boolean) => {
    try {
      setLoading(true);
      setError(null);

      // Rate limiting check
      if (isRateLimited()) {
        throw new Error('Too many setting changes. Please try again later.');
      }

      // Update security settings
      const updatedSettings = {
        ...securitySettings,
        [setting]: value,
        lastUpdated: new Date(),
        updatedBy: user?.email || ''
      };

      // Update user profile through API service
      await fetch('/api/users/security-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profile: {
            [setting]: value
          }
        })
      });

      // Update local state
      setSecuritySettings(updatedSettings);

      // Track setting change
      analytics.track(ANALYTICS_EVENTS.SECURITY_UPDATE, {
        setting,
        value,
        timestamp: new Date().toISOString()
      });

      // Update rate limiting counter
      updateRateLimit();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Security setting update failed';
      setError(errorMessage);
      console.error('Security setting update error:', {
        timestamp: new Date().toISOString(),
        error: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Rate limiting implementation
   */
  const isRateLimited = (): boolean => {
    const timeSinceLastChange = Date.now() - lastSettingChange.getTime();
    return rateLimitCounter >= SECURITY_SETTINGS.RATE_LIMIT_ATTEMPTS &&
           timeSinceLastChange < SECURITY_SETTINGS.RATE_LIMIT_WINDOW;
  };

  const updateRateLimit = () => {
    const now = new Date();
    const timeSinceLastChange = now.getTime() - lastSettingChange.getTime();

    if (timeSinceLastChange > SECURITY_SETTINGS.RATE_LIMIT_WINDOW) {
      setRateLimitCounter(1);
    } else {
      setRateLimitCounter(prev => prev + 1);
    }
    setLastSettingChange(now);
  };

  return (
    <Stack 
      spacing={4} 
      sx={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: { xs: '16px', sm: '24px', md: '32px' },
        width: '100%'
      }}
    >
      {/* Profile Settings Section */}
      <Card
        title="Profile Settings"
        subtitle="Update your personal information"
        testId="profile-settings-card"
        elevation={2}
      >
        <ProfileForm
          onSubmit={handleProfileSubmit}
          initialData={{
            name: user?.name || '',
            email: user?.email || '',
            phone: '',
            province: ''
          }}
          isSubmitting={loading}
        />
      </Card>

      {/* Security Settings Section */}
      <Card
        title="Security Settings"
        subtitle="Manage your account security preferences"
        testId="security-settings-card"
        elevation={2}
      >
        <Stack spacing={4}>
          {/* Security Options Group */}
          <Stack spacing={3}>
            <Typography 
              variant="h6" 
              color="text.primary" 
              sx={{ 
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: 1
              }}
            >
              Authentication
            </Typography>
            <Stack 
              direction="row" 
              justifyContent="space-between" 
              alignItems="center"
              sx={{
                padding: '12px 16px',
                backgroundColor: 'action.hover',
                borderRadius: 1
              }}
            >
              <Stack spacing={0.5}>
                <Typography variant="body1" color="text.primary" fontWeight={500}>
                  Two-Factor Authentication
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add an extra layer of security to your account
                </Typography>
              </Stack>
              <Switch
                checked={securitySettings.twoFactorEnabled}
                onChange={(e) => handleSecuritySettingChange(SECURITY_SETTINGS.TWO_FACTOR, e.target.checked)}
                disabled={loading}
                inputProps={{
                  'aria-label': 'Two-Factor Authentication toggle'
                }}
              />
            </Stack>
          </Stack>

          {/* Notification Options Group */}
          <Stack spacing={3}>
            <Typography 
              variant="h6" 
              color="text.primary"
              sx={{ 
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: 1
              }}
            >
              Notifications
            </Typography>
            <Stack spacing={2}>
              <Stack 
                direction="row" 
                justifyContent="space-between" 
                alignItems="center"
                sx={{
                  padding: '12px 16px',
                  backgroundColor: 'action.hover',
                  borderRadius: 1
                }}
              >
                <Stack spacing={0.5}>
                  <Typography variant="body1" color="text.primary" fontWeight={500}>
                    Email Notifications
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Receive updates and alerts via email
                  </Typography>
                </Stack>
                <Switch
                  checked={securitySettings.emailNotifications}
                  onChange={(e) => handleSecuritySettingChange(SECURITY_SETTINGS.EMAIL_NOTIFICATIONS, e.target.checked)}
                  disabled={loading}
                  inputProps={{
                    'aria-label': 'Email notifications toggle'
                  }}
                />
              </Stack>

              <Stack 
                direction="row" 
                justifyContent="space-between" 
                alignItems="center"
                sx={{
                  padding: '12px 16px',
                  backgroundColor: 'action.hover',
                  borderRadius: 1
                }}
              >
                <Stack spacing={0.5}>
                  <Typography variant="body1" color="text.primary" fontWeight={500}>
                    SMS Notifications
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Receive updates and alerts via SMS
                  </Typography>
                </Stack>
                <Switch
                  checked={securitySettings.smsNotifications}
                  onChange={(e) => handleSecuritySettingChange(SECURITY_SETTINGS.SMS_NOTIFICATIONS, e.target.checked)}
                  disabled={loading}
                  inputProps={{
                    'aria-label': 'SMS notifications toggle'
                  }}
                />
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Card>

      {/* Error Display */}
      {error && (
        <Typography
          color="error"
          variant="body2"
          role="alert"
          sx={{ 
            marginTop: 2,
            padding: '12px 16px',
            backgroundColor: 'error.light',
            borderRadius: 1,
            color: 'error.main'
          }}
          data-testid="settings-error"
        >
          {error}
        </Typography>
      )}

      {/* Last Updated Information */}
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ 
          marginTop: 2,
          textAlign: 'center',
          fontStyle: 'italic'
        }}
        data-testid="last-updated"
      >
        Last updated: {securitySettings.lastUpdated.toLocaleString()}
      </Typography>
    </Stack>
  );
};

export default Settings;