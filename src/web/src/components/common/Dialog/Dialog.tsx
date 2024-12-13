import React, { useCallback, useEffect, useRef } from 'react';
import {
  Dialog as MuiDialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { FocusTrap } from '@mui/base';

/**
 * Interface for CustomDialog component props with enhanced accessibility features
 */
export interface CustomDialogProps {
  title: string;
  content: React.ReactNode;
  open: boolean;
  onClose: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  largeText?: boolean;
  reduceMotion?: boolean;
  useSound?: boolean;
  description?: string;
}

/**
 * CustomDialog - A senior-friendly dialog component with comprehensive accessibility features
 * 
 * Features:
 * - WCAG 2.1 Level AA compliant
 * - Enhanced text sizes and contrast
 * - Focus management for keyboard navigation
 * - Optional motion reduction
 * - Sound feedback
 * - Responsive sizing
 * 
 * @version MUI 5.11+
 */
export const CustomDialog: React.FC<CustomDialogProps> = ({
  title,
  content,
  open,
  onClose,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  maxWidth = 'sm',
  fullWidth = true,
  largeText = false,
  reduceMotion = false,
  useSound = false,
  description,
}) => {
  // Refs for focus management
  const previousFocus = useRef<HTMLElement | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  
  // Get theme and media query for responsive behavior
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:768px)');

  // Sound effects for feedback
  const playSound = useCallback((type: 'close' | 'confirm') => {
    if (!useSound) return;
    
    const audio = new Audio();
    audio.src = type === 'confirm' 
      ? '/assets/sounds/confirm.mp3'
      : '/assets/sounds/close.mp3';
    audio.play().catch(() => {}); // Ignore errors if sound fails
  }, [useSound]);

  // Store previously focused element when dialog opens
  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement;
    }
  }, [open]);

  // Handle dialog close
  const handleClose = useCallback((_: {}, reason: "backdropClick" | "escapeKeyDown") => {
    playSound('close');
    onClose();
    
    // Restore focus to previous element
    if (previousFocus.current) {
      previousFocus.current.focus();
    }
  }, [onClose, playSound]);

  // Handle confirmation
  const handleConfirm = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    playSound('confirm');
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  }, [onConfirm, onClose, playSound]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Escape':
        onClose();
        break;
      case 'Enter':
        if (onConfirm) {
          handleConfirm(event as unknown as React.MouseEvent);
        }
        break;
      case 'Tab':
        // Focus trap is handled by FocusTrap component
        break;
      default:
        break;
    }
  }, [onClose, handleConfirm, onConfirm]);

  return (
    <FocusTrap open={open}>
      <MuiDialog
        open={open}
        onClose={handleClose}
        maxWidth={maxWidth}
        fullWidth={fullWidth}
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        onKeyDown={handleKeyDown}
        sx={{
          '& .MuiDialog-paper': {
            padding: theme.spacing(3),
            ...(reduceMotion && {
              transition: 'none',
            }),
          },
        }}
      >
        <DialogTitle
          id="dialog-title"
          sx={{
            fontSize: largeText ? theme.typography.h4.fontSize : theme.typography.h5.fontSize,
            fontWeight: theme.typography.h5.fontWeight,
            color: theme.palette.text.primary,
            padding: theme.spacing(2),
          }}
        >
          {title}
        </DialogTitle>

        <DialogContent
          id="dialog-description"
          sx={{
            padding: theme.spacing(2),
            '& > *': {
              fontSize: largeText ? '1.25rem' : '1.125rem',
              lineHeight: 1.6,
            },
          }}
        >
          {description && (
            <Typography
              variant="body1"
              sx={{ marginBottom: theme.spacing(2) }}
              color="textSecondary"
            >
              {description}
            </Typography>
          )}
          {content}
        </DialogContent>

        <DialogActions
          sx={{
            padding: theme.spacing(2),
            gap: theme.spacing(2),
            flexDirection: isMobile ? 'column' : 'row',
            '& > button': {
              margin: 0,
              flex: isMobile ? 1 : 'initial',
            },
          }}
        >
          <Button
            variant="outlined"
            onClick={() => onClose()}
            size="large"
            sx={{
              fontSize: largeText ? '1.25rem' : '1.125rem',
              minWidth: isMobile ? '100%' : '120px',
            }}
          >
            {cancelLabel}
          </Button>
          {onConfirm && (
            <Button
              ref={confirmButtonRef}
              variant="contained"
              onClick={handleConfirm}
              size="large"
              sx={{
                fontSize: largeText ? '1.25rem' : '1.125rem',
                minWidth: isMobile ? '100%' : '120px',
              }}
            >
              {confirmLabel}
            </Button>
          )}
        </DialogActions>
      </MuiDialog>
    </FocusTrap>
  );
};

export default CustomDialog;