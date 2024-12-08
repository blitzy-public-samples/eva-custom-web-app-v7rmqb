/**
 * Estate Kit - Redux Store Configuration
 * 
 * Requirements addressed:
 * - State Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Implements centralized state management for the frontend application using Redux Toolkit.
 * 
 * Human Tasks:
 * 1. Verify Redux DevTools integration in development environment
 * 2. Test state persistence configuration if needed
 * 3. Monitor Redux store performance with large state trees
 */

// @reduxjs/toolkit version ^1.9.5
import { configureStore } from '@reduxjs/toolkit';

// Import reducers from slices
import { reducer as authReducer } from './slices/authSlice';
import { reducer as subscriptionReducer } from './slices/subscriptionSlice';
import documentReducer from './slices/documentSlice';
import delegateReducer from './slices/delegateSlice';

/**
 * Configure and create the Redux store with all application slices
 * Implements centralized state management using Redux Toolkit
 */
const store = configureStore({
  reducer: {
    auth: authReducer,
    subscription: subscriptionReducer,
    document: documentReducer,
    delegate: delegateReducer
  },
  // Enable Redux DevTools integration and default middleware
  devTools: process.env.NODE_ENV !== 'production',
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore specific action types or paths in state for date objects
        ignoredActions: ['subscription/fetchSubscription/fulfilled'],
        ignoredPaths: [
          'document.documents.createdAt',
          'document.documents.updatedAt',
          'subscription.subscriptions.startDate',
          'subscription.subscriptions.endDate',
          'delegate.delegates.expiresAt'
        ]
      }
    })
});

// Export store types for TypeScript support
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;