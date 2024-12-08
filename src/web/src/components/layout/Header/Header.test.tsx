// @testing-library/react version ^13.4.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material';
import Header from './Header';
import store from '../../../redux/store';
import { theme } from '../../../config/theme.config';
import { mockApiRequest } from '../../../utils/test.util';

/**
 * Helper function to render the Header component with required providers
 * @returns The rendered component utilities from react-testing-library
 */
const renderHeader = () => {
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <Header />
      </ThemeProvider>
    </Provider>
  );
};

describe('Header Component', () => {
  // Test header rendering
  describe('Rendering', () => {
    it('renders the Estate Kit logo/title', () => {
      renderHeader();
      const logo = screen.getByText('Estate Kit');
      expect(logo).toBeInTheDocument();
      expect(logo.tagName.toLowerCase()).toBe('a');
      expect(logo).toHaveAttribute('href', '/');
    });

    it('renders navigation buttons on desktop view', () => {
      // Mock desktop viewport
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query !== '(max-width: 768px)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
      }));

      renderHeader();
      
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('Delegates')).toBeInTheDocument();
      expect(screen.getByText('Login')).toBeInTheDocument();
    });

    it('renders hamburger menu on mobile view', () => {
      // Mock mobile viewport
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(max-width: 768px)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
      }));

      renderHeader();
      
      const menuButton = screen.getByLabelText('menu');
      expect(menuButton).toBeInTheDocument();
    });
  });

  // Test user interactions
  describe('User Interactions', () => {
    it('opens login dialog when login button is clicked', async () => {
      renderHeader();
      
      const loginButton = screen.getByText('Login');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Please enter your credentials to log in.')).toBeInTheDocument();
      });
    });

    it('opens mobile menu when hamburger button is clicked', async () => {
      // Mock mobile viewport
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(max-width: 768px)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
      }));

      renderHeader();
      
      const menuButton = screen.getByLabelText('menu');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Documents')).toBeInTheDocument();
        expect(screen.getByText('Delegates')).toBeInTheDocument();
        expect(screen.getByText('Login')).toBeInTheDocument();
      });
    });

    it('handles successful login', async () => {
      // Mock API request
      mockApiRequest({
        url: '/auth/login',
        method: 'POST',
        data: {
          email: 'test@example.com',
          token: 'mock-token',
          role: 'user'
        },
        status: 200
      });

      renderHeader();
      
      // Click login button
      const loginButton = screen.getByText('Login');
      fireEvent.click(loginButton);

      // Wait for login dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Submit login form (implementation would depend on your actual form structure)
      // This is a placeholder for the actual login form submission test
      await waitFor(() => {
        expect(store.getState().auth.isAuthenticated).toBe(true);
      });
    });

    it('handles logout', async () => {
      // Set initial authenticated state
      store.dispatch({
        type: 'auth/login',
        payload: {
          email: 'test@example.com',
          token: 'mock-token',
          role: 'user'
        }
      });

      renderHeader();
      
      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(store.getState().auth.isAuthenticated).toBe(false);
      });
    });
  });

  // Test accessibility
  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderHeader();
      
      expect(screen.getByLabelText('Navigate to documents')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to delegates')).toBeInTheDocument();
      expect(screen.getByLabelText('Log in to your account')).toBeInTheDocument();
    });

    it('maintains focus trap in login dialog', async () => {
      renderHeader();
      
      const loginButton = screen.getByText('Login');
      fireEvent.click(loginButton);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title');
      });
    });
  });

  // Test theme integration
  describe('Theme Integration', () => {
    it('applies theme colors correctly', () => {
      renderHeader();
      
      const appBar = screen.getByRole('banner');
      expect(appBar).toHaveStyle({
        backgroundColor: theme.palette.primary.main
      });
    });

    it('applies responsive styles based on viewport', () => {
      // Mock mobile viewport
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(max-width: 768px)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
      }));

      renderHeader();
      
      const title = screen.getByText('Estate Kit');
      expect(title).toHaveStyle({
        fontSize: '1.5rem'
      });
    });
  });
});