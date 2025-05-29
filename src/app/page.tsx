'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Hero } from '@/components/landing/Hero';

export default function Home() {
  return (
    <div className='flex flex-col min-h-screen'>
      <Header />
      <main className='flex-1'>
        <Hero />
      </main>
    </div>
  );
}
