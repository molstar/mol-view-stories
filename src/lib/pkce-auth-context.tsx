'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getValidTokens, clearTokens, startLogin, type AuthTokens } from './auth-utils';

// User profile type (extracted from id_token)
export interface UserProfile {
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  email_verified?: boolean;
}

// JWT payload interface
interface JWTPayload {
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  email_verified?: boolean;
  exp?: number;
  iat?: number;
  aud?: string | string[];
  iss?: string;
  [key: string]: unknown;
}

// Auth state interface 
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { 
    profile: UserProfile;
    access_token: string;
    id_token?: string;
  } | null;
  error: string | null;
}

// Auth context interface
export interface AuthContextType extends AuthState {
  // Methods
  removeUser: () => void;
  refreshAuth: () => Promise<void>;
  signinRedirect: () => Promise<void>;
}

const PKCEAuthContext = createContext<AuthContextType | null>(null);

// Main hook to use PKCE auth
export function useAuth(): AuthContextType {
  const context = useContext(PKCEAuthContext);
  if (!context) {
    throw new Error('useAuth must be used within PKCEAuthProvider');
  }
  return context;
}

// Decode JWT payload to extract user profile
function decodeJWTPayload(token: string): JWTPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

// Convert tokens to user object
function tokensToUser(tokens: AuthTokens): AuthState['user'] | null {
  if (!tokens.id_token) {
    console.warn('No id_token available for user profile');
    return null;
  }
  
  const payload = decodeJWTPayload(tokens.id_token);
  if (!payload) {
    return null;
  }
  
  return {
    profile: {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      preferred_username: payload.preferred_username,
      given_name: payload.given_name,
      family_name: payload.family_name,
      email_verified: payload.email_verified,
    },
    access_token: tokens.access_token,
    id_token: tokens.id_token,
  };
}

export function PKCEAuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
  });

  // Initialize auth state from stored tokens with automatic refresh
  const initializeAuth = useCallback(async () => {
    try {
      const tokens = await getValidTokens();
      
      if (tokens) {
        const user = tokensToUser(tokens);
        if (user) {
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user,
            error: null,
          });
          return;
        }
      }
      
      // No valid tokens
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      });
    } catch (error) {
      console.error('Auth initialization failed:', error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: error instanceof Error ? error.message : 'Authentication failed',
      });
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    // Initialize immediately - no delay needed
    initializeAuth();
  }, [initializeAuth]);

  // Remove user (logout)
  const removeUser = useCallback(() => {
    clearTokens();
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
    });
  }, []);

  // Refresh authentication state (check for new tokens)
  const refreshAuth = useCallback(async () => {
    await initializeAuth();
  }, [initializeAuth]);

  // Listen for storage events (token updates from other tabs)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'oauth_tokens') {
        initializeAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [initializeAuth]);

  // Custom event listener for when tokens are updated in same tab
  useEffect(() => {
    const handleTokenUpdate = () => {
      initializeAuth();
    };

    window.addEventListener('tokens-updated', handleTokenUpdate);
    return () => window.removeEventListener('tokens-updated', handleTokenUpdate);
  }, [initializeAuth]);

  // Periodic token refresh check
  useEffect(() => {
    // Always run the check, even when not authenticated 
    // (in case we have tokens but user appears logged out due to error)
    const checkTokenExpiry = async () => {
      try {
        // Check if we have any tokens in storage
        const saved = sessionStorage.getItem('oauth_tokens');
        if (!saved) return;
        
        const tokens = JSON.parse(saved);
        const now = Date.now();
        
        // Check if tokens will expire in the next 15 minutes
        const fifteenMinutesFromNow = now + (15 * 60 * 1000);
        if (tokens.refresh_token && fifteenMinutesFromNow >= tokens.expires_at) {
          // Use getValidTokens which handles the refresh logic
          const validTokens = await getValidTokens();
          if (validTokens) {
            // Update auth state if needed
            if (!authState.isAuthenticated) {
              await initializeAuth();
            }
          } else {
            // If we were authenticated but refresh failed, update state
            if (authState.isAuthenticated) {
              setAuthState({
                isAuthenticated: false,
                isLoading: false,
                user: null,
                error: 'Session expired',
              });
            }
          }
        }
        
        // Additional check: if tokens are already expired but we're still marked as authenticated
        if (now >= tokens.expires_at && authState.isAuthenticated) {
          const validTokens = await getValidTokens();
          if (!validTokens) {
            setAuthState({
              isAuthenticated: false,
              isLoading: false,
              user: null,
              error: 'Session expired',
            });
          }
        }
        
      } catch (error) {
        console.error('Periodic check error:', error);
      }
    };

    // Check every 30 seconds for more frequent monitoring
    const interval = setInterval(checkTokenExpiry, 30 * 1000);
    
    // Also run immediately
    checkTokenExpiry();
    
    return () => clearInterval(interval);
  }, [authState.isAuthenticated, initializeAuth]);

  // Start login flow
  const signinRedirect = useCallback(async () => {
    await startLogin();
  }, []);

  const contextValue: AuthContextType = {
    ...authState,
    removeUser,
    refreshAuth,
    signinRedirect,
  };

  return (
    <PKCEAuthContext.Provider value={contextValue}>
      {children}
    </PKCEAuthContext.Provider>
  );
}

// Helper function to trigger auth refresh after login
export function triggerAuthRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tokens-updated'));
  }
} 