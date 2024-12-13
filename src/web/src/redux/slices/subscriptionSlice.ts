/**
 * Subscription Management Redux Slice
 * Version: 1.0.0
 * 
 * Manages subscription state with enhanced security, caching, and error handling
 * for the Estate Kit frontend application.
 * 
 * @package @reduxjs/toolkit ^1.9.0
 * @package redux-persist ^6.0.0
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import SubscriptionService from '../../services/subscription.service';
import { 
  ISubscription, 
  ISubscriptionPlanDetails,
  SubscriptionStatus,
  SubscriptionPlan,
  BillingCycle 
} from '../types/subscription.types';

// Interface for subscription-related errors
interface ISubscriptionError {
  code: string;
  message: string;
  timestamp: Date;
  operationId?: string;
}

// Interface for subscription state
interface SubscriptionState {
  currentSubscription: ISubscription | null;
  availablePlans: ISubscriptionPlanDetails[];
  loading: Record<string, boolean>;
  error: ISubscriptionError | null;
  retryCount: number;
  lastSync: Date | null;
  cache: {
    plans: Record<string, ISubscriptionPlanDetails>;
    expiresAt: Date | null;
  };
}

// Initial state with type safety
const initialState: SubscriptionState = {
  currentSubscription: null,
  availablePlans: [],
  loading: {},
  error: null,
  retryCount: 0,
  lastSync: null,
  cache: {
    plans: {},
    expiresAt: null
  }
};

// Cache duration in milliseconds (30 minutes)
const CACHE_DURATION = 30 * 60 * 1000;

/**
 * Async thunk for fetching current subscription with retry logic
 */
export const fetchCurrentSubscription = createAsyncThunk(
  'subscription/fetchCurrent',
  async (_, { rejectWithValue }) => {
    try {
      const service = new SubscriptionService();
      const subscription = await service.getCurrentSubscription();
      return subscription;
    } catch (error: any) {
      return rejectWithValue({
        code: error.code || 'FETCH_ERROR',
        message: error.message,
        timestamp: new Date()
      });
    }
  }
);

/**
 * Async thunk for fetching available subscription plans
 */
export const fetchSubscriptionPlans = createAsyncThunk(
  'subscription/fetchPlans',
  async (_, { rejectWithValue }) => {
    try {
      const service = new SubscriptionService();
      const plans = await service.getSubscriptionPlans();
      return plans;
    } catch (error: any) {
      return rejectWithValue({
        code: error.code || 'FETCH_PLANS_ERROR',
        message: error.message,
        timestamp: new Date()
      });
    }
  }
);

/**
 * Async thunk for updating subscription
 */
export const updateSubscription = createAsyncThunk(
  'subscription/update',
  async (updateData: {
    plan: SubscriptionPlan;
    billingCycle: BillingCycle;
    autoRenew: boolean;
  }, { rejectWithValue }) => {
    try {
      const service = new SubscriptionService();
      const updatedSubscription = await service.updateSubscription(
        updateData.plan,
        updateData.billingCycle,
        updateData.autoRenew
      );
      return updatedSubscription;
    } catch (error: any) {
      return rejectWithValue({
        code: error.code || 'UPDATE_ERROR',
        message: error.message,
        timestamp: new Date(),
        operationId: Date.now().toString()
      });
    }
  }
);

/**
 * Async thunk for canceling subscription
 */
export const cancelSubscription = createAsyncThunk(
  'subscription/cancel',
  async (subscriptionId: string, { rejectWithValue }) => {
    try {
      const service = new SubscriptionService();
      const result = await service.cancelSubscription(subscriptionId);
      return result;
    } catch (error: any) {
      return rejectWithValue({
        code: error.code || 'CANCEL_ERROR',
        message: error.message,
        timestamp: new Date(),
        operationId: Date.now().toString()
      });
    }
  }
);

