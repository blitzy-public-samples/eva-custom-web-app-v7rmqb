import React from 'react';
import { Typography, Chip, IconButton, Tooltip, Box, CircularProgress, Alert } from '@mui/material';
import { Edit, Delete, AccessTime, Check, Error, Info } from '@mui/icons-material';
import { format } from 'date-fns'; // v2.30+
import Card, { CardProps } from '../../common/Card/Card';
import { 
  Delegate, 
  DelegateRole, 
  DelegateStatus, 
  DelegatePermission,
  ResourceType,
  AccessLevel 
} from '../../../types/delegate.types';

/**
 * Props interface for DelegateCard component with enhanced accessibility options
 */
export interface DelegateCardProps {
  delegate: Delegate;
  onEdit?: (delegateId: string) => void;
  onDelete?: (delegateId: string) => void;
  className?: string;
  testId?: string;
  loading?: boolean;
  error?: string;
  showConfirmation?: boolean;
}

/**
 * Maps delegate roles to senior-friendly display text
 */
const ROLE_DISPLAY: Record<DelegateRole, string> = {
  [DelegateRole.EXECUTOR]: 'Estate Executor',
  [DelegateRole.HEALTHCARE_PROXY]: 'Healthcare Representative',
  [DelegateRole.FINANCIAL_ADVISOR]: 'Financial Advisor',
  [DelegateRole.LEGAL_ADVISOR]: 'Legal Advisor'
};

/**
 * Returns WCAG-compliant color for status chip based on delegate status
 */
const getStatusColor = (status: DelegateStatus): string => {
  switch (status) {
    case DelegateStatus.ACTIVE:
      return 'success';
    case DelegateStatus.PENDING:
      return 'warning';
    case DelegateStatus.EXPIRED:
    case DelegateStatus.REVOKED:
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Formats delegate permissions into senior-friendly readable text
 */
const formatPermissions = (permissions: DelegatePermission[]): string => {
  const permissionsByType = permissions.reduce((acc, perm) => {
    if (perm.accessLevel === AccessLevel.NONE) return acc;
    
    const displayText = {
      [ResourceType.PERSONAL_INFO]: 'Personal Information',
      [ResourceType.FINANCIAL_DATA]: 'Financial Documents',
      [ResourceType.MEDICAL_DATA]: 'Medical Records',
      [ResourceType.LEGAL_DOCS]: 'Legal Documents'
    }[perm.resourceType];

    return `${acc}${acc ? ', ' : ''}${displayText} (${perm.accessLevel === AccessLevel.READ ? 'View Only' : 'Full Access'})`;
  }, '');

  return permissionsByType || 'No permissions assigned';
};

/**
 * Senior-friendly delegate card component with enhanced accessibility features
 * Displays delegate information with clear visual hierarchy and intuitive actions
 */
export const DelegateCard: React.FC<DelegateCardProps> = ({
  delegate,
  onEdit,
  onDelete,
  className,
  testId = 'delegate-card',
  loading = false,
  error,
  showConfirmation = false,
}) => {
  const statusText = {
    [DelegateStatus.ACTIVE]: 'Active',
    [DelegateStatus.PENDING]: 'Invitation Pending',
    [DelegateStatus.EXPIRED]: 'Access Expired',
    [DelegateStatus.REVOKED]: 'Access Revoked'
  }[delegate.status];

  const actions = React.useMemo(() => {
    const buttons = [];

    if (onEdit) {
      buttons.push(
        <Tooltip 
          title="Edit Delegate Access" 
          arrow 
          enterDelay={1500}
          key="edit"
        >
          <IconButton
            onClick={() => onEdit(delegate.id.toString())}
            aria-label="Edit delegate access"
            size="large"
            color="primary"
          >
            <Edit fontSize="large" />
          </IconButton>
        </Tooltip>
      );
    }

    if (onDelete) {
      buttons.push(
        <Tooltip 
          title="Remove Delegate Access" 
          arrow 
          enterDelay={1500}
          key="delete"
        >
          <IconButton
            onClick={() => onDelete(delegate.id.toString())}
            aria-label="Remove delegate access"
            size="large"
            color="error"
          >
            <Delete fontSize="large" />
          </IconButton>
        </Tooltip>
      );
    }

    return buttons;
  }, [delegate.id, onEdit, onDelete]);

  if (loading) {
    return (
      <Card
        title="Loading Delegate Information"
        testId={`${testId}-loading`}
        className={className}
      >
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress size={48} thickness={4} />
        </Box>
      </Card>
    );
  }

  if (error) {
    return (
      <Card
        title="Error Loading Delegate"
        testId={`${testId}-error`}
        className={className}
      >
        <Alert 
          severity="error"
          icon={<Error fontSize="large" />}
          sx={{ fontSize: '1.125rem' }}
        >
          {error}
        </Alert>
      </Card>
    );
  }

  return (
    <Card
      title={delegate.name}
      subtitle={ROLE_DISPLAY[delegate.role]}
      actions={actions}
      testId={testId}
      className={className}
      ariaLabel={`Delegate card for ${delegate.name}`}
    >
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="body1"
          component="div"
          gutterBottom
          sx={{ fontSize: '1.125rem' }}
        >
          <Box component="span" sx={{ fontWeight: 'medium', mr: 1 }}>
            Email:
          </Box>
          {delegate.email}
        </Typography>

        <Box display="flex" alignItems="center" mb={2}>
          <Chip
            icon={delegate.status === DelegateStatus.ACTIVE ? <Check /> : <Info />}
            label={statusText}
            color={getStatusColor(delegate.status)}
            size="large"
            sx={{ 
              fontSize: '1rem',
              height: '32px',
              mr: 2
            }}
          />
          
          <Tooltip title="Last access time" arrow enterDelay={1500}>
            <Box display="flex" alignItems="center">
              <AccessTime sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {format(new Date(delegate.lastAccess), 'MMM d, yyyy h:mm a')}
              </Typography>
            </Box>
          </Tooltip>
        </Box>

        <Typography
          variant="body1"
          component="div"
          sx={{ 
            fontSize: '1.125rem',
            backgroundColor: 'background.paper',
            p: 2,
            borderRadius: 1
          }}
        >
          <Box component="span" sx={{ fontWeight: 'medium', display: 'block', mb: 1 }}>
            Access Permissions:
          </Box>
          {formatPermissions(delegate.permissions)}
        </Typography>
      </Box>
    </Card>
  );
};

export default DelegateCard;