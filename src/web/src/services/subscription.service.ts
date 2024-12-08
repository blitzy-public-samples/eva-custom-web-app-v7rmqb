/**
 * Estate Kit - Subscription Service
 * 
 * Requirements addressed:
 * - Subscription Management (Technical Specifications/1.3 Scope/In-Scope/User Management)
 *   Implements service-level logic for managing user subscriptions, including fetching 
 *   subscription details, updating plans, and handling subscription statuses.
 * 
 * Human Tasks:
 * 1. Verify API endpoints match backend subscription service configuration
 * 2. Test subscription status update workflows in staging environment
 * 3. Validate error handling for subscription API responses
 */

// axios version ^1.3.4
import axios from 'axios';
import { SubscriptionTypes } from '../types/subscription.types';
import { API_BASE_URL, makeRequest } from '../config/api.config';
import { validateSubscription } from '../utils/validation.util';

/**
 * Fetches subscription details from the backend API.
 * @param subscriptionId - The unique identifier of the subscription to fetch
 * @returns Promise resolving to the subscription details
 * @throws Error if the subscription data is invalid or the request fails
 */
export async function fetchSubscriptionDetails(subscriptionId: string): Promise<SubscriptionTypes> {
  try {
    // Construct the API endpoint URL
    const endpoint = `${API_BASE_URL}/subscriptions/${subscriptionId}`;

    // Make the GET request using the makeRequest utility
    const response = await makeRequest({
      method: 'GET',
      url: endpoint,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Extract the subscription data from the response
    const subscriptionData = response.data;

    // Validate the subscription data
    if (!validateSubscription(subscriptionData)) {
      throw new Error('Invalid subscription data received from the server');
    }

    return subscriptionData;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle specific HTTP error cases
      switch (error.response?.status) {
        case 404:
          throw new Error(`Subscription with ID ${subscriptionId} not found`);
        case 401:
          throw new Error('Unauthorized access to subscription data');
        case 403:
          throw new Error('Forbidden access to subscription data');
        default:
          throw new Error(`Failed to fetch subscription details: ${error.message}`);
      }
    }
    // Handle non-Axios errors
    throw new Error(`Unexpected error while fetching subscription: ${error}`);
  }
}

/**
 * Updates the status of a subscription in the backend API.
 * @param subscriptionId - The unique identifier of the subscription to update
 * @param newStatus - The new status to set for the subscription
 * @returns Promise resolving to the updated subscription details
 * @throws Error if the update fails or the response data is invalid
 */
export async function updateSubscriptionStatus(
  subscriptionId: string,
  newStatus: 'active' | 'inactive' | 'cancelled'
): Promise<SubscriptionTypes> {
  try {
    // Construct the API endpoint URL
    const endpoint = `${API_BASE_URL}/subscriptions/${subscriptionId}/status`;

    // Make the PATCH request using the makeRequest utility
    const response = await makeRequest({
      method: 'PATCH',
      url: endpoint,
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        status: newStatus,
      },
    });

    // Extract the updated subscription data from the response
    const updatedSubscription = response.data;

    // Validate the updated subscription data
    if (!validateSubscription(updatedSubscription)) {
      throw new Error('Invalid subscription data received after status update');
    }

    // Verify the status was updated correctly
    if (updatedSubscription.status !== newStatus) {
      throw new Error('Subscription status update failed: status mismatch');
    }

    return updatedSubscription;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle specific HTTP error cases
      switch (error.response?.status) {
        case 404:
          throw new Error(`Subscription with ID ${subscriptionId} not found`);
        case 400:
          throw new Error(`Invalid subscription status: ${newStatus}`);
        case 401:
          throw new Error('Unauthorized to update subscription status');
        case 403:
          throw new Error('Forbidden to update subscription status');
        default:
          throw new Error(`Failed to update subscription status: ${error.message}`);
      }
    }
    // Handle non-Axios errors
    throw new Error(`Unexpected error while updating subscription status: ${error}`);
  }
}