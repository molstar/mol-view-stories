'use client';

import { Header, Main } from '@/components/common';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface LoadingScreenProps {
  isRedirectingToBuilder?: boolean;
  isProcessingCallback?: boolean;
  hasOAuthCode?: boolean;
}

export function LoadingScreen({ isRedirectingToBuilder, isProcessingCallback, hasOAuthCode }: LoadingScreenProps) {
  return (
    <div className='flex flex-col h-screen'>
      <Header>My Stories</Header>
      <Main>
        <div className='flex items-center justify-center h-full'>
          <div className='text-center'>
            <div className='text-lg text-muted-foreground'>
              {isRedirectingToBuilder ? 'Redirecting to builder...' : 
               isProcessingCallback || hasOAuthCode ? 'Completing login...' : 'Loading...'}
            </div>
          </div>
        </div>
      </Main>
    </div>
  );
}

export function AuthRequiredScreen() {
  return (
    <div className='flex flex-col h-screen'>
      <Header>My Stories</Header>
      <Main>
        <div className='container max-w-lg mx-auto py-6'>
          <Card className='w-full max-w-sm mx-auto'>
            <CardHeader className='text-center pb-3'>
              <CardTitle className='text-xl'>Authentication Required</CardTitle>
              <CardDescription className='text-base'>Please log in to view your stories and sessions</CardDescription>
            </CardHeader>
            <CardContent className='text-center pt-0'>
              <p className='text-sm text-muted-foreground'>
                Use the login button in the top navigation to log in with Life Science AAI.
              </p>
            </CardContent>
          </Card>
        </div>
      </Main>
    </div>
  );
} 