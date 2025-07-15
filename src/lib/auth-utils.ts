import { Story, CurrentView } from '@/app/state/types';

// Life Science AAI OAuth2 endpoints
export const OAUTH_CONFIG = {
  authority: process.env.NEXT_PUBLIC_OIDC_AUTHORITY || '',
  client_id: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID || '',
  scope: 'openid profile email offline_access',
  redirect_uri: typeof window !== 'undefined' ? `${window.location.origin}/my-stories` : '',
} as const;

// API Configuration
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://mol-view-stories.dyn.cloud.e-infra.cz',
} as const;

// PKCE utility functions
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined') {
    crypto.getRandomValues(array);
  }
  return btoa(String.fromCharCode(...array))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('generateCodeChallenge can only be called in browser');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);

  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// Simplified login state preservation - only stores redirect path
export interface LoginState {
  redirectPath: string;
  timestamp: number;
}

export function saveLoginState(): void {
  if (typeof window === 'undefined') return;

  // Get current path including search params
  const redirectPath = window.location.pathname + window.location.search;

  const loginState: LoginState = {
    redirectPath,
    timestamp: Date.now(),
  };

  try {
    sessionStorage.setItem('post_login_redirect', redirectPath);
    sessionStorage.setItem('login_app_state', JSON.stringify(loginState));
  } catch (error) {
    console.warn('Failed to save login state:', error);
  }
}

export function restoreLoginState(): LoginState | null {
  if (typeof window === 'undefined') return null;

  try {
    const redirectPath = sessionStorage.getItem('post_login_redirect');
    const savedState = sessionStorage.getItem('login_app_state');

    if (!redirectPath && !savedState) {
      return null;
    }

    let loginState: LoginState | null = null;

    if (savedState) {
      loginState = JSON.parse(savedState);
    } else if (redirectPath) {
      // Fallback if only redirect path is stored
      loginState = {
        redirectPath,
        timestamp: Date.now(),
      };
    }

    // Clean up after restoration
    sessionStorage.removeItem('post_login_redirect');
    sessionStorage.removeItem('login_app_state');

    return loginState;
  } catch (error) {
    console.error('Failed to restore login state:', error);
    return null;
  }
}

// Token management utilities
export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
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
  } catch (error) {
    console.warn('Failed to save tokens:', error);
  }
}

// Trigger auth context refresh when tokens are updated
function triggerAuthRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tokens-updated'));
  }
}

