/**
 * Dialog Component Tests
 * 
 * Human Tasks:
 * 1. Verify test coverage meets minimum threshold requirements
 * 2. Review accessibility test cases with UX team
 * 3. Validate dialog animations with motion sensitivity requirements
 * 4. Test keyboard navigation patterns across different browsers
 */

// @testing-library/react version ^13.4.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// @testing-library/jest-dom version ^5.16.5
import '@testing-library/jest-dom';
// @mui/material version 5.11.0
import { ThemeProvider } from '@mui/material';
import { theme } from '../../../config/theme.config';

// Internal imports
import Dialog from './Dialog';
import { mockApiRequest, validateTestData } from '../../utils/test.util';

/**
 * Requirements addressed:
 * - Testing Framework (Technical Specifications/4.5 Development & Deployment/Testing)
 *   Implements comprehensive test suite for Dialog component functionality
 * - Accessibility Compliance (Technical Specifications/3.1 User Interface Design/Accessibility)
 *   Validates WCAG 2.1 Level AA compliance through accessibility tests
 */

describe('Dialog Component', () => {
  // Test data
  const mockProps = {
    title: 'Test Dialog',
    open: true,
    onClose: jest.fn(),
    children: <div>Dialog content</div>,
    actions: <button>Action button</button>,
    maxWidth: 'sm' as const,
    fullScreenMobile: true,
    ariaLabel: 'test-dialog',
    ariaDescribedBy: 'dialog-description'
  };

  // Helper function to render Dialog with theme
  const renderDialog = (props = mockProps) => {
    return render(
      <ThemeProvider theme={theme}>
        <Dialog {...props} />
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render dialog with correct title', () => {
      renderDialog();
      expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    });

    it('should render dialog content', () => {
      renderDialog();
      expect(screen.getByText('Dialog content')).toBeInTheDocument();
    });

    it('should render dialog actions', () => {
      renderDialog();
      expect(screen.getByText('Action button')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      renderDialog({ ...mockProps, open: false });
      expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA attributes', () => {
      renderDialog();
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'test-dialog');
      expect(dialog).toHaveAttribute('aria-describedby', 'dialog-description');
    });

    it('should trap focus within dialog when open', () => {
      renderDialog();
      const closeButton = screen.getByLabelText('close dialog');
      const actionButton = screen.getByText('Action button');
      
      // Initial focus should be on first focusable element
      expect(closeButton).toHaveFocus();

      // Tab navigation should cycle through focusable elements
      fireEvent.keyDown(closeButton, { key: 'Tab' });
      expect(actionButton).toHaveFocus();
      
      // Shift+Tab should cycle backwards
      fireEvent.keyDown(actionButton, { key: 'Tab', shiftKey: true });
      expect(closeButton).toHaveFocus();
    });

    it('should close on Escape key if not disabled', () => {
      renderDialog();
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should not close on Escape key if disabled', () => {
      renderDialog({ ...mockProps, disableEscapeKeyDown: true });
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      expect(mockProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Responsive Design', () => {
    it('should be fullscreen on mobile if enabled', () => {
      // Mock mobile viewport
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(max-width: 600px)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn()
      }));

      renderDialog();
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveStyle({ margin: '0' });
    });

    it('should respect maxWidth prop on desktop', () => {
      // Mock desktop viewport
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn()
      }));

      renderDialog();
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveStyle({ maxWidth: theme.breakpoints.values.sm });
    });
  });

  describe('Interaction', () => {
    it('should call onClose when backdrop is clicked', async () => {
      renderDialog();
      const backdrop = document.querySelector('.MuiBackdrop-root');
      fireEvent.click(backdrop!);
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should not call onClose when backdrop click is disabled', () => {
      renderDialog({ ...mockProps, disableBackdropClick: true });
      const backdrop = document.querySelector('.MuiBackdrop-root');
      fireEvent.click(backdrop!);
      expect(mockProps.onClose).not.toHaveBeenCalled();
    });

    it('should call onClose when close button is clicked', () => {
      renderDialog();
      const closeButton = screen.getByLabelText('close dialog');
      fireEvent.click(closeButton);
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Animation', () => {
    it('should respect reduced motion preferences', async () => {
      // Mock prefers-reduced-motion media query
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn()
      }));

      renderDialog();
      const dialog = screen.getByRole('dialog');
      
      // Animation duration should be minimal when reduced motion is preferred
      expect(dialog).toHaveStyle({ transitionDuration: '0.001ms' });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing title gracefully', () => {
      const { title, ...propsWithoutTitle } = mockProps;
      renderDialog(propsWithoutTitle as any);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should handle missing actions gracefully', () => {
      const { actions, ...propsWithoutActions } = mockProps;
      renderDialog(propsWithoutActions);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});