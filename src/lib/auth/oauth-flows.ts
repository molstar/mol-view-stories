import { OAUTH_CONFIG } from '../config';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  saveCodeVerifier,
  getCodeVerifier,
  clearCodeVerifier,
  savePopupCodeVerifier,
  getPopupCodeVerifier,
  clearPopupCodeVerifier,
} from './pkce-utils';
import { saveTokens, clearTokens, type AuthTokens } from './token-manager';

// Helper function to get the redirect URI dynamically
function getRedirectUri(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/${process.env.NEXT_PUBLIC_APP_PREFIX || ''}auth`;
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

// OAuth2 flow utilities
export function buildAuthorizationUrl(codeChallenge: string, state?: string): string {
  const params = new URLSearchParams({
    client_id: OAUTH_CONFIG.client_id,
    response_type: 'code',
    scope: OAUTH_CONFIG.scope,
    redirect_uri: getRedirectUri(),
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
    redirect_uri: getRedirectUri(),
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

// Handle OAuth callback - to be used in /auth (redirect-based)
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
      const authUrl = buildAuthorizationUrl(codeChallenge, state);

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
            error: 'POPUP_BLOCKED',
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
            const tokens = await exchangeCodeForTokens(code, storedCodeVerifier);

            // Save tokens
            saveTokens(tokens);

            // Clean up PKCE data
            clearPopupCodeVerifier();

            resolve({ success: true });
          } catch (error) {
            clearPopupCodeVerifier();
            resolve({
              success: false,
              error: error instanceof Error ? error.message : 'Token exchange failed',
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
        error: error instanceof Error ? error.message : 'Authentication failed',
      });
    }
  });
}

// Handle OAuth callback for popup flow - to be used in /auth when window.opener exists
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
        window.opener.postMessage(
          {
            type: 'OAUTH_RESULT',
            success: false,
            error: errorDescription || error,
          },
          window.location.origin
        );
      } else if (code) {
        window.opener.postMessage(
          {
            type: 'OAUTH_RESULT',
            success: true,
            code,
            state,
          },
          window.location.origin
        );
      } else {
        window.opener.postMessage(
          {
            type: 'OAUTH_RESULT',
            success: false,
            error: 'No authorization code received',
          },
          window.location.origin
        );
      }
    }

    // Close popup
    window.close();
  } catch (error) {
    console.error('Popup callback handling failed:', error);

    // Send error to parent
    if (window.opener) {
      window.opener.postMessage(
        {
          type: 'OAUTH_RESULT',
          success: false,
          error: error instanceof Error ? error.message : 'Callback handling failed',
        },
        window.location.origin
      );
    }

    window.close();
  }
}
