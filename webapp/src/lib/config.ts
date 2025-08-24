// Application Configuration
// This file contains all configuration values for the application

import { getEnv, isDevelopment, isProduction, isTest } from './env-config';

// Environment-specific API configurations
const ENV_CONFIGS = {
  development: {
    apiBaseUrl: 'https://mol-view-stories-dev.dyn.cloud.e-infra.cz',
    name: 'Development',
  },
  production: {
    apiBaseUrl: 'https://stories.molstar.org',
    name: 'Production',
  },
  test: {
    apiBaseUrl: 'http://localhost:8000', // For testing
    name: 'Test',
  },
} as const;

// Get current environment config
const getCurrentEnvConfig = () => {
  if (isDevelopment()) return ENV_CONFIGS.development;
  if (isProduction()) return ENV_CONFIGS.production;
  if (isTest()) return ENV_CONFIGS.test;

  // Fallback to production for unknown environments
  console.warn(`Unknown NODE_ENV: ${getEnv().NODE_ENV}, falling back to production config`);
  return ENV_CONFIGS.production;
};

// OAuth2 Configuration for Life Science AAI
export const OAUTH_CONFIG = {
  authority: getEnv().NEXT_PUBLIC_OIDC_AUTHORITY,
  client_id: getEnv().NEXT_PUBLIC_OIDC_CLIENT_ID,
  scope: 'openid profile email offline_access',
  redirect_uri: '', // Will be set dynamically when needed
} as const;

// API Configuration with environment awareness
export const API_CONFIG = {
  baseUrl: getEnv().NEXT_PUBLIC_API_BASE_URL || getCurrentEnvConfig().apiBaseUrl,
  environment: getCurrentEnvConfig().name,
  isDevelopment: isDevelopment(),
  isProduction: isProduction(),
  isTest: isTest(),
} as const;

// PKCE session storage keys
export const PKCE_KEYS = {
  CODE_VERIFIER: 'oauth_code_verifier',
  STATE: 'oauth_state',
  POPUP_CODE_VERIFIER: 'oauth_popup_code_verifier', // Separate key for popup flow
  POPUP_STATE: 'oauth_popup_state',
} as const;

// Configuration validation helper
export const validateConfig = () => {
  const issues: string[] = [];

  if (!API_CONFIG.baseUrl) {
    issues.push('API base URL is not configured');
  }

  if (!OAUTH_CONFIG.authority) {
    issues.push('OAuth authority is not configured');
  }

  if (!OAUTH_CONFIG.client_id) {
    issues.push('OAuth client ID is not configured');
  }

  if (issues.length > 0) {
    console.error('Configuration validation failed:', issues);
    return false;
  }

  return true;
};

// Log configuration in development
if (isDevelopment()) {
  console.log('🔧 Environment Configuration:', {
    environment: API_CONFIG.environment,
    apiBaseUrl: API_CONFIG.baseUrl,
    oauthAuthority: OAUTH_CONFIG.authority ? '✅ Configured' : '❌ Missing',
    oauthClientId: OAUTH_CONFIG.client_id ? '✅ Configured' : '❌ Missing',
  });
}
