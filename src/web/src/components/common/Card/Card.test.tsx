import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { theme } from '@mui/material/styles';
import Card, { CardProps } from './Card';
import { renderWithProviders } from '../../../utils/test.util';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

describe('Card Component', () => {
  // Common test props
  const defaultProps: CardProps = {
    title: 'Test Card',
    children: 'Test content',
    testId: 'test-card',
    elevation: 1
  };

  const interactiveProps: CardProps = {
    title: 'Interactive Card',
    children: 'Interactive content',
    interactive: true,
    onClick: jest.fn(),
    elevation: 2,
    ariaLabel: 'Interactive test card'
  };

  const accessibilityProps: CardProps = {
    title: 'Accessible Card',
    children: 'Accessible content',
    ariaLabel: 'Test card with accessibility features',
    role: 'region',
    tabIndex: 0
  };

  // Helper function to render card with theme
  const renderCard = (props: CardProps) => {
    return renderWithProviders(<Card {...props} />);
  };

  describe('Rendering', () => {
    it('renders with basic props correctly', () => {
      renderCard(defaultProps);
      
      const card = screen.getByTestId('test-card');
      expect(card).toBeInTheDocument();
      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('renders with subtitle when provided', () => {
      renderCard({
        ...defaultProps,
        subtitle: 'Test subtitle'
      });

      expect(screen.getByText('Test subtitle')).toBeInTheDocument();
    });

    it('renders with actions when provided', () => {
      const actions = [
        <button key="1">Action 1</button>,
        <button key="2">Action 2</button>
      ];

      renderCard({
        ...defaultProps,
        actions
      });

      const actionButtons = screen.getAllByRole('button');
      expect(actionButtons).toHaveLength(2);
    });

    it('applies correct elevation styles', () => {
      renderCard(defaultProps);
      const card = screen.getByTestId('test-card');
      expect(card).toHaveStyle(`box-shadow: ${theme.shadows[1]}`);
    });
  });

  describe('Interaction', () => {
    it('handles click events when interactive', async () => {
      renderCard(interactiveProps);
      
      const card = screen.getByRole('button');
      await userEvent.click(card);
      
      expect(interactiveProps.onClick).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard interaction when interactive', async () => {
      renderCard(interactiveProps);
      
      const card = screen.getByRole('button');
      await userEvent.tab();
      expect(card).toHaveFocus();
      
      await userEvent.keyboard('{enter}');
      expect(interactiveProps.onClick).toHaveBeenCalledTimes(1);
      
      await userEvent.keyboard(' ');
      expect(interactiveProps.onClick).toHaveBeenCalledTimes(2);
    });

    it('does not trigger click events when non-interactive', async () => {
      const onClick = jest.fn();
      renderCard({
        ...defaultProps,
        onClick
      });
      
      const card = screen.getByTestId('test-card');
      await userEvent.click(card);
      
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('meets WCAG 2.1 Level AA requirements', async () => {
      const { container } = renderCard(accessibilityProps);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides correct ARIA attributes', () => {
      renderCard(accessibilityProps);
      
      const card = screen.getByRole('region');
      expect(card).toHaveAttribute('aria-label', 'Test card with accessibility features');
    });

    it('maintains focus order for interactive elements', async () => {
      const actions = [
        <button key="1">Action 1</button>,
        <button key="2">Action 2</button>
      ];

      renderCard({
        ...interactiveProps,
        actions
      });

      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'Interactive test card' })).toHaveFocus();
      
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'Action 1' })).toHaveFocus();
      
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'Action 2' })).toHaveFocus();
    });

    it('provides visual focus indicator', async () => {
      renderCard(interactiveProps);
      
      const card = screen.getByRole('button');
      await userEvent.tab();
      
      expect(card).toHaveStyle(`outline: 3px solid ${theme.palette.primary.main}`);
    });
  });

  describe('Senior-Friendly Features', () => {
    it('uses appropriate text sizing', () => {
      renderCard(defaultProps);
      
      const title = screen.getByText('Test Card');
      expect(title).toHaveStyle({
        fontSize: '1.2rem',
        fontWeight: 600
      });
    });

    it('maintains sufficient color contrast', () => {
      renderCard(defaultProps);
      
      const card = screen.getByTestId('test-card');
      const styles = window.getComputedStyle(card);
      
      // Verify background and text colors meet WCAG AA contrast requirements
      expect(styles.backgroundColor).toBe(theme.palette.background.paper);
      expect(styles.color).toBe(theme.palette.text.primary);
    });

    it('provides clear visual boundaries', () => {
      renderCard(defaultProps);
      
      const card = screen.getByTestId('test-card');
      expect(card).toHaveStyle({
        borderRadius: theme.spacing(2),
        minHeight: '100px'
      });
    });

    it('implements clear interactive states', async () => {
      renderCard(interactiveProps);
      
      const card = screen.getByRole('button');
      
      // Hover state
      await userEvent.hover(card);
      expect(card).toHaveStyle({
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows[4] // elevation + 2
      });
      
      // Focus state
      await userEvent.tab();
      expect(card).toHaveStyle({
        outline: `3px solid ${theme.palette.primary.main}`,
        outlineOffset: '2px'
      });
    });
  });

  describe('Error Handling', () => {
    it('handles missing required props gracefully', () => {
      // @ts-expect-error - Testing missing required props
      expect(() => renderCard({})).toThrow();
    });

    it('handles invalid elevation values', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      renderCard({
        ...defaultProps,
        elevation: 25 // Max is 24
      });
      
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });
});