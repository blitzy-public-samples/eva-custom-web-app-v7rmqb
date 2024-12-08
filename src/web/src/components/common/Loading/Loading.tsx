/**
 * Estate Kit - Loading Component
 * 
 * Human Tasks:
 * 1. Verify loading spinner animation performance across browsers
 * 2. Test loading spinner visibility with screen readers
 * 3. Confirm loading spinner contrast meets WCAG 2.1 Level AA standards
 * 4. Validate loading spinner behavior with reduced motion settings
 */

import React from 'react';
import '../../styles/global.css';
import '../../styles/animations.css';

/**
 * Loading component that displays an animated spinner.
 * 
 * Requirements addressed:
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Provides a consistent loading indicator across the application.
 * - Accessibility Compliance (Technical Specifications/3.1 User Interface Design/Accessibility)
 *   Implements an accessible loading spinner with ARIA attributes and respects motion preferences.
 * 
 * @param {boolean} isVisible - Controls the visibility of the loading spinner
 * @returns {JSX.Element | null} The loading spinner component or null if not visible
 */
export const Loading: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="loading-container"
    >
      <div className="loading-spinner" />
      <span className="loading-text">Loading...</span>
      
      <style jsx>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-md);
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--neutral-color-light);
          border-top-color: var(--primary-color);
          border-radius: 50%;
          animation: pulse var(--pulse-duration) var(--pulse-timing-function) infinite,
                     spin 1s linear infinite;
        }

        .loading-text {
          margin-top: var(--spacing-sm);
          color: var(--text-color);
          font-size: var(--font-size-sm);
          font-family: var(--font-family-base);
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Respect user's motion preferences - Addresses Accessibility Compliance requirement */
        @media (prefers-reduced-motion: reduce) {
          .loading-spinner {
            animation: none;
          }
        }

        /* High contrast mode - Addresses Accessibility Compliance requirement */
        @media (prefers-contrast: high) {
          .loading-spinner {
            border-color: #000;
            border-top-color: #fff;
          }
          
          .loading-text {
            color: #000;
          }
        }
      `}</style>
    </div>
  );
};

export default Loading;