'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import 'molstar/build/viewer/molstar.css';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <title>Mol View Stories</title>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
