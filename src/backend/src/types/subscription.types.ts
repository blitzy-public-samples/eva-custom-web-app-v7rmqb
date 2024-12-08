// @package zod v3.21.4
import { z } from 'zod';

/**
 * Requirement: Subscription Management
 * Location: Technical Specifications/1.3 Scope/In-Scope/Subscription Management
 * 
 * Human Tasks:
 * 1. Ensure the subscription status values ('active', 'inactive', 'cancelled') align with 
 *    the payment gateway's subscription status terminology
 * 2. Verify that the features array in SubscriptionPlan matches the planned feature set
 */

// Type alias for user ID to maintain consistency across the application
type UserId = string;

/**
 * Interface defining the structure of a subscription plan
 * Includes essential plan details like ID, name, pricing, and included features
 */
export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    features: string[];
}

/**
 * Interface defining the structure of a user's subscription
 * Tracks the relationship between users and their subscription plans
 */
export interface UserSubscription {
    userId: string;
    planId: string;
    status: 'active' | 'inactive' | 'cancelled';
    startDate: Date;
    endDate: Date;
}

/**
 * Zod schema for validating subscription data
 * Ensures data consistency and type safety at runtime
 */
export const SubscriptionSchema = {
    plan: z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        price: z.number().positive(),
        features: z.array(z.string().min(1))
    }),

    userSubscription: z.object({
        userId: z.string().min(1),
        planId: z.string().min(1),
        status: z.enum(['active', 'inactive', 'cancelled']),
        startDate: z.date(),
        endDate: z.date()
    }).refine((data) => {
        return data.startDate <= data.endDate;
    }, {
        message: "End date must be after or equal to start date",
        path: ["endDate"]
    })
};