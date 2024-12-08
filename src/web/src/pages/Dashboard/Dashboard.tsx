/**
 * Estate Kit - Dashboard Page
 * 
 * Requirements addressed:
 * - Dashboard Overview (Technical Specifications/3.1 User Interface Design/Critical User Flows)
 *   Provides a centralized view of user data, including documents, delegates, and subscription details.
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Ensures consistent design and theming across the web application by using reusable components.
 * - State Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Integrates with custom hooks and Redux to manage state for documents, delegates, and subscriptions.
 */

// React v18.2.0
import React, { useEffect } from 'react';

// Internal imports
import MainLayout from '../components/layout/MainLayout/MainLayout';
import DocumentList from '../components/documents/DocumentList/DocumentList';
import DelegateList from '../components/delegates/DelegateList/DelegateList';
import SubscriptionCard from '../components/subscription/SubscriptionCard/SubscriptionCard';
import useDocument from '../hooks/useDocument';
import useDelegate from '../hooks/useDelegate';
import useSubscription from '../hooks/useSubscription';

// Import theme for consistent styling
import { theme } from '../config/theme.config';

const Dashboard: React.FC = () => {
  // Initialize hooks for data management
  const { documents, loading: documentsLoading, error: documentsError, fetchAllDocuments } = useDocument();
  const { delegates, isLoading: delegatesLoading, error: delegatesError, getDelegatesList } = useDelegate();
  const { subscriptions, loading: subscriptionLoading, error: subscriptionError, fetchSubscription } = useSubscription();

  // Fetch data on component mount
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        await Promise.all([
          fetchAllDocuments(),
          getDelegatesList(),
          fetchSubscription('current') // Fetch current subscription
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadDashboardData();
  }, [fetchAllDocuments, getDelegatesList, fetchSubscription]);

  // Container styles
  const containerStyles: React.CSSProperties = {
    padding: theme.spacing(3),
    maxWidth: '1200px',
    margin: '0 auto'
  };

  // Section styles
  const sectionStyles: React.CSSProperties = {
    marginBottom: theme.spacing(4)
  };

  // Section header styles
  const sectionHeaderStyles: React.CSSProperties = {
    fontSize: theme.typography.h5.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(2)
  };

  return (
    <MainLayout>
      <div style={containerStyles}>
        {/* Page Header */}
        <h1 style={{
          fontSize: theme.typography.h4.fontSize,
          fontWeight: theme.typography.fontWeightBold,
          color: theme.palette.text.primary,
          marginBottom: theme.spacing(4)
        }}>
          Dashboard
        </h1>

        {/* Subscription Section */}
        <section style={sectionStyles}>
          <h2 style={sectionHeaderStyles}>Subscription Status</h2>
          {subscriptionLoading ? (
            <p>Loading subscription details...</p>
          ) : subscriptionError ? (
            <p style={{ color: theme.palette.error.main }}>Error loading subscription: {subscriptionError}</p>
          ) : subscriptions.length > 0 ? (
            <SubscriptionCard
              subscription={subscriptions[0]}
              onRenew={() => {/* Handle subscription renewal */}}
              onCancel={() => {/* Handle subscription cancellation */}}
            />
          ) : (
            <p>No active subscription found.</p>
          )}
        </section>

        {/* Documents Section */}
        <section style={sectionStyles}>
          <h2 style={sectionHeaderStyles}>Recent Documents</h2>
          {documentsLoading ? (
            <p>Loading documents...</p>
          ) : documentsError ? (
            <p style={{ color: theme.palette.error.main }}>Error loading documents: {documentsError}</p>
          ) : (
            <DocumentList />
          )}
        </section>

        {/* Delegates Section */}
        <section style={sectionStyles}>
          <h2 style={sectionHeaderStyles}>Active Delegates</h2>
          {delegatesLoading ? (
            <p>Loading delegates...</p>
          ) : delegatesError ? (
            <p style={{ color: theme.palette.error.main }}>Error loading delegates: {delegatesError}</p>
          ) : (
            <DelegateList />
          )}
        </section>
      </div>
    </MainLayout>
  );
};

export default Dashboard;