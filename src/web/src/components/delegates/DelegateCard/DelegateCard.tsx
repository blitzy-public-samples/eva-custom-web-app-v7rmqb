// @mui/material version 5.11.0
import { Typography, Stack, Chip } from '@mui/material';
import { ReactNode } from 'react';

// Import relative paths for components, types, and styles
import Card from '../../../components/common/Card/Card';
import { DelegateTypes } from '../../../types/delegate.types';
import { formatDate } from '../../../utils/format.util';
import '../../../styles/global.css';

/* Human Tasks:
1. Verify that the DelegateCard component's contrast ratios meet WCAG 2.1 Level AA standards
2. Test DelegateCard component's responsive behavior across different viewport sizes
3. Validate that the DelegateCard component works with screen readers
4. Ensure proper font loading and fallback behavior
*/

interface DelegateCardProps {
  /** The delegate data to be displayed */
  delegate: DelegateTypes;
}

/**
 * A component for displaying delegate information in a visually consistent and accessible manner.
 * 
 * Requirements addressed:
 * - Delegate Access Management (Technical Specifications/1.3 Scope/In-Scope)
 *   Displays delegate information, including roles and permissions, in a user-friendly format
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Ensures consistent design and theming across the web application
 * - Accessibility Compliance (Technical Specifications/3.1 User Interface Design/Accessibility)
 *   Provides an accessible component adhering to WCAG 2.1 Level AA standards
 */
export const DelegateCard = ({ delegate }: DelegateCardProps): ReactNode => {
  const {
    delegateId,
    role,
    permissions,
    expiresAt
  } = delegate;

  return (
    <Card
      title={`Delegate ${delegateId}`}
    >
      <Stack spacing={2}>
        {/* Role Section */}
        <div>
          <Typography
            variant="subtitle1"
            component="h3"
            sx={{
              fontWeight: 'medium',
              marginBottom: 1,
              color: 'text.primary'
            }}
          >
            Role
          </Typography>
          <Chip
            label={role.charAt(0).toUpperCase() + role.slice(1)}
            color="primary"
            size="medium"
            sx={{
              borderRadius: '4px',
              '& .MuiChip-label': {
                fontWeight: 'medium'
              }
            }}
          />
        </div>

        {/* Permissions Section */}
        <div>
          <Typography
            variant="subtitle1"
            component="h3"
            sx={{
              fontWeight: 'medium',
              marginBottom: 1,
              color: 'text.primary'
            }}
          >
            Permissions
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            sx={{ gap: 1 }}
          >
            {permissions.map((permission) => (
              <Chip
                key={permission.permissionId}
                label={`${permission.resourceType}: ${permission.accessLevel}`}
                variant="outlined"
                size="small"
                sx={{
                  borderRadius: '4px',
                  backgroundColor: 'background.paper'
                }}
              />
            ))}
          </Stack>
        </div>

        {/* Expiration Section */}
        <div>
          <Typography
            variant="subtitle1"
            component="h3"
            sx={{
              fontWeight: 'medium',
              marginBottom: 1,
              color: 'text.primary'
            }}
          >
            Expires
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              // Add warning color if expiration is within 30 days
              ...(new Date(expiresAt).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000 && {
                color: 'warning.main',
                fontWeight: 'medium'
              })
            }}
          >
            {formatDate(expiresAt)}
          </Typography>
        </div>
      </Stack>
    </Card>
  );
};

export default DelegateCard;