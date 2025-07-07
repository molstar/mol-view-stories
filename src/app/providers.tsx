'use client';

import { PKCEAuthProvider } from '@/lib/pkce-auth-context';

// Re-export useAuth from our PKCE context for compatibility
export { useAuth } from '@/lib/pkce-auth-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PKCEAuthProvider>
      {children}
    </PKCEAuthProvider>
  );
}
