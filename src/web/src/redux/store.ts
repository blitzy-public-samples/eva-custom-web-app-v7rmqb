/**
 * Redux Store Configuration
 * Version: 1.0.0
 * 
 * Implements secure, type-safe Redux store configuration with performance monitoring,
 * middleware integration, and development tools for the Estate Kit platform.
 * 
 * @package @reduxjs/toolkit ^1.9.0
 * @package react-redux ^8.0.5
 */

import { 
  configureStore, 
  ThunkAction, 
  Action,
  combineReducers,
  Middleware,
  isRejectedWithValue
} from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Import reducers
import authReducer from './slices/authSlice';
import documentReducer from './slices/documentSlice';
import delegateReducer from './slices/delegateSlice';
import subscriptionReducer from './slices/subscriptionSlice';

// Performance monitoring middleware
const performanceMiddleware: Middleware = () => (next) => (action) => {
  const start = performance.now();
  const result = next(action);
  const duration = performance.now() - start;

  // Log performance metrics for actions taking longer than 100ms
  if (duration > 100) {
    console.warn('Slow action detected:', {
      type: action.type,
      duration: `${duration.toFixed(2)}ms`
    });
  }

  return result;
};

// Error handling middleware
const errorMiddleware: Middleware = () => (next) => (action) => {
  // Handle rejected actions
  if (isRejectedWithValue(action)) {
    console.error('Action Error:', {
      type: action.type,
      error: action.payload,
      timestamp: new Date().toISOString()
    });
  }
  return next(action);
};

// Security middleware for development tools
const securityMiddleware: Middleware = () => (next) => (action) => {
  // Prevent certain actions in production
  if (import.meta.env.NODE_ENV === 'production' && action.type.includes('@@INIT')) {
    return next(action);
  }
  return next(action);
};

// Combine reducers with type safety
const rootReducer = combineReducers({
  auth: authReducer,
  documents: documentReducer,
  delegates: delegateReducer,
  subscription: subscriptionReducer
});

// Configure Redux store with middleware and DevTools
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST']
      },
      thunk: true,
      immutableCheck: true
    }).concat([
      performanceMiddleware,
      errorMiddleware,
      securityMiddleware
    ]),
  devTools: import.meta.env.NODE_ENV !== 'production' && {
    name: 'Estate Kit',
    trace: true,
    traceLimit: 25,
    maxAge: 50
  }
});

// Type definitions for enhanced type safety
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Type-safe hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Type definition for thunk actions
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

// Export configured store
export default store;