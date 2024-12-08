/**
 * @fileoverview Redux slice for managing authentication state in Estate Kit frontend
 * 
 * Requirements addressed:
 * - Account creation and authentication (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Implements state management for user authentication, including login, logout, and token handling.
 * 
 * Human Tasks:
 * 1. Ensure Auth0 configuration is properly set up as specified in auth.config.ts
 * 2. Verify environment variables for Auth0 are configured in .env file
 * 3. Test authentication flow with configured Auth0 tenant
 */

// @reduxjs/toolkit version ^1.9.5
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthTypes } from '../../types/auth.types';
import { getAuthConfig } from '../../config/auth.config';

// Validate auth configuration on initialization
getAuthConfig();

/**
 * Interface defining the structure of the authentication state
 */
interface AuthState {
    user: string | null;
    token: string | null;
    role: AuthTypes['role'] | null;
    isAuthenticated: boolean;
}

/**
 * Interface for login action payload
 */
interface LoginPayload {
    email: AuthTypes['email'];
    token: AuthTypes['token'];
    role: AuthTypes['role'];
}

/**
 * Initial state for the authentication slice
 */
const initialState: AuthState = {
    user: null,
    token: null,
    role: null,
    isAuthenticated: false
};

/**
 * Redux slice for managing authentication state
 */
export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        /**
         * Updates the authentication state with user details and token upon successful login
         */
        login: (state, action: PayloadAction<LoginPayload>) => {
            const { email, token, role } = action.payload;
            state.user = email;
            state.token = token;
            state.role = role;
            state.isAuthenticated = true;
        },
        
        /**
         * Clears the authentication state upon logout
         */
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.role = null;
            state.isAuthenticated = false;
        }
    }
});

/**
 * Selector for retrieving the authentication state from the Redux store
 * @param state - The root state of the Redux store
 * @returns The current authentication state
 */
export const selectAuthState = (state: { auth: AuthState }): AuthState => state.auth;

// Export actions and reducer
export const { login, logout } = authSlice.actions;
export const { reducer } = authSlice;