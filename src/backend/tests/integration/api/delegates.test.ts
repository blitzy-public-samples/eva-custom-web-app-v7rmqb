/**
 * Integration Tests for Estate Kit Delegates API
 * Validates delegate management features, security controls, and compliance requirements
 * @version 1.0.0
 */

import { describe, it, beforeAll, afterAll, beforeEach, afterEach } from 'jest'; // ^29.0.0
import supertest from 'supertest'; // ^6.3.3
import { Express } from 'express';
import { createConnection, Connection, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

// Internal imports
import { DelegatesController } from '../../../src/api/controllers/delegates.controller';
import { DelegateEntity } from '../../../src/db/models/delegate.model';
import { UserModel } from '../../../src/db/models/user.model';
import { AuditModel } from '../../../src/db/models/audit.model';
import { 
  ResourceType, 
  AccessLevel, 
  DEFAULT_PERMISSION_MATRICES 
} from '../../../src/types/permission.types';
import { 
  UserRole, 
  UserStatus 
} from '../../../src/types/user.types';
import { DelegateStatus } from '../../../src/types/delegate.types';
import { AuditEventType, AuditSeverity } from '../../../src/types/audit.types';

describe('Delegates API Integration Tests', () => {
  let app: Express;
  let connection: Connection;
  let delegateRepository: Repository<DelegateEntity>;
  let userRepository: Repository<UserModel>;
  let auditRepository: Repository<AuditModel>;
  let testUsers: Map<string, any>;
  let authTokens: Map<string, string>;

  // Test data constants
  const TEST_OWNER_EMAIL = 'owner@test.ca';
  const TEST_DELEGATE_EMAIL = 'delegate@test.ca';
  const VALID_BUSINESS_HOURS = {
    timezone: 'America/Toronto',
    start: '09:00',
    end: '17:00'
  };

  beforeAll(async () => {
    // Initialize test database connection
    connection = await createConnection({
      type: 'postgres',
      database: 'estate_kit_test',
      entities: [DelegateEntity, UserModel, AuditModel],
      synchronize: true,
      dropSchema: true
    });

    // Initialize repositories
    delegateRepository = connection.getRepository(DelegateEntity);
    userRepository = connection.getRepository(UserModel);
    auditRepository = connection.getRepository(AuditModel);

    // Create test application instance
    app = require('../../../src/app').default;
  });

  beforeEach(async () => {
    // Create test users
    testUsers = new Map();
    authTokens = new Map();

    // Create owner user
    const owner = await userRepository.save({
      email: TEST_OWNER_EMAIL,
      name: 'Test Owner',
      role: UserRole.OWNER,
      status: UserStatus.ACTIVE,
      profile: {
        province: 'ON',
        mfaEnabled: true,
        emailNotifications: true,
        smsNotifications: false,
        timezone: 'America/Toronto',
        language: 'en'
      }
    });
    testUsers.set('owner', owner);

    // Generate auth tokens
    const ownerToken = generateTestToken(owner);
    authTokens.set('owner', ownerToken);
  });

  afterEach(async () => {
    // Clean up test data
    await delegateRepository.delete({});
    await userRepository.delete({});
    await auditRepository.delete({});
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('POST /api/delegates', () => {
    it('should create a new delegate with valid data', async () => {
      const delegateData = {
        email: TEST_DELEGATE_EMAIL,
        role: UserRole.EXECUTOR,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        permissions: [
          {
            resourceType: ResourceType.PERSONAL_INFO,
            accessLevel: AccessLevel.READ
          },
          {
            resourceType: ResourceType.FINANCIAL_DATA,
            accessLevel: AccessLevel.READ
          }
        ],
        businessHours: VALID_BUSINESS_HOURS
      };

      const response = await supertest(app)
        .post('/api/delegates')
        .set('Authorization', `Bearer ${authTokens.get('owner')}`)
        .send(delegateData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe(DelegateStatus.PENDING);

      // Verify audit log creation
      const auditLog = await auditRepository.findOne({
        where: {
          eventType: AuditEventType.DELEGATE_INVITE,
          resourceId: response.body.id
        }
      });
      expect(auditLog).toBeTruthy();
    });

    it('should reject delegate creation with invalid permissions', async () => {
      const invalidData = {
        email: TEST_DELEGATE_EMAIL,
        role: UserRole.EXECUTOR,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        permissions: [
          {
            resourceType: ResourceType.MEDICAL_DATA,
            accessLevel: AccessLevel.WRITE
          }
        ],
        businessHours: VALID_BUSINESS_HOURS
      };

      const response = await supertest(app)
        .post('/api/delegates')
        .set('Authorization', `Bearer ${authTokens.get('owner')}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid permission matrix');
    });

    it('should enforce business hours restrictions', async () => {
      const invalidBusinessHours = {
        email: TEST_DELEGATE_EMAIL,
        role: UserRole.EXECUTOR,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        permissions: [
          {
            resourceType: ResourceType.PERSONAL_INFO,
            accessLevel: AccessLevel.READ
          }
        ],
        businessHours: {
          timezone: 'America/Toronto',
          start: '20:00',
          end: '22:00'
        }
      };

      const response = await supertest(app)
        .post('/api/delegates')
        .set('Authorization', `Bearer ${authTokens.get('owner')}`)
        .send(invalidBusinessHours);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('business hours');
    });
  });

  describe('GET /api/delegates', () => {
    it('should list delegates with proper pagination', async () => {
      // Create multiple test delegates
      const delegates = await createTestDelegates(3);

      const response = await supertest(app)
        .get('/api/delegates')
        .set('Authorization', `Bearer ${authTokens.get('owner')}`)
        .query({ page: 1, limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.delegates).toHaveLength(2);
      expect(response.body.total).toBe(3);
    });

    it('should filter delegates by status', async () => {
      // Create delegates with different statuses
      await createTestDelegates(2, DelegateStatus.ACTIVE);
      await createTestDelegates(1, DelegateStatus.EXPIRED);

      const response = await supertest(app)
        .get('/api/delegates')
        .set('Authorization', `Bearer ${authTokens.get('owner')}`)
        .query({ status: DelegateStatus.ACTIVE });

      expect(response.status).toBe(200);
      expect(response.body.delegates).toHaveLength(2);
      expect(response.body.delegates.every(d => d.status === DelegateStatus.ACTIVE)).toBe(true);
    });
  });

  describe('PUT /api/delegates/:id', () => {
    it('should update delegate permissions with valid data', async () => {
      const delegate = await createTestDelegate(DelegateStatus.ACTIVE);

      const updateData = {
        permissions: [
          {
            resourceType: ResourceType.PERSONAL_INFO,
            accessLevel: AccessLevel.READ
          }
        ],
        businessHours: VALID_BUSINESS_HOURS
      };

      const response = await supertest(app)
        .put(`/api/delegates/${delegate.id}`)
        .set('Authorization', `Bearer ${authTokens.get('owner')}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.permissions).toHaveLength(1);

      // Verify audit log
      const auditLog = await auditRepository.findOne({
        where: {
          eventType: AuditEventType.PERMISSION_CHANGE,
          resourceId: delegate.id
        }
      });
      expect(auditLog).toBeTruthy();
    });

    it('should prevent updating to invalid status transitions', async () => {
      const delegate = await createTestDelegate(DelegateStatus.ACTIVE);

      const response = await supertest(app)
        .put(`/api/delegates/${delegate.id}`)
        .set('Authorization', `Bearer ${authTokens.get('owner')}`)
        .send({ status: DelegateStatus.EXPIRED });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Cannot manually set delegate to EXPIRED');
    });
  });

  describe('DELETE /api/delegates/:id', () => {
    it('should revoke delegate access', async () => {
      const delegate = await createTestDelegate(DelegateStatus.ACTIVE);

      const response = await supertest(app)
        .delete(`/api/delegates/${delegate.id}`)
        .set('Authorization', `Bearer ${authTokens.get('owner')}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(DelegateStatus.REVOKED);

      // Verify audit log
      const auditLog = await auditRepository.findOne({
        where: {
          eventType: AuditEventType.PERMISSION_CHANGE,
          resourceId: delegate.id,
          details: { action: 'REVOKE' }
        }
      });
      expect(auditLog).toBeTruthy();
    });
  });

  // Helper functions
  async function createTestDelegate(status: DelegateStatus = DelegateStatus.PENDING): Promise<DelegateEntity> {
    return await delegateRepository.save({
      id: uuidv4(),
      ownerId: testUsers.get('owner').id,
      delegateId: uuidv4(),
      role: UserRole.EXECUTOR,
      status,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      permissions: DEFAULT_PERMISSION_MATRICES.EXECUTOR
    });
  }

  async function createTestDelegates(count: number, status: DelegateStatus = DelegateStatus.PENDING): Promise<DelegateEntity[]> {
    const delegates = [];
    for (let i = 0; i < count; i++) {
      delegates.push(await createTestDelegate(status));
    }
    return delegates;
  }

  function generateTestToken(user: any): string {
    // Implementation would depend on your authentication system
    // This is a placeholder that should be replaced with actual token generation
    return `test_token_${user.id}`;
  }
});