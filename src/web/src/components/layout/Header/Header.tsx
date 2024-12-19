/**
 * Enhanced Header Component
 * Version: 1.0.0
 * 
 * Implements a secure, accessible, and senior-friendly header component with
 * comprehensive navigation, user profile access, and security features.
 */

import React, { useReducer, useCallback, useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  Menu, 
  MenuItem,
  Typography,
  useMediaQuery,
  Box,
  Badge
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import HelpOutline from '@mui/icons-material/HelpOutline';
import Settings from '@mui/icons-material/Settings';
import SecurityIcon from '@mui/icons-material/Security';
import { Button } from '../../common/Button/Button';
import { useAuth } from '../../../hooks/useAuth';

// Enhanced styled components with accessibility improvements
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: 'var(--color-background)',
  boxShadow: 'var(--box-shadow-md)',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: theme.zIndex.appBar,
  borderBottom: '1px solid var(--color-border)',
  '& .MuiToolbar-root': {
    minHeight: '64px',
    [theme.breakpoints.down('sm')]: {
      minHeight: '56px',
    },
  },
  '& a': {
    color: 'var(--color-text)',
    textDecoration: 'none',
    '&:focus-visible': {
      outline: '3px solid var(--color-primary)',
      outlineOffset: '2px',
    },
  },
}));

const Logo = styled(Typography)({
  fontFamily: 'var(--font-family-heading)',
  fontSize: 'calc(var(--font-size-base) * 1.4)',
  fontWeight: 'var(--font-weight-bold)',
  color: 'var(--color-primary)',
  letterSpacing: '0.5px', 
  textTransform: 'uppercase',
});

// Interface definitions
interface HeaderProps {
  className?: string;
  onMenuToggle: (isOpen: boolean) => void;
  ariaLabel?: string;
}

interface MenuState {
  anchorEl: HTMLElement | null;
  isOpen: boolean;
}

// Action types for menu state management
type MenuAction = 
  | { type: 'OPEN_MENU'; payload: HTMLElement }
  | { type: 'CLOSE_MENU' };

// Menu state reducer
const menuReducer = (state: MenuState, action: MenuAction): MenuState => {
  switch (action.type) {
    case 'OPEN_MENU':
      return { anchorEl: action.payload, isOpen: true };
    case 'CLOSE_MENU':
      return { anchorEl: null, isOpen: false };
    default:
      return state;
  }
};

/**
 * Enhanced Header component with comprehensive security and accessibility features
 */
export const Header: React.FC<HeaderProps> = ({
  className,
  onMenuToggle,
  ariaLabel = 'Main navigation',
}) => {
  // Hooks and state management
  const { isAuthenticated, user, logout, mfaRequired } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [menuState, dispatch] = useReducer(menuReducer, {
    anchorEl: null,
    isOpen: false,
  });
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const isProfileMenuOpen = Boolean(profileAnchorEl);

  // Security audit logging
  useEffect(() => {
    if (isAuthenticated) {
      console.info('Header mounted for authenticated user:', {
        timestamp: new Date().toISOString(),
        userId: user?.id,
        mfaStatus: mfaRequired ? 'required' : 'verified',
      });
    }
  }, [isAuthenticated, user, mfaRequired]);

  // Enhanced menu handlers with security logging
  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    dispatch({ type: 'OPEN_MENU', payload: event.currentTarget });
    onMenuToggle(true);
  }, [onMenuToggle]);

  const handleMenuClose = useCallback(() => {
    dispatch({ type: 'CLOSE_MENU' });
    onMenuToggle(false);
  }, [onMenuToggle]);

  // Secure logout handler
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      handleMenuClose();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [logout, handleMenuClose]);

  // Keyboard navigation handler
  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleMenuClose();
    }
  }, [handleMenuClose]);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null);
  };

  return (
    <StyledAppBar 
      position="static" 
      className={className}
      role="banner"
      aria-label={ariaLabel}
    >
      <Toolbar>
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="Open menu"
            onClick={handleMenuOpen}
            sx={{ 
              mr: 2,
              ...(isAuthenticated ? {
                display: { xs: 'flex', md: 'none' }, 
                color: 'var(--color-text)'   
              } : {})
            }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Logo variant="h4" sx={{ flexGrow: 1 }}>
          Estate Kit
        </Logo>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {!isMobile && (
            <>
              <Button
                variant="text"
                startIcon={<HelpOutline />}
                ariaLabel="Help and Support"
                size="large"
                sx={{
                  color: 'var(--color-text)', 
                  '&:hover': { backgroundColor: 'var(--color-hover)' }
                }}
              >
                Help
              </Button>

              {isAuthenticated && (
                <Button
                  variant="text"
                  startIcon={<Settings />}
                  ariaLabel="Settings"
                  size="large"
                  sx={{
                    color: 'var(--color-text)', 
                    '&:hover': { backgroundColor: 'var(--color-hover)' }
                  }}
                >
                  Settings
                </Button>
              )}
            </>
          )}

          {isAuthenticated ? (
            <>
              <IconButton
                aria-label="Account menu"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
                size="large"
              >
                <Badge
                  color="secondary"
                  variant="dot"
                  invisible={!mfaRequired}
                  sx={{
                    color: 'var(--color-text)',
                  }}
                >
                  <AccountCircle />
                </Badge>
              </IconButton>

              <Menu
                id="profile-menu"
                anchorEl={profileAnchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={isProfileMenuOpen}
                onClose={handleProfileMenuClose}
                onKeyDown={handleKeyPress}
              >
                <MenuItem onClick={handleMenuClose}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {user?.name}
                  </Typography>
                </MenuItem>
                {mfaRequired && (
                  <MenuItem onClick={handleMenuClose}>
                    <SecurityIcon sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      Enable MFA
                    </Typography>
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout}>
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              variant="primary"
              size="small"
              ariaLabel="Login to Estate Kit"
              sx={{
                backgroundColor: 'var(--color-primary)',
                '&:hover': { backgroundColor: 'var(--color-primary-hover)', color: 'var(--color-text)' },
              }}
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </StyledAppBar>
  );
};

export type { HeaderProps };
