/**
 * Main Layout Component
 * Version: 1.0.0
 * 
 * Implements the core application layout with enhanced accessibility features,
 * responsive design, and senior-friendly interface elements.
 * 
 * @package react ^18.2.0
 * @package @mui/material ^5.11.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Box, styled, useMediaQuery, useTheme } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import { Header } from '../Header/Header';
import Footer from '../Footer/Footer';
import Sidebar from '../Sidebar/Sidebar';
import { useAuth } from '../../../hooks/useAuth';

// Enhanced styled components with accessibility improvements
const LayoutContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: 'var(--color-background)',
  position: 'relative',
  // Enhanced focus indicators for accessibility
  '&:focus-visible': {
    outline: '3px solid var(--color-primary)',
    outlineOffset: '2px',
  },
});

const MainContent = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(3),
  paddingTop: '84px',
  position: 'relative',
  minHeight: 'calc(100vh - 64px)',
  width: '100%',
  marginLeft: 0,
  transition: 'margin-left 225ms cubic-bezier(0.4, 0, 0.6, 1) 0ms, padding 225ms cubic-bezier(0.4, 0, 0.6, 1) 0ms',
  
  [theme.breakpoints.up('sm')]: {
    marginLeft: '280px',
  },

  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    paddingTop: '76px',
    marginLeft: 0,
  }
}));

// Interface definitions
interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
  testId?: string;
}

const DRAWER_WIDTH = '280px';
const MOBILE_DRAWER_WIDTH = '100%';
const TRANSITION_DURATION = 225;
/**
 * Error fallback component with senior-friendly error message
 */
const ErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <Box
    role="alert"
    sx={{
      padding: 3,
      margin: 3,
      backgroundColor: 'var(--color-error-light)',
      borderRadius: 'var(--border-radius-md)',
      color: 'var(--color-text)',
    }}
  >
    <h2>We're sorry, something went wrong</h2>
    <p>Please try refreshing the page or contact support if the problem persists.</p>
    <p>Error details: {error.message}</p>
  </Box>
);

/**
 * MainLayout component implementing core application structure with
 * enhanced accessibility and senior-friendly features.
 */
export const MainLayout: React.FC<MainLayoutProps> = React.memo(({
  children,
  className,
  testId = 'main-layout'
}) => {
  const { isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Handle sidebar toggle with analytics tracking
  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
    // Log interaction for analytics
    console.info('Sidebar toggle:', {
      timestamp: new Date().toISOString(),
      newState: !sidebarOpen,
      viewport: isMobile ? 'mobile' : 'desktop'
    });
  }, [sidebarOpen, isMobile]);

  // Update sidebar state on viewport changes
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.altKey && event.key === 'm') {
        event.preventDefault();
        handleSidebarToggle();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleSidebarToggle]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <LayoutContainer 
        className={className}
        data-testid={testId}
        role="main"
      >
        <Header
          onMenuToggle={handleSidebarToggle}
          ariaLabel="Main navigation header"
        />

        {isAuthenticated && (
          <Box component="nav" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Sidebar
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
          </Box>
        )}

        <MainContent
          role="main"
          aria-label="Main content"
          sx={{
            marginLeft: {
              xs: 0,
              sm: isAuthenticated ? DRAWER_WIDTH : 0
            },
            width: {
              xs: '100%',
              sm: isAuthenticated ? `calc(100% - ${DRAWER_WIDTH})` : '100%'
            }
          }}
        >
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            {children}
          </ErrorBoundary>
        </MainContent>

        <Box sx={{
          marginLeft: {
            xs: 0,
            sm: isAuthenticated ? DRAWER_WIDTH : 0
          },
          width: {
            xs: '100%',
            sm: isAuthenticated ? `calc(100% - ${DRAWER_WIDTH})` : '100%'
          }
        }}>
          <Footer ariaLabel="Site footer" />
        </Box>

      </LayoutContainer>
    </ErrorBoundary>
  );
});

MainLayout.displayName = 'MainLayout';

export type { MainLayoutProps };