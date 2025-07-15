// Life Science AAI OAuth2 endpoints
export const OAUTH_CONFIG = {
  authority: process.env.NEXT_PUBLIC_OIDC_AUTHORITY || '',
  client_id: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID || '',
  scope: 'openid profile email offline_access',
  redirect_uri: '', // Will be set dynamically when needed
} as const;

// Helper function to get the redirect URI dynamically
function getRedirectUri(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/my-stories`;
}

// Helper function to get popup redirect URI (use same as regular to match OAuth config)
function getPopupRedirectUri(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/my-stories`;
}

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

// Simple redirect path preservation for OAuth flow
export function saveRedirectPath(): void {
  if (typeof window === 'undefined') return;

  // Get current path including search params
  const redirectPath = window.location.pathname + window.location.search;

  try {
    sessionStorage.setItem('post_login_redirect', redirectPath);
  } catch (error) {
    console.warn('Failed to save redirect path:', error);
  }
}

export function getAndClearRedirectPath(): string {
  if (typeof window === 'undefined') return '/';

  try {
    const redirectPath = sessionStorage.getItem('post_login_redirect');
    
    // Clean up after retrieval
    sessionStorage.removeItem('post_login_redirect');
    
    return redirectPath || '/';
  } catch (error) {
    console.warn('Failed to get redirect path:', error);
    return '/';
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
export function buildAuthorizationUrl(codeChallenge: string, state?: string, usePopup = false): string {
  const params = new URLSearchParams({
    client_id: OAUTH_CONFIG.client_id,
    response_type: 'code',
    scope: OAUTH_CONFIG.scope,
    redirect_uri: usePopup ? getPopupRedirectUri() : getRedirectUri(),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    ...(state && { state }),
  });

  return `${OAUTH_CONFIG.authority}/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string, codeVerifier: string, usePopup = false): Promise<AuthTokens> {
  const requestBody = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: OAUTH_CONFIG.client_id,
    code,
    redirect_uri: usePopup ? getPopupRedirectUri() : getRedirectUri(),
    code_verifier: codeVerifier,
  });

  const response = await fetch(`${OAUTH_CONFIG.authority}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: requestBody,
  });


  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
  }

  const tokens = await response.json();

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
  POPUP_CODE_VERIFIER: 'oauth_popup_code_verifier', // Separate key for popup flow
  POPUP_STATE: 'oauth_popup_state',
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

export function savePopupCodeVerifier(codeVerifier: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(PKCE_KEYS.POPUP_CODE_VERIFIER, codeVerifier);
}

export function getPopupCodeVerifier(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(PKCE_KEYS.POPUP_CODE_VERIFIER);
}

export function clearPopupCodeVerifier(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PKCE_KEYS.POPUP_CODE_VERIFIER);
}

