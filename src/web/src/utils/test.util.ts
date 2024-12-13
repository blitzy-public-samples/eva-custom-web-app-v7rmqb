/**
 * Test Utilities for Estate Kit Frontend
 * Version: 1.0.0
 * 
 * Provides comprehensive testing utilities for React components and Redux state management
 * with TypeScript support, accessibility testing, and standardized testing patterns.
 * 
 * @package @testing-library/react ^14.0.0
 * @package react-redux ^8.1.0
 * @package react-router-dom ^6.0.0
 */

import { ReactElement } from 'react';
import { render, screen, fireEvent, within, waitFor, RenderResult } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter, MemoryRouter, Location } from 'react-router-dom';
import { Store, getState, dispatch, replaceReducer } from '../redux/store';
import { AuthState } from '../types/auth.types';

// Default mock states
export const defaultAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
  mfaRequired: false,
  mfaVerified: false,
  sessionExpiry: null,
  lastActivity: Date.now()
};

// Interface for render options
interface RenderWithProvidersOptions {
  initialState?: any;
  store?: Store;
  route?: string;
  routerType?: 'memory' | 'browser';
  mockDispatch?: jest.Mock;
}

// Interface for enhanced render result
interface EnhancedRenderResult extends RenderResult {
  store: Store;
  mockDispatch?: jest.Mock;
  rerender: (ui: ReactElement) => void;
  history: {
    location: Location;
    push: (path: string) => void;
    replace: (path: string) => void;
  };
}

/**
 * Enhanced utility to render components with Redux Provider and Router
 * Includes accessibility and user interaction testing support
 */
export const renderWithProviders = (
  ui: ReactElement,
  options: RenderWithProvidersOptions = {}
): EnhancedRenderResult => {
  const {
    initialState = {},
    store = createMockStore({ initialState }),
    route = '/',
    routerType = 'memory',
    mockDispatch
  } = options;

  // Mock dispatch if provided
  if (mockDispatch) {
    store.dispatch = mockDispatch;
  }

  // Wrap with providers
  const Wrapper = ({ children }: { children: ReactElement }) => {
    const Router = routerType === 'memory' ? MemoryRouter : BrowserRouter;
    return (
      <Provider store={store}>
        <Router>{children}</Router>
      </Provider>
    );
  };

  // Render with enhanced result
  const renderResult = render(ui, { wrapper: Wrapper });

  return {
    ...renderResult,
    store,
    mockDispatch,
    rerender: (ui: ReactElement) => renderResult.rerender(<Wrapper>{ui}</Wrapper>),
    history: {
      location: window.location,
      push: (path: string) => window.history.pushState({}, '', path),
      replace: (path: string) => window.history.replaceState({}, '', path)
    }
  };
};

/**
 * Creates a fully configured mock Redux store with TypeScript support
 */
export const createMockStore = (options: {
  initialState?: any;
  middleware?: any[];
} = {}): Store => {
  const { initialState = {}, middleware = [] } = options;

  // Create store with initial state
  const store = {
    getState: () => ({ ...initialState }),
    dispatch: jest.fn(),
    subscribe: jest.fn(),
    replaceReducer: jest.fn(),
  } as unknown as Store;

  return store;
};

/**
 * Creates strongly-typed mock authentication state
 */
export const createMockAuthState = (overrides: Partial<AuthState> = {}): AuthState => {
  return {
    ...defaultAuthState,
    ...overrides
  };
};

/**
 * User interaction helpers with accessibility support
 */
export const userInteractions = {
  click: async (element: Element | null) => {
    if (!element) throw new Error('Element not found');
    fireEvent.click(element);
    await waitFor(() => {});
  },

  type: async (element: Element | null, value: string) => {
    if (!element) throw new Error('Element not found');
    fireEvent.change(element, { target: { value } });
    await waitFor(() => {});
  },

  submit: async (formElement: Element | null) => {
    if (!formElement) throw new Error('Form element not found');
    fireEvent.submit(formElement);
    await waitFor(() => {});
  }
};

/**
 * Accessibility testing helpers
 */
export const accessibilityHelpers = {
  getByRole: (role: string, name?: string) => 
    screen.getByRole(role, name ? { name } : undefined),

  queryByRole: (role: string, name?: string) =>
    screen.queryByRole(role, name ? { name } : undefined),

  getByLabelText: (text: string) => screen.getByLabelText(text),

  getByText: (text: string) => screen.getByText(text)
};

/**
 * Redux state testing helpers
 */
export const reduxHelpers = {
  dispatchAction: (store: Store, action: any) => {
    store.dispatch(action);
    return waitFor(() => {});
  },

  getState: (store: Store) => store.getState(),

  selectFromState: <T>(store: Store, selector: (state: any) => T): T => 
    selector(store.getState())
};

/**
 * Router testing helpers
 */
export const routerHelpers = {
  navigateTo: async (path: string) => {
    window.history.pushState({}, '', path);
    await waitFor(() => {});
  },

  getLocation: () => window.location,

  getPathname: () => window.location.pathname
};

/**
 * Async testing helpers
 */
export const asyncHelpers = {
  waitForElement: (callback: () => Element | null) => 
    waitFor(() => {
      const element = callback();
      expect(element).toBeInTheDocument();
      return element;
    }),

  waitForElementToBeRemoved: (callback: () => Element | null) =>
    waitFor(() => {
      const element = callback();
      expect(element).not.toBeInTheDocument();
    })
};