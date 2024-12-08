/**
 * Estate Kit - Document List Component
 * 
 * Requirements addressed:
 * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 *   Provides a user interface for listing and managing documents, including sorting and displaying metadata.
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Ensures consistent design and functionality for document listing and interaction.
 * - Accessibility Compliance (Technical Specifications/3.1 User Interface Design/Accessibility)
 *   Adheres to WCAG 2.1 Level AA standards for accessible tabular data presentation.
 * 
 * Human Tasks:
 * 1. Verify table column configuration matches design requirements
 * 2. Test document sorting functionality with large datasets
 * 3. Validate accessibility features with screen readers
 * 4. Review date formatting for different locales
 */

import React, { useCallback, useMemo } from 'react';
import { DocumentTypes } from '../../types/document.types';
import useDocument from '../../hooks/useDocument';
import { Table } from '../common/Table/Table';

/**
 * DocumentList component displays a list of documents in a tabular format
 * with sorting capabilities and accessibility features.
 */
const DocumentList: React.FC = () => {
  // Use the document hook to fetch and manage document data
  const { 
    documents, 
    loading, 
    error, 
    formatDates 
  } = useDocument();

  // Define table columns with sorting configuration
  const columns = useMemo(() => [
    {
      key: 'title',
      label: 'Document Title',
      sortable: true,
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      sortable: true,
    },
    {
      key: 'updatedAt',
      label: 'Last Modified',
      sortable: true,
    },
  ], []);

  // Format document data for table display
  const formatDocumentData = useCallback((doc: DocumentTypes) => {
    const dates = formatDates(doc);
    return {
      ...doc,
      createdAt: dates.createdAt,
      updatedAt: dates.updatedAt,
    };
  }, [formatDates]);

  // Handle loading state
  if (loading) {
    return (
      <div 
        role="status" 
        aria-live="polite" 
        className="flex justify-center items-center p-4"
      >
        <span className="sr-only">Loading documents...</span>
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div 
        role="alert" 
        className="p-4 text-error bg-error-light rounded"
      >
        <h2 className="text-lg font-semibold">Error Loading Documents</h2>
        <p>{error.message}</p>
      </div>
    );
  }

  // Handle empty state
  if (!documents.length) {
    return (
      <div 
        role="status" 
        className="p-4 text-center bg-gray-50 rounded"
      >
        <h2 className="text-lg font-semibold">No Documents Found</h2>
        <p>There are currently no documents to display.</p>
      </div>
    );
  }

  // Render document table
  return (
    <div className="bg-white rounded shadow">
      <Table
        columns={columns}
        data={documents.map(formatDocumentData)}
        className="w-full"
        aria-label="Document List"
      />
    </div>
  );
};

export default DocumentList;