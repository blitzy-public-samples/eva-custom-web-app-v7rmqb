import React from 'react';
import { render, screen, within } from '@testing-library/react'; // v14.0.0
import { describe, it, expect } from '@jest/globals'; // v29.0.0
import { axe, toHaveNoViolations } from 'jest-axe'; // v4.7.0
import Footer from './Footer';
import { renderWithProviders } from '../../../utils/test.util';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

describe('Footer Component', () => {
  // Test basic rendering
  it('renders footer content correctly', () => {
    renderWithProviders(<Footer />);

    // Verify copyright text with current year
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`© ${currentYear} Estate Kit. All rights reserved.`))
      .toBeInTheDocument();

    // Verify all required navigation links
    const links = ['Privacy Policy', 'Terms of Service', 'Accessibility', 'Contact'];
    links.forEach(linkText => {
      const link = screen.getByRole('link', { name: linkText });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', expect.stringMatching(new RegExp(linkText.toLowerCase().replace(/\s/g, ''))));
    });

    // Verify contact information
    expect(screen.getByText(/Need help\? Call us at/i)).toBeInTheDocument();
    const phoneLink = screen.getByRole('link', { name: /Call Estate Kit Support/i });
    expect(phoneLink).toHaveAttribute('href', 'tel:1-800-555-0123');
  });

  // Test accessibility compliance
  it('meets accessibility requirements', async () => {
    const { container } = renderWithProviders(<Footer />);

    // Run axe accessibility tests
    const results = await axe(container);
    expect(results).toHaveNoViolations();

    // Verify semantic HTML structure
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /Footer Navigation/i }))
      .toBeInTheDocument();

    // Test keyboard navigation sequence
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveAttribute('href');
      expect(link).toHaveStyle({ color: 'var(--color-primary)' });
      expect(link).toHaveStyle({ textDecoration: 'underline' });
    });

    // Verify ARIA labels
    expect(screen.getByLabelText('Site Footer')).toBeInTheDocument();
    expect(screen.getByLabelText('Footer Navigation')).toBeInTheDocument();
  });

  // Test senior-friendly features
  it('validates senior-friendly design elements', () => {
    renderWithProviders(<Footer />);

    // Verify minimum font size compliance
    const footerText = screen.getByText(/© \d{4} Estate Kit/);
    const computedStyle = window.getComputedStyle(footerText);
    expect(parseInt(computedStyle.fontSize)).toBeGreaterThanOrEqual(16);

    // Check link underlines for visibility
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      const linkStyle = window.getComputedStyle(link);
      expect(linkStyle.textDecoration).toContain('underline');
    });

    // Verify touch target sizes
    links.forEach(link => {
      const linkRect = link.getBoundingClientRect();
      expect(linkRect.height).toBeGreaterThanOrEqual(44); // Minimum touch target size
      expect(linkRect.width).toBeGreaterThanOrEqual(44);
    });

    // Check spacing between interactive elements
    const nav = screen.getByRole('navigation');
    const navStyle = window.getComputedStyle(nav);
    expect(parseInt(navStyle.gap)).toBeGreaterThanOrEqual(16); // Minimum spacing
  });

  // Test responsive layout
  it('handles responsive layout correctly', () => {
    // Mock different viewport sizes
    const mockMatchMedia = (matches: boolean) => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
    };

    // Test mobile layout
    mockMatchMedia(false); // Simulate mobile viewport
    const { rerender } = renderWithProviders(<Footer />);
    
    const footerContent = screen.getByRole('contentinfo');
    expect(footerContent).toHaveStyle({ textAlign: 'center' });

    // Test desktop layout
    mockMatchMedia(true); // Simulate desktop viewport
    rerender(<Footer />);
    
    const navigation = screen.getByRole('navigation');
    expect(navigation).toBeInTheDocument();
    expect(window.getComputedStyle(navigation).flexDirection).not.toBe('column');
  });

  // Test error handling
  it('handles missing props gracefully', () => {
    // Test with undefined ariaLabel
    renderWithProviders(<Footer ariaLabel={undefined} />);
    expect(screen.getByRole('contentinfo')).toHaveAttribute('aria-label', 'Site Footer');
  });

  // Test content consistency
  it('maintains consistent content across rerenders', () => {
    const { rerender } = renderWithProviders(<Footer />);
    const initialLinks = screen.getAllByRole('link').length;
    
    rerender(<Footer />);
    const rerenderedLinks = screen.getAllByRole('link').length;
    
    expect(rerenderedLinks).toBe(initialLinks);
  });
});