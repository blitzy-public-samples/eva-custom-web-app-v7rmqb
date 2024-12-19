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
  Req,
} from '@nestjs/common'; // ^9.0.0
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiBearerAuth,
} from '@nestjs/swagger'; // ^6.0.0
import { Throttle } from '@nestjs/throttler'; // ^4.0.0

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
import { AuthGuard } from '../middlewares/auth.middleware';
import { RBACGuard } from '../middlewares/rbac.middleware';
import { AuditInterceptor } from '../middlewares/logging.middleware';
import { CreateDelegateDTO } from '../../types/delegate.types';

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
  @Throttle(10, 60)
  @ApiOperation({ summary: 'Create new delegate relationship' })
  @ApiResponse({ status: 201, description: 'Delegate created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid delegate data' })
  @ApiResponse({ status: 403, description: 'Unauthorized role or permission' })
  async createDelegate(@Body() createDelegateDto: CreateDelegateDTO, @Req() request: any) {
    try {
      // Validate request data
      const validatedData = await createDelegateSchema.parseAsync(createDelegateDto);

      // Create delegate with audit logging
      const delegate = await this.delegateService.createDelegate(request.user.id, validatedData);

      // Log delegate creation
      await this.auditService.createAuditLog({
        eventType: AuditEventType.DELEGATE_INVITE,
        severity: AuditSeverity.INFO,
        userId: delegate.delegateId,
        resourceId: delegate.id,
        resourceType: 'DELEGATE',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        details: {
          delegateEmail: validatedData.email,
          role: validatedData.role,
          permissions: validatedData.permissions
        }
      });

      return delegate;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create delegate';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Updates existing delegate relationship with security validation
   */
  @Put(':id')
  @Throttle(20, 60)
  @ApiOperation({ summary: 'Update delegate relationship' })
  @ApiResponse({ status: 200, description: 'Delegate updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid update data' })
  @ApiResponse({ status: 404, description: 'Delegate not found' })
  async updateDelegate(
    @Param('id') id: string,
    @Body() updateDelegateDto: any,
    @Req() request: any
  ) {
    try {
      // Validate delegate ID
      await delegateIdSchema.parseAsync({ id });

      // Validate update data
      const validatedData = await updateDelegateSchema.parseAsync(updateDelegateDto);

      // Get existing delegate
      const delegate = await this.delegateService.getDelegate(id);
      if (!delegate) {
        throw new HttpException('Delegate not found', HttpStatus.NOT_FOUND);
      }

      // Update delegate with security checks
      const updatedDelegate = await this.delegateService.updateDelegate(id, validatedData);

      // Log delegate update
      await this.auditService.createAuditLog({
        eventType: AuditEventType.PERMISSION_CHANGE,
        severity: AuditSeverity.INFO,
        userId: updatedDelegate.delegateId,
        resourceId: id,
        resourceType: 'DELEGATE',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        details: {
          changes: validatedData,
          previousState: delegate
        }
      });

      return updatedDelegate;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update delegate';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Retrieves delegate information with security validation
   */
  @Get(':id')
  @Throttle(100, 60)
  @ApiOperation({ summary: 'Get delegate by ID' })
  @ApiResponse({ status: 200, description: 'Delegate retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Delegate not found' })
  async getDelegate(@Param('id') id: string, @Req() request: any) {
    try {
      // Validate delegate ID
      await delegateIdSchema.parseAsync({ id });

      // Retrieve delegate with security checks
      const delegate = await this.delegateService.getDelegate(id);

      if (!delegate) {
        throw new HttpException('Delegate not found', HttpStatus.NOT_FOUND);
      }

      // Log delegate access
      await this.auditService.createAuditLog({
        eventType: AuditEventType.DELEGATE_ACCESS,
        severity: AuditSeverity.INFO,
        userId: delegate.delegateId,
        resourceId: id,
        resourceType: 'DELEGATE',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        details: { accessType: 'READ' }
      });

      return delegate;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve delegate';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Lists delegates with filtering and security validation
   */
  @Get()
  @Throttle(50, 60)
  @ApiOperation({ summary: 'List delegates' })
  @ApiResponse({ status: 200, description: 'Delegates retrieved successfully' })
  async getDelegates(@Query() query: any, @Req() request: any) {
    try {
      // Get delegates with security checks
      const delegates = await this.delegateService.getDelegates(query);

      // Log delegate list access
      await this.auditService.createAuditLog({
        eventType: AuditEventType.DELEGATE_ACCESS,
        severity: AuditSeverity.INFO,
        userId: request.user.id,
        resourceType: 'DELEGATE',
        resourceId: 'LIST',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        details: { filters: query }
      });

      return delegates;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list delegates';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Revokes delegate access with security validation
   */
  @Delete(':id')
  @Throttle(10, 60)
  @ApiOperation({ summary: 'Revoke delegate access' })
  @ApiResponse({ status: 200, description: 'Delegate access revoked successfully' })
  @ApiResponse({ status: 404, description: 'Delegate not found' })
  async revokeDelegate(@Param('id') id: string, @Req() request: any) {
    try {
      // Validate delegate ID
      await delegateIdSchema.parseAsync({ id });

      // Get existing delegate
      const delegate = await this.delegateService.getDelegate(id);
      if (!delegate) {
        throw new HttpException('Delegate not found', HttpStatus.NOT_FOUND);
      }

      // Revoke delegate access with security checks
      const revokedDelegate = await this.delegateService.revokeDelegate(id);

      // Log delegate revocation
      await this.auditService.createAuditLog({
        eventType: AuditEventType.PERMISSION_CHANGE,
        severity: AuditSeverity.WARNING,
        userId: revokedDelegate.delegateId,
        resourceId: id,
        resourceType: 'DELEGATE',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        details: {
          action: 'REVOKE',
          previousStatus: delegate.status
        }
      });

      return revokedDelegate;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to revoke delegate';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Verifies delegate access permissions with security validation
   */
  @Get('verify-access')
  @Throttle(100, 60)
  @ApiOperation({ summary: 'Verify delegate access permissions' })
  @ApiResponse({ status: 200, description: 'Access verification result' })
  async verifyDelegateAccess(@Query() verifyAccessDto: any, @Req() request: any) {
    try {
      const hasAccess = await this.delegateService.verifyDelegateAccess(
        verifyAccessDto.delegateId,
        verifyAccessDto.resourceType as ResourceType,
        verifyAccessDto.accessLevel as AccessLevel
      );

      // Log access verification
      await this.auditService.createAuditLog({
        eventType: AuditEventType.DELEGATE_ACCESS,
        severity: hasAccess ? AuditSeverity.INFO : AuditSeverity.WARNING,
        userId: verifyAccessDto.delegateId,
        resourceId: verifyAccessDto.resourceId || 'VERIFY',
        resourceType: verifyAccessDto.resourceType,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        details: {
          accessLevel: verifyAccessDto.accessLevel,
          accessGranted: hasAccess
        }
      });

      return { hasAccess };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify access';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }
}