/**
 * Environment Configuration Utility
 * Uses Next.js compile-time inlining for NEXT_PUBLIC_* variables on the client.
 * Avoids accessing process.env dynamically in the browser to prevent `undefined`.
 */

// Environment variable schema
interface EnvSchema {
  // API Configuration
  NEXT_PUBLIC_API_BASE_URL?: string;

  // OAuth Configuration
  NEXT_PUBLIC_OIDC_AUTHORITY?: string;
  NEXT_PUBLIC_OIDC_CLIENT_ID?: string;

  // Environment
  NODE_ENV: 'development' | 'production' | 'test';
}

// Capture env at module init so Next can inline on the client
const ENV: EnvSchema = {
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_OIDC_AUTHORITY: process.env.NEXT_PUBLIC_OIDC_AUTHORITY,
  NEXT_PUBLIC_OIDC_CLIENT_ID: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID,
  NODE_ENV: (process.env.NODE_ENV as EnvSchema['NODE_ENV']) || 'development',
};

// Validate only on the server (build/dev process). On the client these are inlined.
function validateOnServer(): void {
  const runningOnServer = typeof window === 'undefined';
  if (!runningOnServer) return;

  if (!['development', 'production', 'test'].includes(ENV.NODE_ENV)) {
    throw new Error(`Invalid NODE_ENV: ${ENV.NODE_ENV}. Must be one of: development, production, test`);
  }

  if (!ENV.NEXT_PUBLIC_OIDC_AUTHORITY) {
    throw new Error('NEXT_PUBLIC_OIDC_AUTHORITY is required');
  }

  if (!ENV.NEXT_PUBLIC_OIDC_CLIENT_ID) {
    throw new Error('NEXT_PUBLIC_OIDC_CLIENT_ID is required');
  }
}

// Run server-side validation at import time
try {
  validateOnServer();
} catch (error) {
  // Ensure a helpful message in server logs without crashing the client bundle
  // The server should still throw to surface misconfiguration early
  console.error('Environment validation failed:', error);
  throw error;
}

// Get environment (already captured)
export const getEnv = (): EnvSchema => ENV;

// Environment-specific helpers
export const isDevelopment = () => ENV.NODE_ENV === 'development';
export const isProduction = () => ENV.NODE_ENV === 'production';
export const isTest = () => ENV.NODE_ENV === 'test';

// Safe environment variable access
export const getEnvVar = (key: keyof EnvSchema): string | undefined => ENV[key];

// Environment info for debugging
export const getEnvironmentInfo = () => {
  return {
    nodeEnv: ENV.NODE_ENV,
    apiBaseUrl: ENV.NEXT_PUBLIC_API_BASE_URL || 'Using default for environment',
    oauthAuthority: ENV.NEXT_PUBLIC_OIDC_AUTHORITY ? '✅ Configured' : '❌ Missing',
    oauthClientId: ENV.NEXT_PUBLIC_OIDC_CLIENT_ID ? '✅ Configured' : '❌ Missing',
  };
};