// Popup-based authentication flow
export async function startPopupLogin(): Promise<{
  success: boolean;
  error?: string;
}> {
  return new Promise(async (resolve) => {
    try {
      // Generate PKCE parameters
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = generateCodeVerifier(); // Use as random state

      // Save code verifier for later use
      savePopupCodeVerifier(codeVerifier);
      
      // Build authorization URL for popup
      const authUrl = buildAuthorizationUrl(codeChallenge, state, true);

      // Open popup window
      const popup = window.open(
        authUrl,
        'oauth-popup',
        'width=500,height=700,scrollbars=yes,resizable=yes,centerscreen=yes'
      );

      if (!popup || popup.closed) {
        throw new Error('POPUP_BLOCKED');
      }

      // Additional check for popup blocking after a short delay
      setTimeout(() => {
        if (popup.closed) {
          window.removeEventListener('message', messageHandler);
          clearPopupCodeVerifier();
          resolve({ 
            success: false, 
            error: 'POPUP_BLOCKED'
          });
        }
      }, 100);

      // Listen for messages from popup
      const messageHandler = async (event: MessageEvent) => {
        // Verify origin for security
        if (event.origin !== window.location.origin) {
          return;
        }

        const { type, success, code, error, state: returnedState } = event.data;

        if (type === 'OAUTH_RESULT') {
          // Clean up
          window.removeEventListener('message', messageHandler);
          
          if (!success) {
            clearPopupCodeVerifier();
            resolve({ success: false, error: error || 'Authentication failed' });
            return;
          }

          try {
            // Verify state matches (basic CSRF protection)
            if (returnedState !== state) {
              throw new Error('Invalid state parameter');
            }

            // Get stored code verifier
            const storedCodeVerifier = getPopupCodeVerifier();
            if (!storedCodeVerifier) {
              throw new Error('No code verifier found in session');
            }

            // Exchange code for tokens
            const tokens = await exchangeCodeForTokens(code, storedCodeVerifier, true);

            // Save tokens
            saveTokens(tokens);

            // Clean up PKCE data
            clearPopupCodeVerifier();

            resolve({ success: true });
          } catch (error) {
            clearPopupCodeVerifier();
            resolve({
              success: false,
              error: error instanceof Error ? error.message : 'Token exchange failed'
            });
          }
        }
      };

      // Handle popup being closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          clearPopupCodeVerifier();
          resolve({ success: false, error: 'Authentication was cancelled' });
        }
      }, 1000);

      window.addEventListener('message', messageHandler);

    } catch (error) {
      clearPopupCodeVerifier();
      resolve({
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      });
    }
  });
}

// Main login function - starts the OAuth flow (redirect-based)
export async function startLogin(): Promise<void> {
  try {
    // Save current redirect path
    saveRedirectPath();

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

// Handle OAuth callback for popup flow - to be used in /my-stories when window.opener exists
export function handlePopupCallback(): void {
  try {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    const state = urlParams.get('state');

    // Send result to parent window
    if (window.opener) {
      if (error) {
        window.opener.postMessage({
          type: 'OAUTH_RESULT',
          success: false,
          error: errorDescription || error
        }, window.location.origin);
      } else if (code) {
        window.opener.postMessage({
          type: 'OAUTH_RESULT',
          success: true,
          code,
          state
        }, window.location.origin);
      } else {
        window.opener.postMessage({
          type: 'OAUTH_RESULT',
          success: false,
          error: 'No authorization code received'
        }, window.location.origin);
      }
    }

    // Close popup
    window.close();
  } catch (error) {
    console.error('Popup callback handling failed:', error);
    
    // Send error to parent
    if (window.opener) {
      window.opener.postMessage({
        type: 'OAUTH_RESULT',
        success: false,
        error: error instanceof Error ? error.message : 'Callback handling failed'
      }, window.location.origin);
    }
    
    window.close();
  }
}

// Handle OAuth callback - to be used in /my-stories (redirect-based)
export async function handleOAuthCallback(): Promise<{
  success: boolean;
  redirectPath?: string;
  error?: string;
}> {
  
  try {
    // Check if this is an OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      throw new Error(errorDescription || error);
    }

    // If no code, this is probably not a callback
    if (!code) {
      return { success: false, error: 'No authorization code found' };
    }

    // Get stored code verifier
    const codeVerifier = getCodeVerifier();
;
    
    if (!codeVerifier) {
      throw new Error('No code verifier found in session');
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, codeVerifier);

    // Save tokens
    saveTokens(tokens);

    // Get saved redirect path
    const redirectPath = getAndClearRedirectPath();

    // Clean up PKCE data
    clearCodeVerifier();

    // Clean URL (remove OAuth params)
    window.history.replaceState({}, document.title, window.location.pathname);

    return {
      success: true,
      redirectPath: redirectPath,
    };
  } catch (error) {

    // Clean up on error
    clearCodeVerifier();
    clearTokens();
    sessionStorage.removeItem('post_login_redirect');

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}
