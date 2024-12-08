// Human Tasks:
// 1. Verify color contrast ratios meet WCAG 2.1 Level AA standards
// 2. Test responsive behavior across different viewport sizes
// 3. Validate keyboard navigation and screen reader accessibility
// 4. Ensure proper touch target sizes on mobile devices

// External dependencies
// @mui/material version 5.11.0
import { 
  AppBar,
  Box,
  Button as MuiButton,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import MenuIcon from '@mui/material/icons-material/Menu';
import { useState, useCallback } from 'react';

// Internal dependencies
import { theme } from '../../../config/theme.config';
import Button from '../../common/Button/Button';
import Dialog from '../../common/Dialog/Dialog';
import { useAuth } from '../../../hooks/useAuth';
import { useDispatch } from 'react-redux';
import { login, logout } from '../../../redux/slices/authSlice';

/**
 * Header component providing navigation and authentication controls
 * 
 * Requirements addressed:
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Implements consistent styling and branding across the application
 * - Account creation and authentication (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Provides user authentication controls in the header
 * - Responsive Design (Technical Specifications/3.1 User Interface Design/Responsive Breakpoints)
 *   Adapts layout and controls for different screen sizes
 */
const Header = () => {
  // State management
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  
  // Hooks
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const { isAuthenticated, userRole, login: authLogin, logout: authLogout } = useAuth();
  const dispatch = useDispatch();

  // Mobile menu handlers
  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  // Authentication handlers
  const handleLoginClick = useCallback(() => {
    setLoginDialogOpen(true);
  }, []);

  const handleLoginSubmit = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      const success = await authLogin(credentials);
      if (success) {
        dispatch(login({ email: credentials.email, token: '', role: userRole || 'user' }));
        setLoginDialogOpen(false);
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  }, [authLogin, dispatch, userRole]);

  const handleLogout = useCallback(async () => {
    try {
      await authLogout();
      dispatch(logout());
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [authLogout, dispatch]);

  return (
    <AppBar 
      position="fixed"
      sx={{
        backgroundColor: theme.palette.primary.main,
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
      }}
    >
      <Container maxWidth="lg">
        <Toolbar
          sx={{
            justifyContent: 'space-between',
            padding: theme.spacing(2),
            [muiTheme.breakpoints.down('sm')]: {
              padding: theme.spacing(1),
            }
          }}
        >
          {/* Logo and Branding */}
          <Typography
            variant="h1"
            sx={{
              ...theme.typography.h1,
              fontSize: isMobile ? '1.5rem' : '2rem',
              color: '#ffffff',
              fontWeight: 'bold',
              textDecoration: 'none'
            }}
            component="a"
            href="/"
          >
            Estate Kit
          </Typography>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing(2)
              }}
            >
              <Button
                label="Documents"
                variant="text"
                className="nav-button"
                ariaLabel="Navigate to documents"
              />
              <Button
                label="Delegates"
                variant="text"
                className="nav-button"
                ariaLabel="Navigate to delegates"
              />
              {isAuthenticated ? (
                <Button
                  label="Logout"
                  variant="outlined"
                  onClick={handleLogout}
                  ariaLabel="Log out of your account"
                />
              ) : (
                <Button
                  label="Login"
                  variant="outlined"
                  onClick={handleLoginClick}
                  ariaLabel="Log in to your account"
                />
              )}
            </Box>
          )}

          {/* Mobile Navigation */}
          {isMobile && (
            <>
              <IconButton
                size="large"
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={handleMobileMenuOpen}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={mobileMenuAnchor}
                open={Boolean(mobileMenuAnchor)}
                onClose={handleMobileMenuClose}
                sx={{
                  '& .MuiPaper-root': {
                    backgroundColor: theme.palette.background.paper,
                    minWidth: '200px'
                  }
                }}
              >
                <MenuItem onClick={handleMobileMenuClose}>
                  <Typography>Documents</Typography>
                </MenuItem>
                <MenuItem onClick={handleMobileMenuClose}>
                  <Typography>Delegates</Typography>
                </MenuItem>
                <MenuItem 
                  onClick={() => {
                    handleMobileMenuClose();
                    isAuthenticated ? handleLogout() : handleLoginClick();
                  }}
                >
                  <Typography>
                    {isAuthenticated ? 'Logout' : 'Login'}
                  </Typography>
                </MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </Container>

      {/* Login Dialog */}
      <Dialog
        title="Login"
        open={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        maxWidth="sm"
        ariaLabel="Login dialog"
      >
        {/* Login form content would be implemented here */}
        <Box sx={{ padding: theme.spacing(2) }}>
          <Typography variant="body1">
            Please enter your credentials to log in.
          </Typography>
          {/* Login form components would be added here */}
        </Box>
      </Dialog>
    </AppBar>
  );
};

export default Header;