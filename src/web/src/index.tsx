/**
 * Estate Kit Web Application Entry Point
 * Version: 1.0.0
 * 
 * Implements secure application initialization with enhanced error handling,
 * performance monitoring, and React 18 concurrent features.
 * 
 * @package react ^18.2.0
 * @package react-dom ^18.2.0
 * @package react-redux ^8.0.5
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import { store } from './redux/store';
import './styles/global.css';

/**
 * Initializes application monitoring and error tracking
 */
const initializeApp = (): void => {
  // Enable React strict mode in development
  if (process.env.NODE_ENV === 'development') {
    console.info('Development mode enabled:', {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      version: process.env.VITE_APP_VERSION || '1.0.0'
    });
  }

  // Set up global error handler
  window.onerror = (message, source, lineno, colno, error) => {
    console.error('Global error:', {
      timestamp: new Date().toISOString(),
      message,
      source,
      lineno,
      colno,
      error: error?.stack
    });
  };

  // Handle unhandled promise rejections
  window.onunhandledrejection = (event) => {
    console.error('Unhandled promise rejection:', {
      timestamp: new Date().toISOString(),
      reason: event.reason
    });
    event.preventDefault();
  };
};

/**
 * Initializes and renders the React application with all required providers
 */
const renderApp = (): void => {
  // Get root element with type safety
  const rootElement = (document.getElementById('root') as HTMLElement | null) ?? 
    (() => { throw new Error('Root element not found'); })();

  // Create React 18 root
  const root = createRoot(rootElement);

  // Start performance tracking
  const startTime = performance.now();

  // Render application with providers
  root.render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  );

  // Log performance metrics
  const renderTime = performance.now() - startTime;
  console.info('Initial render complete:', {
    timestamp: new Date().toISOString(),
    renderTime: `${renderTime.toFixed(2)}ms`
  });
};

// Initialize application
try {
  initializeApp();
  renderApp();
} catch (error) {
  console.error('Application initialization failed:', {
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? error.message : 'Unknown error'
  });
  
  // Display user-friendly error message
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="
        padding: 2rem;
        margin: 2rem;
        border: 2px solid #E53E3E;
        border-radius: 8px;
        background-color: #FFF5F5;
        color: #2D3748;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <h2>We apologize for the inconvenience</h2>
        <p>The application failed to initialize. Please try refreshing the page.</p>
        <p>If the problem persists, please contact our support team.</p>
      </div>
    `;
  }
}