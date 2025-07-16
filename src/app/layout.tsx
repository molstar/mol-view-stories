'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import 'molstar/build/viewer/molstar.css';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Disable Redux DevTools extension to avoid Invalid frameId for foreground error
    if (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
      (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ = undefined;
      (window as any).__REDUX_DEVTOOLS_EXTENSION__ = undefined;
    }
  }, []);

  return (
    <html lang='en'>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
