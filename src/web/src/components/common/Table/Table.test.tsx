import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Table } from './Table';
import { renderWithProviders } from '../../../utils/test.util';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock data for testing
const mockColumns = [
  { id: 'name', label: 'Name', sortable: true, minWidth: '200px' },
  { id: 'age', label: 'Age', sortable: true, minWidth: '100px' },
  { id: 'status', label: 'Status', sortable: false, minWidth: '150px' }
];

const mockData = [
  { name: 'John Smith', age: 65, status: 'Active' },
  { name: 'Jane Doe', age: 70, status: 'Inactive' },
  { name: 'Robert Johnson', age: 68, status: 'Active' }
];

// Test setup helper
const setup = () => {
  const onSort = jest.fn();
  const onPageChange = jest.fn();
  const user = userEvent.setup();

  const defaultProps = {
    columns: mockColumns,
    data: mockData,
    loading: false,
    sortable: true,
    pagination: true,
    onSort,
    onPageChange,
    ariaLabel: 'Test table',
    highContrast: false,
    reducedMotion: false
  };

  return {
    user,
    onSort,
    onPageChange,
    defaultProps
  };
};

describe('Table Component', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { defaultProps } = setup();
      renderWithProviders(<Table {...defaultProps} />);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('displays loading state correctly', async () => {
      const { defaultProps } = setup();
      renderWithProviders(<Table {...defaultProps} loading={true} />);
      
      const loadingSpinner = screen.getByLabelText(/loading/i);
      expect(loadingSpinner).toBeInTheDocument();
      expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    });

    it('displays no data message when data is empty', () => {
      const { defaultProps } = setup();
      renderWithProviders(<Table {...defaultProps} data={[]} />);
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('meets WCAG 2.1 Level AA standards', async () => {
      const { defaultProps } = setup();
      const { container } = renderWithProviders(<Table {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides correct ARIA attributes for sorting', () => {
      const { defaultProps } = setup();
      renderWithProviders(<Table {...defaultProps} />);
      
      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      expect(nameHeader).toHaveAttribute('aria-sort');
    });

    it('announces sort changes to screen readers', async () => {
      const { defaultProps, user } = setup();
      renderWithProviders(<Table {...defaultProps} />);
      
      const nameHeader = screen.getByRole('button', { name: /sort by name/i });
      await user.click(nameHeader);
      
      const announcement = screen.getByRole('status');
      expect(announcement).toHaveTextContent(/sorted by name/i);
    });

    it('supports keyboard navigation', async () => {
      const { defaultProps, user } = setup();
      renderWithProviders(<Table {...defaultProps} />);
      
      const firstHeader = screen.getByRole('button', { name: /sort by name/i });
      await user.tab();
      expect(firstHeader).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(defaultProps.onSort).toHaveBeenCalled();
    });
  });

  describe('Senior-Friendly Features', () => {
    it('maintains minimum font size for readability', () => {
      const { defaultProps } = setup();
      renderWithProviders(<Table {...defaultProps} />);
      
      const table = screen.getByRole('table');
      const computedStyle = window.getComputedStyle(table);
      expect(parseInt(computedStyle.fontSize)).toBeGreaterThanOrEqual(16);
    });

    it('provides adequate touch targets for interactive elements', () => {
      const { defaultProps } = setup();
      renderWithProviders(<Table {...defaultProps} />);
      
      const sortButtons = screen.getAllByRole('button');
      sortButtons.forEach(button => {
        const { height, width } = button.getBoundingClientRect();
        expect(height).toBeGreaterThanOrEqual(44);
        expect(width).toBeGreaterThanOrEqual(44);
      });
    });

    it('supports high contrast mode', () => {
      const { defaultProps } = setup();
      renderWithProviders(<Table {...defaultProps} highContrast={true} />);
      
      const table = screen.getByRole('table');
      const computedStyle = window.getComputedStyle(table);
      expect(computedStyle.backgroundColor).toBe('rgb(229, 231, 235)'); // grey-200
    });
  });

  describe('Sorting Functionality', () => {
    it('handles column sorting correctly', async () => {
      const { defaultProps, user } = setup();
      renderWithProviders(<Table {...defaultProps} />);
      
      const nameHeader = screen.getByRole('button', { name: /sort by name/i });
      await user.click(nameHeader);
      
      expect(defaultProps.onSort).toHaveBeenCalledWith('name', 'asc');
      
      await user.click(nameHeader);
      expect(defaultProps.onSort).toHaveBeenCalledWith('name', 'desc');
    });

    it('disables sorting for non-sortable columns', async () => {
      const { defaultProps, user } = setup();
      renderWithProviders(<Table {...defaultProps} />);
      
      const statusCell = screen.getByRole('columnheader', { name: /status/i });
      expect(statusCell).not.toHaveAttribute('aria-sort');
      expect(statusCell).not.toContainElement(screen.queryByRole('button'));
    });
  });

  describe('Pagination Features', () => {
    it('handles page changes correctly', async () => {
      const { defaultProps, user } = setup();
      const manyRows = Array(15).fill(null).map((_, i) => ({
        name: `Person ${i}`,
        age: 60 + i,
        status: 'Active'
      }));
      
      renderWithProviders(<Table {...defaultProps} data={manyRows} />);
      
      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);
      
      expect(defaultProps.onPageChange).toHaveBeenCalledWith(1);
    });

    it('announces page changes to screen readers', async () => {
      const { defaultProps, user } = setup();
      const manyRows = Array(15).fill(null).map((_, i) => ({
        name: `Person ${i}`,
        age: 60 + i,
        status: 'Active'
      }));
      
      renderWithProviders(<Table {...defaultProps} data={manyRows} />);
      
      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);
      
      const announcement = screen.getByRole('status');
      expect(announcement).toHaveTextContent(/showing page 2/i);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('handles large datasets efficiently', async () => {
      const { defaultProps } = setup();
      const largeDataset = Array(1000).fill(null).map((_, i) => ({
        name: `Person ${i}`,
        age: 60 + (i % 40),
        status: i % 2 === 0 ? 'Active' : 'Inactive'
      }));
      
      const startTime = performance.now();
      renderWithProviders(<Table {...defaultProps} data={largeDataset} />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Render time should be under 100ms
    });

    it('gracefully handles undefined data', () => {
      const { defaultProps } = setup();
      renderWithProviders(<Table {...defaultProps} data={undefined as any} />);
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });
});