import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { renderWithProviders } from '../../../utils/test.util';
import Loading from './Loading';

describe('Loading Component', () => {
  // Mock matchMedia for reduced motion tests
  beforeEach(() => {
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Default Rendering', () => {
    it('renders with default props and proper accessibility attributes', () => {
      renderWithProviders(<Loading />);
      
      const loadingContainer = screen.getByRole('status');
      expect(loadingContainer).toBeInTheDocument();
      expect(loadingContainer).toHaveAttribute('aria-live', 'polite');
      expect(loadingContainer).toHaveAttribute('aria-label', 'Loading...');
      
      // Verify visually hidden text for screen readers
      const hiddenText = screen.getByText('Loading...');
      expect(hiddenText).toHaveClass('visually-hidden');
    });

    it('applies default medium size and primary color', () => {
      renderWithProviders(<Loading />);
      
      const spinner = screen.getByRole('status');
      const styles = window.getComputedStyle(spinner);
      
      expect(spinner).toHaveStyle({
        '--spinner-size': '40px',
        '--spinner-color': 'var(--color-primary)'
      });
    });
  });

  describe('Size Variations', () => {
    it.each([
      ['small', '24px'],
      ['medium', '40px'],
      ['large', '56px']
    ])('renders correct dimensions for %s size', (size, expectedSize) => {
      renderWithProviders(<Loading size={size as 'small' | 'medium' | 'large'} />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveStyle({
        '--spinner-size': expectedSize
      });
    });
  });

  describe('Color Variations', () => {
    it.each([
      ['primary', 'var(--color-primary)'],
      ['secondary', 'var(--color-secondary)'],
      ['neutral', 'var(--color-neutral)']
    ])('applies correct color variable for %s theme', (color, expectedVar) => {
      renderWithProviders(<Loading color={color as 'primary' | 'secondary' | 'neutral'} />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveStyle({
        '--spinner-color': expectedVar
      });
    });
  });

  describe('Custom Labels', () => {
    it('displays and announces custom loading message', () => {
      const customLabel = 'Processing your request...';
      renderWithProviders(<Loading label={customLabel} />);
      
      const loadingContainer = screen.getByRole('status');
      expect(loadingContainer).toHaveAttribute('aria-label', customLabel);
      
      const hiddenText = screen.getByText(customLabel);
      expect(hiddenText).toHaveClass('visually-hidden');
    });
  });

  describe('Overlay Behavior', () => {
    it('renders with overlay when specified', () => {
      renderWithProviders(<Loading overlay />);
      
      const overlay = screen.getByTestId('loading-overlay');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('loading-overlay');
      
      // Verify spinner is rendered within overlay
      const spinner = within(overlay).getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('positions overlay correctly in document', () => {
      renderWithProviders(<Loading overlay />);
      
      const overlay = screen.getByTestId('loading-overlay');
      expect(overlay).toHaveStyle({
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0'
      });
    });
  });

  describe('Reduced Motion Support', () => {
    it('disables animation when reduced motion is preferred', () => {
      // Mock prefers-reduced-motion media query
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      renderWithProviders(<Loading />);
      
      const spinner = screen.getByRole('status').querySelector('.loading-spinner');
      const styles = window.getComputedStyle(spinner!);
      
      expect(styles.animation).toBe('none !important');
      expect(spinner).toHaveStyle({ opacity: '0.7' });
    });
  });

  describe('Senior-Friendly Features', () => {
    it('maintains clear visibility with high contrast', () => {
      renderWithProviders(<Loading />);
      
      const spinner = screen.getByRole('status');
      const background = window.getComputedStyle(spinner).backgroundColor;
      const spinnerColor = window.getComputedStyle(spinner).getPropertyValue('--spinner-color');
      
      // Verify contrast ratio meets WCAG AA standards
      // Note: Actual contrast calculation would be implemented here
      expect(background).toBe('var(--color-background-paper)');
      expect(spinnerColor).toBe('var(--color-primary)');
    });

    it('provides clear loading state indication', () => {
      renderWithProviders(<Loading label="Please wait while we load your documents" />);
      
      const loadingContainer = screen.getByRole('status');
      expect(loadingContainer).toHaveAttribute('aria-live', 'polite');
      expect(loadingContainer).toHaveAttribute('aria-label', 'Please wait while we load your documents');
    });
  });
});