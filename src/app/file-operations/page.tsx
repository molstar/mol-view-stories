'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { handleOAuthCallback } from '@/lib/auth-utils';
import { triggerAuthRefresh } from '@/lib/pkce-auth-context';

export default function FileOperationsPage() {
  const [isHandlingCallback, setIsHandlingCallback] = useState(false);
  const [callbackError, setCallbackError] = useState<string | null>(null);

  // Handle OAuth callback on mount
  useEffect(() => {
    const processCallback = async () => {
      // Check if this looks like an OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      const hasCode = urlParams.has('code');
      const hasError = urlParams.has('error');

      if (!hasCode && !hasError) {
        // Not a callback, redirect to home
        window.location.replace('/');
        return;
      }

      setIsHandlingCallback(true);

      try {
        const result = await handleOAuthCallback();

        if (result.success) {
          // Save the state for restoration on target page
          if (result.loginState) {
            sessionStorage.setItem('restore_app_state', JSON.stringify(result.loginState));
          }

          // Trigger auth context refresh with new tokens
          triggerAuthRefresh();

          // Redirect immediately to target page
          const redirectPath = result.redirectPath || '/';
          window.location.replace(redirectPath);
        } else {
          setCallbackError(result.error || 'Authentication failed');
          setIsHandlingCallback(false);
        }
      } catch (error) {
        console.error('Callback processing failed:', error);
        setCallbackError(error instanceof Error ? error.message : 'Authentication failed');
        setIsHandlingCallback(false);
      }
    };

    processCallback();
  }, []);

  // Show callback processing state
  if (isHandlingCallback) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='max-w-md w-full space-y-8 p-8 text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
          <h2 className='text-2xl font-bold text-gray-900'>Processing Login...</h2>
          <p className='text-gray-600'>Completing authentication and restoring your session.</p>
        </div>
      </div>
    );
  }

  // Show callback error
  if (callbackError) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='max-w-md w-full space-y-8 p-8 text-center'>
          <div className='rounded-full h-8 w-8 bg-red-100 flex items-center justify-center mx-auto'>
            <svg className='h-5 w-5 text-red-600' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                clipRule='evenodd'
              />
            </svg>
          </div>
          <h2 className='text-2xl font-bold text-gray-900'>Authentication Error</h2>
          <p className='text-red-600'>{callbackError}</p>
          <Link href='/' className='inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'>
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // Fallback - should not reach here in normal flow
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='max-w-md w-full space-y-8 p-8 text-center'>
        <h2 className='text-2xl font-bold text-gray-900'>Redirecting...</h2>
        <p className='text-gray-600'>Taking you back to the application.</p>
        <Link href='/' className='inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'>
          Continue to Home
        </Link>
      </div>
    </div>
  );
}
