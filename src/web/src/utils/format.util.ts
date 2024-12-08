/**
 * Estate Kit - Frontend Format Utilities
 * 
 * Requirements addressed:
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Ensures consistent formatting of user-facing data such as dates and strings across the web application.
 * 
 * Human Tasks:
 * 1. Verify date formatting aligns with regional/locale requirements
 * 2. Confirm subscription status display text meets UX guidelines
 * 3. Review document title formatting rules with content team
 */

import { AuthTypes } from '../types/auth.types';
import { SubscriptionTypes } from '../types/subscription.types';
import { DocumentTypes } from '../types/document.types';
import { DelegateTypes } from '../types/delegate.types';
import { theme } from '../config/theme.config';

/**
 * Formats a JavaScript Date object into a user-friendly string.
 * Implements consistent date formatting across the application.
 * 
 * @param date - The date to format
 * @returns A formatted date string suitable for display in the UI
 */
export function formatDate(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date provided to formatDate');
  }

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };

  try {
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return date.toLocaleString(); // Fallback format
  }
}

/**
 * Formats a subscription status into a user-friendly string.
 * Maps technical status values to user-friendly display text.
 * 
 * @param status - The subscription status to format
 * @returns A user-friendly string representation of the subscription status
 */
export function formatSubscriptionStatus(status: SubscriptionTypes['status']): string {
  const statusMap: Record<SubscriptionTypes['status'], string> = {
    'active': 'Active Subscription',
    'inactive': 'Subscription Paused',
    'cancelled': 'Subscription Cancelled'
  };

  if (!(status in statusMap)) {
    throw new Error(`Invalid subscription status: ${status}`);
  }

  const statusColor = {
    'active': theme.palette.primary.main,
    'inactive': theme.palette.text.secondary,
    'cancelled': theme.palette.error.main
  }[status];

  // Return formatted status with appropriate color styling
  return `<span style="color: ${statusColor}">${statusMap[status]}</span>`;
}

/**
 * Formats a document title for display purposes.
 * Implements consistent title formatting rules across the application.
 * 
 * @param title - The document title to format
 * @returns A formatted document title string
 */
export function formatDocumentTitle(title: DocumentTypes['title']): string {
  if (typeof title !== 'string') {
    throw new Error('Invalid document title provided');
  }

  // Trim whitespace and handle empty titles
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    return 'Untitled Document';
  }

  // Capitalize first letter of each word, preserving special characters
  return trimmedTitle
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      return word[0].toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ')
    // Preserve common abbreviations
    .replace(/\b(id|ssn|ein)\b/gi, match => match.toUpperCase())
    // Handle special characters
    .replace(/([.?!])\s+([a-z])/g, (_, punctuation, letter) => 
      `${punctuation} ${letter.toUpperCase()}`
    );
}