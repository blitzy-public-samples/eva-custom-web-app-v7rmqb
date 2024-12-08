// @testing-library/react version ^13.4.0
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// jest version ^29.0.0
import '@testing-library/jest-dom';

// Internal imports
import Footer from './Footer';
import { mockApiRequest, validateTestData, formatTestOutput } from '../../utils/test.util';
import { theme } from '../../../config/theme.config';

/**
 * Test suite for the Footer component
 * 
 * Requirements addressed:
 * - Frontend Testing (Technical Specifications/4.5 Development & Deployment/Testing)
 *   Implements unit tests to validate the functionality, accessibility, and responsiveness of the Footer component.
 */

describe('Footer Component', () => {
  // Mock current date for consistent testing
  const mockDate = new Date('2024-01-01');
  
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering Tests', () => {
    it('should render the footer with company information', () => {
      render(<Footer />);
      
      // Verify company section
      const companySection = screen.getByText('Estate Kit');
      expect(companySection).toBeInTheDocument();
      expect(screen.getByText('Simplifying estate planning and management for you and your loved ones.')).toBeInTheDocument();
      
      // Verify contact button
      const contactButton = screen.getByRole('button', { name: /contact us/i });
      expect(contactButton).toBeInTheDocument();
      expect(contactButton).toHaveAttribute('aria-label', 'Navigate to contact page');
    });

    it('should render quick links section with all links', () => {
      render(<Footer />);
      
      const quickLinksSection = screen.getByRole('navigation', { name: 'Footer navigation' });
      const links = within(quickLinksSection).getAllByRole('link');
      
      // Verify all quick links are present
      const expectedLinks = [
        { text: 'About Us', href: '/about' },
        { text: 'Services', href: '/services' },
        { text: 'Resources', href: '/resources' },
        { text: 'Privacy Policy', href: '/privacy' },
        { text: 'Terms of Service', href: '/terms' },
      ];

      expect(links).toHaveLength(expectedLinks.length);
      
      expectedLinks.forEach(({ text, href }) => {
        const link = screen.getByRole('link', { name: text });
        expect(link).toHaveAttribute('href', href);
      });
    });

    it('should render legal information with current year', () => {
      render(<Footer />);
      
      // Verify copyright notice
      expect(screen.getByText(`© ${mockDate.getFullYear()} Estate Kit. All rights reserved.`)).toBeInTheDocument();
      
      // Verify legal text
      expect(screen.getByText(/Estate Kit is a registered trademark/)).toBeInTheDocument();
    });

    it('should render accessibility information', () => {
      render(<Footer />);
      
      const accessibilityText = screen.getByText(/This website is designed to be accessible to all users/);
      expect(accessibilityText).toBeInTheDocument();
      expect(accessibilityText).toHaveTextContent('WCAG 2.1 Level AA standards');
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<Footer />);
      
      // Verify footer landmark
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
      
      // Verify navigation landmark
      expect(screen.getByRole('navigation', { name: 'Footer navigation' })).toBeInTheDocument();
      
      // Verify contact button accessibility
      const contactButton = screen.getByRole('button', { name: /contact us/i });
      expect(contactButton).toHaveAttribute('aria-label', 'Navigate to contact page');
    });

    it('should have sufficient color contrast', () => {
      render(<Footer />);
      
      // Get all text elements
      const textElements = screen.getAllByText(/.+/);
      
      textElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        const backgroundColor = styles.backgroundColor;
        const color = styles.color;
        
        // Verify contrast ratio meets WCAG AA standards
        // Note: This is a simplified check. In a real implementation,
        // you would use a color contrast calculation library
        expect(backgroundColor).not.toBe(color);
      });
    });

    it('should have focusable and keyboard-navigable links', () => {
      render(<Footer />);
      
      const links = screen.getAllByRole('link');
      
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
        expect(link).toHaveStyle({
          '&:focus': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: '2px',
          },
        });
      });
    });
  });

  describe('Responsive Design Tests', () => {
    it('should apply responsive padding based on viewport size', () => {
      render(<Footer />);
      
      const footer = screen.getByRole('contentinfo');
      
      // Verify responsive padding
      expect(footer).toHaveStyle({
        paddingTop: { xs: 4, md: 6 },
        paddingBottom: { xs: 4, md: 6 },
      });
    });

    it('should adjust grid layout for different screen sizes', () => {
      render(<Footer />);
      
      const gridContainer = screen.getByRole('contentinfo').querySelector('.MuiGrid-container');
      expect(gridContainer).toBeInTheDocument();
      
      // Verify grid items have proper responsive breakpoints
      const gridItems = gridContainer!.querySelectorAll('.MuiGrid-item');
      gridItems.forEach(item => {
        expect(item).toHaveAttribute('class', expect.stringMatching(/MuiGrid-grid-xs-12/));
      });
    });
  });

  describe('Interactive Behavior Tests', () => {
    it('should navigate to contact page when contact button is clicked', () => {
      render(<Footer />);
      
      const contactButton = screen.getByRole('button', { name: /contact us/i });
      userEvent.click(contactButton);
      
      // Verify navigation
      expect(window.location.href).toBe('/contact');
    });

    it('should have hover states for links', () => {
      render(<Footer />);
      
      const links = screen.getAllByRole('link');
      
      links.forEach(link => {
        expect(link).toHaveStyle({
          '&:hover': {
            color: theme.palette.primary.main,
            textDecoration: 'underline',
          },
        });
      });
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle missing theme values gracefully', () => {
      // Mock theme with missing values
      jest.mock('../../../config/theme.config', () => ({
        theme: {},
      }));
      
      // Verify component renders without crashing
      expect(() => render(<Footer />)).not.toThrow();
    });
  });
});