// @testing-library/react version ^13.4.0
import { render, screen, fireEvent, act } from '@testing-library/react';
// jest version ^29.0.0
import { describe, it, expect, beforeEach, jest } from 'jest';
// react-router-dom version ^6.4.0
import { BrowserRouter } from 'react-router-dom';
// react-redux version ^8.1.2
import { Provider } from 'react-redux';

// Internal imports
import Sidebar from './Sidebar';
import store from '../../redux/store';
import { theme } from '../../config/theme.config';
import { mockApiRequest } from '../../utils/test.util';

// Mock the redux store and router hooks
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ pathname: '/' }),
  useNavigate: () => jest.fn(),
}));

describe('Sidebar Component', () => {
  // Test setup helper function
  const renderSidebar = (initialState = {}) => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      </Provider>
    );
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock window resize listener
    global.innerWidth = 1024;
    global.dispatchEvent(new Event('resize'));
  });

  // Test Frontend Design Consistency requirement
  describe('Design System Compliance', () => {
    it('should render with correct theme styling', () => {
      const { container } = renderSidebar();
      
      const sidebar = container.querySelector('[role="navigation"]');
      expect(sidebar).toHaveStyle({
        backgroundColor: theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`,
      });
    });

    it('should display the Estate Kit logo/brand', () => {
      renderSidebar();
      
      const brandTitle = screen.getByText('Estate Kit');
      expect(brandTitle).toBeInTheDocument();
      expect(brandTitle).toHaveStyle({
        color: theme.palette.primary.main,
      });
    });
  });

  // Test Role-based delegate access management requirement
  describe('Role-Based Access Control', () => {
    it('should display correct navigation items for admin role', () => {
      const mockAuthState = {
        role: 'admin',
        user: 'admin@example.com',
      };
      
      jest.spyOn(require('react-redux'), 'useSelector')
        .mockReturnValue(mockAuthState);

      renderSidebar();
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('Delegates')).toBeInTheDocument();
      expect(screen.getByText('Subscription')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should display correct navigation items for delegate role', () => {
      const mockAuthState = {
        role: 'delegate',
        user: 'delegate@example.com',
      };
      
      jest.spyOn(require('react-redux'), 'useSelector')
        .mockReturnValue(mockAuthState);

      renderSidebar();
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.queryByText('Delegates')).not.toBeInTheDocument();
      expect(screen.queryByText('Subscription')).not.toBeInTheDocument();
    });

    it('should display user info with correct role', () => {
      const mockAuthState = {
        role: 'admin',
        user: 'admin@example.com',
      };
      
      jest.spyOn(require('react-redux'), 'useSelector')
        .mockReturnValue(mockAuthState);

      renderSidebar();
      
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
  });

  // Test Responsive Design requirement
  describe('Responsive Design', () => {
    it('should render in mobile mode when viewport width is less than 768px', () => {
      // Set viewport width to mobile size
      global.innerWidth = 767;
      global.dispatchEvent(new Event('resize'));

      const { container } = renderSidebar();
      
      const sidebar = container.querySelector('[role="navigation"]');
      expect(sidebar).toHaveStyle({
        position: 'fixed',
        width: '0',
      });

      const toggleButton = screen.getByRole('button', { name: /open menu/i });
      expect(toggleButton).toBeInTheDocument();
    });

    it('should toggle sidebar visibility on mobile when menu button is clicked', () => {
      // Set viewport width to mobile size
      global.innerWidth = 767;
      global.dispatchEvent(new Event('resize'));

      const { container } = renderSidebar();
      
      const toggleButton = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(toggleButton);

      const sidebar = container.querySelector('[role="navigation"]');
      expect(sidebar).toHaveStyle({
        width: '100%',
      });
    });

    it('should close sidebar when clicking a navigation item on mobile', () => {
      // Set viewport width to mobile size
      global.innerWidth = 767;
      global.dispatchEvent(new Event('resize'));

      const { container } = renderSidebar();
      
      // Open sidebar
      const toggleButton = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(toggleButton);

      // Click a navigation item
      const dashboardLink = screen.getByText('Dashboard');
      fireEvent.click(dashboardLink);

      const sidebar = container.querySelector('[role="navigation"]');
      expect(sidebar).toHaveStyle({
        width: '0',
      });
    });
  });

  // Test Navigation Functionality
  describe('Navigation Functionality', () => {
    it('should highlight active navigation item based on current route', () => {
      jest.spyOn(require('react-router-dom'), 'useLocation')
        .mockReturnValue({ pathname: '/dashboard' });

      renderSidebar();
      
      const activeItem = screen.getByText('Dashboard').closest('div');
      expect(activeItem).toHaveStyle({
        backgroundColor: `${theme.palette.primary.main}10`,
        color: theme.palette.primary.main,
      });
    });

    it('should navigate to correct route when clicking navigation items', () => {
      const mockNavigate = jest.fn();
      jest.spyOn(require('react-router-dom'), 'useNavigate')
        .mockReturnValue(mockNavigate);

      renderSidebar();
      
      const documentsLink = screen.getByText('Documents');
      fireEvent.click(documentsLink);

      expect(mockNavigate).toHaveBeenCalledWith('/documents');
    });
  });

  // Test Accessibility
  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderSidebar();
      
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Main navigation');
      expect(screen.getByRole('button', { name: /menu/i })).toHaveAttribute('aria-label');
    });

    it('should handle keyboard navigation', () => {
      renderSidebar();
      
      const navigationItems = screen.getAllByRole('button');
      navigationItems[0].focus();

      // Test keyboard navigation
      fireEvent.keyDown(document.activeElement || document.body, { key: 'Tab' });
      expect(document.activeElement).toBe(navigationItems[1]);
    });
  });
});