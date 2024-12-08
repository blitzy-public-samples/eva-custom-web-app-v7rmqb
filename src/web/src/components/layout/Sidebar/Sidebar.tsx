/**
 * Estate Kit - Sidebar Component
 * 
 * Requirements addressed:
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Implements consistent sidebar navigation using theme configuration
 * - Role-based delegate access management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 *   Provides navigation links based on user roles and permissions
 * - Responsive Design (Technical Specifications/3.1 User Interface Design/Responsive Breakpoints)
 *   Adapts sidebar layout for different screen sizes
 */

// react version ^18.2.0
import React, { useState, useEffect } from 'react';
// react-router-dom version ^6.4.0
import { useLocation, useNavigate } from 'react-router-dom';
// clsx version ^1.2.1
import clsx from 'clsx';

// Internal imports
import { theme } from '../../config/theme.config';
import { useSelector } from 'react-redux';
import { selectAuthState } from '../../redux/slices/authSlice';
import Button from '../common/Button/Button';

// Import styles
import '../../styles/global.css';
import '../../styles/variables.css';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const authState = useSelector(selectAuthState);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isOpen, setIsOpen] = useState(!isMobile);

  // Update mobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsOpen(!mobile);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navigation items based on user role
  const navigationItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      roles: ['user', 'admin', 'delegate'],
    },
    {
      label: 'Documents',
      path: '/documents',
      roles: ['user', 'admin', 'delegate'],
    },
    {
      label: 'Delegates',
      path: '/delegates',
      roles: ['user', 'admin'],
    },
    {
      label: 'Subscription',
      path: '/subscription',
      roles: ['user', 'admin'],
    },
    {
      label: 'Settings',
      path: '/settings',
      roles: ['user', 'admin', 'delegate'],
    },
  ];

  // Filter navigation items based on user role
  const filteredNavItems = navigationItems.filter(
    item => authState.role && item.roles.includes(authState.role)
  );

  // Styles
  const sidebarStyles: React.CSSProperties = {
    position: isMobile ? 'fixed' : 'sticky',
    top: 0,
    left: 0,
    height: '100vh',
    width: isOpen ? (isMobile ? '100%' : '250px') : '0',
    backgroundColor: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.divider}`,
    transition: 'width 0.3s ease-in-out',
    overflowX: 'hidden',
    overflowY: 'auto',
    zIndex: 1000,
    boxShadow: isMobile ? '0 0 10px rgba(0, 0, 0, 0.1)' : 'none',
  };

  const navItemStyles = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    padding: '12px 24px',
    color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
    backgroundColor: isActive ? `${theme.palette.primary.main}10` : 'transparent',
    borderRadius: theme.shape.borderRadius,
    margin: '4px 12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    textDecoration: 'none',
    '&:hover': {
      backgroundColor: `${theme.palette.primary.main}20`,
    },
  });

  const toggleButtonStyles: React.CSSProperties = {
    position: 'fixed',
    top: '12px',
    left: isOpen ? '12px' : '12px',
    zIndex: 1001,
    display: isMobile ? 'block' : 'none',
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      {isMobile && (
        <Button
          label={isOpen ? 'Close Menu' : 'Open Menu'}
          variant="outlined"
          onClick={() => setIsOpen(!isOpen)}
          style={toggleButtonStyles}
          ariaLabel={`${isOpen ? 'Close' : 'Open'} navigation menu`}
        />
      )}

      {/* Sidebar */}
      <aside
        style={sidebarStyles}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo/Brand */}
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <h1 style={{
            fontSize: theme.typography.h6.fontSize,
            color: theme.palette.primary.main,
            margin: 0,
          }}>
            Estate Kit
          </h1>
        </div>

        {/* Navigation Items */}
        <nav>
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <div
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setIsOpen(false);
                }}
                style={navItemStyles(isActive)}
                role="button"
                tabIndex={0}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </div>
            );
          })}
        </nav>

        {/* User Info */}
        {authState.user && (
          <div style={{
            padding: '24px',
            borderTop: `1px solid ${theme.palette.divider}`,
            marginTop: 'auto',
          }}>
            <div style={{
              fontSize: theme.typography.body2.fontSize,
              color: theme.palette.text.secondary,
            }}>
              {authState.user}
            </div>
            <div style={{
              fontSize: theme.typography.caption.fontSize,
              color: theme.palette.text.secondary,
              textTransform: 'capitalize',
            }}>
              {authState.role}
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Backdrop */}
      {isMobile && isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          }}
          onClick={() => setIsOpen(false)}
          role="presentation"
        />
      )}
    </>
  );
};

export default Sidebar;