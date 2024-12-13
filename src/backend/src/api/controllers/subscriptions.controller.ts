/**
 * @fileoverview Enhanced subscription controller for Estate Kit platform
 * Implements secure subscription management with Shopify integration
 * @version 1.0.0
 */

import {
  Controller,
  UseGuards,
  UseInterceptors,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Headers,
  HttpStatus,
  HttpException,
  Logger
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiBearerAuth
} from '@nestjs/swagger';

import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';

// Internal imports
import { SubscriptionService } from '../../services/subscription.service';
import { createSubscriptionSchema, updateSubscriptionSchema } from '../validators/subscriptions.validator';
import { 
  ISubscriptionCreateDTO, 
  ISubscriptionResponse,
  ISubscriptionUpdateDTO 
} from '../../types/subscription.types';

/**
 * Controller handling subscription-related HTTP endpoints with enhanced security
 */
@Controller('subscriptions')
@ApiTags('Subscriptions')
@UseGuards(AuthGuard('jwt'), ThrottlerGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  private readonly logger = new Logger(SubscriptionsController.name);

  constructor(private readonly subscriptionService: SubscriptionService) {}

  /**
   * Creates a new subscription with enhanced validation and security
   */
  @Post()
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Create new subscription' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Subscription created successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid request data' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized access' 
  })
  async createSubscription(
    @Body() createDTO: ISubscriptionCreateDTO
  ): Promise<ISubscriptionResponse> {
    try {
      // Validate request data using Zod schema
      const validatedData = await createSubscriptionSchema.parseAsync(createDTO);

      this.logger.log(`Creating subscription for user: ${validatedData.userId}`);

      const subscription = await this.subscriptionService.createSubscription({
        ...validatedData,
        shopifyCustomerId: createDTO.shopifyCustomerId,
        trialDays: createDTO.trialDays || null
      });

      this.logger.log(`Successfully created subscription: ${subscription.id}`);

      return {
        subscription,
        planDetails: {
          id: subscription.id,
          name: subscription.plan,
          description: `${subscription.plan} Plan`,
          price: 0, // To be populated from plan configuration
          billingCycle: subscription.billingCycle,
          features: [],
          shopifyProductId: subscription.shopifySubscriptionId,
          shopifyPriceId: '', // To be populated from Shopify
          trialDays: 0,
          compareAtPrice: null
        },
        usage: {}
      };
    } catch (error: any) {
      this.logger.error(`Failed to create subscription: ${error.message}`, error.stack);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Handles Shopify subscription webhooks with enhanced security
   */
  @Post('webhook/shopify')
  @ApiOperation({ summary: 'Handle Shopify webhook' })
  @ApiSecurity('shopify-hmac')
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Webhook processed successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid webhook data' 
  })
  async handleShopifyWebhook(
    @Body() webhookEvent: any,
    @Headers('x-shopify-hmac-sha256') signature: string
  ): Promise<void> {
    try {
      if (!signature) {
        throw new HttpException(
          'Missing Shopify HMAC signature',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log(`Processing Shopify webhook: ${webhookEvent.topic}`);

      await this.subscriptionService.handleShopifyWebhook({
        ...webhookEvent,
        signature
      });

      this.logger.log('Successfully processed Shopify webhook');
    } catch (error: any) {
      this.logger.error(`Failed to process Shopify webhook: ${error.message}`, error.stack);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Updates an existing subscription with validation
   */
  @Put(':subscriptionId')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Update subscription' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Subscription updated successfully' 
  })
  async updateSubscription(
    @Param('subscriptionId') subscriptionId: string,
    @Body() updateDTO: ISubscriptionUpdateDTO
  ): Promise<ISubscriptionResponse> {
    try {
      // Validate request data using Zod schema
      const validatedData = await updateSubscriptionSchema.parseAsync({
        ...updateDTO,
        cancelReason: updateDTO.status === 'CANCELLED' ? updateDTO.cancelReason || 'User requested cancellation' : null,
        status: updateDTO.status
      });

      this.logger.log(`Updating subscription: ${subscriptionId}`);

      const subscription = await this.subscriptionService.updateSubscription(
        subscriptionId,
        validatedData
      );

      this.logger.log(`Successfully updated subscription: ${subscriptionId}`);

      return {
        subscription,
        planDetails: {
          id: subscription.id,
          name: subscription.plan,
          description: `${subscription.plan} Plan`,
          price: 0, // To be populated from plan configuration
          billingCycle: subscription.billingCycle,
          features: [],
          shopifyProductId: subscription.shopifySubscriptionId,
          shopifyPriceId: '', // To be populated from Shopify
          trialDays: 0,
          compareAtPrice: null
        },
        usage: {}
      };
    } catch (error: any) {
      this.logger.error(`Failed to update subscription: ${error.message}`, error.stack);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Retrieves subscription details with security checks
   */
  @Get(':subscriptionId')
  @ApiOperation({ summary: 'Get subscription details' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Subscription details retrieved successfully' 
  })
  async getSubscription(
    @Param('subscriptionId') subscriptionId: string
  ): Promise<ISubscriptionResponse> {
    try {
      this.logger.log(`Retrieving subscription: ${subscriptionId}`);

      const subscription = await this.subscriptionService.getSubscription(subscriptionId);

      return {
        subscription,
        planDetails: {
          id: subscription.id,
          name: subscription.plan,
          description: `${subscription.plan} Plan`,
          price: 0, // To be populated from plan configuration
          billingCycle: subscription.billingCycle,
          features: [],
          shopifyProductId: subscription.shopifySubscriptionId,
          shopifyPriceId: '', // To be populated from Shopify
          trialDays: 0,
          compareAtPrice: null
        },
        usage: {}
      };
    } catch (error: any) {
      this.logger.error(`Failed to retrieve subscription: ${error.message}`, error.stack);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Cancels an existing subscription with security validation
   */
  @Delete(':subscriptionId')
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Subscription cancelled successfully' 
  })
  async cancelSubscription(
    @Param('subscriptionId') subscriptionId: string
  ): Promise<void> {
    try {
      this.logger.log(`Cancelling subscription: ${subscriptionId}`);

      await this.subscriptionService.cancelSubscription(
        subscriptionId,
        'User requested cancellation' // Default cancellation reason
      );

      this.logger.log(`Successfully cancelled subscription: ${subscriptionId}`);
    } catch (error: any) {
      this.logger.error(`Failed to cancel subscription: ${error.message}`, error.stack);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

// Export standalone functions for use in routes
export const {
  createSubscription,
  handleShopifyWebhook,
  updateSubscription,
  getSubscription,
  cancelSubscription
} = SubscriptionsController.prototype;