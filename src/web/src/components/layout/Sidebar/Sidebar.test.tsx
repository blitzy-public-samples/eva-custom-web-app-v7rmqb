/**
 * Test Suite for Sidebar Component
 * Version: 1.0.0
 * 
 * Comprehensive tests for navigation functionality, authentication-based rendering,
 * responsive behavior, and accessibility compliance.
 */

import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderWithProviders } from '../../../utils/test.util';
import Sidebar from './Sidebar';

// Constants for testing
const VIEWPORT_SIZES = {
  MOBILE: '320px',
  TABLET: '768px',
  DESKTOP: '1024px'
};

const NAV_ITEMS = {
  AUTHENTICATED: [
    'Dashboard',
    'Documents',
    'Delegates',
    'Subscription',
    'Settings',
    'Help & Support'
  ],
  UNAUTHENTICATED: ['Help & Support']
};

// Mock hooks and functions
const mockNavigate = vi.fn();
const mockOnClose = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' })
}));

// Mock useMediaQuery for responsive testing
const mockUseMediaQuery = vi.fn();
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: () => mockUseMediaQuery()
  };
});

describe('Sidebar Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockOnClose.mockClear();
    mockUseMediaQuery.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication-based rendering', () => {
    it('renders authenticated navigation items when user is authenticated', async () => {
      // Render with authenticated state
      renderWithProviders(
        <Sidebar open={true} onClose={mockOnClose} />,
        {
          initialState: {
            auth: { isAuthenticated: true }
          }
        }
      );

      // Verify all authenticated items are present
      for (const item of NAV_ITEMS.AUTHENTICATED) {
        const navItem = await screen.findByRole('button', { name: new RegExp(item, 'i') });
        expect(navItem).toBeInTheDocument();
      }
    });

    it('renders only public navigation items when user is not authenticated', async () => {
      // Render with unauthenticated state
      renderWithProviders(
        <Sidebar open={true} onClose={mockOnClose} />,
        {
          initialState: {
            auth: { isAuthenticated: false }
          }
        }
      );

      // Verify only public items are present
      for (const item of NAV_ITEMS.UNAUTHENTICATED) {
        const navItem = await screen.findByRole('button', { name: new RegExp(item, 'i') });
        expect(navItem).toBeInTheDocument();
      }

      // Verify authenticated items are not present
      const authenticatedOnly = NAV_ITEMS.AUTHENTICATED.filter(
        item => !NAV_ITEMS.UNAUTHENTICATED.includes(item)
      );
      for (const item of authenticatedOnly) {
        expect(screen.queryByText(item)).not.toBeInTheDocument();
      }
    });
  });

  describe('Responsive behavior', () => {
    it('renders as temporary drawer on mobile', async () => {
      // Mock mobile viewport
      mockUseMediaQuery.mockReturnValue(true);

      renderWithProviders(
        <Sidebar open={true} onClose={mockOnClose} />,
        {
          initialState: {
            auth: { isAuthenticated: true }
          }
        }
      );

      // Verify drawer behavior
      const drawer = screen.getByRole('navigation');
      expect(drawer).toHaveAttribute('aria-label', 'Estate Kit navigation');

      // Test close functionality
      const backdrop = screen.getByRole('presentation');
      await userEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('renders as permanent drawer on desktop', async () => {
      // Mock desktop viewport
      mockUseMediaQuery.mockReturnValue(false);

      renderWithProviders(
        <Sidebar open={true} onClose={mockOnClose} />,
        {
          initialState: {
            auth: { isAuthenticated: true }
          }
        }
      );

      // Verify permanent drawer
      const drawer = screen.getByRole('navigation');
      expect(drawer).toHaveAttribute('aria-label', 'Estate Kit navigation');
      
      // Verify no backdrop on desktop
      expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
    });
  });

  describe('Navigation functionality', () => {
    it('navigates to correct route when item is clicked', async () => {
      renderWithProviders(
        <Sidebar open={true} onClose={mockOnClose} />,
        {
          initialState: {
            auth: { isAuthenticated: true }
          }
        }
      );

      // Test navigation for each item
      const dashboardButton = screen.getByRole('button', { name: /go to dashboard/i });
      await userEvent.click(dashboardButton);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');

      // Verify mobile close behavior
      mockUseMediaQuery.mockReturnValue(true);
      await userEvent.click(dashboardButton);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('handles keyboard shortcuts correctly', async () => {
      renderWithProviders(
        <Sidebar open={true} onClose={mockOnClose} />,
        {
          initialState: {
            auth: { isAuthenticated: true }
          }
        }
      );

      // Simulate keyboard shortcuts
      const event = new KeyboardEvent('keydown', { key: 'D', altKey: true });
      window.dispatchEvent(event);
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Accessibility', () => {
    it('maintains proper focus management', async () => {
      mockUseMediaQuery.mockReturnValue(true);
      renderWithProviders(
        <Sidebar open={true} onClose={mockOnClose} />,
        {
          initialState: {
            auth: { isAuthenticated: true }
          }
        }
      );

      // Test focus trap in modal
      const drawer = screen.getByRole('navigation');
      const focusableElements = within(drawer).getAllByRole('button');
      
      // Simulate tab navigation
      await userEvent.tab();
      expect(focusableElements[0]).toHaveFocus();

      // Tab to last element
      for (let i = 0; i < focusableElements.length; i++) {
        await userEvent.tab();
      }
      expect(focusableElements[focusableElements.length - 1]).toHaveFocus();

      // Tab again should cycle back to first element
      await userEvent.tab();
      expect(focusableElements[0]).toHaveFocus();
    });

    it('provides proper ARIA labels and roles', async () => {
      renderWithProviders(
        <Sidebar open={true} onClose={mockOnClose} />,
        {
          initialState: {
            auth: { isAuthenticated: true }
          }
        }
      );

      // Verify navigation role and label
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Estate Kit navigation');

      // Verify navigation items have proper labels
      const items = within(nav).getAllByRole('button');
      items.forEach(item => {
        expect(item).toHaveAttribute('aria-label');
      });
    });

    it('supports screen reader announcements', async () => {
      renderWithProviders(
        <Sidebar open={true} onClose={mockOnClose} />,
        {
          initialState: {
            auth: { isAuthenticated: true }
          }
        }
      );

      // Verify list structure for screen readers
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();

      // Verify items are properly structured
      const items = within(list).getAllByRole('listitem');
      items.forEach(item => {
        const button = within(item).getByRole('button');
        expect(button).toHaveAttribute('aria-label');
      });
    });
  });
});