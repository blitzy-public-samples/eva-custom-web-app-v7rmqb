/**
 * Integration Tests for User Management API
 * Tests CRUD operations, security controls, and compliance requirements
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers and Services
import { UsersController } from '../../src/api/controllers/users.controller';
import { UserService } from '../../src/services/user.service';
import { AuditService } from '../../src/services/audit.service';
import { EncryptionService } from '../../src/services/encryption.service';

// Types and Mocks
import { 
  User, 
  UserRole, 
  UserStatus, 
  CreateUserDTO, 
  UpdateUserDTO 
} from '../../src/types/user.types';
import { 
  createMockUser, 
  createMockCreateUserDTO, 
  createMockUpdateUserDTO, 
  createMockUserWithRole 
} from '../../mocks/user.mock';

// Test Database Configuration
const TEST_DB_CONFIG = {
  type: 'postgres',
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  username: process.env.TEST_DB_USER || 'test',
  password: process.env.TEST_DB_PASSWORD || 'test',
  database: process.env.TEST_DB_NAME || 'estatekit_test',
  entities: [__dirname + '/../../src/db/models/*.model.ts'],
  synchronize: true
};

describe('Users API Integration Tests', () => {
  let app: INestApplication;
  let userService: UserService;
  let auditService: AuditService;
  let testUser: User;
  let authToken: string;

  beforeEach(async () => {
    // Create test module with security configurations
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(TEST_DB_CONFIG),
        TypeOrmModule.forFeature([User])
      ],
      controllers: [UsersController],
      providers: [
        UserService,
        AuditService,
        EncryptionService
      ]
    }).compile();

    app = moduleFixture.createApplication();
    
    // Initialize services
    userService = moduleFixture.get<UserService>(UserService);
    auditService = moduleFixture.get<AuditService>(AuditService);

    // Set up test user and authentication
    testUser = createMockUser();
    authToken = 'test-auth-token';

    // Configure security headers
    app.use((req: any, res: any, next: any) => {
      req.headers['user-agent'] = 'test-agent';
      req.headers['x-forwarded-for'] = '127.0.0.1';
      next();
    });

    await app.init();
  });

  afterEach(async () => {
    // Clean up test data securely
    await userService.deleteUser(testUser.id, UserRole.OWNER);
    await app.close();
  });

  describe('POST /users', () => {
    it('should create a new user with valid data and audit log', async () => {
      // Arrange
      const createUserDTO: CreateUserDTO = createMockCreateUserDTO();
      const expectedAuditParams = {
        eventType: 'USER_LOGIN',
        severity: 'INFO',
        userId: expect.any(String),
        resourceType: 'USER'
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createUserDTO)
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        email: createUserDTO.email,
        name: createUserDTO.name,
        role: UserRole.OWNER,
        status: UserStatus.PENDING
      });

      // Verify audit log creation
      const auditLogs = await auditService.getAuditLogs({
        userId: response.body.id
      });
      expect(auditLogs.logs[0]).toMatchObject(expectedAuditParams);
    });

    it('should enforce input validation and security controls', async () => {
      // Arrange
      const invalidDTO = {
        email: 'invalid-email',
        name: '',
        province: ''
      };

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDTO)
        .expect(400);

      expect(response.body.message).toContain('Invalid email format');
    });

    it('should prevent duplicate email registration', async () => {
      // Arrange
      const existingUser = await userService.createUser(createMockCreateUserDTO());
      const duplicateDTO = createMockCreateUserDTO({
        email: existingUser.email
      });

      // Act & Assert
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateDTO)
        .expect(400);
    });
  });

  describe('GET /users/:id', () => {
    it('should retrieve user with proper role-based access', async () => {
      // Arrange
      const user = await userService.createUser(createMockCreateUserDTO());

      // Act
      const response = await request(app.getHttpServer())
        .get(`/users/${user.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-role', UserRole.OWNER)
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        id: user.id,
        email: user.email,
        role: user.role
      });
    });

    it('should enforce role-based access control', async () => {
      // Arrange
      const user = await userService.createUser(createMockCreateUserDTO());

      // Act & Assert
      await request(app.getHttpServer())
        .get(`/users/${user.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-role', UserRole.FINANCIAL_ADVISOR)
        .expect(403);
    });

    it('should handle non-existent users securely', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .get('/users/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-role', UserRole.OWNER)
        .expect(404);
    });
  });

  describe('PUT /users/:id', () => {
    it('should update user with proper authorization and audit', async () => {
      // Arrange
      const user = await userService.createUser(createMockCreateUserDTO());
      const updateDTO: UpdateUserDTO = createMockUpdateUserDTO();

      // Act
      const response = await request(app.getHttpServer())
        .put(`/users/${user.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-role', UserRole.OWNER)
        .send(updateDTO)
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        id: user.id,
        name: updateDTO.name,
        profile: expect.objectContaining(updateDTO.profile)
      });

      // Verify audit log
      const auditLogs = await auditService.getAuditLogs({
        userId: user.id,
        eventType: ['PERMISSION_CHANGE']
      });
      expect(auditLogs.logs).toHaveLength(1);
    });

    it('should validate sensitive data updates', async () => {
      // Arrange
      const user = await userService.createUser(createMockCreateUserDTO());
      const updateDTO = createMockUpdateUserDTO({
        profile: {
          phoneNumber: 'invalid-phone'
        }
      });

      // Act & Assert
      await request(app.getHttpServer())
        .put(`/users/${user.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-role', UserRole.OWNER)
        .send(updateDTO)
        .expect(400);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete user with proper authorization and audit', async () => {
      // Arrange
      const user = await userService.createUser(createMockCreateUserDTO());

      // Act
      await request(app.getHttpServer())
        .delete(`/users/${user.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-role', UserRole.OWNER)
        .expect(200);

      // Assert
      const deletedUser = await userService.getUserById(user.id, UserRole.OWNER);
      expect(deletedUser).toBeNull();

      // Verify audit log
      const auditLogs = await auditService.getAuditLogs({
        userId: user.id,
        eventType: ['USER_LOGIN']
      });
      expect(auditLogs.logs[0].severity).toBe('WARNING');
    });

    it('should prevent unauthorized deletion', async () => {
      // Arrange
      const user = await userService.createUser(createMockCreateUserDTO());

      // Act & Assert
      await request(app.getHttpServer())
        .delete(`/users/${user.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-role', UserRole.EXECUTOR)
        .expect(403);
    });
  });

  describe('Security and Compliance Tests', () => {
    it('should enforce PIPEDA compliance for data handling', async () => {
      // Arrange
      const user = await userService.createUser(createMockCreateUserDTO({
        profile: {
          phoneNumber: '+1-555-123-4567',
          sin: '123-456-789'
        }
      }));

      // Act
      const response = await request(app.getHttpServer())
        .get(`/users/${user.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-role', UserRole.OWNER)
        .expect(200);

      // Assert
      expect(response.body.profile.phoneNumber).toMatch(/^\*+\d{4}$/);
      expect(response.body.profile.sin).toBeUndefined();
    });

    it('should maintain comprehensive audit trail', async () => {
      // Arrange
      const user = await userService.createUser(createMockCreateUserDTO());

      // Perform multiple operations
      await request(app.getHttpServer())
        .get(`/users/${user.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-role', UserRole.OWNER);

      await request(app.getHttpServer())
        .put(`/users/${user.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-role', UserRole.OWNER)
        .send(createMockUpdateUserDTO());

      // Assert audit trail
      const auditLogs = await auditService.getAuditLogs({ userId: user.id });
      expect(auditLogs.logs.length).toBeGreaterThanOrEqual(3);
      expect(auditLogs.logs.map(log => log.eventType)).toContain('DOCUMENT_ACCESS');
      expect(auditLogs.logs.map(log => log.eventType)).toContain('PERMISSION_CHANGE');
    });
  });
});