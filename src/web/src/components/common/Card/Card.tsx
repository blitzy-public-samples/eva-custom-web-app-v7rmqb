import React from 'react';
import { Card as MuiCard, CardContent, CardActions, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { theme } from '../../config/theme.config';

/**
 * Interface for Card component props with comprehensive accessibility and interaction features
 */
export interface CardProps {
  /** Main card title */
  title: string;
  /** Optional subtitle text */
  subtitle?: string;
  /** Card content */
  children: React.ReactNode;
  /** Optional elevation level (1-24) */
  elevation?: number;
  /** Optional CSS class name */
  className?: string;
  /** Enable interactive card behavior */
  interactive?: boolean;
  /** Click handler for interactive cards */
  onClick?: () => void;
  /** Optional action buttons array */
  actions?: React.ReactNode[];
  /** Data test ID for testing */
  testId?: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Enable keyboard focus */
  focusable?: boolean;
  /** Custom tab index */
  tabIndex?: number;
}

/**
 * Styled Card component with enhanced visual feedback and accessibility features
 */
const StyledCard = styled(MuiCard)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s ease-in-out',
  minHeight: '100px',
  position: 'relative',
  backgroundColor: theme.palette.background.paper,
  cursor: (props: CardProps) => props.interactive ? 'pointer' : 'default',
  
  '&:hover': {
    transform: (props: CardProps) => props.interactive ? 'translateY(-2px)' : 'none',
    boxShadow: (props: CardProps) => props.interactive ? theme.shadows[props.elevation || 1 + 2] : theme.shadows[props.elevation || 1],
  },

  '&:focus-visible': {
    outline: `3px solid ${theme.palette.primary.main}`,
    outlineOffset: '2px',
  },

  '& .MuiCardContent-root': {
    padding: theme.spacing(3),
  },

  '& .MuiCardActions-root': {
    padding: theme.spacing(2),
    justifyContent: 'flex-end',
  },
}));

/**
 * Senior-friendly Card component with enhanced accessibility features
 * 
 * @component
 * @example
 * ```tsx
 * <Card
 *   title="Important Documents"
 *   subtitle="Your estate planning documents"
 *   interactive
 *   onClick={() => handleCardClick()}
 * >
 *   <DocumentList documents={documents} />
 * </Card>
 * ```
 */
export const Card: React.FC<CardProps> = React.memo(({
  title,
  subtitle,
  children,
  elevation = 1,
  className,
  interactive = false,
  onClick,
  actions,
  testId = 'estate-kit-card',
  ariaLabel,
  focusable = true,
  tabIndex,
  ...props
}) => {
  /**
   * Handles keyboard interactions for interactive cards
   */
  const handleKeyPress = React.useCallback((event: React.KeyboardEvent) => {
    if (!interactive || !onClick) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  }, [interactive, onClick]);

  return (
    <StyledCard
      elevation={elevation}
      className={className}
      onClick={interactive ? onClick : undefined}
      onKeyPress={handleKeyPress}
      data-testid={testId}
      role={interactive ? 'button' : 'region'}
      aria-label={ariaLabel || title}
      tabIndex={interactive && focusable ? tabIndex || 0 : undefined}
      {...props}
    >
      <CardContent>
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          color="text.primary"
          sx={{ 
            fontFamily: theme.typography.h5.fontFamily,
            fontSize: '1.2rem',
            fontWeight: 600 
          }}
        >
          {title}
        </Typography>
        
        {subtitle && (
          <Typography
            variant="body2"
            color="text.secondary"
            gutterBottom
            sx={{ 
              fontSize: '1rem',
              marginBottom: theme.spacing(2)
            }}
          >
            {subtitle}
          </Typography>
        )}
        
        {children}
      </CardContent>

      {actions && actions.length > 0 && (
        <CardActions>
          {actions}
        </CardActions>
      )}
    </StyledCard>
  );
});

Card.displayName = 'Card';

export default Card;