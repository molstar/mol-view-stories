'use client';

import React from 'react';
import { Header } from '@/components/story-builder/Header';
import { Hero } from '@/components/story-builder/Hero';

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
