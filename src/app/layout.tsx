"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import 'molstar/build/viewer/molstar.css';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