// Enhanced token retrieval with automatic refresh
export async function getValidTokens(): Promise<AuthTokens | null> {
  if (typeof window === 'undefined') return null;

  try {
    const saved = sessionStorage.getItem('oauth_tokens');
    if (!saved) return null;

    const tokens: AuthTokens = JSON.parse(saved);
    const now = Date.now();

    // Check if tokens are expired
    if (now >= tokens.expires_at) {
      // Try to refresh tokens
      const refreshedTokens = await refreshAccessToken();
      if (refreshedTokens) {
        return refreshedTokens;
      } else {
        return null;
      }
    }

    // Check if tokens will expire soon (within 10 minutes) and refresh proactively
    const tenMinutesFromNow = now + 10 * 60 * 1000;
    if (tokens.refresh_token && tenMinutesFromNow >= tokens.expires_at) {
      // Try to refresh tokens and wait for result
      try {
        const refreshedTokens = await refreshAccessToken();
        if (refreshedTokens) {
          return refreshedTokens;
        } else {
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
      // Start background refresh but don't wait for it
      refreshAccessToken()
        .then((refreshedTokens) => {
          if (refreshedTokens) {
            // Trigger auth context update
            triggerAuthRefresh();
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
    const refreshedTokens = await refreshAccessToken();
    if (refreshedTokens) {
      response = await makeRequest(refreshedTokens);
    } else {
      clearTokens();
      // Trigger auth context refresh to update UI
      triggerAuthRefresh();
    }
  }

  return response;
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem('oauth_tokens');
    triggerAuthRefresh();
  } catch (error) {
    console.warn('Failed to clear tokens:', error);
  }
}

// OAuth2 flow utilities
export function buildAuthorizationUrl(codeChallenge: string, state?: string): string {
  const params = new URLSearchParams({
    client_id: OAUTH_CONFIG.client_id,
    response_type: 'code',
    scope: OAUTH_CONFIG.scope,
    redirect_uri: OAUTH_CONFIG.redirect_uri,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    ...(state && { state }),
  });

  return `${OAUTH_CONFIG.authority}/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string, codeVerifier: string): Promise<AuthTokens> {
  const requestBody = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: OAUTH_CONFIG.client_id,
    code,
    redirect_uri: OAUTH_CONFIG.redirect_uri,
    code_verifier: codeVerifier,
  });

  console.log('[DEBUG TOKEN EXCHANGE] Request details:', {
    url: `${OAUTH_CONFIG.authority}/token`,
    grant_type: 'authorization_code',
    client_id: OAUTH_CONFIG.client_id,
    redirect_uri: OAUTH_CONFIG.redirect_uri,
    code: code.substring(0, 10) + '...', // Log partial code for security
    code_verifier: codeVerifier.substring(0, 10) + '...', // Log partial verifier for security
  });

  const response = await fetch(`${OAUTH_CONFIG.authority}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: requestBody,
  });

  console.log('[DEBUG TOKEN EXCHANGE] Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[DEBUG TOKEN EXCHANGE] Error response:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
    });
    throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
  }

  const tokens = await response.json();
  console.log('[DEBUG TOKEN EXCHANGE] Success:', {
    hasAccessToken: !!tokens.access_token,
    hasRefreshToken: !!tokens.refresh_token,
    hasIdToken: !!tokens.id_token,
    expiresIn: tokens.expires_in,
  });

  if (!tokens.refresh_token) {
    console.warn('⚠️  No refresh_token in response! This means automatic token refresh will not work.');
  }

  return tokens;
}

// Refresh tokens using refresh_token
export async function refreshAccessToken(): Promise<AuthTokens | null> {
  if (typeof window === 'undefined') return null;

  // Get tokens directly from storage, even if expired
  let currentTokens: AuthTokens;
  try {
    const saved = sessionStorage.getItem('oauth_tokens');
    if (!saved) {
      return null;
    }
    currentTokens = JSON.parse(saved);
  } catch (error) {
    console.error('Failed to parse stored tokens:', error);
    return null;
  }

  if (!currentTokens?.refresh_token) {
    return null;
  }

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

      // Only clear tokens if it's a 400 error (invalid refresh token)
      // For other errors (network, 500, etc.), keep the tokens and try again later
      if (response.status === 400 || response.status === 401) {
        clearTokens();
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

    return {
      ...newTokens,
      expires_at: Date.now() + newTokens.expires_in * 1000,
    };
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
}

// PKCE session storage keys
export const PKCE_KEYS = {
  CODE_VERIFIER: 'oauth_code_verifier',
  STATE: 'oauth_state',
} as const;

export function saveCodeVerifier(codeVerifier: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(PKCE_KEYS.CODE_VERIFIER, codeVerifier);
}

export function getCodeVerifier(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(PKCE_KEYS.CODE_VERIFIER);
}

export function clearCodeVerifier(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PKCE_KEYS.CODE_VERIFIER);
}

// Main login function - starts the OAuth flow
export async function startLogin(): Promise<void> {
  try {
    // Save current redirect path
    saveLoginState();

    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Save code verifier for later use
    saveCodeVerifier(codeVerifier);

    // Build authorization URL and redirect
    const authUrl = buildAuthorizationUrl(codeChallenge);

    // Redirect to authorization server
    window.location.href = authUrl;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

// Utility function to restore app state from sessionStorage (for use on any page)
// Note: App state restoration has been removed for reliability. Only redirect path is preserved.
export function tryRestoreAppState(): {
  wasRestored: boolean;
} {
  if (typeof window === 'undefined') {
    return { wasRestored: false };
  }

  // Clean up any legacy state that might exist
  try {
    sessionStorage.removeItem('restore_app_state');
  } catch (error) {
    console.warn('Failed to clean up legacy app state:', error);
  }

  // No app state restoration - return empty state
  return { wasRestored: false };
}

// Handle OAuth callback - to be used in /file-operations
export async function handleOAuthCallback(): Promise<{
  success: boolean;
  redirectPath?: string;
  loginState?: LoginState;
  error?: string;
}> {
  console.log('[DEBUG CALLBACK] Starting OAuth callback handling...');
  
  try {
    // Check if this is an OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    console.log('[DEBUG CALLBACK] URL params:', {
      hasCode: !!code,
      codeLength: code?.length,
      hasError: !!error,
      error,
      errorDescription,
    });

    // Handle OAuth errors
    if (error) {
      throw new Error(errorDescription || error);
    }

    // If no code, this is probably not a callback
    if (!code) {
      console.log('[DEBUG CALLBACK] No authorization code found');
      return { success: false, error: 'No authorization code found' };
    }

    // Get stored code verifier
    const codeVerifier = getCodeVerifier();
    console.log('[DEBUG CALLBACK] Code verifier check:', {
      hasCodeVerifier: !!codeVerifier,
      verifierLength: codeVerifier?.length,
    });
    
    if (!codeVerifier) {
      throw new Error('No code verifier found in session');
    }

    console.log('[DEBUG CALLBACK] Attempting token exchange...');
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, codeVerifier);

    console.log('[DEBUG CALLBACK] Token exchange successful, saving tokens...');
    // Save tokens
    saveTokens(tokens);

    // Get saved login state
    const loginState = restoreLoginState();
    console.log('[DEBUG CALLBACK] Login state restored:', {
      hasLoginState: !!loginState,
      redirectPath: loginState?.redirectPath,
    });

    // Clean up PKCE data
    clearCodeVerifier();

    // Clean URL (remove OAuth params)
    window.history.replaceState({}, document.title, window.location.pathname);

    console.log('[DEBUG CALLBACK] Callback completed successfully');
    return {
      success: true,
      redirectPath: loginState?.redirectPath || '/',
      loginState: loginState || undefined,
    };
  } catch (error) {
    console.error('[DEBUG CALLBACK] OAuth callback handling failed:', error);

    // Clean up on error
    clearCodeVerifier();
    clearTokens();
    sessionStorage.removeItem('post_login_redirect');
    sessionStorage.removeItem('login_app_state');

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}
