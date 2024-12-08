// @jest/react version 29.0.0
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ThemeProvider } from '@mui/material/styles';
import Card from './Card';
import { theme } from '../../../config/theme.config';
import { mockApiRequest, validateTestData, formatTestOutput } from '../../utils/test.util';

/* Human Tasks:
1. Verify that all test cases pass with the current Card component implementation
2. Ensure accessibility tests cover all WCAG 2.1 Level AA requirements
3. Validate that theme-related tests match the design system specifications
4. Review test coverage and add additional test cases if needed
*/

// Mock theme provider wrapper for consistent testing
const renderWithTheme = (component: React.ReactNode) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('Card Component', () => {
  // Test basic rendering
  describe('Rendering', () => {
    /**
     * Requirements addressed:
     * - Frontend Component Testing (Technical Specifications/4.5 Development & Deployment/Testing)
     *   Tests basic rendering of the Card component with default props
     */
    it('should render without crashing', () => {
      renderWithTheme(
        <Card>
          <p>Test content</p>
        </Card>
      );
      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('should render with title when provided', () => {
      const title = 'Test Title';
      renderWithTheme(
        <Card title={title}>
          <p>Test content</p>
        </Card>
      );
      expect(screen.getByText(title)).toBeInTheDocument();
    });

    it('should render children content correctly', () => {
      const childContent = 'Test child content';
      renderWithTheme(
        <Card>
          <p>{childContent}</p>
        </Card>
      );
      expect(screen.getByText(childContent)).toBeInTheDocument();
    });
  });

  // Test theming and styling
  describe('Theming', () => {
    /**
     * Requirements addressed:
     * - Frontend Component Testing (Technical Specifications/4.5 Development & Deployment/Testing)
     *   Tests theme integration and styling consistency
     */
    it('should apply correct theme styles', () => {
      renderWithTheme(
        <Card>
          <p>Test content</p>
        </Card>
      );
      const card = screen.getByRole('article');
      const styles = window.getComputedStyle(card);
      
      expect(styles.backgroundColor).toBe(theme.palette.background.paper);
      expect(styles.borderRadius).toBe(theme.shape.borderRadius);
    });

    it('should apply hover styles correctly', () => {
      renderWithTheme(
        <Card>
          <p>Test content</p>
        </Card>
      );
      const card = screen.getByRole('article');
      
      fireEvent.mouseEnter(card);
      const hoverStyles = window.getComputedStyle(card);
      expect(hoverStyles.boxShadow).toBe('0px 4px 8px rgba(0, 0, 0, 0.15)');
    });

    it('should apply focus styles correctly', () => {
      renderWithTheme(
        <Card>
          <p>Test content</p>
        </Card>
      );
      const card = screen.getByRole('article');
      
      fireEvent.focus(card);
      const focusStyles = window.getComputedStyle(card);
      expect(focusStyles.outline).toBe(`3px solid ${theme.palette.primary.main}`);
    });
  });

  // Test accessibility
  describe('Accessibility', () => {
    /**
     * Requirements addressed:
     * - Frontend Component Testing (Technical Specifications/4.5 Development & Deployment/Testing)
     *   Tests accessibility compliance and ARIA attributes
     */
    it('should have no accessibility violations', async () => {
      const { container } = renderWithTheme(
        <Card title="Accessibility Test">
          <p>Test content</p>
        </Card>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have correct ARIA attributes', () => {
      renderWithTheme(
        <Card title="ARIA Test">
          <p>Test content</p>
        </Card>
      );
      
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('tabIndex', '0');
      expect(card).toHaveAttribute('role', 'article');
    });

    it('should be keyboard navigable', () => {
      renderWithTheme(
        <Card title="Keyboard Test">
          <p>Test content</p>
        </Card>
      );
      
      const card = screen.getByRole('article');
      card.focus();
      expect(document.activeElement).toBe(card);
    });
  });

  // Test high contrast mode
  describe('High Contrast Mode', () => {
    /**
     * Requirements addressed:
     * - Frontend Component Testing (Technical Specifications/4.5 Development & Deployment/Testing)
     *   Tests component behavior in high contrast mode
     */
    it('should apply correct high contrast styles', () => {
      // Mock matchMedia for high contrast mode
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-contrast: high)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
      }));

      renderWithTheme(
        <Card title="High Contrast Test">
          <p>Test content</p>
        </Card>
      );
      
      const title = screen.getByText('High Contrast Test');
      const styles = window.getComputedStyle(title);
      expect(styles.color).toBe('#000000');
    });
  });

  // Test error handling
  describe('Error Handling', () => {
    /**
     * Requirements addressed:
     * - Frontend Component Testing (Technical Specifications/4.5 Development & Deployment/Testing)
     *   Tests component error handling and validation
     */
    it('should handle empty title gracefully', () => {
      renderWithTheme(
        <Card title="">
          <p>Test content</p>
        </Card>
      );
      
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should validate props correctly', () => {
      const testData = {
        title: 'Test Title',
        children: <p>Test content</p>
      };

      const isValid = validateTestData(testData, {
        type: 'object',
        properties: {
          title: { type: 'string' },
          children: { type: 'object' }
        }
      });

      expect(isValid).toBe(true);
    });
  });
});