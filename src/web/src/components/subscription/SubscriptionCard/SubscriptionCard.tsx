/**
 * Estate Kit - SubscriptionCard Component
 * 
 * Requirements addressed:
 * - Subscription Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Provides a user interface for displaying subscription details such as plan, status, and actions.
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Ensures consistent design and theming across the web application.
 * - Accessibility Compliance (Technical Specifications/3.1 User Interface Design/Accessibility)
 *   Implements WCAG 2.1 Level AA standards for accessible subscription information display.
 * 
 * Human Tasks:
 * 1. Verify color contrast ratios meet WCAG 2.1 Level AA standards
 * 2. Test component behavior across different viewport sizes
 * 3. Validate accessibility with screen readers
 */

import React from 'react';
import { SubscriptionTypes } from '../../types/subscription.types';
import { formatDate } from '../../utils/format.util';
import Button from '../common/Button/Button';
import '../../styles/global.css';
import { theme } from '../../config/theme.config';

interface SubscriptionCardProps {
  subscription: SubscriptionTypes;
  onRenew?: () => void;
  onCancel?: () => void;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  onRenew,
  onCancel
}) => {
  const {
    plan,
    status,
    startDate,
    endDate
  } = subscription;

  // Card container styles
  const cardStyles: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: theme.shape.borderRadius,
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${theme.palette.primary.main}`,
    maxWidth: '400px',
    width: '100%',
  };

  // Status badge styles
  const statusBadgeStyles: React.CSSProperties = {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '14px',
    fontWeight: 500,
    backgroundColor: status === 'active' 
      ? `${theme.palette.primary.main}20`
      : status === 'inactive'
        ? `${theme.palette.secondary.main}20`
        : '#f5f5f5',
    color: status === 'active'
      ? theme.palette.primary.main
      : status === 'inactive'
        ? theme.palette.secondary.main
        : '#666666',
  };

  // Text styles
  const labelStyles: React.CSSProperties = {
    fontSize: '14px',
    color: '#666666',
    marginBottom: '4px',
  };

  const valueStyles: React.CSSProperties = {
    fontSize: '16px',
    color: '#333333',
    marginBottom: '16px',
  };

  // Actions container styles
  const actionsStyles: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  };

  return (
    <div 
      style={cardStyles}
      role="region"
      aria-label="Subscription Details"
    >
      {/* Plan Information */}
      <div>
        <div style={labelStyles}>Plan</div>
        <div style={valueStyles}>{plan}</div>
      </div>

      {/* Status Badge */}
      <div style={{ marginBottom: '16px' }}>
        <div style={labelStyles}>Status</div>
        <span 
          style={statusBadgeStyles}
          role="status"
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {/* Dates */}
      <div>
        <div style={labelStyles}>Start Date</div>
        <div style={valueStyles}>{formatDate(startDate)}</div>

        <div style={labelStyles}>End Date</div>
        <div style={valueStyles}>{formatDate(endDate)}</div>
      </div>

      {/* Action Buttons */}
      <div style={actionsStyles}>
        {status !== 'cancelled' && onRenew && (
          <Button
            label="Renew Subscription"
            variant="primary"
            onClick={onRenew}
            ariaLabel="Renew your subscription"
          />
        )}
        {status === 'active' && onCancel && (
          <Button
            label="Cancel Subscription"
            variant="outlined"
            onClick={onCancel}
            ariaLabel="Cancel your subscription"
          />
        )}
      </div>
    </div>
  );
};

export default SubscriptionCard;