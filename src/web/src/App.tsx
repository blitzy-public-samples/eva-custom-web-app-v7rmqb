/**
 * Estate Kit - Frontend Application Entry Point
 * 
 * Requirements addressed:
 * - Frontend Design Consistency (Technical Specifications/3.1 User Interface Design/Design System Specifications)
 *   Ensures consistent design and theming across the web application by integrating global styles and layout components.
 * - Critical User Flows (Technical Specifications/3.1 User Interface Design/Critical User Flows)
 *   Supports navigation through key user flows such as dashboard, documents, and settings.
 * - State Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Integrates Redux for centralized state management.
 */

// react version ^18.2.0
import React from 'react';
// react-redux version ^8.0.5
import { Provider } from 'react-redux';
// @mui/material version 5.11.0
import { ThemeProvider } from '@mui/material';

// Internal imports
import { theme } from './config/theme.config';
import AppRoutes from './routes';
import store from './redux/store';
import MainLayout from './components/layout/MainLayout/MainLayout';

// Import global styles
import './styles/global.css';

/**
 * Main application component that integrates routing, state management, and global styling.
 * Serves as the entry point for the Estate Kit frontend application.
 * 
 * @returns {JSX.Element} The rendered application component
 */
const App: React.FC = (): JSX.Element => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <MainLayout>
          <AppRoutes />
        </MainLayout>
      </ThemeProvider>
    </Provider>
  );
};

export default App;