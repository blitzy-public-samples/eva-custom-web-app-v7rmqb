/**
 * Estate Kit - Delegate Redux Slice
 * Version: 1.0.0
 * 
 * Requirements Addressed:
 * - Delegate Access Management (Technical Specifications/1.3 Scope/In-Scope)
 *   Implements state management for delegate access control, including CRUD operations
 * - State Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Provides centralized state management for delegate-related data using Redux Toolkit
 * 
 * Human Tasks:
 * 1. Verify error handling aligns with UI requirements
 * 2. Test state updates with the Redux DevTools
 * 3. Confirm loading states trigger appropriate UI feedback
 */

// @reduxjs/toolkit version ^1.9.5
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DelegateTypes } from '../../types/delegate.types';
import {
  getDelegates,
  createDelegate,
  updateDelegate,
  deleteDelegate,
} from '../../services/delegate.service';
import { validateDelegate } from '../../utils/validation.util';

// Define the state interface
interface DelegateState {
  delegates: DelegateTypes[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// Define initial state
const initialState: DelegateState = {
  delegates: [],
  status: 'idle',
  error: null,
};

// Async thunks for CRUD operations
export const fetchDelegates = createAsyncThunk(
  'delegate/fetchDelegates',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getDelegates();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const addDelegate = createAsyncThunk(
  'delegate/addDelegate',
  async (delegate: DelegateTypes, { rejectWithValue }) => {
    try {
      if (!validateDelegate(delegate)) {
        throw new Error('Invalid delegate data');
      }
      const response = await createDelegate(delegate);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const editDelegate = createAsyncThunk(
  'delegate/editDelegate',
  async ({ delegateId, updates }: { delegateId: string; updates: Partial<DelegateTypes> }, { rejectWithValue }) => {
    try {
      const response = await updateDelegate(delegateId, updates);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeDelegate = createAsyncThunk(
  'delegate/removeDelegate',
  async (delegateId: string, { rejectWithValue }) => {
    try {
      await deleteDelegate(delegateId);
      return delegateId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Create the delegate slice
export const delegateSlice = createSlice({
  name: 'delegate',
  initialState,
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchDelegates cases
      .addCase(fetchDelegates.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDelegates.fulfilled, (state, action: PayloadAction<DelegateTypes[]>) => {
        state.status = 'succeeded';
        state.delegates = action.payload;
      })
      .addCase(fetchDelegates.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })

      // addDelegate cases
      .addCase(addDelegate.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(addDelegate.fulfilled, (state, action: PayloadAction<DelegateTypes>) => {
        state.status = 'succeeded';
        state.delegates.push(action.payload);
      })
      .addCase(addDelegate.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })

      // editDelegate cases
      .addCase(editDelegate.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(editDelegate.fulfilled, (state, action: PayloadAction<DelegateTypes>) => {
        state.status = 'succeeded';
        const index = state.delegates.findIndex(d => d.delegateId === action.payload.delegateId);
        if (index !== -1) {
          state.delegates[index] = action.payload;
        }
      })
      .addCase(editDelegate.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })

      // removeDelegate cases
      .addCase(removeDelegate.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(removeDelegate.fulfilled, (state, action: PayloadAction<string>) => {
        state.status = 'succeeded';
        state.delegates = state.delegates.filter(d => d.delegateId !== action.payload);
      })
      .addCase(removeDelegate.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

// Export actions and reducer
export const { resetError } = delegateSlice.actions;
export default delegateSlice.reducer;