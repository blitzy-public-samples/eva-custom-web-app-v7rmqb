/**
 * Estate Kit - Subscription Redux Slice
 * 
 * Requirements addressed:
 * - State Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Implements centralized state management for subscriptions, enabling consistent 
 *   and efficient handling of subscription-related data.
 * 
 * Human Tasks:
 * 1. Verify error handling aligns with UI error display requirements
 * 2. Test subscription status update workflows in staging environment
 * 3. Validate state persistence requirements for subscription data
 */

// @reduxjs/toolkit version ^1.9.5
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SubscriptionTypes } from '../../types/subscription.types';
import { 
  fetchSubscriptionDetails, 
  updateSubscriptionStatus 
} from '../../services/subscription.service';

// Define the initial state interface
interface SubscriptionState {
  subscriptions: Array<SubscriptionTypes>;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: SubscriptionState = {
  subscriptions: [],
  loading: false,
  error: null,
};

// Async thunk for fetching subscription details
export const fetchSubscription = createAsyncThunk(
  'subscription/fetchSubscription',
  async (subscriptionId: string, { rejectWithValue }) => {
    try {
      const response = await fetchSubscriptionDetails(subscriptionId);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch subscription');
    }
  }
);

// Async thunk for updating subscription status
export const updateSubscription = createAsyncThunk(
  'subscription/updateSubscription',
  async (
    { 
      subscriptionId, 
      newStatus 
    }: { 
      subscriptionId: string; 
      newStatus: 'active' | 'inactive' | 'cancelled' 
    }, 
    { rejectWithValue }
  ) => {
    try {
      const response = await updateSubscriptionStatus(subscriptionId, newStatus);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update subscription');
    }
  }
);

// Create the subscription slice
export const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchSubscription
      .addCase(fetchSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscription.fulfilled, (state, action) => {
        state.loading = false;
        const subscription = action.payload;
        const index = state.subscriptions.findIndex(
          (sub) => sub.subscriptionId === subscription.subscriptionId
        );
        if (index !== -1) {
          state.subscriptions[index] = subscription;
        } else {
          state.subscriptions.push(subscription);
        }
      })
      .addCase(fetchSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Handle updateSubscription
      .addCase(updateSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSubscription.fulfilled, (state, action) => {
        state.loading = false;
        const updatedSubscription = action.payload;
        const index = state.subscriptions.findIndex(
          (sub) => sub.subscriptionId === updatedSubscription.subscriptionId
        );
        if (index !== -1) {
          state.subscriptions[index] = updatedSubscription;
        }
      })
      .addCase(updateSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions and reducer
export const { setLoading, setError } = subscriptionSlice.actions;
export const subscriptionReducer = subscriptionSlice.reducer;

// Selectors
export const selectSubscriptions = (state: { subscription: SubscriptionState }) => 
  state.subscription.subscriptions;
export const selectSubscriptionLoading = (state: { subscription: SubscriptionState }) => 
  state.subscription.loading;
export const selectSubscriptionError = (state: { subscription: SubscriptionState }) => 
  state.subscription.error;
export const selectSubscriptionById = (
  state: { subscription: SubscriptionState }, 
  subscriptionId: string
) => state.subscription.subscriptions.find(
  (sub) => sub.subscriptionId === subscriptionId
);