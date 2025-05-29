'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';

export default function Home() {
  return (
    <div className='flex flex-col min-h-screen'>
      <Header />

      <main className='flex-1'>
        <Hero />
        <Features />
      </main>

      <Footer />
    </div>
  );
}
