// Re-export all auth utilities from modular structure
export * from './pkce-utils';
export * from './token-manager';
export * from './oauth-flows';

// Debug utilities for development
export function debugTokenState(): void {
  if (typeof window === 'undefined') {
    console.log('🔍 Token debug: Not in browser environment');
    return;
  }

  try {
    const saved = sessionStorage.getItem('oauth_tokens');
    if (!saved) {
      console.log('🔍 Token debug: No tokens in storage');
      return;
    }

    const tokens = JSON.parse(saved);
    const now = Date.now();
    const expiresAt = new Date(tokens.expires_at);
    const timeUntilExpiry = tokens.expires_at - now;
    const minutesUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60));

    console.log('🔍 Token debug:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresAt: expiresAt.toISOString(),
      minutesUntilExpiry,
      isExpired: now >= tokens.expires_at,
    });
  } catch (error) {
    console.error('🔍 Token debug error:', error);
  }
}

// Utility to manually trigger token refresh (for testing)
export async function manualTokenRefresh(): Promise<boolean> {
  console.log('🔧 Manual token refresh triggered');
  const { refreshAccessToken } = await import('./token-manager');
  const result = await refreshAccessToken();
  return !!result;
}

// Expose debugging utilities to global window object for easy testing
if (typeof window !== 'undefined') {
  (
    window as unknown as { authDebug: { debugTokenState: () => void; manualTokenRefresh: () => Promise<boolean> } }
  ).authDebug = {
    debugTokenState,
    manualTokenRefresh,
  };
  console.log('🔧 Auth debugging utilities available at window.authDebug');
}
