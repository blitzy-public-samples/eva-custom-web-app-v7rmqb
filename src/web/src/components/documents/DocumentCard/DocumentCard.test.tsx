// @jest/react version 29.0.0
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import DocumentCard from './DocumentCard';
import { theme } from '../../../config/theme.config';
import { mockApiRequest, validateTestData, formatTestOutput } from '../../utils/test.util';

/* Human Tasks:
1. Verify that test coverage meets minimum requirements
2. Ensure test data matches expected production scenarios
3. Validate accessibility testing approach with QA team
4. Review error handling test cases
*/

/**
 * Unit tests for the DocumentCard component
 * 
 * Requirements addressed:
 * - Testing Framework (Technical Specifications/4.5 Development & Deployment/Testing)
 *   Implements unit tests to validate the functionality and rendering of the DocumentCard component.
 */

// Mock data for testing
const mockDocumentData = {
  title: 'Test Document',
  category: 'medical',
  status: 'pending_review'
};

// Test schema for document data validation
const documentTestSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    category: { type: 'string' },
    status: { type: 'string' }
  },
  required: ['title', 'category', 'status']
};

describe('DocumentCard Component', () => {
  // Validate test data before running tests
  beforeAll(() => {
    const isValidData = validateTestData(mockDocumentData, documentTestSchema);
    if (!isValidData) {
      throw new Error('Invalid test data structure');
    }
  });

  // Setup test environment
  beforeEach(() => {
    // Mock API requests
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockDocumentData)
      })
    );
  });

  // Cleanup after tests
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    test('renders with all required props', () => {
      render(
        <ThemeProvider theme={theme}>
          <DocumentCard
            title={mockDocumentData.title}
            category={mockDocumentData.category}
            status={mockDocumentData.status}
          />
        </ThemeProvider>
      );

      // Verify title is rendered
      expect(screen.getByText(mockDocumentData.title)).toBeInTheDocument();
      
      // Verify category is rendered with proper formatting
      expect(screen.getByText('Medical')).toBeInTheDocument();
      
      // Verify status is rendered with proper formatting
      expect(screen.getByText('Pending Review')).toBeInTheDocument();
    });

    test('applies correct styling based on status', () => {
      render(
        <ThemeProvider theme={theme}>
          <DocumentCard
            title={mockDocumentData.title}
            category={mockDocumentData.category}
            status={mockDocumentData.status}
          />
        </ThemeProvider>
      );

      const statusElement = screen.getByRole('status');
      const computedStyle = window.getComputedStyle(statusElement);
      
      // Verify status styling
      expect(computedStyle.backgroundColor).toContain('rgb(44, 82, 130, 0.2)');
      expect(computedStyle.color).toBe('#2C5282');
    });

    test('handles long titles appropriately', () => {
      const longTitle = 'A'.repeat(100);
      render(
        <ThemeProvider theme={theme}>
          <DocumentCard
            title={longTitle}
            category={mockDocumentData.category}
            status={mockDocumentData.status}
          />
        </ThemeProvider>
      );

      const titleElement = screen.getByText(longTitle);
      expect(titleElement).toBeInTheDocument();
      expect(window.getComputedStyle(titleElement).overflow).toBe('hidden');
    });
  });

  describe('Accessibility', () => {
    test('provides appropriate ARIA labels', () => {
      render(
        <ThemeProvider theme={theme}>
          <DocumentCard
            title={mockDocumentData.title}
            category={mockDocumentData.category}
            status={mockDocumentData.status}
          />
        </ThemeProvider>
      );

      // Verify category ARIA label
      expect(screen.getByLabelText(`Document category: ${mockDocumentData.category}`))
        .toBeInTheDocument();

      // Verify status ARIA label
      expect(screen.getByLabelText(`Document status: Pending Review`))
        .toBeInTheDocument();
    });

    test('maintains color contrast ratios', () => {
      render(
        <ThemeProvider theme={theme}>
          <DocumentCard
            title={mockDocumentData.title}
            category={mockDocumentData.category}
            status={mockDocumentData.status}
          />
        </ThemeProvider>
      );

      const statusElement = screen.getByRole('status');
      const computedStyle = window.getComputedStyle(statusElement);
      
      // Verify contrast ratio meets WCAG 2.1 Level AA standards
      // Note: This is a simplified check. In practice, you would use a color contrast analysis tool
      expect(computedStyle.color).toBe('#2C5282');
      expect(computedStyle.backgroundColor).toContain('rgb(44, 82, 130, 0.2)');
    });
  });

  describe('Error Handling', () => {
    test('handles missing props gracefully', () => {
      // @ts-expect-error - Testing invalid props
      const renderWithoutProps = () => render(
        <ThemeProvider theme={theme}>
          <DocumentCard />
        </ThemeProvider>
      );

      expect(renderWithoutProps).toThrow();
    });

    test('handles invalid status values', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <ThemeProvider theme={theme}>
          <DocumentCard
            title={mockDocumentData.title}
            category={mockDocumentData.category}
            status="invalid_status"
          />
        </ThemeProvider>
      );

      // Verify fallback color is applied for invalid status
      const statusElement = screen.getByRole('status');
      const computedStyle = window.getComputedStyle(statusElement);
      expect(computedStyle.color).toBe('#718096');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Integration', () => {
    test('integrates with Material UI theme', () => {
      render(
        <ThemeProvider theme={theme}>
          <DocumentCard
            title={mockDocumentData.title}
            category={mockDocumentData.category}
            status={mockDocumentData.status}
          />
        </ThemeProvider>
      );

      const card = screen.getByRole('article');
      const computedStyle = window.getComputedStyle(card);
      
      // Verify theme integration
      expect(computedStyle.fontFamily).toContain('Inter');
      expect(computedStyle.borderRadius).toBe('4px');
    });
  });
});