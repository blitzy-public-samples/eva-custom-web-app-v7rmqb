/**
 * Estate Kit - Table Component Tests
 * 
 * Requirements addressed:
 * - Frontend Component Testing (Technical Specifications/4.5 Development & Deployment/Testing)
 *   Ensures the Table component behaves as expected under various scenarios and adheres to the design and functional requirements.
 * 
 * Human Tasks:
 * 1. Verify test coverage meets project requirements
 * 2. Review test cases with UX team for accessibility compliance
 * 3. Validate sorting behavior with large datasets
 */

// @testing-library/react version ^13.0.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// jest version ^29.0.0
import '@testing-library/jest-dom';
import React from 'react';

import { Table } from './Table';
import { mockApiRequest, validateTestData } from '../../utils/test.util';
import { DocumentTypes } from '../../types/document.types';
import { SubscriptionTypes } from '../../types/subscription.types';

describe('Table Component', () => {
  // Mock data for testing
  const mockColumns = [
    { key: 'title', label: 'Title', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'createdAt', label: 'Created At', sortable: true }
  ];

  const mockData: Array<DocumentTypes | SubscriptionTypes> = [
    {
      documentId: '1',
      title: 'Document A',
      category: 'Legal',
      status: 'active',
      metadata: {},
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      documentId: '2',
      title: 'Document B',
      category: 'Medical',
      status: 'active',
      metadata: {},
      createdAt: new Date('2023-01-02'),
      updatedAt: new Date('2023-01-02')
    }
  ];

  beforeEach(() => {
    // Reset any mocks before each test
    jest.clearAllMocks();
  });

  describe('Rendering Tests', () => {
    test('renders table with correct columns and data', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      // Verify column headers are rendered
      mockColumns.forEach(column => {
        expect(screen.getByText(column.label)).toBeInTheDocument();
      });

      // Verify data rows are rendered
      mockData.forEach(item => {
        expect(screen.getByText(item.title)).toBeInTheDocument();
        expect(screen.getByText(item.category)).toBeInTheDocument();
      });
    });

    test('renders empty table when no data is provided', () => {
      render(<Table columns={mockColumns} data={[]} />);

      // Verify column headers are still rendered
      mockColumns.forEach(column => {
        expect(screen.getByText(column.label)).toBeInTheDocument();
      });

      // Verify table body is empty
      const tbody = screen.getByRole('rowgroup').lastChild;
      expect(tbody?.childNodes.length).toBe(0);
    });

    test('applies custom className when provided', () => {
      const customClass = 'custom-table';
      const { container } = render(
        <Table columns={mockColumns} data={mockData} className={customClass} />
      );

      expect(container.firstChild).toHaveClass(customClass);
    });
  });

  describe('Sorting Tests', () => {
    test('sorts data in ascending order when clicking sortable column header', async () => {
      render(<Table columns={mockColumns} data={mockData} />);

      // Click the title column header
      fireEvent.click(screen.getByText('Title'));

      // Verify sort indicator is visible
      const titleHeader = screen.getByText('Title').closest('th');
      expect(titleHeader).toHaveAttribute('aria-sort', 'ascending');

      // Verify data is sorted
      const cells = screen.getAllByRole('cell');
      expect(cells[0]).toHaveTextContent('Document A');
      expect(cells[3]).toHaveTextContent('Document B');
    });

    test('toggles sort direction when clicking same column header twice', async () => {
      render(<Table columns={mockColumns} data={mockData} />);

      const titleHeader = screen.getByText('Title');

      // First click - ascending
      fireEvent.click(titleHeader);
      expect(titleHeader.closest('th')).toHaveAttribute('aria-sort', 'ascending');

      // Second click - descending
      fireEvent.click(titleHeader);
      expect(titleHeader.closest('th')).toHaveAttribute('aria-sort', 'descending');
    });

    test('handles date sorting correctly', async () => {
      render(<Table columns={mockColumns} data={mockData} />);

      // Click the createdAt column header
      fireEvent.click(screen.getByText('Created At'));

      // Verify dates are sorted correctly
      const cells = screen.getAllByRole('cell');
      expect(cells[2]).toHaveTextContent('January 1, 2023');
      expect(cells[5]).toHaveTextContent('January 2, 2023');
    });
  });

  describe('Accessibility Tests', () => {
    test('provides correct ARIA attributes for sortable columns', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      mockColumns.forEach(column => {
        if (column.sortable) {
          const header = screen.getByText(column.label).closest('th');
          expect(header).toHaveAttribute('role', 'button');
          expect(header).toHaveAttribute('tabIndex', '0');
        }
      });
    });

    test('maintains keyboard navigation', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      const headers = screen.getAllByRole('columnheader');
      headers.forEach(header => {
        header.focus();
        expect(document.activeElement).toBe(header);
      });
    });
  });

  describe('Integration Tests', () => {
    test('integrates with API data correctly', async () => {
      // Mock API response
      const apiData = {
        data: mockData,
        status: 200,
        headers: { 'content-type': 'application/json' }
      };

      mockApiRequest({
        url: '/documents',
        method: 'GET',
        data: apiData.data
      });

      // Validate test data
      expect(validateTestData(apiData.data, {
        type: 'array',
        properties: {
          documentId: { type: 'string' },
          title: { type: 'string' },
          category: { type: 'string' },
          createdAt: { type: 'date' }
        }
      })).toBeTruthy();

      render(<Table columns={mockColumns} data={apiData.data} />);

      await waitFor(() => {
        apiData.data.forEach(item => {
          expect(screen.getByText(item.title)).toBeInTheDocument();
        });
      });
    });

    test('handles large datasets efficiently', async () => {
      // Generate large dataset
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        documentId: `doc-${i}`,
        title: `Document ${i}`,
        category: i % 2 === 0 ? 'Legal' : 'Medical',
        status: 'active',
        metadata: {},
        createdAt: new Date(2023, 0, i + 1),
        updatedAt: new Date(2023, 0, i + 1)
      }));

      const { container } = render(<Table columns={mockColumns} data={largeData} />);

      // Verify rendering performance
      expect(container.querySelectorAll('tr').length).toBe(1001); // 1000 rows + header
      
      // Test sorting with large dataset
      fireEvent.click(screen.getByText('Title'));
      await waitFor(() => {
        const firstRow = container.querySelector('tbody tr');
        expect(firstRow).toHaveTextContent('Document 0');
      });
    });
  });
});