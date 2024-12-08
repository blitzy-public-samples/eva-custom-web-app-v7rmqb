// @mui/material version 5.11.0
import { Box, Container, Grid, Typography, Link } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Internal imports
import { theme } from '../../../config/theme.config';
import { formatDate } from '../../../utils/format.util';
import Button from '../../common/Button/Button';
import Card from '../../common/Card/Card';

/**
 * Footer component that provides consistent branding, navigation links, and legal information.
 * 
 * Requirements addressed:
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Implements a consistent footer design that follows the application's design system
 * - Accessibility Compliance (Technical Specifications/3.1 User Interface Design/Accessibility)
 *   Ensures the footer is accessible by using semantic HTML and ARIA attributes
 * - Responsive Design (Technical Specifications/3.1 User Interface Design/Responsive Breakpoints)
 *   Adapts to different screen sizes using responsive layout and typography
 */
const Footer = (): JSX.Element => {
  const currentYear = new Date().getFullYear();
  const lastUpdated = formatDate(new Date());

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: theme.palette.background.paper,
        paddingTop: { xs: 4, md: 6 },
        paddingBottom: { xs: 4, md: 6 },
        borderTop: `1px solid ${theme.palette.divider}`,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Company Information */}
          <Grid item xs={12} md={4}>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.primary,
                marginBottom: 2,
                fontFamily: theme.typography.h6.fontFamily,
              }}
            >
              Estate Kit
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                marginBottom: 2,
              }}
            >
              Simplifying estate planning and management for you and your loved ones.
            </Typography>
            <Button
              label="Contact Us"
              variant="outlined"
              onClick={() => window.location.href = '/contact'}
              ariaLabel="Navigate to contact page"
            />
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={6} md={4}>
            <Card title="Quick Links">
              <Box
                component="nav"
                aria-label="Footer navigation"
                sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
              >
                {[
                  { text: 'About Us', href: '/about' },
                  { text: 'Services', href: '/services' },
                  { text: 'Resources', href: '/resources' },
                  { text: 'Privacy Policy', href: '/privacy' },
                  { text: 'Terms of Service', href: '/terms' },
                ].map((link) => (
                  <Link
                    key={link.text}
                    href={link.href}
                    sx={{
                      color: theme.palette.text.primary,
                      textDecoration: 'none',
                      '&:hover': {
                        color: theme.palette.primary.main,
                        textDecoration: 'underline',
                      },
                      '&:focus': {
                        outline: `2px solid ${theme.palette.primary.main}`,
                        outlineOffset: '2px',
                      },
                    }}
                  >
                    {link.text}
                  </Link>
                ))}
              </Box>
            </Card>
          </Grid>

          {/* Legal Information */}
          <Grid item xs={12} sm={6} md={4}>
            <Card title="Legal Information">
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  marginBottom: 2,
                }}
              >
                © {currentYear} Estate Kit. All rights reserved.
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  display: 'block',
                }}
              >
                Last updated: {lastUpdated}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  display: 'block',
                  marginTop: 1,
                }}
              >
                Estate Kit is a registered trademark. For legal inquiries, please contact our legal department.
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Accessibility Information */}
        <Typography
          variant="body2"
          align="center"
          sx={{
            color: theme.palette.text.secondary,
            marginTop: 4,
            padding: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          This website is designed to be accessible to all users and complies with WCAG 2.1 Level AA standards.
          If you experience any accessibility issues, please contact us.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;