/**
 * Dashboard Component
 * Version: 1.0.0
 * 
 * Main dashboard page component providing a senior-friendly overview of estate planning status,
 * including documents, delegates, and subscription information with enhanced accessibility
 * and real-time updates.
 * 
 * @package react ^18.2.0
 * @package @mui/material ^5.11.0
 */

import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { 
  Grid, 
  Typography, 
  Box, 
  Button, 
  CircularProgress,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Internal component imports
import { MainLayout } from '../../components/layout/MainLayout/MainLayout';
import { DocumentCard } from '../../components/documents/DocumentCard/DocumentCard';
import { DelegateCard } from '../../components/delegates/DelegateCard/DelegateCard';
import { SubscriptionCard } from '../../components/subscription/SubscriptionCard/SubscriptionCard';
import { useAuth } from '../../hooks/useAuth';
import { Document } from '../../types/document.types';
import { Delegate } from '../../types/delegate.types';
import { ISubscription, SubscriptionPlan, SubscriptionStatus, BillingCycle } from '../../types/subscription.types';

// Interface for component props
interface DashboardProps {
  onError?: (error: Error) => void;
}

/**
 * Enhanced dashboard component with comprehensive estate planning overview
 * and senior-friendly interface elements
 */
const Dashboard: React.FC<DashboardProps> = React.memo(({ onError }) => {
  // Hooks initialization
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Local state management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [subscription, setSubscription] = useState<ISubscription | null>(null);

  // Fetch dashboard data with error handling
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulated API calls - replace with actual API service calls
      const documentsData: Document[] = [];
      const delegatesData: Delegate[] = [];
      const subscriptionData: ISubscription = {
        id: 'sub_123',
        userId: user?.id || '',
        plan: SubscriptionPlan.PREMIUM,
        status: SubscriptionStatus.ACTIVE,
        autoRenew: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        lastBillingDate: new Date(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        billingCycle: BillingCycle.MONTHLY,
        features: ['unlimited_storage', 'priority_support'],
        price: 19.99,
        shopifySubscriptionId: '',
        shopifyCustomerId: ''
      };

      setDocuments(documentsData);
      setDelegates(delegatesData);
      setSubscription(subscriptionData);

    } catch (err) {
      const errorMessage = 'Failed to load dashboard data. Please try again.';
      setError(errorMessage);
      onError?.(new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [onError, user]);

  // Initial data load
  useEffect(() => {
    console.log('isAuthenticated', user);
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, fetchDashboardData]);

  // Memoized subscription plan details
  const planDetails = useMemo(() => ({
    name: 'Premium Plan',
    price: 19.99,
    description: 'Full access to all Estate Kit features including unlimited document storage and delegate management.'
  }), []);

  // Navigation handlers
  const handleDocumentUpload = useCallback(() => {
    navigate('/documents/upload');
  }, [navigate]);

  const handleDelegateAdd = useCallback(() => {
    navigate('/delegates/add');
  }, [navigate]);

  const handleSubscriptionManage = useCallback(() => {
    navigate('/subscription/manage');
  }, [navigate]);

  // Loading state
  if (authLoading || loading) {
    return (
      <Box>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="50vh"
          role="status"
          aria-label="Loading dashboard"
        >
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading your dashboard...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box>
        <Alert 
          severity="error"
          sx={{ mb: 3, fontSize: '1.1rem' }}
          role="alert"
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box component="main" sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Welcome Section */}
      <Box mb={4}>
        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontSize: { xs: '2rem', md: '2.5rem' },
            fontWeight: 700,
            mb: 2,
            color: 'text.primary'
          }}
        >
          Welcome back, {user?.name}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: '1.1rem', md: '1.2rem' },
            color: 'text.secondary',
            maxWidth: '800px',
            lineHeight: 1.6
          }}
        >
          Your estate planning dashboard provides a secure overview of your documents,
          delegates, and subscription status. Keep your information up to date for
          peace of mind.
        </Typography>
      </Box>

      {/* Main Dashboard Grid */}
      <Grid container spacing={{ xs: 3, md: 4 }}>
        {/* Documents Section */}
        <Grid item xs={12} md={6}>
          <Box 
            mb={4}
            sx={{
              backgroundColor: 'background.paper',
              borderRadius: 2,
              p: 3,
              boxShadow: 1
            }}
          >
            <Typography
              variant="h2"
              component="h2"
              sx={{
                fontSize: { xs: '1.5rem', md: '1.8rem' },
                fontWeight: 600,
                mb: 3
              }}
            >
              Recent Documents
            </Typography>
            {documents.length > 0 ? (
              documents.slice(0, 3).map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  className="dashboard-card"
                />
              ))
            ) : (
              <Typography
                variant="body1"
                sx={{ 
                  fontSize: '1.1rem', 
                  mb: 2,
                  color: 'text.secondary',
                  textAlign: 'center',
                  py: 4
                }}
              >
                No documents uploaded yet.
              </Typography>
            )}
            <Button
              variant="contained"
              onClick={handleDocumentUpload}
              size="large"
              sx={{ 
                mt: 2,
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Upload New Document
            </Button>
          </Box>
        </Grid>

        {/* Delegates Section */}
        <Grid item xs={12} md={6}>
          <Box 
            mb={4}
            sx={{
              backgroundColor: 'background.paper',
              borderRadius: 2,
              p: 3,
              boxShadow: 1
            }}
          >
            <Typography
              variant="h2"
              component="h2"
              sx={{
                fontSize: { xs: '1.5rem', md: '1.8rem' },
                fontWeight: 600,
                mb: 3
              }}
            >
              Active Delegates
            </Typography>
            {delegates.length > 0 ? (
              delegates.slice(0, 3).map((delegate) => (
                <DelegateCard
                  key={delegate.id}
                  delegate={delegate}
                  className="dashboard-card"
                />
              ))
            ) : (
              <Typography
                variant="body1"
                sx={{ 
                  fontSize: '1.1rem', 
                  mb: 2,
                  color: 'text.secondary',
                  textAlign: 'center',
                  py: 4
                }}
              >
                No delegates added yet.
              </Typography>
            )}
            <Button
              variant="contained"
              onClick={handleDelegateAdd}
              size="large"
              sx={{ 
                mt: 2,
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Add New Delegate
            </Button>
          </Box>
        </Grid>

        {/* Subscription Section */}
        <Grid item xs={12}>
          {subscription && (
            <Box sx={{ mb: 4 }}>
              <SubscriptionCard
                subscription={subscription}
                planDetails={planDetails}
                onManage={handleSubscriptionManage}
                className="dashboard-card"
              />
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
});

Dashboard.displayName = 'Dashboard';

export type { DashboardProps };
export default Dashboard;