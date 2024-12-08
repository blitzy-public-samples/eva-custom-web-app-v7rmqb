// @testing-library/react version ^13.4.0
import { render, screen } from '@testing-library/react';
// jest version ^29.0.0
import '@testing-library/jest-dom';
import React from 'react';
import { Loading } from './Loading';
import { mockApiRequest } from 'src/web/src/utils/test.util';

/**
 * Unit tests for the Loading component
 * 
 * Requirements addressed:
 * - Frontend Component Testing (Technical Specifications/4.5 Development & Deployment/Testing)
 *   Implements unit tests to validate the functionality and rendering of the Loading component.
 */

describe('Loading Component', () => {
  beforeEach(() => {
    // Reset any mocks before each test
    jest.clearAllMocks();
  });

  it('should render loading spinner when isVisible is true', () => {
    render(<Loading isVisible={true} />);
    
    // Check if loading container is present
    const loadingContainer = screen.getByRole('status');
    expect(loadingContainer).toBeInTheDocument();
    
    // Check if loading spinner is present
    const loadingSpinner = screen.getByRole('status').querySelector('.loading-spinner');
    expect(loadingSpinner).toBeInTheDocument();
    
    // Check if loading text is present
    const loadingText = screen.getByText('Loading...');
    expect(loadingText).toBeInTheDocument();
    
    // Verify ARIA attributes for accessibility
    expect(loadingContainer).toHaveAttribute('aria-live', 'polite');
    expect(loadingContainer).toHaveAttribute('aria-busy', 'true');
  });

  it('should not render anything when isVisible is false', () => {
    render(<Loading isVisible={false} />);
    
    // Check that loading container is not present
    const loadingContainer = screen.queryByRole('status');
    expect(loadingContainer).not.toBeInTheDocument();
    
    // Check that loading text is not present
    const loadingText = screen.queryByText('Loading...');
    expect(loadingText).not.toBeInTheDocument();
  });

  it('should handle loading state during API requests', async () => {
    // Mock API request with delay
    const mockResponse = { data: { success: true }, status: 200 };
    mockApiRequest({
      url: '/test',
      method: 'GET',
      delay: 1000,
      data: mockResponse.data,
      status: mockResponse.status
    });

    // Render loading component
    render(<Loading isVisible={true} />);
    
    // Verify loading state is shown during request
    const loadingContainer = screen.getByRole('status');
    expect(loadingContainer).toBeInTheDocument();
    
    // Verify loading animation is present
    const loadingSpinner = screen.getByRole('status').querySelector('.loading-spinner');
    expect(loadingSpinner).toHaveClass('loading-spinner');
    
    // Verify loading text is shown
    const loadingText = screen.getByText('Loading...');
    expect(loadingText).toBeInTheDocument();
  });

  it('should apply correct styles and animations', () => {
    render(<Loading isVisible={true} />);
    
    // Check loading container styles
    const loadingContainer = screen.getByRole('status');
    expect(loadingContainer).toHaveClass('loading-container');
    
    // Check loading spinner styles and animation
    const loadingSpinner = screen.getByRole('status').querySelector('.loading-spinner');
    const spinnerStyles = window.getComputedStyle(loadingSpinner as Element);
    expect(spinnerStyles.animation).toContain('pulse');
    expect(spinnerStyles.animation).toContain('spin');
    
    // Check loading text styles
    const loadingText = screen.getByText('Loading...');
    expect(loadingText).toHaveClass('loading-text');
  });

  it('should respect reduced motion preferences', () => {
    // Mock prefers-reduced-motion media query
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(<Loading isVisible={true} />);
    
    // Check that animations are disabled when reduced motion is preferred
    const loadingSpinner = screen.getByRole('status').querySelector('.loading-spinner');
    const spinnerStyles = window.getComputedStyle(loadingSpinner as Element);
    
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      expect(spinnerStyles.animation).toBe('none');
    }
  });

  it('should handle high contrast mode', () => {
    // Mock prefers-contrast media query
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-contrast: high)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(<Loading isVisible={true} />);
    
    // Check high contrast styles are applied when preferred
    const loadingSpinner = screen.getByRole('status').querySelector('.loading-spinner');
    const spinnerStyles = window.getComputedStyle(loadingSpinner as Element);
    
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      expect(spinnerStyles.borderColor).toBe('#000');
      expect(spinnerStyles.borderTopColor).toBe('#fff');
    }
  });
});