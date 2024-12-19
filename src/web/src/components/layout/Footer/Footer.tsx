import React from 'react'; // v18.2.0
import { Box, Container, Typography, Link, styled } from '@mui/material'; // v5.11.0

/**
 * Interface for Footer component props
 */
interface FooterProps {
  ariaLabel?: string;
}

/**
 * Styled footer container with accessibility features and senior-friendly design
 */
const FooterContainer = styled(Box)(({ theme }) => ({
  backgroundColor: 'var(--color-background-paper)',
  color: 'var(--color-text-primary)',
  marginTop: 'auto',
  borderTop: '1px solid var(--color-neutral)',
  fontSize: theme.typography.fontSize,
  role: 'contentinfo',
  '&:focus-visible': {
    outline: '2px solid var(--color-primary)',
    outlineOffset: '2px',
  },
}));

/**
 * Styled footer content container with responsive layout
 */
const FooterContent = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(3),
  textAlign: 'center',
  fontSize: '1rem',
  lineHeight: '1.5',
  a: {
    color: 'var(--color-primary)',
    textDecoration: 'underline',
    padding: theme.spacing(1),
    '&:hover': {
      textDecoration: 'none',
    },
    '&:focus': {
      outline: '2px solid var(--color-primary)',
      outlineOffset: '2px',
    },
  },
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    textAlign: 'left',
    gap: theme.spacing(4),
  },
}));

/**
 * Styled footer links section with accessibility features
 */
const FooterLinks = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(4),
  flexWrap: 'wrap',
  justifyContent: 'center',
  alignItems: 'center',
  'nav': {
    role: 'navigation',
    ariaLabel: 'Footer Navigation',
  },
  'a': {
    fontSize: '1rem',
    padding: theme.spacing(1),
    color: 'var(--color-primary)',
    textDecoration: 'underline',
    transition: 'all 0.2s ease',
    '&:hover': {
      textDecoration: 'none',
    },
    '&:focus': {
      outline: '2px solid var(--color-primary)',
      outlineOffset: '2px',
    },
  },
}));

/**
 * Footer component that provides consistent footer content across the Estate Kit application.
 * Implements senior-friendly design with high contrast text, proper spacing, and accessibility features.
 * 
 * @param {FooterProps} props - Component props
 * @returns {JSX.Element} Rendered footer component with accessibility features
 */
const Footer: React.FC<FooterProps> = React.memo(({ ariaLabel = 'Site Footer' }) => {
  const currentYear = new Date().getFullYear();

  return (
    <FooterContainer
      component="footer"
      aria-label={ariaLabel}
    >
      <FooterContent maxWidth="lg">
        <Box>
          <Typography
            variant="body2"
            component="p"
            sx={{ fontSize: '1rem', lineHeight: 1.5 }}
          >
            © {currentYear} Estate Kit. All rights reserved.
          </Typography>
        </Box>

        <FooterLinks component="nav" aria-label="Footer Navigation">
          <Link href="/privacy" aria-label="Privacy Policy">
            Privacy Policy
          </Link>
          <Link href="/terms" aria-label="Terms of Service">
            Terms of Service
          </Link>
          <Link href="/accessibility" aria-label="Accessibility Statement">
            Accessibility
          </Link>
          <Link href="/contact" aria-label="Contact Us">
            Contact
          </Link>
        </FooterLinks>

        <Box>
          <Typography
            variant="body2"
            component="p"
            sx={{ fontSize: '1rem', lineHeight: 1.5 }}
          >
            Need help? Call us at{' '}
            <Link
              href="tel:1-800-555-0123"
              aria-label="Call Estate Kit Support"
              sx={{ display: 'inline-block' }}
            >
              1-800-555-0123
            </Link>
          </Typography>
        </Box>
      </FooterContent>
    </FooterContainer>
  );
});

Footer.displayName = 'Footer';

export type { FooterProps };
export default Footer;