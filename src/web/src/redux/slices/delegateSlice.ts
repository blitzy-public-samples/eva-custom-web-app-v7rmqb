/**
 * Delegate Management Redux Slice
 * Version: 1.0.0
 * 
 * Implements comprehensive delegate access management with role-based permissions,
 * audit logging, and secure invitation workflow for the Estate Kit platform.
 * 
 * @package @reduxjs/toolkit ^1.9.0
 */

import { 
  createSlice, 
  createAsyncThunk, 
  createEntityAdapter,
  PayloadAction
} from '@reduxjs/toolkit';
import { 
  Delegate, 
  CreateDelegateDTO, 
  UpdateDelegateDTO, 
  DelegateRole, 
  DelegateAuditLog 
} from '../types/delegate.types';
import DelegateService from '../../services/delegate.service';

// Entity adapter for normalized state management
const delegateAdapter = createEntityAdapter<Delegate>({
  selectId: (delegate) => delegate.id,
  sortComparer: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
});

// Interface for delegate state including cache and audit log
interface DelegateState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  cache: {
    timestamp: number;
    ttl: number;
  };
  auditLog: DelegateAuditLog[];
}

// Initial state with cache configuration
const initialState = delegateAdapter.getInitialState<DelegateState>({
  status: 'idle',
  error: null,
  cache: {
    timestamp: 0,
    ttl: 300000, // 5 minutes cache TTL
  },
  auditLog: [],
});

// Async thunk for fetching delegates with cache validation
export const fetchDelegates = createAsyncThunk(
  'delegates/fetchDelegates',
  async (_, { rejectWithValue }) => {
    try {
      const delegateService = new DelegateService();
      const delegates = await delegateService.getDelegates();
      return delegates;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
  {
    condition: (_, { getState }) => {
      const { delegates } = getState() as { delegates: DelegateState };
      const now = Date.now();
      const cacheValid = now - delegates.cache.timestamp < delegates.cache.ttl;
      return !cacheValid;
    },
  }
);

// Async thunk for creating new delegate
export const createDelegate = createAsyncThunk(
  'delegates/createDelegate',
  async (delegateData: CreateDelegateDTO, { rejectWithValue }) => {
    try {
      const delegateService = new DelegateService();
      const newDelegate = await delegateService.createDelegate(delegateData);
      return newDelegate;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunk for updating delegate
export const updateDelegate = createAsyncThunk(
  'delegates/updateDelegate',
  async (
    { id, data }: { id: string; data: UpdateDelegateDTO },
    { rejectWithValue }
  ) => {
    try {
      const delegateService = new DelegateService();
      const updatedDelegate = await delegateService.updateDelegate(id, data);
      return updatedDelegate;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunk for removing delegate
export const removeDelegate = createAsyncThunk(
  'delegates/removeDelegate',
  async (delegateId: string, { rejectWithValue }) => {
    try {
      const delegateService = new DelegateService();
      await delegateService.revokeDelegate(delegateId);
      return delegateId;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Create the delegate slice
const delegateSlice = createSlice({
  name: 'delegates',
  initialState,
  reducers: {
    // Clear error state
    clearError: (state) => {
      state.error = null;
    },
    // Add audit log entry
    addAuditLogEntry: (state, action: PayloadAction<DelegateAuditLog>) => {
      state.auditLog.push(action.payload);
    },
    // Clear cache to force refresh
    invalidateCache: (state) => {
      state.cache.timestamp = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch delegates reducers
      .addCase(fetchDelegates.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDelegates.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.cache.timestamp = Date.now();
        delegateAdapter.setAll(state, action.payload);
      })
      .addCase(fetchDelegates.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Create delegate reducers
      .addCase(createDelegate.fulfilled, (state, action) => {
        delegateAdapter.addOne(state, action.payload);
      })
      // Update delegate reducers
      .addCase(updateDelegate.fulfilled, (state, action) => {
        delegateAdapter.upsertOne(state, action.payload);
      })
      // Remove delegate reducers
      .addCase(removeDelegate.fulfilled, (state, action) => {
        delegateAdapter.removeOne(state, action.payload);
      });
  },
});

// Export actions
export const { clearError, addAuditLogEntry, invalidateCache } = delegateSlice.actions;

// Export selectors
export const {
  selectAll: selectAllDelegates,
  selectById: selectDelegateById,
  selectIds: selectDelegateIds,
} = delegateAdapter.getSelectors((state: any) => state.delegates);

// Custom selectors
export const selectDelegatesByRole = (state: any, role: DelegateRole) =>
  selectAllDelegates(state).filter((delegate) => delegate.role === role);

export const selectDelegateStatus = (state: any) => state.delegates.status;
export const selectDelegateError = (state: any) => state.delegates.error;
export const selectDelegateAuditLog = (state: any) => state.delegates.auditLog;

// Export reducer
export default delegateSlice.reducer;