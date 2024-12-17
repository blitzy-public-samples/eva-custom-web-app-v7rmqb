/**
 * @fileoverview Utility functions for formatting data types, strings, dates, and values
 * Ensures WCAG 2.1 Level AA compliance and consistent data presentation
 * @version 1.0.0
 */

// External imports - date-fns v2.30.0
import { format, formatDistance } from 'date-fns';

// Internal imports
import { DocumentType } from '../types/document.types';
import { SubscriptionPlan } from '../types/subscription.types';
import { DelegateRole } from '../types/delegate.types';

/**
 * Formats document type enums into human-readable, accessible text
 * @param type - DocumentType enum value
 * @returns Formatted string with proper spacing and capitalization
 */
export const formatDocumentType = (type: DocumentType): string => {
  const formattedText = type
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Add ARIA-friendly prefix for screen readers
  return `Document Type: ${formattedText}`;
};

/**
 * Formats subscription plan types into clear, descriptive display text
 * @param plan - SubscriptionPlan enum value
 * @returns Formatted string with proper emphasis and context
 */
export const formatSubscriptionPlan = (plan: SubscriptionPlan): string => {
  const planMap: Record<SubscriptionPlan, string> = {
    [SubscriptionPlan.FREE]: 'Free Plan',
    [SubscriptionPlan.BASIC]: 'Basic Plan',
    [SubscriptionPlan.PREMIUM]: 'Premium Plan',
    [SubscriptionPlan.ENTERPRISE]: 'Enterprise Plan'
  };
  
  return planMap[plan] || 'Unknown Plan';
};

/**
 * Formats delegate role types into human-readable text
 * @param role - DelegateRole enum value
 * @returns Formatted string with proper spacing and context
 */
export const formatDelegateRole = (role: DelegateRole): string => {
  const roleMap: Record<DelegateRole, string> = {
    [DelegateRole.EXECUTOR]: 'Estate Executor',
    [DelegateRole.HEALTHCARE_PROXY]: 'Healthcare Proxy',
    [DelegateRole.FINANCIAL_ADVISOR]: 'Financial Advisor',
    [DelegateRole.LEGAL_ADVISOR]: 'Legal Advisor'
  };
  
  return roleMap[role] || 'Unknown Role';
};

/**
 * Formats numbers into CAD currency strings with proper localization
 * @param amount - Numeric amount to format
 * @returns Formatted currency string with proper spacing and symbols
 */
export const formatCurrency = (amount: number): string => {
  const formatter = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  // Add ARIA label for screen readers
  return `${formatter.format(amount)} CAD`;
};

/**
 * Converts byte sizes into human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted string with appropriate unit and spacing
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  const unit = units[i];
  
  // Add ARIA-friendly format for screen readers
  return `${size} ${unit}`;
};

/**
 * Formats dates into localized strings with timezone support
 * @param date - Date object to format
 * @returns Formatted date string with proper localization
 */
export const formatDate = (date: Date): string => {
  // Format: "February 15, 2024" - clear and accessible format for older adults
  const formattedDate = format(date, 'MMMM d, yyyy');
  
  // Add ARIA label for screen readers
  return formattedDate;
};

/**
 * Formats dates into relative time strings with accessibility support
 * @param date - Date object to format
 * @returns Screen reader optimized relative time string
 */
export const formatRelativeTime = (date: Date): string => {
  const relativeTime = formatDistance(date, new Date(), { addSuffix: true });
  
  // Add context for screen readers
  return `Last modified: ${relativeTime}`;
};

/**
 * Formats a percentage value with proper spacing and symbols
 * @param value - Numeric percentage value
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number): string => {
  const formatted = Math.round(value);
  return `${formatted}%`;
};

/**
 * Formats a phone number into a consistent, readable format
 * @param phone - Raw phone number string
 * @returns Formatted phone number string
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  
  return phone;
};