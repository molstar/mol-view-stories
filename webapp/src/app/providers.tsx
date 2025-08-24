'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { PKCEAuthProvider } from '@/lib/pkce-auth-context';

// Re-export useAuth from our PKCE context for compatibility
export { useAuth } from '@/lib/pkce-auth-context';

export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient instance with sensible defaults
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Consider data fresh for 2 minutes to reduce unnecessary refetches
            staleTime: 2 * 60 * 1000,
            // Keep data in cache for 5 minutes after components unmount
            gcTime: 5 * 60 * 1000,
            // Retry failed requests 3 times with exponential backoff
            retry: 3,
            // Refetch on window focus to keep data up-to-date
            refetchOnWindowFocus: true,
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <PKCEAuthProvider>
        {children}
        {/* Show React Query devtools in development */}
        <ReactQueryDevtools initialIsOpen={false} />
      </PKCEAuthProvider>
    </QueryClientProvider>
  );
}
