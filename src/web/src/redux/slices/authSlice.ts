/**
 * Authentication Redux Slice
 * Version: 1.0.0
 * 
 * Implements secure authentication state management with Auth0 integration,
 * MFA support, session management, and comprehensive error handling.
 * 
 * @package @reduxjs/toolkit ^1.9.0
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AuthService from '../../services/auth.service';
import { AuthState, LoginPayload, RegisterPayload } from '../../types/auth.types';

// Initial state with comprehensive security tracking
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
  mfaRequired: false,
  mfaVerified: false,
  mfaPending: false,
  sessionExpiry: null,
  lastActivity: Date.now()
};

/**
 * Async thunk for secure user login with MFA support
 */
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginPayload, { rejectWithValue }) => {
    try {
      const response = await AuthService.login(credentials);
      
      // Log successful authentication attempt for audit
      console.info('Authentication attempt:', {
        timestamp: new Date().toISOString(),
        email: credentials.email,
        success: true
      });

      return response;
    } catch (error: any) {
      // Log failed authentication attempt
      console.error('Authentication failed:', {
        timestamp: new Date().toISOString(),
        email: credentials.email,
        error: error.message
      });

      return rejectWithValue(error.message);
    }
  }
);

/**
 * Async thunk for secure user registration
 */
export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterPayload, { rejectWithValue }) => {
    try {
      await AuthService.register(userData);

      // Log successful registration for audit
      console.info('Registration successful:', {
        timestamp: new Date().toISOString(),
        email: userData.email
      });

      return true;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Async thunk for secure logout
 */
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await AuthService.logout();

      // Log logout event
      console.info('User logged out:', {
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Async thunk for MFA verification
 */
export const verifyMFA = createAsyncThunk(
  'auth/verifyMFA',
  async ({ email, code }: { email: string; code: string }, { rejectWithValue }) => {
    try {
      const response = await AuthService.verifyMFA(email, code);

      // Log successful MFA verification
      console.info('MFA verification successful:', {
        timestamp: new Date().toISOString()
      });

      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Async thunk for token refresh
 */
export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await AuthService.refreshToken();

      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Async thunk for session refresh
 */
export const refreshSession = createAsyncThunk(
  'auth/refreshSession',
  async (_, { rejectWithValue }) => {
    try {
      const response = await AuthService.refreshToken();
      
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Authentication slice with comprehensive security features
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setMFARequired: (state, action: PayloadAction<boolean>) => {
      state.mfaRequired = action.payload;
    },
    setMFAVerified: (state, action: PayloadAction<boolean>) => {
      state.mfaVerified = action.payload;
    },
    setSessionExpiry: (state, action: PayloadAction<number | null>) => {
      state.sessionExpiry = action.payload;
    },
    updateLastActivity: (state) => {
      state.lastActivity = Date.now();
    }
  },
  extraReducers: (builder) => {
    // Login reducers
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = {
          id: action.payload.user.id,
          email: action.payload.user.email,
          name: action.payload.user.name,
          province: action.payload.user.province,
          mfaEnabled: action.payload.user.mfaEnabled
        };
        state.sessionExpiry = action.payload.expiresAt;
        state.loading = false;
        state.error = null;
        state.lastActivity = Date.now();
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      })

    // Register reducers
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

    // Logout reducers
    builder
      .addCase(logout.fulfilled, () => {
        return { ...initialState, lastActivity: Date.now() };
      })

    // MFA verification reducers
    builder
      .addCase(verifyMFA.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyMFA.fulfilled, (state) => {
        state.mfaRequired = false;
        state.mfaVerified = true;
        state.loading = false;
        state.error = null;
        state.lastActivity = Date.now();
      })
      .addCase(verifyMFA.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.mfaVerified = false;
      })

    // Token refresh reducers
    builder
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.sessionExpiry = action.payload.expiresAt;
        state.lastActivity = Date.now();
      })
      .addCase(refreshToken.rejected, () => {
        return { ...initialState, lastActivity: Date.now() };
      })

    // Session refresh reducers
    builder
      .addCase(refreshSession.fulfilled, (state, action) => {
        state.sessionExpiry = action.payload.expiresAt;
        state.lastActivity = Date.now();
      })
      .addCase(refreshSession.rejected, () => {
        return { ...initialState, lastActivity: Date.now() };
      });
  }
});

// Export actions
export const {
  setLoading,
  setError,
  clearError,
  setMFARequired,
  setMFAVerified,
  setSessionExpiry,
  updateLastActivity
} = authSlice.actions;

// Export reducer
export default authSlice.reducer;