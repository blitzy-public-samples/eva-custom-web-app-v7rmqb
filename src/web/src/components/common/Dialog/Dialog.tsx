/**
 * Estate Kit - Dialog Component
 * 
 * Human Tasks:
 * 1. Verify dialog animations meet accessibility standards for users with motion sensitivity
 * 2. Test dialog keyboard navigation and screen reader compatibility
 * 3. Validate dialog content rendering across different viewport sizes
 * 4. Ensure dialog backdrop opacity meets contrast requirements
 */

// @mui/material version 5.11.0
import { 
  Dialog as MuiDialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/material/icons-material/Close';
import { ReactNode, useCallback, useEffect } from 'react';

// Internal imports
import { validateAuth } from '../../utils/validation.util';
import { theme } from '../../config/theme.config';
import { formatDate } from '../../utils/format.util';

// Import styles
import '../../styles/global.css';
import '../../styles/typography.css';
import '../../styles/variables.css';

interface DialogProps {
  /** Dialog title */
  title: string;
  /** Dialog content */
  children: ReactNode;
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog is closed */
  onClose: () => void;
  /** Optional dialog actions/buttons */
  actions?: ReactNode;
  /** Maximum width of dialog */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Whether dialog is fullscreen on mobile */
  fullScreenMobile?: boolean;
  /** Whether dialog can be closed by clicking outside */
  disableBackdropClick?: boolean;
  /** Whether dialog can be closed by pressing escape */
  disableEscapeKeyDown?: boolean;
  /** Optional aria-label for accessibility */
  ariaLabel?: string;
  /** Optional aria-describedby for accessibility */
  ariaDescribedBy?: string;
}

/**
 * Dialog component providing a modal interface for displaying content.
 * 
 * Requirements addressed:
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Implements consistent styling and behavior for modal dialogs
 * - Accessibility Compliance (Technical Specifications/3.1 User Interface Design/Accessibility)
 *   Ensures dialog is accessible via keyboard and screen readers
 * - Responsive Design (Technical Specifications/3.1 User Interface Design/Responsive Breakpoints)
 *   Adapts dialog size and behavior for different screen sizes
 */
export default function Dialog({
  title,
  children,
  open,
  onClose,
  actions,
  maxWidth = 'sm',
  fullScreenMobile = true,
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
  ariaLabel,
  ariaDescribedBy
}: DialogProps) {
  // Theme and responsive handling
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const fullScreen = fullScreenMobile && isMobile;

  // Handle dialog close events
  const handleClose = useCallback((event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
    if (disableBackdropClick && reason === 'backdropClick') {
      return;
    }
    if (disableEscapeKeyDown && reason === 'escapeKeyDown') {
      return;
    }
    onClose();
  }, [onClose, disableBackdropClick, disableEscapeKeyDown]);

  // Focus trap and keyboard navigation
  useEffect(() => {
    if (open) {
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog) {
        const focusableElements = dialog.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length) {
          (focusableElements[0] as HTMLElement).focus();
        }
      }
    }
  }, [open]);

  return (
    <MuiDialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullScreen={fullScreen}
      aria-labelledby={ariaLabel || 'dialog-title'}
      aria-describedby={ariaDescribedBy}
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: theme.palette.background.paper,
          borderRadius: theme.shape.borderRadius,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
          margin: isMobile ? 0 : '32px',
          minWidth: isMobile ? '100%' : '320px',
          maxHeight: isMobile ? '100%' : 'calc(100% - 64px)',
        },
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }
      }}
    >
      <DialogTitle
        id="dialog-title"
        sx={{
          padding: theme.spacing(2, 3),
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          variant="h6"
          component="h2"
          sx={{
            color: theme.palette.text.primary,
            fontFamily: theme.typography.h6.fontFamily,
            fontWeight: theme.typography.fontWeightMedium,
          }}
        >
          {title}
        </Typography>
        <IconButton
          aria-label="close dialog"
          onClick={onClose}
          sx={{
            color: theme.palette.text.secondary,
            '&:hover': {
              color: theme.palette.text.primary,
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          padding: theme.spacing(3),
          overflowY: 'auto',
          '&:first-of-type': {
            paddingTop: theme.spacing(3),
          },
        }}
      >
        {children}
      </DialogContent>

      {actions && (
        <DialogActions
          sx={{
            padding: theme.spacing(2, 3),
            borderTop: `1px solid ${theme.palette.divider}`,
            justifyContent: 'flex-end',
            gap: theme.spacing(1),
          }}
        >
          {actions}
        </DialogActions>
      )}
    </MuiDialog>
  );
}