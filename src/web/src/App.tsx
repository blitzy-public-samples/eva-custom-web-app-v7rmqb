/**
 * Root Application Component
 * Version: 1.0.0
 * 
 * Implements secure application initialization with enhanced authentication,
 * accessibility features, and comprehensive error handling for Estate Kit.
 * 
 * @package react ^18.2.0
 * @package @mui/material ^5.11.0
 * @package @auth0/auth0-react ^2.0.0
 */

import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Auth0Provider } from '@auth0/auth0-react';
import { ErrorBoundary } from 'react-error-boundary';
import { AppRoutes } from './routes';
import { MainLayout } from './components/layout/MainLayout/MainLayout';
import { store } from './redux/store';
import { createAppTheme } from './config/theme.config';
import { AUTH0_SCOPE, auth0Config } from './config/auth.config';

// Error fallback component with accessibility support
const ErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div 
    role="alert" 
    aria-live="assertive" 
    className="error-boundary"
    style={{
      padding: '2rem',
      margin: '2rem',
      border: '2px solid var(--color-error)',
      borderRadius: 'var(--border-radius-md)',
      backgroundColor: 'var(--color-error-light)'
    }}
  >
    <h2>We apologize for the inconvenience</h2>
    <p>Something went wrong with the application. Please try refreshing the page.</p>
    <p>If the problem persists, please contact our support team.</p>
    <pre style={{ marginTop: '1rem' }}>{error.message}</pre>
    <button 
      onClick={() => window.location.reload()}
      style={{
        padding: '0.5rem 1rem',
        marginTop: '1rem',
        backgroundColor: 'var(--color-primary)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--border-radius-sm)',
        cursor: 'pointer'
      }}
    >
      Refresh Page
    </button>
  </div>
);

/**
 * Root application component implementing secure initialization
 * and enhanced accessibility features
 */
const App: React.FC = () => {
  const [theme, setTheme] = useState(createAppTheme());

  useEffect(() => {
    // Update theme after DOM is loaded to ensure CSS variables are available
    setTheme(createAppTheme());
  }, []);

  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onError={(error) => {
        console.error('Application Error:', error);
      }}
    >
      <Auth0Provider
        domain={auth0Config.domain}
        clientId={auth0Config.clientId}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: auth0Config.audience,
          scope: AUTH0_SCOPE
        }}
        cacheLocation="memory"
        useRefreshTokens={true}
      >
        <Provider store={store}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <MainLayout>
              <AppRoutes />
            </MainLayout>
          </ThemeProvider>
        </Provider>
      </Auth0Provider>
    </ErrorBoundary>
  );
};

export default App;