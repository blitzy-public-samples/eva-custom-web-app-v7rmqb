/**
 * Sidebar Component
 * Version: 1.0.0
 * 
 * A responsive sidebar navigation component with enhanced accessibility features
 * and senior-friendly design considerations for the Estate Kit application.
 * 
 * @package react ^18.2.0
 * @package @mui/material ^5.11.0
 * @package @mui/icons-material ^5.11.0
 */

import React, { memo, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Description as DocumentIcon,
  People as PeopleIcon,
  Subscriptions as SubscriptionIcon,
  Settings as SettingsIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { useAuth } from '../../../hooks/useAuth';
import '../../../styles/variables.css';

// Constants for component configuration
const DRAWER_WIDTH = 280;
const MOBILE_DRAWER_WIDTH = '100%';
const TRANSITION_DURATION = 225;

// Interface definitions
interface SidebarProps {
  open: boolean;
  onClose: () => void;
  className?: string;
}

interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  requiresAuth: boolean;
  ariaLabel: string;
  shortcutKey?: string;
}

// Navigation items configuration with accessibility information
const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: <DashboardIcon />,
    requiresAuth: true,
    ariaLabel: 'Go to dashboard overview',
    shortcutKey: 'Alt+D'
  },
  {
    id: 'documents',
    label: 'Documents',
    path: '/documents',
    icon: <DocumentIcon />,
    requiresAuth: true,
    ariaLabel: 'Manage your documents',
    shortcutKey: 'Alt+F'
  },
  {
    id: 'delegates',
    label: 'Delegates',
    path: '/delegates',
    icon: <PeopleIcon />,
    requiresAuth: true,
    ariaLabel: 'Manage your delegates',
    shortcutKey: 'Alt+P'
  },
  {
    id: 'subscription',
    label: 'Subscription',
    path: '/subscription',
    icon: <SubscriptionIcon />,
    requiresAuth: true,
    ariaLabel: 'Manage your subscription',
    shortcutKey: 'Alt+S'
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: <SettingsIcon />,
    requiresAuth: true,
    ariaLabel: 'Adjust your settings',
    shortcutKey: 'Alt+T'
  },
  {
    id: 'help',
    label: 'Help & Support',
    path: '/help',
    icon: <HelpIcon />,
    requiresAuth: false,
    ariaLabel: 'Get help and support',
    shortcutKey: 'Alt+H'
  }
];

// Styles
const drawerStyles = {
  width: { sm: DRAWER_WIDTH },
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: { xs: MOBILE_DRAWER_WIDTH, sm: DRAWER_WIDTH },
    boxSizing: 'border-box',
    backgroundColor: 'var(--color-background)',
    borderRight: '1px solid var(--color-neutral)',
    transition: `width ${TRANSITION_DURATION}ms ease-in-out`
  }
};

const listItemStyles = {
  margin: 'var(--spacing-xs)',
  padding: 'var(--spacing-md)',
  borderRadius: 'var(--border-radius-md)',
  minHeight: '48px', // Minimum touch target size
  '&:hover': {
    backgroundColor: 'var(--color-background-paper)',
    transition: 'background-color 0.2s ease'
  },
  '&.Mui-selected': {
    backgroundColor: 'var(--color-primary-light)',
    color: 'var(--color-background)',
    '&:hover': {
      backgroundColor: 'var(--color-primary)'
    }
  },
  '&:focus-visible': {
    outline: '2px solid var(--color-primary)',
    outlineOffset: '2px'
  }
};

/**
 * Sidebar component with enhanced accessibility and responsive design
 */
const Sidebar: React.FC<SidebarProps> = memo(({ open, onClose, className }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Filter navigation items based on authentication state
  const visibleItems = NAVIGATION_ITEMS.filter(
    item => !item.requiresAuth || isAuthenticated
  );

  // Navigation handler with analytics tracking
  const handleNavigation = useCallback((path: string) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  }, [navigate, isMobile, onClose]);

  // Keyboard navigation setup
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const item = visibleItems.find(
        item => item.shortcutKey === `Alt+${event.key.toUpperCase()}`
      );
      if (event.altKey && item) {
        event.preventDefault();
        handleNavigation(item.path);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [visibleItems, handleNavigation]);

  // Focus trap implementation for accessibility
  useEffect(() => {
    if (!isMobile || !open) return;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !sidebarRef.current) return;

      const focusableElements = sidebarRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener('keydown', handleTabKey);
    return () => window.removeEventListener('keydown', handleTabKey);
  }, [isMobile, open]);

  const drawer = (
    <Box
      ref={sidebarRef}
      role="navigation"
      aria-label="Main navigation"
      sx={{ overflow: 'auto' }}
    >
      <List>
        {visibleItems.map((item) => (
          <ListItem
            key={item.id}
            button
            selected={location.pathname === item.path}
            onClick={() => handleNavigation(item.path)}
            aria-label={item.ariaLabel}
            sx={listItemStyles}
          >
            <ListItemIcon sx={{ color: 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                style: {
                  fontSize: 'var(--font-size-base)',
                  fontWeight: location.pathname === item.path ? 
                    'var(--font-weight-bold)' : 
                    'var(--font-weight-regular)'
                }
              }}
            />
            {item.shortcutKey && (
              <Box
                component="span"
                sx={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                  marginLeft: 'var(--spacing-md)'
                }}
                aria-hidden="true"
              >
                {item.shortcutKey}
              </Box>
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={drawerStyles}
      className={className}
      aria-label="Estate Kit navigation"
    >
      {isMobile ? (
        <Drawer
          variant="temporary"
          anchor="left"
          open={open}
          onClose={onClose}
          ModalProps={{
            keepMounted: true // Better mobile performance
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: MOBILE_DRAWER_WIDTH
            }
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          open
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH
            }
          }}
        >
          {drawer}
        </Drawer>
      )}
    </Box>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;