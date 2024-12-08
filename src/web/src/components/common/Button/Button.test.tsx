// jest v29.0.0
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from './Button';
import { mockApiRequest, validateTestData } from '../../utils/test.util';
import { theme } from '../../../config/theme.config';

/**
 * Button Component Test Suite
 * 
 * Requirements addressed:
 * - Frontend Component Testing (Technical Specifications/4.5 Development & Deployment/Testing)
 *   Implements unit tests to validate the functionality and design compliance of the Button component.
 */

describe('Button Component', () => {
  // Test button rendering with default props
  describe('Rendering', () => {
    it('should render button with default props', () => {
      render(<Button label="Test Button" />);
      const button = screen.getByRole('button', { name: /test button/i });
      
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
      expect(button).not.toBeDisabled();
      expect(button).toHaveClass('button');
      expect(button).toHaveClass('button-primary');
    });

    it('should render button with custom className', () => {
      render(<Button label="Test Button" className="custom-class" />);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('custom-class');
    });

    it('should render button with aria-label', () => {
      render(<Button label="Test Button" ariaLabel="Custom Aria Label" />);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-label', 'Custom Aria Label');
    });
  });

  // Test button variants
  describe('Variants', () => {
    it('should apply primary variant styles', () => {
      render(<Button label="Primary Button" variant="primary" />);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('button-primary');
      expect(button).toHaveStyle({
        backgroundColor: theme.palette.primary.main,
        color: '#ffffff'
      });
    });

    it('should apply secondary variant styles', () => {
      render(<Button label="Secondary Button" variant="secondary" />);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('button-secondary');
      expect(button).toHaveStyle({
        backgroundColor: theme.palette.secondary.main,
        color: '#ffffff'
      });
    });

    it('should apply outlined variant styles', () => {
      render(<Button label="Outlined Button" variant="outlined" />);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('button-outlined');
      expect(button).toHaveStyle({
        backgroundColor: 'transparent',
        color: theme.palette.primary.main,
        border: `1px solid ${theme.palette.primary.main}`
      });
    });

    it('should apply text variant styles', () => {
      render(<Button label="Text Button" variant="text" />);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('button-text');
      expect(button).toHaveStyle({
        backgroundColor: 'transparent',
        color: theme.palette.primary.main,
        border: 'none'
      });
    });
  });

  // Test button states
  describe('States', () => {
    it('should handle disabled state', () => {
      render(<Button label="Disabled Button" disabled />);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      expect(button).toHaveClass('button-disabled');
      expect(button).toHaveStyle({
        opacity: 0.6,
        cursor: 'not-allowed'
      });
    });

    it('should handle click events when not disabled', () => {
      const handleClick = jest.fn();
      render(<Button label="Clickable Button" onClick={handleClick} />);
      const button = screen.getByRole('button');
      
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not trigger click events when disabled', () => {
      const handleClick = jest.fn();
      render(<Button label="Disabled Button" onClick={handleClick} disabled />);
      const button = screen.getByRole('button');
      
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // Test button accessibility
  describe('Accessibility', () => {
    it('should have proper focus styles', () => {
      render(<Button label="Focus Test Button" />);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).toHaveStyle({
        outline: `3px solid ${theme.palette.primary.light}`,
        outlineOffset: '2px'
      });
    });

    it('should have proper aria attributes', () => {
      render(<Button label="Aria Test Button" disabled />);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAttribute('aria-label', 'Aria Test Button');
    });
  });

  // Test button dimensions and layout
  describe('Layout', () => {
    it('should have minimum touch target size', () => {
      render(<Button label="Size Test Button" />);
      const button = screen.getByRole('button');
      
      expect(button).toHaveStyle({
        minWidth: '2.5rem',
        minHeight: '2.5rem'
      });
    });

    it('should have proper padding', () => {
      render(<Button label="Padding Test Button" />);
      const button = screen.getByRole('button');
      
      expect(button).toHaveStyle({
        padding: '0.75rem 1.5rem'
      });
    });
  });

  // Test button types
  describe('Types', () => {
    it('should render submit type button', () => {
      render(<Button label="Submit Button" type="submit" />);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should render reset type button', () => {
      render(<Button label="Reset Button" type="reset" />);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('type', 'reset');
    });
  });
});