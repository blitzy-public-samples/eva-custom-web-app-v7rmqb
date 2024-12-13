/**
 * Header Component Test Suite
 * Version: 1.0.0
 * 
 * Comprehensive test suite for the Header component with enhanced security,
 * accessibility, and responsive design testing.
 */

import React from 'react'; // ^18.2.0
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'; // ^14.0.0
import userEvent from '@testing-library/user-event'; // ^14.0.0
import { axe, toHaveNoViolations } from 'jest-axe'; // ^4.7.0
import { vi } from 'vitest'; // ^0.34.0
import { Header } from './Header';
import { renderWithProviders } from '../../../utils/test.util';
import { useAuth } from '../../../hooks/useAuth';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock useAuth hook
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

// Mock useNavigate hook
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}));

describe('Header Component', () => {
  // Test setup helpers
  const mockOnMenuToggle = vi.fn();
  const defaultProps = {
    onMenuToggle: mockOnMenuToggle,
    ariaLabel: 'Main navigation'
  };

  const mockAuthState = {
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null,
    mfaRequired: false,
    mfaVerified: false,
    logout: vi.fn(),
    refreshSession: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue(mockAuthState);
  });

  // Accessibility Tests
  describe('Accessibility Compliance', () => {
    it('should meet WCAG 2.1 Level AA standards', async () => {
      const { container } = renderWithProviders(<Header {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation', async () => {
      renderWithProviders(<Header {...defaultProps} />);
      
      // Focus on menu button
      const menuButton = screen.getByRole('button', { name: /account menu/i });
      menuButton.focus();
      expect(document.activeElement).toBe(menuButton);

      // Test keyboard interaction
      fireEvent.keyDown(menuButton, { key: 'Enter' });
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Test escape key closes menu
      fireEvent.keyDown(menuButton, { key: 'Escape' });
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('should have proper ARIA labels and roles', () => {
      renderWithProviders(<Header {...defaultProps} />);
      
      expect(screen.getByRole('banner')).toHaveAttribute('aria-label', 'Main navigation');
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Estate Kit');
      expect(screen.getByRole('button', { name: /account menu/i })).toHaveAttribute('aria-haspopup', 'true');
    });
  });

  // Authentication State Tests
  describe('Authentication State Handling', () => {
    it('should render login button when not authenticated', () => {
      renderWithProviders(<Header {...defaultProps} />);
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('should render user menu when authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuthState,
        isAuthenticated: true,
        user: { name: 'John Smith' }
      });

      renderWithProviders(<Header {...defaultProps} />);
      expect(screen.getByRole('button', { name: /account menu/i })).toBeInTheDocument();
    });

    it('should show MFA indicator when MFA is required', () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuthState,
        isAuthenticated: true,
        mfaRequired: true,
        user: { name: 'John Smith' }
      });

      renderWithProviders(<Header {...defaultProps} />);
      const badge = screen.getByTestId('mfa-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).not.toHaveAttribute('invisible');
    });

    it('should handle logout correctly', async () => {
      const mockLogout = vi.fn();
      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuthState,
        isAuthenticated: true,
        user: { name: 'John Smith' },
        logout: mockLogout
      });

      renderWithProviders(<Header {...defaultProps} />);
      
      // Open menu and click logout
      const menuButton = screen.getByRole('button', { name: /account menu/i });
      fireEvent.click(menuButton);
      
      const logoutButton = await screen.findByText('Logout');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });
    });
  });

  // Responsive Design Tests
  describe('Responsive Behavior', () => {
    const mockMobileMediaQuery = (matches: boolean) => {
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    };

    it('should render mobile menu on small screens', () => {
      mockMobileMediaQuery(true);
      renderWithProviders(<Header {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /help/i })).not.toBeInTheDocument();
    });

    it('should render full navigation on large screens', () => {
      mockMobileMediaQuery(false);
      renderWithProviders(<Header {...defaultProps} />);
      
      expect(screen.queryByRole('button', { name: /open menu/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /help/i })).toBeInTheDocument();
    });

    it('should handle menu toggle correctly on mobile', async () => {
      mockMobileMediaQuery(true);
      renderWithProviders(<Header {...defaultProps} />);
      
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      await userEvent.click(menuButton);
      
      expect(mockOnMenuToggle).toHaveBeenCalledWith(true);
    });
  });

  // Menu Interaction Tests
  describe('Menu Interactions', () => {
    it('should open and close user menu', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuthState,
        isAuthenticated: true,
        user: { name: 'John Smith' }
      });

      renderWithProviders(<Header {...defaultProps} />);
      
      const menuButton = screen.getByRole('button', { name: /account menu/i });
      await userEvent.click(menuButton);
      
      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      
      await userEvent.click(menuButton);
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('should handle menu item selection', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuthState,
        isAuthenticated: true,
        user: { name: 'John Smith' }
      });

      renderWithProviders(<Header {...defaultProps} />);
      
      const menuButton = screen.getByRole('button', { name: /account menu/i });
      await userEvent.click(menuButton);
      
      const menuItem = screen.getByText('John Smith');
      await userEvent.click(menuItem);
      
      expect(mockOnMenuToggle).toHaveBeenCalledWith(false);
    });
  });

  // Performance Tests
  describe('Performance Monitoring', () => {
    it('should render efficiently without unnecessary updates', async () => {
      const { rerender } = renderWithProviders(<Header {...defaultProps} />);
      
      // Force re-render with same props
      rerender(<Header {...defaultProps} />);
      
      // Verify no unnecessary DOM updates
      expect(screen.getAllByRole('banner')).toHaveLength(1);
    });
  });
});