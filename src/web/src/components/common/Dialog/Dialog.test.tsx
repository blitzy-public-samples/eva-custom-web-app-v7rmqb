import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import CustomDialog, { CustomDialogProps } from './Dialog';
import { renderWithProviders } from '../../../utils/test.util';
import { palette, spacing, typography } from '../../../config/theme.config';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

describe('CustomDialog Component', () => {
  // Default props for testing
  const defaultProps: CustomDialogProps = {
    title: 'Important Information',
    content: 'This is important content for seniors.',
    open: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    confirmLabel: 'I Understand',
    cancelLabel: 'Go Back',
    maxWidth: 'sm',
    fullWidth: true,
    largeText: true,
    reduceMotion: true,
    useSound: true,
    description: 'Please review this information carefully.'
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Senior-Friendly Rendering', () => {
    it('renders with enhanced text size for senior visibility', () => {
      renderWithProviders(<CustomDialog {...defaultProps} />);
      
      const dialogTitle = screen.getByRole('heading', { name: defaultProps.title });
      const computedTitleStyle = window.getComputedStyle(dialogTitle);
      
      expect(computedTitleStyle.fontSize).toBe(typography.h4.fontSize);
      expect(computedTitleStyle.fontWeight).toBe(typography.h4.fontWeight);
    });

    it('maintains minimum touch target sizes for senior accessibility', () => {
      renderWithProviders(<CustomDialog {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const computedStyle = window.getComputedStyle(button);
        expect(parseInt(computedStyle.minHeight)).toBeGreaterThanOrEqual(48);
        expect(parseInt(computedStyle.minWidth)).toBeGreaterThanOrEqual(120);
      });
    });

    it('provides clear visual hierarchy with proper spacing', () => {
      renderWithProviders(<CustomDialog {...defaultProps} />);
      
      const dialogContent = screen.getByRole('dialog');
      const computedStyle = window.getComputedStyle(dialogContent);
      
      expect(computedStyle.padding).toBe(spacing(3));
    });
  });

  describe('Accessibility Features', () => {
    it('meets WCAG 2.1 Level AA requirements', async () => {
      const { container } = renderWithProviders(<CustomDialog {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides proper ARIA labels and roles', () => {
      renderWithProviders(<CustomDialog {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'dialog-description');
    });

    it('maintains keyboard focus trap when open', () => {
      renderWithProviders(<CustomDialog {...defaultProps} />);
      
      const focusableElements = screen.getAllByRole('button');
      
      // Tab through all focusable elements
      focusableElements.forEach(() => {
        fireEvent.keyDown(document.activeElement || document.body, { key: 'Tab' });
        expect(document.activeElement).toBeVisible();
        expect(within(screen.getByRole('dialog')).contains(document.activeElement)).toBe(true);
      });
    });

    it('supports reduced motion preferences', () => {
      renderWithProviders(<CustomDialog {...defaultProps} reduceMotion={true} />);
      
      const dialog = screen.getByRole('dialog');
      const computedStyle = window.getComputedStyle(dialog);
      
      expect(computedStyle.transition).toBe('none');
    });
  });

  describe('Senior-Friendly Interactions', () => {
    it('handles close action with confirmation', () => {
      const onClose = jest.fn();
      renderWithProviders(<CustomDialog {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByRole('button', { name: defaultProps.cancelLabel });
      fireEvent.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('provides clear feedback for confirmation action', () => {
      const onConfirm = jest.fn();
      renderWithProviders(<CustomDialog {...defaultProps} onConfirm={onConfirm} />);
      
      const confirmButton = screen.getByRole('button', { name: defaultProps.confirmLabel });
      fireEvent.click(confirmButton);
      
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('supports keyboard navigation with enhanced focus indicators', () => {
      renderWithProviders(<CustomDialog {...defaultProps} />);
      
      const confirmButton = screen.getByRole('button', { name: defaultProps.confirmLabel });
      fireEvent.keyDown(confirmButton, { key: 'Enter' });
      
      expect(defaultProps.onConfirm).toHaveBeenCalled();
    });
  });

  describe('Responsive Behavior', () => {
    it('adjusts layout for mobile devices while maintaining accessibility', () => {
      // Mock mobile viewport
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(max-width:768px)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
      }));

      renderWithProviders(<CustomDialog {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const computedStyle = window.getComputedStyle(button);
        expect(computedStyle.width).toBe('100%');
      });
    });

    it('maintains text readability across screen sizes', () => {
      renderWithProviders(<CustomDialog {...defaultProps} />);
      
      const content = screen.getByText(defaultProps.content as string);
      const computedStyle = window.getComputedStyle(content);
      
      expect(parseFloat(computedStyle.fontSize)).toBeGreaterThanOrEqual(16);
      expect(parseFloat(computedStyle.lineHeight)).toBeGreaterThanOrEqual(1.5);
    });
  });

  describe('Error Handling', () => {
    it('gracefully handles missing optional props', () => {
      const minimalProps = {
        title: 'Test',
        content: 'Content',
        open: true,
        onClose: jest.fn(),
      };
      
      expect(() => renderWithProviders(<CustomDialog {...minimalProps} />))
        .not.toThrow();
    });

    it('maintains accessibility when error state occurs', async () => {
      const errorProps = {
        ...defaultProps,
        error: 'An error occurred',
      };
      
      const { container } = renderWithProviders(<CustomDialog {...errorProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});