// Create the subscription slice
const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    resetState: (state) => {
      Object.assign(state, initialState);
    },
    setLoading: (state, action: PayloadAction<{ operation: string; isLoading: boolean }>) => {
      state.loading[action.payload.operation] = action.payload.isLoading;
    },
    clearCache: (state) => {
      state.cache = {
        plans: {},
        expiresAt: null
      };
    },
    clearError: (state) => {
      state.error = null;
      state.retryCount = 0;
    }
  },
  extraReducers: (builder) => {
    // Fetch current subscription
    builder
      .addCase(fetchCurrentSubscription.pending, (state) => {
        state.loading['fetchCurrent'] = true;
        state.error = null;
      })
      .addCase(fetchCurrentSubscription.fulfilled, (state, action) => {
        state.currentSubscription = action.payload;
        state.loading['fetchCurrent'] = false;
        state.lastSync = new Date();
        state.retryCount = 0;
      })
      .addCase(fetchCurrentSubscription.rejected, (state, action) => {
        state.loading['fetchCurrent'] = false;
        state.error = action.payload as ISubscriptionError;
        state.retryCount += 1;
      })

    // Fetch subscription plans
    builder
      .addCase(fetchSubscriptionPlans.pending, (state) => {
        state.loading['fetchPlans'] = true;
      })
      .addCase(fetchSubscriptionPlans.fulfilled, (state, action) => {
        state.availablePlans = action.payload;
        state.cache.plans = action.payload.reduce((acc: Record<string, ISubscriptionPlanDetails>, plan: ISubscriptionPlanDetails) => ({
          ...acc,
          [plan.id]: plan
        }), {});
        state.cache.expiresAt = new Date(Date.now() + CACHE_DURATION);
        state.loading['fetchPlans'] = false;
      })
      .addCase(fetchSubscriptionPlans.rejected, (state, action) => {
        state.loading['fetchPlans'] = false;
        state.error = action.payload as ISubscriptionError;
      })

    // Update subscription
    builder
      .addCase(updateSubscription.pending, (state) => {
        state.loading['update'] = true;
      })
      .addCase(updateSubscription.fulfilled, (state, action) => {
        state.currentSubscription = action.payload;
        state.loading['update'] = false;
        state.lastSync = new Date();
      })
      .addCase(updateSubscription.rejected, (state, action) => {
        state.loading['update'] = false;
        state.error = action.payload as ISubscriptionError;
      })

    // Cancel subscription
    builder
      .addCase(cancelSubscription.pending, (state) => {
        state.loading['cancel'] = true;
      })
      .addCase(cancelSubscription.fulfilled, (state) => {
        if (state.currentSubscription) {
          state.currentSubscription.status = SubscriptionStatus.CANCELLED;
        }
        state.loading['cancel'] = false;
        state.lastSync = new Date();
      })
      .addCase(cancelSubscription.rejected, (state, action) => {
        state.loading['cancel'] = false;
        state.error = action.payload as ISubscriptionError;
      });
  }
});

// Configure persistence
const persistConfig = {
  key: 'subscription',
  storage,
  whitelist: ['currentSubscription', 'cache'],
  blacklist: ['loading', 'error']
};

// Export actions
export const { 
  resetState, 
  setLoading, 
  clearCache, 
  clearError 
} = subscriptionSlice.actions;

// Export persisted reducer
export default persistReducer(persistConfig, subscriptionSlice.reducer);

// Selectors
export const selectCurrentSubscription = (state: { subscription: SubscriptionState }) => 
  state.subscription.currentSubscription;

export const selectAvailablePlans = (state: { subscription: SubscriptionState }) => 
  state.subscription.availablePlans;

export const selectSubscriptionLoading = (state: { subscription: SubscriptionState }) => 
  state.subscription.loading;

export const selectSubscriptionError = (state: { subscription: SubscriptionState }) => 
  state.subscription.error;

export const selectCachedPlan = (planId: string) => 
  (state: { subscription: SubscriptionState }) => 
    state.subscription.cache.plans[planId];