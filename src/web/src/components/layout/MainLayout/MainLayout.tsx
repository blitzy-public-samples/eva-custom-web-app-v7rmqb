/**
 * Estate Kit - Main Layout Component
 * 
 * Requirements addressed:
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Implements consistent layout and theming across the web application
 * - Responsive Design (Technical Specifications/3.1 User Interface Design/Responsive Breakpoints)
 *   Provides responsive layout that adapts to different screen sizes
 * - Accessibility Compliance (Technical Specifications/3.1 User Interface Design/Accessibility)
 *   Ensures layout is accessible and meets WCAG 2.1 Level AA standards
 */

// External dependencies
// @mui/material version 5.11.0
import { Box, Container } from '@mui/material';
import React, { ReactNode } from 'react';

// Internal dependencies
import { theme, palette, typography } from '../../../config/theme.config';
import Header from '../Header/Header';
import Sidebar from '../Sidebar/Sidebar';
import Footer from '../Footer/Footer';

// Import styles
import '../../../styles/global.css';
import '../../../styles/variables.css';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // Layout container styles
  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: theme.palette.background.default,
  };

  // Main content wrapper styles
  const mainStyles = {
    display: 'flex',
    flex: 1,
    paddingTop: theme.spacing(8), // Account for fixed header height
  };

  // Content area styles
  const contentStyles = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(3),
    overflow: 'auto',
    [theme.breakpoints.down('md')]: {
      padding: theme.spacing(2),
    },
  };

  return (
    <Box
      sx={containerStyles}
      component="div"
      role="application"
      aria-label="Estate Kit Application Layout"
    >
      {/* Header Component */}
      <Header />

      {/* Main Content Area */}
      <Box sx={mainStyles} component="main">
        {/* Sidebar Component */}
        <Sidebar />

        {/* Content Container */}
        <Box
          sx={contentStyles}
          component="div"
          role="main"
          aria-label="Main Content"
        >
          <Container
            maxWidth="lg"
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {children}
          </Container>
        </Box>
      </Box>

      {/* Footer Component */}
      <Footer />
    </Box>
  );
};

export default MainLayout;