import { PKCE_KEYS } from '../config';

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

// Main flow PKCE storage
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

// Popup flow PKCE storage
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