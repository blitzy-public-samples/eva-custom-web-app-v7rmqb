// @mui/material version 5.11.0
import { Card as MuiCard, CardContent, CardHeader, Typography } from '@mui/material';
import { ReactNode } from 'react';

// Import relative paths for styles and utilities
import '../../../styles/global.css';
import '../../../styles/typography.css';
import '../../../styles/variables.css';
import { theme } from '../../../config/theme.config';
import { formatDocumentTitle } from '../../../utils/format.util';

/* Human Tasks:
1. Verify that the Card component's contrast ratios meet WCAG 2.1 Level AA standards
2. Test Card component's responsive behavior across different viewport sizes
3. Validate that the Card component works with screen readers
4. Ensure proper font loading and fallback behavior
*/

interface CardProps {
  /** The title to be displayed in the card header */
  title?: string;
  /** The content to be displayed within the card */
  children: ReactNode;
}

/**
 * A reusable Card component for displaying content in a visually consistent and accessible manner.
 * 
 * Requirements addressed:
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Implements a consistent card design that follows the application's design system
 * - Accessibility Compliance (Technical Specifications/3.1 User Interface Design/Accessibility)
 *   Ensures the card component is accessible by using semantic HTML and ARIA attributes
 */
export const Card = ({ title, children }: CardProps): JSX.Element => {
  // Format the title if provided
  const formattedTitle = title ? formatDocumentTitle(title) : undefined;

  return (
    <MuiCard
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        transition: 'box-shadow 0.3s ease-in-out',
        '&:hover': {
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
        },
        // Ensure proper spacing and layout
        margin: theme.spacing(2),
        width: '100%',
        // Ensure accessibility
        outline: 'none',
        '&:focus-visible': {
          outline: `3px solid ${theme.palette.primary.main}`,
          outlineOffset: '2px',
        },
      }}
      // Add semantic role for accessibility
      role="article"
      // Ensure keyboard navigation
      tabIndex={0}
    >
      {formattedTitle && (
        <CardHeader
          title={
            <Typography
              variant="h5"
              component="h2"
              sx={{
                color: theme.palette.text.primary,
                fontFamily: theme.typography.h5.fontFamily,
                fontWeight: theme.typography.h5.fontWeight,
                // Ensure proper text contrast
                '@media (prefers-contrast: high)': {
                  color: '#000000',
                },
              }}
            >
              {formattedTitle}
            </Typography>
          }
          sx={{
            padding: theme.spacing(2),
            // Ensure proper spacing between header and content
            '& .MuiCardHeader-content': {
              overflow: 'hidden',
            },
          }}
        />
      )}
      <CardContent
        sx={{
          padding: theme.spacing(2),
          '&:last-child': {
            paddingBottom: theme.spacing(2),
          },
          // Ensure proper text color and contrast
          color: theme.palette.text.primary,
          '@media (prefers-contrast: high)': {
            color: '#000000',
          },
        }}
      >
        {children}
      </CardContent>
    </MuiCard>
  );
};

// Default export for the Card component
export default Card;