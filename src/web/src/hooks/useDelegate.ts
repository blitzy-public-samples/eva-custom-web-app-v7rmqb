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
  selectDelegateIds,
  selectDelegateStatus,
  selectDelegateError,
  selectDelegateById,
  addAuditLogEntry,
  selectAllDelegates
} from '../redux/slices/delegateSlice';
import {
  CreateDelegateDTO,
  UpdateDelegateDTO,
  DelegateRole,
  AccessLevel
} from '../types/delegate.types';
import { EntityId } from '@reduxjs/toolkit';

// Cache status type for tracking cache state
type CacheStatus = 'valid' | 'stale' | 'invalid';

/**
 * Custom hook for managing delegate operations with enhanced security and monitoring
 * @returns Object containing delegate state and secure operations
 */
export const useDelegate = () => {
  const dispatch = useDispatch();

  // Redux state selectors
  const delegateIds = useSelector(selectDelegateIds);
  const delegates = useSelector(selectAllDelegates);
  const status = useSelector(selectDelegateStatus);
  const error = useSelector(selectDelegateError);

  // Local state for cache management
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>('invalid');
  const [lastRefresh, setLastRefresh] = useState<number>(0);

  // Cache configuration
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get delegate by ID
   */
  const getDelegateById = useCallback((id: EntityId) => {
    return useSelector((state) => selectDelegateById(state, id));
  }, []);

  /**
   * Validates delegate permissions against security matrix
   */
  const validatePermissions = useCallback(async (
    delegateId: EntityId,
    action: string
  ): Promise<boolean> => {
    const delegate = getDelegateById(delegateId);
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

    const role = delegate.role as DelegateRole;
    return !!permissionMatrix[role]?.[action];
  }, [getDelegateById]);

  /**
   * Adds audit log entry for delegate operations
   */
  const logAuditEvent = useCallback((
    action: string,
    delegateId: EntityId | 'system',
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

      await dispatch(fetchDelegates() as any);
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

      const result = await dispatch(createDelegate(data) as any);
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
    id: EntityId,
    data: UpdateDelegateDTO
  ) => {
    try {
      // Validate permissions for update
      const hasPermission = await validatePermissions(id, 'write.delegate');
      if (!hasPermission) {
        throw new Error('Insufficient permissions to update delegate');
      }

      const result = await dispatch(updateDelegate({ id: id.toString(), data }) as any);
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
    id: EntityId
  ) => {
    try {
      // Validate permissions for removal
      const hasPermission = await validatePermissions(id, 'delete.delegate');
      if (!hasPermission) {
        throw new Error('Insufficient permissions to remove delegate');
      }

      const result = await dispatch(removeDelegate(id.toString()) as any);
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
    delegateIds,
    delegates,
    status,
    error,
    cacheStatus,
    getDelegateById,
    fetchDelegates: fetchDelegatesEnhanced,
    createDelegate: createDelegateEnhanced,
    updateDelegate: updateDelegateEnhanced,
    removeDelegate: removeDelegateEnhanced,
    validatePermissions,
    refreshCache
  }), [
    delegateIds,
    delegates,
    status,
    error,
    cacheStatus,
    getDelegateById,
    fetchDelegatesEnhanced,
    createDelegateEnhanced,
    updateDelegateEnhanced,
    removeDelegateEnhanced,
    validatePermissions,
    refreshCache
  ]);
};