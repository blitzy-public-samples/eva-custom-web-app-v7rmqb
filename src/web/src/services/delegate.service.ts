/**
 * Delegate Service Implementation
 * Version: 1.0.0
 * 
 * Implements secure, role-based delegate access management with comprehensive 
 * audit logging, expiration handling, and Auth0 integration.
 * 
 * @package @auth0/auth0-spa-js ^2.1.0
 */

import { Auth0Client } from '@auth0/auth0-spa-js';
import { auth0Client } from '../config/auth.config';
import { apiService } from '../services/api.service';
import {
  Delegate,
  CreateDelegateDTO,
  UpdateDelegateDTO,
  DelegateRole,
  DelegateStatus,
  DelegatePermission,
  ResourceType,
  AccessLevel
} from '../types/delegate.types';

// Interface for delegate filtering and pagination
interface DelegateFilter {
  status?: DelegateStatus[];
  role?: DelegateRole[];
  search?: string;
}

interface PaginationOptions {
  page: number;
  limit: number;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Singleton service implementing secure delegate access management
 * with comprehensive audit logging and Auth0 integration
 */
export class DelegateService {
  private static instance: DelegateService;

  /**
   * Private constructor initializing API service and Auth0 client
   */
  private constructor() {}

  /**
   * Gets singleton instance of DelegateService
   */
  public static getInstance(): DelegateService {
    if (!DelegateService.instance) {
      DelegateService.instance = new DelegateService();
    }
    return DelegateService.instance;
  }

  /**
   * Retrieves paginated list of delegates with optional filtering
   */
  public async getDelegates(
    filter: DelegateFilter = {},
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<PaginatedResponse<Delegate>> {
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filter.status && { status: filter.status.join(',') }),
        ...(filter.role && { role: filter.role.join(',') }),
        ...(filter.search && { search: filter.search })
      });

      return await apiService.get<PaginatedResponse<Delegate>>(
        `/delegates?${queryParams.toString()}`
      );
    } catch (error) {
      console.error('Failed to fetch delegates:', error);
      throw error;
    }
  }

  /**
   * Creates new delegate invitation with role-based permissions
   */
  public async createDelegate(delegateData: CreateDelegateDTO): Promise<Delegate> {
    try {
      // Validate permissions based on role
      this.validateRolePermissions(delegateData.role, delegateData.permissions);

      // Create delegate with validated permissions
      const delegate = await apiService.post<Delegate>('/delegates', {
        ...delegateData,
        status: DelegateStatus.PENDING
      });

      // Send invitation email
      await this.sendDelegateInvitation(delegate);

      return delegate;
    } catch (error) {
      console.error('Failed to create delegate:', error);
      throw error;
    }
  }

  /**
   * Updates delegate permissions and status
   */
  public async updateDelegate(
    id: string,
    updateData: UpdateDelegateDTO
  ): Promise<Delegate> {
    try {
      // Validate permissions based on role
      this.validateRolePermissions(updateData.role, updateData.permissions);

      return await apiService.put<Delegate>(`/delegates/${id}`, updateData);
    } catch (error) {
      console.error('Failed to update delegate:', error);
      throw error;
    }
  }

  /**
   * Revokes delegate access
   */
  public async revokeDelegate(id: string): Promise<void> {
    try {
      await apiService.put<Delegate>(`/delegates/${id}`, {
        status: DelegateStatus.REVOKED
      });

      // Revoke Auth0 access
      const delegate = await apiService.get<Delegate>(`/delegates/${id}`);
      await this.revokeAuth0Access(delegate.delegateId);
    } catch (error) {
      console.error('Failed to revoke delegate access:', error);
      throw error;
    }
  }

  /**
   * Validates role-based permissions according to security matrix
   */
  private validateRolePermissions(
    role: DelegateRole,
    permissions: DelegatePermission[]
  ): void {
    const permissionMatrix: Record<DelegateRole, Record<ResourceType, AccessLevel>> = {
      [DelegateRole.EXECUTOR]: {
        [ResourceType.PERSONAL_INFO]: AccessLevel.READ,
        [ResourceType.FINANCIAL_DATA]: AccessLevel.READ,
        [ResourceType.MEDICAL_DATA]: AccessLevel.NONE,
        [ResourceType.LEGAL_DOCS]: AccessLevel.READ
      },
      [DelegateRole.HEALTHCARE_PROXY]: {
        [ResourceType.PERSONAL_INFO]: AccessLevel.READ,
        [ResourceType.FINANCIAL_DATA]: AccessLevel.NONE,
        [ResourceType.MEDICAL_DATA]: AccessLevel.READ,
        [ResourceType.LEGAL_DOCS]: AccessLevel.READ
      },
      [DelegateRole.FINANCIAL_ADVISOR]: {
        [ResourceType.PERSONAL_INFO]: AccessLevel.NONE,
        [ResourceType.FINANCIAL_DATA]: AccessLevel.READ,
        [ResourceType.MEDICAL_DATA]: AccessLevel.NONE,
        [ResourceType.LEGAL_DOCS]: AccessLevel.NONE
      },
      [DelegateRole.LEGAL_ADVISOR]: {
        [ResourceType.PERSONAL_INFO]: AccessLevel.READ,
        [ResourceType.FINANCIAL_DATA]: AccessLevel.READ,
        [ResourceType.MEDICAL_DATA]: AccessLevel.NONE,
        [ResourceType.LEGAL_DOCS]: AccessLevel.READ
      }
    };

    permissions.forEach(permission => {
      const allowedAccess = permissionMatrix[role][permission.resourceType];
      if (permission.accessLevel > allowedAccess) {
        throw new Error(
          `Invalid permission level for role ${role} and resource ${permission.resourceType}`
        );
      }
    });
  }

  /**
   * Sends secure invitation email to delegate
   */
  private async sendDelegateInvitation(delegate: Delegate): Promise<void> {
    try {
      await apiService.post('/notifications/delegate-invitation', {
        delegateId: delegate.id,
        email: delegate.email,
        role: delegate.role
      });
    } catch (error) {
      console.error('Failed to send delegate invitation:', error);
      throw error;
    }
  }

  /**
   * Revokes Auth0 access for delegate
   */
  private async revokeAuth0Access(delegateId: string): Promise<void> {
    try {
      // Use token endpoint to revoke access
      await apiService.post('/auth/revoke-access', {
        delegateId
      });
    } catch (error) {
      console.error('Failed to revoke Auth0 access:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default DelegateService.getInstance();