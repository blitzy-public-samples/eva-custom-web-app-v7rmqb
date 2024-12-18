/**
 * Delegates Controller for Estate Kit platform
 * Implements secure delegate relationship management with PIPEDA and HIPAA compliance
 * @version 1.0.0
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

// Internal service imports
import { DelegateService } from '../../services/delegate.service';
import { AuditService } from '../../services/audit.service';
import {
  createDelegateSchema,
  updateDelegateSchema,
  delegateIdSchema,
} from '../validators/delegates.validator';

// Types and enums
import { ResourceType, AccessLevel } from '../../types/permission.types';
import { AuditEventType, AuditSeverity } from '../../types/audit.types';

// Security guards and interceptors
import { AuthGuard } from '../guards/auth.guard';
import { RBACGuard } from '../guards/rbac.guard';
import { AuditInterceptor } from '../interceptors/audit.interceptor';

@Controller('delegates')
@ApiTags('Delegates')
@ApiBearerAuth()
@ApiSecurity('bearer')
@UseGuards(AuthGuard, RBACGuard)
@UseInterceptors(AuditInterceptor)
export class DelegatesController {
  constructor(
    private readonly delegateService: DelegateService,
    private readonly auditService: AuditService
  ) {}

  /**
   * Creates a new delegate relationship with comprehensive security validation
   */
  @Post()
  @Throttle({ ttl: 60, limit: 10 })
  @ApiOperation({ summary: 'Create new delegate relationship' })
  @ApiResponse({ status: 201, description: 'Delegate created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid delegate data' })
  @ApiResponse({ status: 403, description: 'Unauthorized role or permission' })
  async createDelegate(@Body() createDelegateDto: any) {
    try {
      // Validate request data
      const validatedData = await createDelegateSchema.parseAsync(createDelegateDto);

      // Create delegate with audit logging
      const delegate = await this.delegateService.createDelegate(
        createDelegateDto.ownerId,
        validatedData
      );

      // Log delegate creation
      await this.auditService.logEvent({
        eventType: AuditEventType.DELEGATE_INVITE,
        severity: AuditSeverity.INFO,
        userId: createDelegateDto.ownerId,
        resourceId: delegate.id,
        resourceType: 'DELEGATE',
        details: {
          delegateEmail: validatedData.email,
          role: validatedData.role,
          permissions: validatedData.permissions
        }
      });

      return delegate;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new HttpException(
        `Failed to create delegate: ${errorMessage}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Updates existing delegate relationship with security validation
   */
  @Put(':id')
  @Throttle({ ttl: 60, limit: 20 })
  @ApiOperation({ summary: 'Update delegate relationship' })
  @ApiResponse({ status: 200, description: 'Delegate updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid update data' })
  @ApiResponse({ status: 404, description: 'Delegate not found' })
  async updateDelegate(
    @Param('id') id: string,
    @Body() updateDelegateDto: any
  ) {
    try {
      // Validate delegate ID
      await delegateIdSchema.parseAsync({ id });

      // Validate update data
      const validatedData = await updateDelegateSchema.parseAsync(updateDelegateDto);

      // Update delegate with security checks
      const updatedDelegate = await this.delegateService.updateDelegate(
        id,
        validatedData
      );

      // Log delegate update
      await this.auditService.logEvent({
        eventType: AuditEventType.PERMISSION_CHANGE,
        severity: AuditSeverity.INFO,
        userId: updatedDelegate.ownerId,
        resourceId: id,
        resourceType: 'DELEGATE',
        details: {
          changes: validatedData,
          previousState: updatedDelegate
        }
      });

      return updatedDelegate;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new HttpException(
        `Failed to update delegate: ${errorMessage}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Retrieves delegate information with security validation
   */
  @Get(':id')
  @Throttle({ ttl: 60, limit: 100 })
  @ApiOperation({ summary: 'Get delegate by ID' })
  @ApiResponse({ status: 200, description: 'Delegate retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Delegate not found' })
  async getDelegate(@Param('id') id: string) {
    try {
      // Validate delegate ID
      await delegateIdSchema.parseAsync({ id });

      // Retrieve delegate with security checks
      const delegate = await this.delegateService.getDelegateById(id);

      if (!delegate) {
        throw new HttpException('Delegate not found', HttpStatus.NOT_FOUND);
      }

      // Log delegate access
      await this.auditService.logEvent({
        eventType: AuditEventType.DELEGATE_ACCESS,
        severity: AuditSeverity.INFO,
        userId: delegate.ownerId,
        resourceId: id,
        resourceType: 'DELEGATE',
        details: { accessType: 'READ' }
      });

      return delegate;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new HttpException(
        `Failed to retrieve delegate: ${errorMessage}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Lists delegates with filtering and security validation
   */
  @Get()
  @Throttle({ ttl: 60, limit: 50 })
  @ApiOperation({ summary: 'List delegates' })
  @ApiResponse({ status: 200, description: 'Delegates retrieved successfully' })
  async getDelegates(@Query() query: any) {
    try {
      // Get delegates with security checks
      const delegates = await this.delegateService.getDelegatesByOwner(
        query.ownerId,
        query.status
      );

      // Log delegate list access
      await this.auditService.logEvent({
        eventType: AuditEventType.DELEGATE_ACCESS,
        severity: AuditSeverity.INFO,
        userId: query.ownerId,
        resourceType: 'DELEGATE_LIST',
        details: { filters: query }
      });

      return delegates;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new HttpException(
        `Failed to list delegates: ${errorMessage}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Revokes delegate access with security validation
   */
  @Delete(':id')
  @Throttle({ ttl: 60, limit: 10 })
  @ApiOperation({ summary: 'Revoke delegate access' })
  @ApiResponse({ status: 200, description: 'Delegate access revoked successfully' })
  @ApiResponse({ status: 404, description: 'Delegate not found' })
  async revokeDelegate(@Param('id') id: string) {
    try {
      // Validate delegate ID
      await delegateIdSchema.parseAsync({ id });

      // Revoke delegate access with security checks
      const revokedDelegate = await this.delegateService.revokeDelegate(id);

      // Log delegate revocation
      await this.auditService.logEvent({
        eventType: AuditEventType.PERMISSION_CHANGE,
        severity: AuditSeverity.WARNING,
        userId: revokedDelegate.ownerId,
        resourceId: id,
        resourceType: 'DELEGATE',
        details: {
          action: 'REVOKE',
          previousStatus: revokedDelegate.status
        }
      });

      return revokedDelegate;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new HttpException(
        `Failed to revoke delegate: ${errorMessage}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Verifies delegate access permissions with security validation
   */
  @Get('verify-access')
  @Throttle({ ttl: 60, limit: 100 })
  @ApiOperation({ summary: 'Verify delegate access permissions' })
  @ApiResponse({ status: 200, description: 'Access verification result' })
  async verifyDelegateAccess(@Query() verifyAccessDto: any) {
    try {
      const hasAccess = await this.delegateService.verifyDelegateAccess(
        verifyAccessDto.delegateId,
        verifyAccessDto.resourceType as ResourceType,
        verifyAccessDto.accessLevel as AccessLevel
      );

      // Log access verification
      await this.auditService.logEvent({
        eventType: AuditEventType.DELEGATE_ACCESS,
        severity: hasAccess ? AuditSeverity.INFO : AuditSeverity.WARNING,
        userId: verifyAccessDto.delegateId,
        resourceType: verifyAccessDto.resourceType,
        details: {
          accessLevel: verifyAccessDto.accessLevel,
          accessGranted: hasAccess
        }
      });

      return { hasAccess };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new HttpException(
        `Failed to verify access: ${errorMessage}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }
}