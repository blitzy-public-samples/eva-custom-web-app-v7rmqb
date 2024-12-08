/**
 * Estate Kit - Frontend Date Utilities
 * 
 * Requirements addressed:
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Ensures consistent formatting of user-facing data such as dates across the web application.
 * - Data Validation (Technical Specifications/2.7 Cross-Cutting Concerns/Security Architecture)
 *   Implements validation mechanisms to ensure data integrity and prevent invalid inputs.
 * 
 * Human Tasks:
 * 1. Verify date formatting aligns with regional/locale requirements
 * 2. Confirm timezone handling meets user expectations
 * 3. Review date validation rules with backend team
 */

import { formatDate } from './format.util';
import { validateDocument } from './validation.util';
import { DocumentTypes } from '../types/document.types';

/**
 * Formats the createdAt and updatedAt dates of a document object into user-friendly strings.
 * Implements consistent date formatting across the application.
 * 
 * @param document - The document object containing dates to format
 * @returns An object containing the formatted createdAt and updatedAt dates
 * @throws Error if the document object is invalid or dates are missing
 */
export function formatDocumentDates(document: DocumentTypes): { 
  createdAt: string; 
  updatedAt: string; 
} {
  // Validate the document object
  if (!validateDocument(document)) {
    throw new Error('Invalid document object provided to formatDocumentDates');
  }

  // Validate that required date fields exist
  if (!document.createdAt || !document.updatedAt) {
    throw new Error('Document missing required date fields');
  }

  // Ensure dates are valid Date objects
  if (!(document.createdAt instanceof Date) || !(document.updatedAt instanceof Date)) {
    throw new Error('Invalid date objects in document');
  }

  try {
    // Format the dates using the formatDate utility
    const formattedCreatedAt = formatDate(document.createdAt);
    const formattedUpdatedAt = formatDate(document.updatedAt);

    return {
      createdAt: formattedCreatedAt,
      updatedAt: formattedUpdatedAt
    };
  } catch (error) {
    console.error('Error formatting document dates:', error);
    throw new Error('Failed to format document dates');
  }
}

/**
 * Retrieves the current date and formats it into a user-friendly string.
 * Ensures consistent date formatting across the application.
 * 
 * @returns A formatted string representing the current date
 */
export function getCurrentDate(): string {
  try {
    const currentDate = new Date();
    
    // Validate that we have a valid date object
    if (isNaN(currentDate.getTime())) {
      throw new Error('Invalid current date');
    }

    // Format the current date using the formatDate utility
    return formatDate(currentDate);
  } catch (error) {
    console.error('Error getting current date:', error);
    throw new Error('Failed to get current date');
  }
}