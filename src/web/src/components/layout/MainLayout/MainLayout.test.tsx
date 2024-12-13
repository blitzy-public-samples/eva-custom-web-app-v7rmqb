/**
 * Test Suite for MainLayout Component
 * Version: 1.0.0
 * 
 * Implements comprehensive testing for the core application layout including:
 * - Layout structure and integration
 * - Responsive behavior
 * - Accessibility compliance
 * - Error handling
 * - Performance monitoring
 */

import React from 'react'; // v18.2.0
import { screen, fireEvent, waitFor, within } from '@testing-library/react'; // v14.0.0
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'; // v29.0.0
import { axe, toHaveNoViolations } from 'jest-axe'; // v4.7.0
import { MainLayout } from './MainLayout';
import { renderWithProviders } from '../../../utils/test.util';

// Mock Material UI hooks
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: jest.fn(),
  useTheme: jest.fn(() => ({
    breakpoints: {
      down: jest.fn()
    }
  }))
}));

// Mock authentication hook
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    isAuthenticated: true
  }))
}));

// Mock performance monitoring
const mockPerformanceObserver = jest.fn();
window.PerformanceObserver = mockPerformanceObserver;

describe('MainLayout', () => {
  // Setup and teardown
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Layout Structure', () => {
    it('renders all core layout components', () => {
      renderWithProviders(
        <MainLayout>
          <div data-testid="test-content">Content</div>
        </MainLayout>
      );

      // Verify core structure
      expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
      expect(screen.getByRole('navigation')).toBeInTheDocument(); // Sidebar
      expect(screen.getByRole('main')).toBeInTheDocument(); // Main content
      expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // Footer
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });

    it('integrates child components correctly', () => {
      const TestChild = () => <div data-testid="test-child">Child Component</div>;
      
      renderWithProviders(
        <MainLayout>
          <TestChild />
        </MainLayout>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(screen.getByText('Child Component')).toBeInTheDocument();
    });

    it('maintains proper layout hierarchy', () => {
      renderWithProviders(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      const mainLayout = screen.getByTestId('main-layout');
      const header = within(mainLayout).getByRole('banner');
      const main = within(mainLayout).getByRole('main');

      expect(header).toBeInTheDocument();
      expect(main).toBeInTheDocument();
      expect(header.compareDocumentPosition(main)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });
  });

  describe('Responsive Behavior', () => {
    it('adapts to mobile viewport', async () => {
      // Mock mobile viewport
      const useMediaQuery = require('@mui/material').useMediaQuery;
      useMediaQuery.mockReturnValue(true); // isMobile = true

      renderWithProviders(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      // Verify mobile layout
      expect(screen.queryByRole('navigation')).not.toBeVisible();
      
      // Test menu toggle
      const menuButton = screen.getByLabelText('Main navigation header');
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeVisible();
      });
    });

    it('adapts to tablet viewport', () => {
      // Mock tablet viewport
      const useMediaQuery = require('@mui/material').useMediaQuery;
      useMediaQuery.mockReturnValue(false); // isMobile = false

      renderWithProviders(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      // Verify tablet layout
      expect(screen.getByRole('navigation')).toBeVisible();
      expect(screen.getByRole('main')).toHaveStyle({
        marginLeft: '280px' // Sidebar width
      });
    });

    it('handles window resize events', async () => {
      const useMediaQuery = require('@mui/material').useMediaQuery;
      useMediaQuery.mockReturnValue(false);

      renderWithProviders(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      // Simulate resize to mobile
      useMediaQuery.mockReturnValue(true);
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(screen.getByRole('navigation')).not.toBeVisible();
      });
    });
  });

  describe('Accessibility', () => {
    it('meets WCAG 2.1 Level AA standards', async () => {
      const { container } = renderWithProviders(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('implements proper keyboard navigation', () => {
      renderWithProviders(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      const layout = screen.getByTestId('main-layout');
      
      // Test keyboard navigation
      layout.focus();
      fireEvent.keyDown(layout, { key: 'Tab' });
      
      expect(document.activeElement).toHaveAttribute('role', 'banner');
    });

    it('provides proper ARIA landmarks', () => {
      renderWithProviders(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      expect(screen.getByRole('banner')).toHaveAttribute('aria-label', 'Main navigation header');
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Main navigation');
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Main content');
    });
  });

  describe('Error Handling', () => {
    it('catches and displays errors gracefully', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      renderWithProviders(
        <MainLayout>
          <ErrorComponent />
        </MainLayout>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('preserves layout structure during errors', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      renderWithProviders(
        <MainLayout>
          <ErrorComponent />
        </MainLayout>
      );

      // Verify core layout remains intact
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('monitors layout shift metrics', () => {
      renderWithProviders(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      expect(mockPerformanceObserver).toHaveBeenCalled();
    });

    it('efficiently handles sidebar toggle', async () => {
      const useMediaQuery = require('@mui/material').useMediaQuery;
      useMediaQuery.mockReturnValue(true);

      renderWithProviders(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      const startTime = performance.now();
      const menuButton = screen.getByLabelText('Main navigation header');
      
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeVisible();
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Max 100ms response time
    });
  });
});