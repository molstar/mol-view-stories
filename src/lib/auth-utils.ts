import { Story, CurrentView } from '@/app/state/types';

// Life Science AAI OAuth2 endpoints
export const OAUTH_CONFIG = {
  authority: process.env.NEXT_PUBLIC_OIDC_AUTHORITY || '',
  client_id: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID || '',
  scope: 'openid profile email',
  redirect_uri: typeof window !== 'undefined' ? `${window.location.origin}/file-operations` : '',
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

// Enhanced login state preservation
export interface LoginState {
  redirectPath: string;
  story?: Story;
  currentView?: CurrentView;
  timestamp: number;
}

export function saveLoginState(story?: Story, currentView?: CurrentView): void {
  if (typeof window === 'undefined') return;
  
  // Get current path including search params
  const redirectPath = window.location.pathname + window.location.search;
  
  const loginState: LoginState = {
    redirectPath,
    story,
    currentView,
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
    expires_at: Date.now() + (tokens.expires_in * 1000),
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

export function getTokens(): AuthTokens | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = sessionStorage.getItem('oauth_tokens');
    if (!saved) return null;
    
    const tokens: AuthTokens = JSON.parse(saved);
    
    // Check if tokens are expired
    if (Date.now() >= tokens.expires_at) {
      clearTokens();
      return null;
    }
    
    return tokens;
  } catch (error) {
    console.warn('Failed to get tokens:', error);
    return null;
  }
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

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<AuthTokens> {
  const response = await fetch(`${OAUTH_CONFIG.authority}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: OAUTH_CONFIG.client_id,
      code,
      redirect_uri: OAUTH_CONFIG.redirect_uri,
      code_verifier: codeVerifier,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
  }
  
  const tokens = await response.json();
  return tokens;
}

// Refresh tokens using refresh_token
export async function refreshAccessToken(): Promise<AuthTokens | null> {
  const currentTokens = getTokens();
  
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
      clearTokens();
      return null;
    }
    
    const newTokens = await response.json();
    
    // Preserve refresh token if not returned
    if (!newTokens.refresh_token && currentTokens.refresh_token) {
      newTokens.refresh_token = currentTokens.refresh_token;
    }
    
    saveTokens(newTokens);
    return newTokens;
    
  } catch (error) {
    console.error('Token refresh error:', error);
    clearTokens();
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
export async function startLogin(story?: Story, currentView?: CurrentView): Promise<void> {
  try {
    // Save current state
    saveLoginState(story, currentView);
    
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
export function tryRestoreAppState(): {
  story?: Story;
  currentView?: CurrentView;
  wasRestored: boolean;
} {
  if (typeof window === 'undefined') {
    return { wasRestored: false };
  }
  
  try {
    const savedStateJson = sessionStorage.getItem('restore_app_state');
    if (!savedStateJson) {
      return { wasRestored: false };
    }
    
    const savedState: LoginState = JSON.parse(savedStateJson);
    
    // Clean up immediately
    sessionStorage.removeItem('restore_app_state');
    
    return {
      story: savedState.story,
      currentView: savedState.currentView,
      wasRestored: true,
    };
  } catch (error) {
    console.error('Failed to restore app state:', error);
    sessionStorage.removeItem('restore_app_state');
    return { wasRestored: false };
  }
}

// Handle OAuth callback - to be used in /file-operations
export async function handleOAuthCallback(): Promise<{
  success: boolean;
  redirectPath?: string;
  loginState?: LoginState;
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
    if (!codeVerifier) {
      throw new Error('No code verifier found in session');
    }
    
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, codeVerifier);
    
    // Save tokens
    saveTokens(tokens);
    
    // Get saved login state
    const loginState = restoreLoginState();
    
    // Clean up PKCE data
    clearCodeVerifier();
    
    // Clean URL (remove OAuth params)
    window.history.replaceState({}, document.title, window.location.pathname);
    
    return {
      success: true,
      redirectPath: loginState?.redirectPath || '/',
      loginState: loginState || undefined,
    };
    
  } catch (error) {
    console.error('OAuth callback handling failed:', error);
    
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