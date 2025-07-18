import { getDefaultStore } from 'jotai';
import { authenticatedFetch } from './auth/token-manager';
import { API_CONFIG } from './config';
import { UserQuota } from '@/app/state/types';
import { UserQuotaAtom } from '@/app/state/atoms';

export interface StorageApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  isAuthError?: boolean;
}

/**
 * Fetch user quota from storage API
 * Returns response with success/error status instead of relying on authentication flags
 */
export async function fetchUserQuota(): Promise<StorageApiResponse<UserQuota>> {
  try {
    const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/user/quota`);

    // Handle unauthenticated responses (401, 403)
    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        error: 'Authentication required',
        isAuthError: true,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch quota: ${response.statusText}`,
        isAuthError: false,
      };
    }

    const quota = await response.json();
    return {
      success: true,
      data: quota,
      isAuthError: false,
    };
  } catch (err) {
    console.error('Error fetching quota:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch quota';
    
    // Check if it's a network/auth related error
    const isAuthError = errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('Unauthorized');
    
    return {
      success: false,
      error: errorMessage,
      isAuthError,
    };
  }
} 

/**
 * Fetch and update user quota in global state
 * Uses the unified AsyncStatus pattern
 */
export function loadUserQuota() {
  const store = getDefaultStore();
  
  // Set loading state
  store.set(UserQuotaAtom, { status: 'loading' });
  
  // Fetch quota and update state
  fetchUserQuota()
    .then((result) => {
      if (result.success && result.data) {
        store.set(UserQuotaAtom, { status: 'success', data: result.data });
      } else {
        store.set(UserQuotaAtom, { status: 'error', error: result.error || 'Failed to fetch quota' });
      }
    })
    .catch((error) => {
      console.error('Error loading quota:', error);
      store.set(UserQuotaAtom, { status: 'error', error: error.message || 'Failed to fetch quota' });
    });
} 