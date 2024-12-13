import React, { useState, useEffect, useRef } from 'react';
import { 
  Table as MuiTable, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Paper,
  useTheme
} from '@mui/material';
import Loading from '../Loading/Loading';

// Constants for configuration
const ITEMS_PER_PAGE = 10;
const ARIA_SORT_ASCENDING = 'ascending';
const ARIA_SORT_DESCENDING = 'descending';
const ARIA_LIVE_REGION_ID = 'table-live-region';

// Interface for column configuration
interface Column {
  id: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

// Interface for component props
interface TableProps {
  columns: Column[];
  data: Record<string, any>[];
  loading?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  onSort?: (columnId: string, direction: 'asc' | 'desc') => void;
  onPageChange?: (page: number) => void;
  ariaLabel?: string;
  highContrast?: boolean;
  reducedMotion?: boolean;
}

/**
 * Enhanced table component with accessibility features and senior-friendly design
 * Implements WCAG 2.1 Level AA standards with comprehensive ARIA support
 */
const Table: React.FC<TableProps> = ({
  columns,
  data,
  loading = false,
  sortable = true,
  pagination = true,
  onSort,
  onPageChange,
  ariaLabel = 'Data table',
  highContrast = false,
  reducedMotion = false,
}) => {
  const theme = useTheme();
  const [currentPage, setCurrentPage] = useState(0);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const tableRef = useRef<HTMLDivElement>(null);
  const announceRef = useRef<HTMLDivElement>(null);

  // Calculate pagination values
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentData = data.slice(startIndex, endIndex);

  /**
   * Announces messages to screen readers via live region
   */
  const announceToScreenReader = (message: string) => {
    if (announceRef.current) {
      announceRef.current.textContent = '';
      // Use setTimeout to ensure the DOM update triggers a new announcement
      setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = message;
        }
      }, 100);
    }
  };

  /**
   * Handles column sorting with accessibility announcements
   */
  const handleSort = (columnId: string) => {
    if (!sortable) return;

    const column = columns.find(col => col.id === columnId);
    if (!column?.sortable) return;

    const newDirection = columnId === sortColumn && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(columnId);
    setSortDirection(newDirection);

    // Announce sort change to screen readers
    const message = `Table sorted by ${column.label} in ${newDirection === 'asc' ? 'ascending' : 'descending'} order`;
    announceToScreenReader(message);

    // Reset to first page when sorting changes
    setCurrentPage(0);
    onSort?.(columnId, newDirection);
  };

  /**
   * Handles pagination with accessibility announcements
   */
  const handlePageChange = (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setCurrentPage(newPage);

    // Announce page change to screen readers
    const message = `Showing page ${newPage + 1} of ${totalPages}`;
    announceToScreenReader(message);

    // Scroll table into view if needed
    tableRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    onPageChange?.(newPage);
  };

  // Enhanced styles for senior-friendly design
  const tableStyles = {
    fontSize: theme.typography.body1.fontSize,
    '& th': {
      fontWeight: theme.typography.fontWeightBold,
      backgroundColor: highContrast ? theme.palette.grey[200] : theme.palette.background.paper,
      color: theme.palette.text.primary,
      padding: theme.spacing(2),
    },
    '& td': {
      padding: theme.spacing(2),
      color: theme.palette.text.primary,
    },
    '& tr:hover': {
      backgroundColor: highContrast ? theme.palette.action.hover : 'inherit',
    },
  };

  return (
    <div ref={tableRef}>
      {/* Hidden live region for screen reader announcements */}
      <div
        id={ARIA_LIVE_REGION_ID}
        ref={announceRef}
        aria-live="polite"
        aria-atomic="true"
        className="visually-hidden"
      />

      <TableContainer component={Paper}>
        <MuiTable 
          aria-label={ariaLabel}
          aria-busy={loading}
          sx={tableStyles}
        >
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  style={{ width: column.width }}
                  aria-sort={
                    sortColumn === column.id
                      ? sortDirection === 'asc'
                        ? ARIA_SORT_ASCENDING
                        : ARIA_SORT_DESCENDING
                      : undefined
                  }
                >
                  {column.sortable && sortable ? (
                    <button
                      onClick={() => handleSort(column.id)}
                      className="table-sort-button"
                      aria-label={`Sort by ${column.label}`}
                    >
                      {column.label}
                    </button>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <Loading size="medium" label="Loading table data..." />
                </TableCell>
              </TableRow>
            ) : currentData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.id}>
                      {row[column.id]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </MuiTable>

        {pagination && data.length > ITEMS_PER_PAGE && (
          <TablePagination
            component="div"
            count={data.length}
            page={currentPage}
            onPageChange={handlePageChange}
            rowsPerPage={ITEMS_PER_PAGE}
            rowsPerPageOptions={[ITEMS_PER_PAGE]}
            aria-label="Table pagination"
          />
        )}
      </TableContainer>

      <style jsx>{`
        .visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .table-sort-button {
          background: none;
          border: none;
          padding: 0;
          font: inherit;
          color: inherit;
          cursor: pointer;
          min-height: 44px;
          min-width: 44px;
          display: inline-flex;
          align-items: center;
          text-align: left;
        }

        .table-sort-button:hover {
          text-decoration: underline;
        }

        .table-sort-button:focus {
          outline: 2px solid ${theme.palette.primary.main};
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

export default Table;