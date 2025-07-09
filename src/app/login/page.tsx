'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { useAuth } from '../providers';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to file operations
    if (auth.isAuthenticated) {
      router.push('/file-operations');
    }
  }, [auth, router]);

  const handleLogin = async () => {
    try {
      await auth.signinRedirect();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (auth.isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p>Loading...</p>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold text-red-600'>Authentication Error</h2>
          <p className='text-gray-600'>{auth.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <Card className='w-96 p-6 space-y-4'>
        <h1 className='text-2xl font-bold text-center'>Login</h1>
        <p className='text-center text-gray-600'>
          Sign in using Life Science AAI to access publishing in MolViewStories
        </p>
        <div className='flex flex-col gap-4'>
          <Button onClick={handleLogin} className='w-full' disabled={auth.isLoading}>
            {auth.isLoading ? 'Loading...' : 'Sign in with Life Science AAI'}
          </Button>
          <div className='text-sm text-gray-500 text-center'>
            Client ID: {process.env.NEXT_PUBLIC_OIDC_CLIENT_ID ? '✓ Set' : '✗ Missing'}
          </div>
          <Link href='/file-operations' className='text-center text-sm text-blue-600 hover:underline'>
            Go to File Operations
          </Link>
        </div>
      </Card>
    </div>
  );
}
