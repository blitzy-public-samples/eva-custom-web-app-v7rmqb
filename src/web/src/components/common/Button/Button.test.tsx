import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; // v14.0.0
import { expect, describe, it, beforeEach, afterEach } from '@jest/globals'; // v29.0.0
import { axe, toHaveNoViolations } from 'jest-axe'; // v4.7.0
import Button, { CustomButtonProps } from './Button';
import { renderWithProviders } from '../../../utils/test.util';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('Button Component', () => {
  // Default props for testing
  const defaultProps: CustomButtonProps = {
    children: 'Test Button',
    variant: 'primary',
    size: 'medium',
    ariaLabel: 'Test Button'
  };

  // Test cleanup
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with correct primary variant styling', () => {
      const { container } = renderWithProviders(
        <Button {...defaultProps} variant="primary" />
      );
      const button = container.firstChild as HTMLElement;
      
      expect(button).toHaveStyle({
        backgroundColor: 'var(--color-primary)',
        color: '#FFFFFF'
      });
    });

    it('renders with correct secondary variant styling', () => {
      const { container } = renderWithProviders(
        <Button {...defaultProps} variant="secondary" />
      );
      const button = container.firstChild as HTMLElement;
      
      expect(button).toHaveStyle({
        backgroundColor: 'var(--color-secondary)',
        color: '#FFFFFF'
      });
    });

    it('renders with correct outline variant styling', () => {
      const { container } = renderWithProviders(
        <Button {...defaultProps} variant="outline" />
      );
      const button = container.firstChild as HTMLElement;
      
      expect(button).toHaveStyle({
        backgroundColor: 'transparent',
        border: '2px solid var(--color-primary)'
      });
    });

    it('renders with correct text variant styling', () => {
      const { container } = renderWithProviders(
        <Button {...defaultProps} variant="text" />
      );
      const button = container.firstChild as HTMLElement;
      
      expect(button).toHaveStyle({
        backgroundColor: 'transparent',
        color: 'var(--color-primary)'
      });
    });

    it('applies correct size-based styling', () => {
      const { container: smallContainer } = renderWithProviders(
        <Button {...defaultProps} size="small" />
      );
      const { container: largeContainer } = renderWithProviders(
        <Button {...defaultProps} size="large" />
      );

      const smallButton = smallContainer.firstChild as HTMLElement;
      const largeButton = largeContainer.firstChild as HTMLElement;

      expect(smallButton).toHaveStyle({
        fontSize: 'calc(var(--font-size-base) * 0.875)'
      });
      expect(largeButton).toHaveStyle({
        fontSize: 'calc(var(--font-size-base) * 1.125)'
      });
    });
  });

  describe('Senior-Friendly Features', () => {
    it('has minimum touch target size of 44x44px', () => {
      const { container } = renderWithProviders(<Button {...defaultProps} />);
      const button = container.firstChild as HTMLElement;
      
      expect(button).toHaveStyle({
        minWidth: '44px',
        minHeight: '44px'
      });
    });

    it('has minimum font size of 16px', () => {
      const { container } = renderWithProviders(<Button {...defaultProps} />);
      const button = container.firstChild as HTMLElement;
      
      const computedStyle = window.getComputedStyle(button);
      const fontSize = parseFloat(computedStyle.fontSize);
      expect(fontSize).toBeGreaterThanOrEqual(16);
    });

    it('provides clear visual feedback on hover', async () => {
      const { container } = renderWithProviders(
        <Button {...defaultProps} variant="primary" />
      );
      const button = container.firstChild as HTMLElement;
      
      fireEvent.mouseEnter(button);
      await waitFor(() => {
        expect(button).toHaveStyle({
          backgroundColor: 'var(--color-primary-dark)'
        });
      });
    });

    it('respects reduced motion preferences', () => {
      const { container } = renderWithProviders(
        <Button {...defaultProps} prefersReducedMotion={true} />
      );
      const button = container.firstChild as HTMLElement;
      
      expect(button).toHaveStyle({
        transition: 'none'
      });
    });
  });

  describe('Accessibility', () => {
    it('meets WCAG 2.1 Level AA standards', async () => {
      const { container } = renderWithProviders(<Button {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides appropriate aria-labels', () => {
      renderWithProviders(
        <Button {...defaultProps} ariaLabel="Custom Label" />
      );
      const button = screen.getByRole('button', { name: 'Custom Label' });
      expect(button).toHaveAttribute('aria-label', 'Custom Label');
    });

    it('handles keyboard navigation correctly', () => {
      const onClickMock = jest.fn();
      renderWithProviders(
        <Button {...defaultProps} onClick={onClickMock} />
      );
      
      const button = screen.getByRole('button');
      button.focus();
      expect(document.activeElement).toBe(button);
      
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(onClickMock).toHaveBeenCalled();
      
      fireEvent.keyDown(button, { key: ' ' });
      expect(onClickMock).toHaveBeenCalledTimes(2);
    });

    it('indicates loading state to screen readers', () => {
      renderWithProviders(
        <Button {...defaultProps} loading={true} />
      );
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('State Management', () => {
    it('handles disabled state correctly', () => {
      const onClickMock = jest.fn();
      renderWithProviders(
        <Button {...defaultProps} disabled onClick={onClickMock} />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(onClickMock).not.toHaveBeenCalled();
      expect(button).toHaveStyle({ opacity: '0.6' });
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('displays loading spinner when loading', () => {
      renderWithProviders(
        <Button {...defaultProps} loading />
      );
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveStyle({
        color: 'transparent'
      });
    });

    it('handles icons correctly', () => {
      const startIcon = <span data-testid="start-icon">Start</span>;
      const endIcon = <span data-testid="end-icon">End</span>;
      
      renderWithProviders(
        <Button 
          {...defaultProps} 
          startIcon={startIcon}
          endIcon={endIcon}
        />
      );
      
      expect(screen.getByTestId('start-icon')).toBeInTheDocument();
      expect(screen.getByTestId('end-icon')).toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    it('calls onClick handler when clicked', () => {
      const onClickMock = jest.fn();
      renderWithProviders(
        <Button {...defaultProps} onClick={onClickMock} />
      );
      
      fireEvent.click(screen.getByRole('button'));
      expect(onClickMock).toHaveBeenCalledTimes(1);
    });

    it('prevents click events when loading', () => {
      const onClickMock = jest.fn();
      renderWithProviders(
        <Button {...defaultProps} loading onClick={onClickMock} />
      );
      
      fireEvent.click(screen.getByRole('button'));
      expect(onClickMock).not.toHaveBeenCalled();
    });

    it('handles full width prop correctly', () => {
      const { container } = renderWithProviders(
        <Button {...defaultProps} fullWidth />
      );
      const button = container.firstChild as HTMLElement;
      
      expect(button).toHaveStyle({ width: '100%' });
    });
  });
});