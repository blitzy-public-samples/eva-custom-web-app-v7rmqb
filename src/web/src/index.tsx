/**
 * Estate Kit - Frontend Application Entry Point
 * 
 * Human Tasks:
 * 1. Verify Intercom app ID is configured in environment variables
 * 2. Test theme configuration across different viewport sizes
 * 3. Validate accessibility of root application structure
 */

// react version ^18.2.0
import React from 'react';
// react-dom version ^18.2.0
import ReactDOM from 'react-dom';
// @mui/material version 5.11.0
import { ThemeProvider } from '@mui/material';

// Internal imports
import App from './App';
import { theme } from './config/theme.config';
import { initializeIntercom } from './config/intercom.config';

/**
 * Initialize the Estate Kit frontend application by rendering the root component
 * and applying global configurations.
 * 
 * Requirements addressed:
 * - Frontend Initialization (Technical Specifications/3.1 User Interface Design/Core Layout Structure)
 *   Ensures the application is initialized with the root React component and global configurations.
 * - Global Theming (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Applies global theming and styles to ensure a consistent user interface.
 * - Third-Party Integration (Technical Specifications/1.2 System Overview/High-Level Description/Integrations)
 *   Initializes third-party integrations such as Intercom for customer support.
 */
const initializeApp = async () => {
  try {
    // Initialize Intercom if app ID is available
    if (process.env.REACT_APP_INTERCOM_APP_ID) {
      await initializeIntercom({
        userId: 'anonymous',
        email: '',
        name: 'Anonymous User',
        createdAt: new Date(),
        role: 'user'
      });
    }

    // Get the root element
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Root element not found');
    }

    // Render the application
    ReactDOM.render(
      <React.StrictMode>
        <ThemeProvider theme={theme}>
          <App />
        </ThemeProvider>
      </React.StrictMode>,
      rootElement
    );
  } catch (error) {
    console.error('Application initialization failed:', error);
    // Display a user-friendly error message
    const errorElement = document.createElement('div');
    errorElement.style.padding = '20px';
    errorElement.style.textAlign = 'center';
    errorElement.innerHTML = `
      <h1>Application Error</h1>
      <p>We're sorry, but the application failed to initialize. Please try refreshing the page.</p>
    `;
    document.body.appendChild(errorElement);
  }
};

// Initialize the application
initializeApp();