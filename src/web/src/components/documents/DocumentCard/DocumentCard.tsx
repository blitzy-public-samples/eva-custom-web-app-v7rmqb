// @mui/material version 5.11.0
import { Typography, Box } from '@mui/material';
import Card from '../../../components/common/Card/Card';
import { DocumentTypes } from '../../../types/document.types';
import { formatDocumentTitle } from '../../../utils/format.util';

/* Human Tasks:
1. Verify that document status colors meet WCAG 2.1 Level AA contrast requirements
2. Test DocumentCard component's responsive behavior across different viewport sizes
3. Validate that the DocumentCard component works with screen readers
4. Ensure proper font loading and fallback behavior
*/

interface DocumentCardProps {
  /** The title of the document */
  title: DocumentTypes['title'];
  /** The category of the document */
  category: DocumentTypes['category'];
  /** The current status of the document */
  status: DocumentTypes['status'];
}

/**
 * A component for displaying individual document details in a visually consistent and accessible manner.
 * 
 * Requirements addressed:
 * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 *   Provides a user interface for displaying document details, including title, category, and status.
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Ensures consistent design and theming across the web application by adhering to the design system.
 * - Accessibility Compliance (Technical Specifications/3.1 User Interface Design/Accessibility)
 *   Provides an accessible component adhering to WCAG 2.1 Level AA standards.
 */
export const DocumentCard = ({ title, category, status }: DocumentCardProps): JSX.Element => {
  // Format the document title using the utility function
  const formattedTitle = formatDocumentTitle(title);

  // Map status to appropriate colors and labels
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'draft':
        return '#718096'; // Neutral color for drafts
      case 'pending_review':
        return '#2C5282'; // Primary color for pending review
      case 'approved':
        return '#48BB78'; // Success color for approved
      case 'archived':
        return '#E53E3E'; // Error color for archived
      default:
        return '#718096'; // Default to neutral color
    }
  };

  const getStatusLabel = (status: string): string => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <Card title={formattedTitle}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography
            variant="body1"
            component="p"
            sx={{
              color: 'text.secondary',
              fontWeight: 'medium',
            }}
            // Add aria-label for screen readers
            aria-label={`Document category: ${category}`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()}
          </Typography>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 2,
              py: 0.5,
              borderRadius: '16px',
              backgroundColor: `${getStatusColor(status)}20`,
              color: getStatusColor(status),
            }}
            // Add role and aria-label for accessibility
            role="status"
            aria-label={`Document status: ${getStatusLabel(status)}`}
          >
            <Typography
              variant="body2"
              component="span"
              sx={{
                fontWeight: 'medium',
                lineHeight: 1,
              }}
            >
              {getStatusLabel(status)}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

// Default export for the DocumentCard component
export default DocumentCard;