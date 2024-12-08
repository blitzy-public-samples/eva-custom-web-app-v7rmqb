/**
 * Estate Kit - Reusable Table Component
 * 
 * Requirements addressed:
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Implements consistent table styling and behavior across the application
 * - Accessibility Compliance (Technical Specifications/3.1 User Interface Design/Accessibility)
 *   Provides accessible table structure with proper ARIA attributes and keyboard navigation
 * 
 * Human Tasks:
 * 1. Verify table styling matches design system specifications
 * 2. Test keyboard navigation and screen reader compatibility
 * 3. Validate sorting behavior with large datasets
 */

import React, { useState, useCallback } from 'react';
import { formatDate, formatDocumentTitle } from '../../utils/format.util';
import { DocumentTypes } from '../../types/document.types';
import { SubscriptionTypes } from '../../types/subscription.types';

// Import styles
import '../../styles/global.css';
import '../../styles/typography.css';

interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

interface TableProps {
  columns: TableColumn[];
  data: Array<DocumentTypes | SubscriptionTypes>;
  className?: string;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export const Table: React.FC<TableProps> = ({ columns, data, className = '' }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Sort data based on column and direction
  const sortData = useCallback((columnKey: string, direction: 'asc' | 'desc') => {
    return [...data].sort((a, b) => {
      let aValue = a[columnKey];
      let bValue = b[columnKey];

      // Format values based on column type
      if (columnKey === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (columnKey === 'title') {
        aValue = formatDocumentTitle(aValue as string);
        bValue = formatDocumentTitle(bValue as string);
      }

      if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data]);

  // Handle column header click for sorting
  const handleSort = useCallback((columnKey: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === columnKey && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    setSortConfig({ key: columnKey, direction });
  }, [sortConfig]);

  // Render table header with sort indicators
  const renderTableHeader = useCallback(() => {
    return (
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              onClick={() => column.sortable && handleSort(column.key)}
              className={`px-4 py-2 text-left font-semibold ${column.sortable ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              role={column.sortable ? 'button' : undefined}
              tabIndex={column.sortable ? 0 : undefined}
              aria-sort={
                sortConfig?.key === column.key
                  ? sortConfig.direction === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : undefined
              }
            >
              <div className="flex items-center">
                {column.label}
                {column.sortable && (
                  <span className="ml-2" aria-hidden="true">
                    {sortConfig?.key === column.key ? (
                      sortConfig.direction === 'asc' ? '↑' : '↓'
                    ) : '↕'}
                  </span>
                )}
              </div>
            </th>
          ))}
        </tr>
      </thead>
    );
  }, [columns, sortConfig, handleSort]);

  // Render table body with formatted data
  const renderTableBody = useCallback(() => {
    const sortedData = sortConfig
      ? sortData(sortConfig.key, sortConfig.direction)
      : data;

    return (
      <tbody>
        {sortedData.map((row, rowIndex) => (
          <tr
            key={rowIndex}
            className={`border-t border-gray-200 ${
              rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
            }`}
          >
            {columns.map((column) => {
              let cellContent = row[column.key];

              // Format cell content based on column type
              if (column.key === 'createdAt') {
                cellContent = formatDate(cellContent as Date);
              } else if (column.key === 'title') {
                cellContent = formatDocumentTitle(cellContent as string);
              }

              return (
                <td
                  key={column.key}
                  className="px-4 py-2"
                  role="cell"
                >
                  {cellContent}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    );
  }, [columns, data, sortConfig, sortData]);

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table
        className="w-full border-collapse"
        role="grid"
        aria-label="Data table"
      >
        {renderTableHeader()}
        {renderTableBody()}
      </table>
    </div>
  );
};

export default Table;