/**
 * Enhanced Users Controller for Estate Kit Platform
 * Implements secure user management with PIPEDA/HIPAA compliance
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
  UseGuards, 
  UseInterceptors,
  Headers,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CorrelationIdInterceptor } from '@evanion/nestjs-correlation-id';
import { ApiOperation, ApiResponse, ApiTags, ApiSecurity } from '@nestjs/swagger';

import { UserService } from '../../services/user.service';
import { AuditService } from '../../services/audit.service';
import { 
  CreateUserDTO, 
  UpdateUserDTO, 
  User, 
  UserRole 
} from '../../types/user.types';
import { 
  AuditEventType, 
  AuditSeverity 
} from '../../types/audit.types';
import { logger } from '../../utils/logger.util';

// Security decorators
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RoleGuard } from '../guards/role.guard';
import { ComplianceGuard } from '../guards/compliance.guard';
import { 
  AuditLogInterceptor, 
  SecurityHeadersInterceptor 
} from '../interceptors';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RoleGuard)
@UseInterceptors(AuditLogInterceptor, SecurityHeadersInterceptor)
@UseGuards(ThrottlerGuard)
export class UsersController {
  constructor(
    private readonly userService: UserService,
    private readonly auditService: AuditService
  ) {}

  /**
   * Creates a new user account with enhanced security validation
   */
  @Post()
  @UseGuards(ComplianceGuard)
  @ApiOperation({ summary: 'Create new user with security validation' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiSecurity('jwt')
  async createUser(
    @Body() userData: CreateUserDTO,
    @Headers('user-agent') userAgent: string,
    @Headers('x-forwarded-for') ipAddress: string,
    @Headers('x-correlation-id') correlationId: string
  ): Promise<User> {
    try {
      logger.addCorrelationId(correlationId);
      logger.info('Creating new user', { email: userData.email });

      const user = await this.userService.createUser(userData);

      // Create audit log for user creation
      await this.auditService.createAuditLog({
        eventType: AuditEventType.USER_LOGIN,
        severity: AuditSeverity.INFO,
        userId: user.id,
        resourceId: user.id,
        resourceType: 'USER',
        ipAddress: ipAddress || '0.0.0.0',
        userAgent: userAgent || 'SYSTEM',
        details: {
          action: 'CREATE_USER',
          email: user.email,
          correlationId
        }
      });

      return user;
    } catch (error: unknown) {
      logger.error('User creation failed', { error, email: userData.email });
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('User creation failed');
    }
  }

  /**
   * Retrieves user by ID with security validation
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID with security checks' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiSecurity('jwt')
  async getUserById(
    @Param('id') id: string,
    @Headers('user-role') userRole: UserRole,
    @Headers('user-agent') userAgent: string,
    @Headers('x-forwarded-for') ipAddress: string,
    @Headers('x-correlation-id') correlationId: string
  ): Promise<User> {
    try {
      logger.addCorrelationId(correlationId);
      
      const user = await this.userService.getUserById(id, userRole);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Log access attempt
      await this.auditService.createAuditLog({
        eventType: AuditEventType.DOCUMENT_ACCESS,
        severity: AuditSeverity.INFO,
        userId: id,
        resourceId: id,
        resourceType: 'USER',
        ipAddress: ipAddress || '0.0.0.0',
        userAgent: userAgent || 'SYSTEM',
        details: {
          action: 'READ_USER',
          requestingRole: userRole,
          correlationId
        }
      });

      return user;
    } catch (error: unknown) {
      logger.error('User retrieval failed', { error, userId: id });
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
      throw new InternalServerErrorException('User retrieval failed');
    }
  }

  /**
   * Updates user information with security validation
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update user with security validation' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 403, description: 'Unauthorized access' })
  @ApiSecurity('jwt')
  async updateUser(
    @Param('id') id: string,
    @Body() updateData: UpdateUserDTO,
    @Headers('user-role') userRole: UserRole,
    @Headers('user-agent') userAgent: string,
    @Headers('x-forwarded-for') ipAddress: string,
    @Headers('x-correlation-id') correlationId: string
  ): Promise<User> {
    try {
      logger.addCorrelationId(correlationId);

      const updatedUser = await this.userService.updateUser(
        id,
        updateData,
        userRole
      );

      // Log update operation
      await this.auditService.createAuditLog({
        eventType: AuditEventType.PERMISSION_CHANGE,
        severity: AuditSeverity.INFO,
        userId: id,
        resourceId: id,
        resourceType: 'USER',
        ipAddress: ipAddress || '0.0.0.0',
        userAgent: userAgent || 'SYSTEM',
        details: {
          action: 'UPDATE_USER',
          changes: updateData,
          requestingRole: userRole,
          correlationId
        }
      });

      return updatedUser;
    } catch (error: unknown) {
      logger.error('User update failed', { error, userId: id });
      if (error instanceof Error) {
        if (error.message === 'Unauthorized access') {
          throw new UnauthorizedException(error.message);
        }
        throw new InternalServerErrorException(error.message);
      }
      throw new InternalServerErrorException('User update failed');
    }
  }

  /**
   * Deletes user account with security validation
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete user with security validation' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 403, description: 'Unauthorized access' })
  @ApiSecurity('jwt')
  async deleteUser(
    @Param('id') id: string,
    @Headers('user-role') userRole: UserRole,
    @Headers('user-agent') userAgent: string,
    @Headers('x-forwarded-for') ipAddress: string,
    @Headers('x-correlation-id') correlationId: string
  ): Promise<void> {
    try {
      logger.addCorrelationId(correlationId);

      await this.userService.deleteUser(id, userRole);

      // Log deletion operation
      await this.auditService.createAuditLog({
        eventType: AuditEventType.USER_LOGIN,
        severity: AuditSeverity.WARNING,
        userId: id,
        resourceId: id,
        resourceType: 'USER',
        ipAddress: ipAddress || '0.0.0.0',
        userAgent: userAgent || 'SYSTEM',
        details: {
          action: 'DELETE_USER',
          requestingRole: userRole,
          correlationId
        }
      });
    } catch (error: unknown) {
      logger.error('User deletion failed', { error, userId: id });
      if (error instanceof Error) {
        if (error.message === 'Unauthorized access') {
          throw new UnauthorizedException(error.message);
        }
        throw new InternalServerErrorException(error.message);
      }
      throw new InternalServerErrorException('User deletion failed');
    }
  }
}