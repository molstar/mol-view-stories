// Application Configuration
// This file contains all configuration values for the application

// OAuth2 Configuration for Life Science AAI
export const OAUTH_CONFIG = {
  authority: process.env.NEXT_PUBLIC_OIDC_AUTHORITY || '',
  client_id: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID || '',
  scope: 'openid profile email offline_access',
  redirect_uri: '', // Will be set dynamically when needed
} as const;

// API Configuration
// Note: Should point to stories.molstar.org, not mol-view-stories.dyn.cloud.e-infra.cz
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://stories.molstar.org',
} as const;

// PKCE session storage keys
export const PKCE_KEYS = {
  CODE_VERIFIER: 'oauth_code_verifier',
  STATE: 'oauth_state',
  POPUP_CODE_VERIFIER: 'oauth_popup_code_verifier', // Separate key for popup flow
  POPUP_STATE: 'oauth_popup_state',
} as const;
