'use client';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Controls } from '@/components/story-builder/Controls';
import dynamic from 'next/dynamic';

const StoryBuilderRoot = dynamic(() => import('@/components/story-builder'), { ssr: false });

export default function StoryBuilder() {
  return (
    <div className='flex flex-col min-h-screen'>
      <Header />
      <main className='flex-1 flex flex-col gap-6 lg:gap-8 px-4 py-6 md:px-8 md:py-8 max-w-[1600px] mx-auto w-full h-full'>
        <Controls />
        <div className='flex gap-6 lg:gap-8 flex-1 h-full min-h-0'>
          <StoryBuilderRoot />
        </div>
      </main>
      <Footer />
    </div>
  );
}
