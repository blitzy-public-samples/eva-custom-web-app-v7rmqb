/**
 * Estate Kit - Shopify Integration
 * Version: 1.0.0
 * 
 * This file implements Shopify integration functionalities for the Estate Kit backend system.
 * 
 * Requirements Addressed:
 * - E-commerce Integration (Technical Specifications/1.3 Scope/In-Scope/Integrations)
 *   Implements Shopify integration for order processing and inventory management.
 * 
 * Human Tasks:
 * 1. Set up Shopify API credentials in environment variables
 * 2. Configure webhook endpoints for order notifications
 * 3. Set up inventory sync settings in Shopify admin
 * 4. Verify API rate limits and adjust as needed
 */

// @package shopify-api-node v4.5.0
import Shopify from 'shopify-api-node';
import { initializeShopifyClient } from '../config/shopify';
import { logInfo, logError } from '../utils/logger.util';
import { handleError } from '../utils/error.util';
import { sendNotification } from '../services/notification.service';

/**
 * Interface defining the structure of Shopify order data
 */
interface ShopifyOrderData {
  id: string;
  order_number: string;
  email: string;
  created_at: string;
  total_price: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string | null;
  customer: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  line_items: Array<{
    id: string;
    product_id: string;
    variant_id: string;
    quantity: number;
    price: string;
  }>;
  shipping_address?: {
    address1: string;
    city: string;
    province: string;
    country: string;
    zip: string;
  };
}

/**
 * Processes an order received from Shopify
 * Implements requirement: E-commerce Integration - Order processing and inventory management
 * 
 * @param orderData - The order data received from Shopify
 * @returns Promise<boolean> indicating if the order was processed successfully
 */
export const processShopifyOrder = async (orderData: ShopifyOrderData): Promise<boolean> => {
  let shopifyClient: Shopify;

  try {
    // Initialize Shopify client
    shopifyClient = await initializeShopifyClient();
    
    // Validate order data structure
    if (!validateOrderData(orderData)) {
      throw new Error('Invalid order data structure');
    }

    // Log order processing initiation
    logInfo(`Processing Shopify order: ${orderData.order_number}`);

    // Update inventory for ordered items
    for (const item of orderData.line_items) {
      try {
        await shopifyClient.inventoryLevel.adjust({
          inventory_item_id: item.variant_id,
          location_id: process.env.SHOPIFY_LOCATION_ID!,
          available_adjustment: -item.quantity
        });

        logInfo(`Updated inventory for product ${item.product_id}, variant ${item.variant_id}`);
      } catch (error) {
        logError(error as Error);
        throw new Error(`Failed to update inventory for variant ${item.variant_id}`);
      }
    }

    // Prepare notification data
    const notificationData = {
      to: orderData.email,
      from: process.env.NOTIFICATION_FROM_EMAIL!,
      subject: `Order Confirmation #${orderData.order_number}`,
      templateId: process.env.SHOPIFY_ORDER_TEMPLATE_ID,
      dynamicTemplateData: {
        order_number: orderData.order_number,
        customer_name: `${orderData.customer.first_name} ${orderData.customer.last_name}`,
        order_total: orderData.total_price,
        currency: orderData.currency
      }
    };

    // Send order confirmation notification
    const notificationSent = await sendNotification(notificationData, 'sendgrid');
    if (!notificationSent) {
      logError(new Error(`Failed to send order confirmation for order ${orderData.order_number}`));
    }

    // Log successful order processing
    logInfo(`Successfully processed Shopify order: ${orderData.order_number}`);
    return true;

  } catch (error) {
    // Handle and log any errors
    handleError(error as Error);
    return false;
  }
};

/**
 * Validates the structure of Shopify order data
 * @param orderData - The order data to validate
 * @returns boolean indicating if the order data is valid
 */
const validateOrderData = (orderData: ShopifyOrderData): boolean => {
  return !!(
    orderData &&
    orderData.id &&
    orderData.order_number &&
    orderData.email &&
    orderData.customer &&
    Array.isArray(orderData.line_items) &&
    orderData.line_items.length > 0 &&
    orderData.line_items.every(item =>
      item.id &&
      item.product_id &&
      item.variant_id &&
      typeof item.quantity === 'number' &&
      item.price
    )
  );
};