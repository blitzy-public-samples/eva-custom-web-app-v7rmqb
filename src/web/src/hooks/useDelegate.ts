/**
 * Enhanced Delegate Management Hook
 * Version: 1.0.0
 * 
 * Custom React hook implementing secure delegate operations with comprehensive
 * validation, caching, and audit logging for the Estate Kit platform.
 * 
 * @package react ^18.2.0
 * @package react-redux ^8.0.5
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchDelegates,
  createDelegate,
  updateDelegate,
  removeDelegate,
  selectDelegates,
  selectDelegateStatus,
  selectDelegateError,
  addAuditLogEntry,
  invalidateCache
} from '../redux/slices/delegateSlice';
import {
  Delegate,
  CreateDelegateDTO,
  UpdateDelegateDTO,
  DelegateRole,
  DelegateStatus,
  ResourceType,
  AccessLevel
} from '../types/delegate.types';

// Cache status type for tracking cache state
type CacheStatus = 'valid' | 'stale' | 'invalid';

// Enhanced error type for delegate operations
interface DelegateError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

/**
 * Custom hook for managing delegate operations with enhanced security and monitoring
 * @returns Object containing delegate state and secure operations
 */
export const useDelegate = () => {
  const dispatch = useDispatch();

  // Redux state selectors
  const delegates = useSelector(selectDelegates);
  const status = useSelector(selectDelegateStatus);
  const error = useSelector(selectDelegateError);

  // Local state for cache management
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>('invalid');
  const [lastRefresh, setLastRefresh] = useState<number>(0);

  // Cache configuration
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Validates delegate permissions against security matrix
   */
  const validatePermissions = useCallback(async (
    delegateId: string,
    action: string
  ): Promise<boolean> => {
    const delegate = delegates.find(d => d.id === delegateId);
    if (!delegate) return false;

    // Permission matrix based on role
    const permissionMatrix: Record<DelegateRole, Record<string, boolean>> = {
      [DelegateRole.EXECUTOR]: {
        'read.personal': true,
        'read.financial': true,
        'read.legal': true,
        'write.personal': false,
        'write.financial': false,
        'write.legal': false
      },
      [DelegateRole.HEALTHCARE_PROXY]: {
        'read.personal': true,
        'read.medical': true,
        'read.legal': true,
        'write.medical': true
      },
      [DelegateRole.FINANCIAL_ADVISOR]: {
        'read.financial': true
      },
      [DelegateRole.LEGAL_ADVISOR]: {
        'read.personal': true,
        'read.financial': true,
        'read.legal': true
      }
    };

    return !!permissionMatrix[delegate.role]?.[action];
  }, [delegates]);

  /**
   * Adds audit log entry for delegate operations
   */
  const logAuditEvent = useCallback((
    action: string,
    delegateId: string,
    details?: Record<string, any>
  ) => {
    dispatch(addAuditLogEntry({
      timestamp: new Date().toISOString(),
      action,
      delegateId,
      details
    }));
  }, [dispatch]);

  /**
   * Enhanced fetch delegates with cache validation
   */
  const fetchDelegatesEnhanced = useCallback(async () => {
    try {
      if (
        cacheStatus === 'valid' &&
        Date.now() - lastRefresh < CACHE_TTL
      ) {
        return;
      }

      await dispatch(fetchDelegates());
      setLastRefresh(Date.now());
      setCacheStatus('valid');
      logAuditEvent('FETCH_DELEGATES', 'system');
    } catch (error) {
      setCacheStatus('invalid');
      throw error;
    }
  }, [dispatch, cacheStatus, lastRefresh, logAuditEvent]);

  /**
   * Enhanced create delegate with security validation
   */
  const createDelegateEnhanced = useCallback(async (
    data: CreateDelegateDTO
  ) => {
    try {
      // Validate delegate role permissions
      const validRole = Object.values(DelegateRole).includes(data.role);
      if (!validRole) {
        throw new Error('Invalid delegate role');
      }

      // Validate permissions against role matrix
      data.permissions.forEach(permission => {
        if (permission.accessLevel === AccessLevel.WRITE) {
          throw new Error('Write permissions not allowed for delegates');
        }
      });

      const result = await dispatch(createDelegate(data));
      logAuditEvent('CREATE_DELEGATE', result.payload.id, { data });
      setCacheStatus('stale');
      return result;
    } catch (error) {
      throw error;
    }
  }, [dispatch, logAuditEvent]);

  /**
   * Enhanced update delegate with permission validation
   */
  const updateDelegateEnhanced = useCallback(async (
    id: string,
    data: UpdateDelegateDTO
  ) => {
    try {
      // Validate permissions for update
      const hasPermission = await validatePermissions(id, 'write.delegate');
      if (!hasPermission) {
        throw new Error('Insufficient permissions to update delegate');
      }

      const result = await dispatch(updateDelegate({ id, data }));
      logAuditEvent('UPDATE_DELEGATE', id, { data });
      setCacheStatus('stale');
      return result;
    } catch (error) {
      throw error;
    }
  }, [dispatch, validatePermissions, logAuditEvent]);

  /**
   * Enhanced remove delegate with security checks
   */
  const removeDelegateEnhanced = useCallback(async (
    id: string
  ) => {
    try {
      // Validate permissions for removal
      const hasPermission = await validatePermissions(id, 'delete.delegate');
      if (!hasPermission) {
        throw new Error('Insufficient permissions to remove delegate');
      }

      const result = await dispatch(removeDelegate(id));
      logAuditEvent('REMOVE_DELEGATE', id);
      setCacheStatus('stale');
      return result;
    } catch (error) {
      throw error;
    }
  }, [dispatch, validatePermissions, logAuditEvent]);

  /**
   * Force cache refresh
   */
  const refreshCache = useCallback(async () => {
    setCacheStatus('invalid');
    await fetchDelegatesEnhanced();
  }, [fetchDelegatesEnhanced]);

  // Initial data fetch
  useEffect(() => {
    fetchDelegatesEnhanced();
  }, [fetchDelegatesEnhanced]);

  // Cache auto-refresh on stale status
  useEffect(() => {
    if (cacheStatus === 'stale') {
      fetchDelegatesEnhanced();
    }
  }, [cacheStatus, fetchDelegatesEnhanced]);

  // Memoized return value
  return useMemo(() => ({
    delegates,
    status,
    error,
    cacheStatus,
    fetchDelegates: fetchDelegatesEnhanced,
    createDelegate: createDelegateEnhanced,
    updateDelegate: updateDelegateEnhanced,
    removeDelegate: removeDelegateEnhanced,
    validatePermissions,
    refreshCache
  }), [
    delegates,
    status,
    error,
    cacheStatus,
    fetchDelegatesEnhanced,
    createDelegateEnhanced,
    updateDelegateEnhanced,
    removeDelegateEnhanced,
    validatePermissions,
    refreshCache
  ]);
};