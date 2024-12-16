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
  PayloadAction,
  EntityId
} from '@reduxjs/toolkit';
import { 
  Delegate, 
  CreateDelegateDTO, 
  UpdateDelegateDTO, 
  DelegateRole, 
  DelegateAuditLog 
} from '../../redux/types/delegate.types';
import DelegateService from '../../services/delegate.service';

const delegateAdapter = createEntityAdapter<Delegate>({
  selectId: (delegate) => delegate.id,
  sortComparer: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
});

interface DelegateState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  cache: {
    timestamp: number;
    ttl: number;
  };
  auditLog: DelegateAuditLog[];
}

const initialState = delegateAdapter.getInitialState<DelegateState>({
  status: 'idle',
  error: null,
  cache: {
    timestamp: 0,
    ttl: 300000,
  },
  auditLog: [],
});

export const fetchDelegates = createAsyncThunk(
  'delegates/fetchDelegates',
  async (_, { rejectWithValue }) => {
    try {
      const delegates = await DelegateService.getDelegates();
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

export const createDelegate = createAsyncThunk(
  'delegates/createDelegate',
  async (delegateData: CreateDelegateDTO, { rejectWithValue }) => {
    try {
      const newDelegate = await DelegateService.createDelegate(delegateData);
      return newDelegate;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateDelegate = createAsyncThunk(
  'delegates/updateDelegate',
  async (
    { id, data }: { id: EntityId; data: UpdateDelegateDTO },
    { rejectWithValue }
  ) => {
    try {
      const updatedDelegate = await DelegateService.updateDelegate(id.toString(), data);
      return updatedDelegate;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const removeDelegate = createAsyncThunk(
  'delegates/removeDelegate',
  async (delegateId: EntityId, { rejectWithValue }) => {
    try {
      await DelegateService.revokeDelegate(delegateId.toString());
      return delegateId;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const delegateSlice = createSlice({
  name: 'delegates',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addAuditLogEntry: (state, action: PayloadAction<DelegateAuditLog>) => {
      state.auditLog.push(action.payload);
    },
    invalidateCache: (state) => {
      state.cache.timestamp = 0;
    },
  },
  extraReducers: (builder) => {
    builder
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
      .addCase(createDelegate.fulfilled, (state, action) => {
        delegateAdapter.addOne(state, action.payload);
      })
      .addCase(updateDelegate.fulfilled, (state, action) => {
        delegateAdapter.upsertOne(state, action.payload);
      })
      .addCase(removeDelegate.fulfilled, (state, action) => {
        delegateAdapter.removeOne(state, action.payload);
      });
  },
});

export const { clearError, addAuditLogEntry, invalidateCache } = delegateSlice.actions;

export const {
  selectAll: selectAllDelegates,
  selectById: selectDelegateById,
  selectIds: selectDelegateIds,
} = delegateAdapter.getSelectors((state: any) => state.delegates);

export const selectDelegatesByRole = (state: any, role: DelegateRole) =>
  selectAllDelegates(state).filter((delegate) => delegate.role === role);

export const selectDelegateStatus = (state: any) => state.delegates.status;
export const selectDelegateError = (state: any) => state.delegates.error;
export const selectDelegateAuditLog = (state: any) => state.delegates.auditLog;

export default delegateSlice.reducer;