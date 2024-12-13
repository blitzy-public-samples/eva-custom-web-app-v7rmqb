/**
 * @fileoverview Date utility functions for Estate Kit platform
 * Provides standardized date formatting and manipulation with senior-friendly formats
 * @version 1.0.0
 */

import { format, formatDistance, parseISO, isValid, addDays, subDays } from 'date-fns'; // v2.30.0
import { enCA } from 'date-fns/locale'; // v2.30.0

// Constants for standardized date formats across the application
export const DEFAULT_DATE_FORMAT = 'MMMM d, yyyy';
export const TIME_FORMAT = 'h:mm a';
export const DATE_TIME_FORMAT = 'MMMM d, yyyy h:mm a';

/**
 * Formats a date string into a human-readable format
 * @param date - Date string or Date object to format
 * @param formatString - Optional custom format string
 * @returns Formatted date string in specified format or default format
 * @throws Error if date is invalid
 */
export const formatDate = (date: string | Date, formatString?: string): string => {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValidDate(parsedDate)) {
      throw new Error('Invalid date provided');
    }

    return format(parsedDate, formatString || DEFAULT_DATE_FORMAT, {
      locale: enCA // Use Canadian English locale for formatting
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    throw new Error('Failed to format date');
  }
};

/**
 * Formats a date relative to current time (e.g., '2 days ago')
 * Provides senior-friendly relative time descriptions
 * @param date - Date string or Date object to format
 * @returns Human-readable relative time string
 * @throws Error if date is invalid
 */
export const formatRelativeTime = (date: string | Date): string => {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValidDate(parsedDate)) {
      throw new Error('Invalid date provided');
    }

    return formatDistance(parsedDate, new Date(), {
      addSuffix: true,
      locale: enCA
    });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    throw new Error('Failed to format relative time');
  }
};

/**
 * Validates if a given date string or Date object is valid
 * @param date - Date string or Date object to validate
 * @returns Boolean indicating if date is valid
 */
export const isValidDate = (date: string | Date): boolean => {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return isValid(parsedDate);
  } catch {
    return false;
  }
};

/**
 * Adds specified number of days to a date
 * @param date - Date string or Date object to add days to
 * @param days - Number of days to add
 * @returns New Date object with added days
 * @throws Error if date is invalid
 */
export const addDaysToDate = (date: string | Date, days: number): Date => {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValidDate(parsedDate)) {
      throw new Error('Invalid date provided');
    }

    return addDays(parsedDate, days);
  } catch (error) {
    console.error('Error adding days to date:', error);
    throw new Error('Failed to add days to date');
  }
};

/**
 * Subtracts specified number of days from a date
 * @param date - Date string or Date object to subtract days from
 * @param days - Number of days to subtract
 * @returns New Date object with subtracted days
 * @throws Error if date is invalid
 */
export const subtractDaysFromDate = (date: string | Date, days: number): Date => {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValidDate(parsedDate)) {
      throw new Error('Invalid date provided');
    }

    return subDays(parsedDate, days);
  } catch (error) {
    console.error('Error subtracting days from date:', error);
    throw new Error('Failed to subtract days from date');
  }
};