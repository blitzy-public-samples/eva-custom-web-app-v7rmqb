// @testing-library/react version ^13.4.0
import { render, screen } from '@testing-library/react';
// @testing-library/jest-dom version ^5.16.5
import '@testing-library/jest-dom';
// react-redux version ^8.1.2
import { Provider } from 'react-redux';
// @mui/material version 5.11.0
import { ThemeProvider } from '@mui/material';

// Internal imports
import MainLayout from './MainLayout';
import { store } from '../../redux/store';
import { theme } from '../../config/theme.config';
import { mockApiRequest } from '../../utils/test.util';

/**
 * Unit tests for MainLayout component
 * 
 * Requirements addressed:
 * - Testing Framework (Technical Specifications/4.5 Development & Deployment/Testing)
 *   Implements unit tests to validate the functionality and rendering of the MainLayout component.
 */

describe('MainLayout Component', () => {
  // Mock child content
  const mockChildContent = 'Test Content';

  // Setup function to render component with required providers
  const renderMainLayout = () => {
    return render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <MainLayout>
            <div>{mockChildContent}</div>
          </MainLayout>
        </ThemeProvider>
      </Provider>
    );
  };

  describe('testMainLayoutRendering', () => {
    it('should render the MainLayout component with all child components', () => {
      renderMainLayout();

      // Verify main layout container is rendered
      const mainLayout = screen.getByRole('application', { name: /estate kit application layout/i });
      expect(mainLayout).toBeInTheDocument();

      // Verify child components are rendered
      expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
      expect(screen.getByRole('complementary')).toBeInTheDocument(); // Sidebar
      expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // Footer
      expect(screen.getByRole('main')).toBeInTheDocument(); // Main content area

      // Verify child content is rendered
      expect(screen.getByText(mockChildContent)).toBeInTheDocument();
    });

    it('should apply correct layout structure and spacing', () => {
      renderMainLayout();

      const mainLayout = screen.getByRole('application');
      const mainContent = screen.getByRole('main');

      // Verify layout styles
      expect(mainLayout).toHaveStyle({
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
      });

      expect(mainContent).toHaveStyle({
        display: 'flex',
        flex: 1,
        paddingTop: theme.spacing(8),
      });
    });
  });

  describe('testMainLayoutThemeIntegration', () => {
    it('should apply theme styles correctly', () => {
      renderMainLayout();

      const mainLayout = screen.getByRole('application');
      
      // Verify theme integration
      expect(mainLayout).toHaveStyle({
        backgroundColor: theme.palette.background.default,
      });

      // Verify container styles
      const container = screen.getByRole('main').querySelector('.MuiContainer-root');
      expect(container).toHaveStyle({
        maxWidth: '1200px', // lg container size
      });
    });

    it('should handle responsive breakpoints correctly', () => {
      renderMainLayout();

      const contentArea = screen.getByRole('main').querySelector('[role="main"]');
      
      // Verify responsive padding
      expect(contentArea).toHaveStyle({
        padding: theme.spacing(3),
      });

      // Mock mobile viewport
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(max-width: 900px)', // md breakpoint
        addListener: jest.fn(),
        removeListener: jest.fn(),
      }));

      // Re-render for mobile view
      renderMainLayout();
      
      expect(contentArea).toHaveStyle({
        padding: theme.spacing(2),
      });
    });
  });

  describe('testMainLayoutApiIntegration', () => {
    beforeEach(() => {
      // Mock API requests
      mockApiRequest({
        url: '/api/user/profile',
        method: 'GET',
        data: { role: 'user' },
      });
    });

    it('should handle API-dependent components correctly', async () => {
      renderMainLayout();

      // Verify Header component with API integration
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();

      // Verify Sidebar component with API integration
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toBeInTheDocument();

      // Wait for API-dependent content to load
      await screen.findByRole('application');
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      mockApiRequest({
        url: '/api/user/profile',
        method: 'GET',
        status: 500,
        data: { error: 'Internal Server Error' },
      });

      renderMainLayout();

      // Verify layout still renders despite API error
      expect(screen.getByRole('application')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });
});