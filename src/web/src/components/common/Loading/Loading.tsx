import React from 'react';
import '../../styles/animations.css';
import '../../styles/variables.css';

/**
 * Props interface for the Loading component with comprehensive accessibility options
 */
interface LoadingProps {
  /** Controls the size of the loading spinner: small (24px), medium (40px), or large (56px) */
  size?: 'small' | 'medium' | 'large';
  /** Determines the color theme using CSS variables for consistent theming */
  color?: 'primary' | 'secondary' | 'neutral';
  /** Accessible label for screen readers with clear, concise messaging */
  label?: string;
  /** Controls whether to show a semi-transparent background overlay */
  overlay?: boolean;
}

/**
 * A reusable loading spinner component optimized for accessibility and senior users.
 * Features:
 * - WCAG 2.1 Level AA compliant
 * - Reduced motion support
 * - High contrast colors
 * - Clear visual feedback
 * - Proper ARIA attributes
 * 
 * @param {LoadingProps} props - Component props
 * @returns {JSX.Element} Loading spinner component
 */
const Loading: React.FC<LoadingProps> = ({
  size = 'medium',
  color = 'primary',
  label = 'Loading...',
  overlay = false,
}) => {
  // Map size values to CSS dimensions
  const sizeMap = {
    small: '24px',
    medium: '40px',
    large: '56px',
  };

  // Create CSS variables for dynamic styling
  const spinnerStyle = {
    '--spinner-size': sizeMap[size],
    '--spinner-color': `var(--color-${color})`,
    '--color-background': 'var(--color-background-paper)',
  } as React.CSSProperties;

  // Base spinner component with accessibility attributes
  const SpinnerElement = (
    <div 
      className="loading-container"
      style={spinnerStyle}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="loading-spinner spin" />
      <span className="visually-hidden">{label}</span>
    </div>
  );

  // Render with or without overlay
  return overlay ? (
    <div className="loading-overlay">
      {SpinnerElement}
    </div>
  ) : SpinnerElement;
};

/**
 * CSS styles for the loading component
 */
const styles = `
  .loading-container {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    min-height: var(--spinner-size);
    min-width: var(--spinner-size);
  }

  .loading-spinner {
    border: 3px solid var(--color-background);
    border-top: 3px solid var(--spinner-color);
    border-radius: 50%;
    width: var(--spinner-size);
    height: var(--spinner-size);
    will-change: transform;
    transform: translateZ(0);
  }

  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.8);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .loading-spinner {
      animation: none !important;
      opacity: 0.7;
    }
  }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default Loading;