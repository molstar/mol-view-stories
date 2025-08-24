/**
 * Auth Page - OAuth Callback Handler
 *
 * This page handles the OAuth2 callback from Life Science AAI.
 * It processes the authorization code, exchanges it for tokens, and provides
 * appropriate feedback based on whether it's running in a popup or regular tab.
 *
 * Features:
 * - User-friendly loading states with timeout handling
 * - Error handling for various OAuth failure scenarios
 * - Automatic token exchange and storage
 * - Message passing to parent window (popup mode)
 * - Clean popup closure after processing (popup mode)
 * - Fallback user experience for non-popup scenarios
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { handleOAuthCallback, handlePopupCallback } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, Home, RefreshCw, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [timeoutReached, setTimeoutReached] = useState(false);

  const processAuth = useCallback(async () => {
    try {
      setStatus('loading');
      setMessage('Processing authentication...');
      setTimeoutReached(false);

      // Check if this is a popup window
      if (window.opener) {
        // Handle popup callback
        handlePopupCallback();
        setStatus('success');
        setMessage('Authentication successful! Closing popup...');
        // Close popup after a short delay
        setTimeout(() => {
          window.close();
        }, 1500);
      } else {
        // Handle redirect callback
        const result = await handleOAuthCallback();

        if (result.success) {
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');

          // Redirect to saved path or home page
          setTimeout(() => {
            router.push(result.redirectPath || '/');
          }, 1500);
        } else {
          setStatus('error');
          setError(result.error || 'Authentication failed');
          setMessage('Authentication failed');
        }
      }
    } catch (err) {
      setStatus('error');
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setMessage('Authentication failed');
    }
  }, [router]);

  useEffect(() => {
    // Check if this is an OAuth callback by looking for code parameter
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    // Set a timeout for the loading state
    const timeout = setTimeout(() => {
      if (status === 'loading') {
        setTimeoutReached(true);
        setMessage('Taking longer than expected...');
      }
    }, 10000); // 10 seconds

    if (error) {
      // Handle OAuth error
      setStatus('error');
      const errorDescription = urlParams.get('error_description') || error;
      setError(errorDescription);
      setMessage('Authentication failed');
    } else if (code) {
      // Process OAuth callback
      processAuth();
    } else {
      setTimeout(() => {
        router.push('/');
      }, 10);
    }

    return () => clearTimeout(timeout);
  }, [router, status, processAuth]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className='h-8 w-8 animate-spin text-blue-500' />;
      case 'success':
        return <CheckCircle className='h-8 w-8 text-green-500' />;
      case 'error':
        return <XCircle className='h-8 w-8 text-red-500' />;
    }
  };

  const handleRetry = () => {
    // Redirect to home page where user can initiate login again
    router.push('/');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'>
      <Card className='w-full max-w-md shadow-lg'>
        <CardHeader className='text-center pb-4'>
          <div className='flex justify-center mb-4'>{getStatusIcon()}</div>
          <CardTitle className='text-xl font-semibold'>
            {status === 'loading' && 'Authenticating...'}
            {status === 'success' && 'Authentication Successful'}
            {status === 'error' && 'Authentication Failed'}
          </CardTitle>
        </CardHeader>

        <CardContent className='space-y-4'>
          <p className='text-center text-gray-600'>{message}</p>

          {timeoutReached && status === 'loading' && (
            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
              <div className='flex items-center gap-2'>
                <AlertCircle className='h-4 w-4 text-yellow-600' />
                <span className='text-sm text-yellow-800'>
                  This is taking longer than usual. Please wait or try again.
                </span>
              </div>
            </div>
          )}

          {status === 'error' && error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
              <div className='flex items-start gap-2'>
                <AlertCircle className='h-4 w-4 text-red-600 mt-0.5' />
                <span className='text-sm text-red-800'>{error}</span>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className='flex gap-2'>
              <Button onClick={handleRetry} className='flex-1' variant='outline'>
                <RefreshCw className='h-4 w-4 mr-2' />
                Try Again
              </Button>
              <Button onClick={handleGoHome} className='flex-1'>
                <Home className='h-4 w-4 mr-2' />
                Go Home
              </Button>
            </div>
          )}

          {status === 'success' && !window.opener && (
            <div className='text-center'>
              <p className='text-sm text-gray-500 mb-2'>You will be redirected automatically...</p>
              <Button onClick={handleGoHome} variant='outline' size='sm'>
                <Home className='h-4 w-4 mr-2' />
                Go Home Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
