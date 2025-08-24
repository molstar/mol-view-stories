/**
 * @deprecated Use the modular auth system from '@/lib/auth' instead
 * This file is kept for backward compatibility but will be removed in the future.
 *
 * Migration guide:
 * - Import from '@/lib/auth' instead of '@/lib/auth-utils'
 * - All functions are available with the same signatures
 */

// Re-export everything from the new modular auth system
export * from './auth';
