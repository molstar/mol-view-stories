import { OAUTH_CONFIG } from '../config';

// Token management utilities
export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
}

// Global refresh promise to prevent race conditions
let refreshPromise: Promise<AuthTokens | null> | null = null;

// Trigger auth context refresh when tokens are updated
function triggerAuthRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tokens-updated'));
  }
}

export function saveTokens(tokens: Omit<AuthTokens, 'expires_at'>): void {
  if (typeof window === 'undefined') return;

  const tokensWithExpiry: AuthTokens = {
    ...tokens,
    expires_at: Date.now() + tokens.expires_in * 1000,
  };

  try {
    sessionStorage.setItem('oauth_tokens', JSON.stringify(tokensWithExpiry));
    triggerAuthRefresh();
    console.log('✅ Tokens saved successfully, expires at:', new Date(tokensWithExpiry.expires_at).toISOString());
  } catch (error) {
    console.warn('Failed to save tokens:', error);
  }
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem('oauth_tokens');
    triggerAuthRefresh();
    console.log('🔄 Tokens cleared');
  } catch (error) {
    console.warn('Failed to clear tokens:', error);
  }
}

// Enhanced token retrieval with automatic refresh and race condition protection
export async function getValidTokens(): Promise<AuthTokens | null> {
  if (typeof window === 'undefined') return null;

  try {
    const saved = sessionStorage.getItem('oauth_tokens');
    if (!saved) return null;

    const tokens: AuthTokens = JSON.parse(saved);
    const now = Date.now();

    // Check if tokens are expired
    if (now >= tokens.expires_at) {
      console.log('🔄 Tokens expired, attempting refresh...');
      // Try to refresh tokens with race condition protection
      const refreshedTokens = await refreshAccessTokenWithProtection();
      if (refreshedTokens) {
        console.log('✅ Token refresh successful');
        return refreshedTokens;
      } else {
        console.log('❌ Token refresh failed');
        return null;
      }
    }

    // Check if tokens will expire soon (within 10 minutes) and refresh proactively
    const tenMinutesFromNow = now + 10 * 60 * 1000;
    if (tokens.refresh_token && tenMinutesFromNow >= tokens.expires_at) {
      console.log('🔄 Tokens expiring soon, proactive refresh...');
      // Try to refresh tokens and wait for result
      try {
        const refreshedTokens = await refreshAccessTokenWithProtection();
        if (refreshedTokens) {
          console.log('✅ Proactive token refresh successful');
          return refreshedTokens;
        } else {
          console.log('⚠️ Proactive token refresh failed, using current tokens');
          return tokens; // Use current tokens if refresh fails
        }
      } catch (error) {
        console.warn('Proactive token refresh error:', error);
        return tokens; // Use current tokens if refresh fails
      }
    }

    // Check if tokens will expire soon (within 5 minutes) and refresh in background
    const fiveMinutesFromNow = now + 5 * 60 * 1000;
    if (tokens.refresh_token && fiveMinutesFromNow >= tokens.expires_at) {
      console.log('🔄 Starting background token refresh...');
      // Start background refresh but don't wait for it
      refreshAccessTokenWithProtection()
        .then((refreshedTokens) => {
          if (refreshedTokens) {
            console.log('✅ Background token refresh successful');
            // Trigger auth context update
            triggerAuthRefresh();
          } else {
            console.log('⚠️ Background token refresh failed');
          }
        })
        .catch((error) => {
          console.warn('Background token refresh error:', error);
        });
    }

    return tokens;
  } catch (error) {
    console.warn('Failed to get valid tokens:', error);
    return null;
  }
}

// Race condition protected wrapper for refreshAccessToken
async function refreshAccessTokenWithProtection(): Promise<AuthTokens | null> {
  // If there's already a refresh in progress, wait for it
  if (refreshPromise) {
    console.log('🔄 Refresh already in progress, waiting...');
    return await refreshPromise;
  }

  // Start new refresh promise
  refreshPromise = refreshAccessToken();

  try {
    const result = await refreshPromise;
    return result;
  } finally {
    // Clear the promise after completion
    refreshPromise = null;
  }
}

// Refresh tokens using refresh_token with improved error handling
export async function refreshAccessToken(): Promise<AuthTokens | null> {
  if (typeof window === 'undefined') return null;

  // Get tokens directly from storage, even if expired
  let currentTokens: AuthTokens;
  try {
    const saved = sessionStorage.getItem('oauth_tokens');
    if (!saved) {
      console.log('❌ No tokens found in storage for refresh');
      return null;
    }
    currentTokens = JSON.parse(saved);
  } catch (error) {
    console.error('Failed to parse stored tokens:', error);
    return null;
  }

  if (!currentTokens?.refresh_token) {
    console.log('❌ No refresh token available');
    return null;
  }

  console.log('🔄 Attempting to refresh access token...');

  try {
    const response = await fetch(`${OAUTH_CONFIG.authority}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: OAUTH_CONFIG.client_id,
        refresh_token: currentTokens.refresh_token,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token refresh failed:', response.status, errorText);

      // Be more selective about when to clear tokens
      // Only clear tokens for specific error conditions that indicate permanent failure
      if (
        response.status === 400 &&
        (errorText.includes('invalid_grant') ||
          errorText.includes('invalid_refresh_token') ||
          errorText.includes('EXPIRED_AUTHORIZATION_CREDENTIAL'))
      ) {
        console.log('❌ Refresh token is permanently invalid, clearing tokens');
        clearTokens();
      } else if (response.status === 401 && errorText.includes('INVALID_GRANT')) {
        console.log('❌ Refresh token is permanently invalid, clearing tokens');
        clearTokens();
      } else {
        // For temporary errors (network, 500, etc.), don't clear tokens
        console.log('⚠️ Temporary error during token refresh, keeping tokens');
      }
      return null;
    }

    const newTokens = await response.json();

    // Preserve refresh token if not returned
    if (!newTokens.refresh_token && currentTokens.refresh_token) {
      newTokens.refresh_token = currentTokens.refresh_token;
    }

    // Save the new tokens
    saveTokens(newTokens);

    console.log('✅ Token refresh successful');
    return {
      ...newTokens,
      expires_at: Date.now() + newTokens.expires_in * 1000,
    };
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Don't clear tokens on network errors - keep them for retry
    return null;
  }
}

// Authenticated fetch wrapper with automatic token refresh
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const makeRequest = async (tokens: AuthTokens | null): Promise<Response> => {
    const headers = new Headers(options.headers);

    if (tokens?.access_token) {
      headers.set('Authorization', `Bearer ${tokens.access_token}`);
    }

    return fetch(url, {
      ...options,
      headers,
    });
  };

  // First attempt with current tokens
  const tokens = await getValidTokens();
  let response = await makeRequest(tokens);

  // If we get a 401 and have a refresh token, try to refresh and retry once
  if (response.status === 401 && tokens?.refresh_token) {
    console.log('🔄 401 response, attempting token refresh...');
    const refreshedTokens = await refreshAccessTokenWithProtection();
    if (refreshedTokens) {
      console.log('✅ Token refresh after 401 successful, retrying request');
      response = await makeRequest(refreshedTokens);
    } else {
      console.log('❌ Token refresh after 401 failed, clearing tokens');
      clearTokens();
      // Trigger auth context refresh to update UI
      triggerAuthRefresh();
    }
  }

  return response;
} 