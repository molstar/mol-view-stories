'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/common';
import { ExampleStoryList } from './examples/list';

export default function Home() {
  return (
    <div className='flex flex-col min-h-screen'>
      <main className='flex-1'>
        <Header />
        <section className='py-20 px-4 md:px-8 bg-gradient-to-br from-background to-muted/20'>
          <div className='max-w-4xl mx-auto text-center'>
            <h1 className='text-5xl md:text-6xl font-bold text-foreground mb-6'>
              Create Interactive
              <span className='text-primary'> Molecular Stories</span>
            </h1>

            <p className='text-xl text-muted-foreground mb-8 max-w-2xl mx-auto'>
              Build engaging, interactive molecular visualizations with code. Combine MolStar&apos;s powerful 3D
              rendering with custom scripts to tell your scientific story.
            </p>

            <div className='flex flex-col sm:flex-row gap-4 justify-center items-center mb-8'>
              <Link
                // NOTE: this (and other links) will not work in the deployed version as it will be hosted on molstar.org/mol-view-stories/...
                //       need to set this up with base prefix
                href='/story-builder?story=Empty'
                className='bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors'
              >
                Start Building
              </Link>
            </div>
          </div>

          <div className='max-w-4xl mx-auto text-center'>
            <h2 className='text-3xl md:text-3xl font-bold text-foreground mb-6'>Examples</h2>
          </div>
          <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
            {ExampleStoryList.map((example) => (
              <Link
                key={example.key}
                className='border border-border px-8 py-3 rounded-lg font-semibold text-foreground hover:bg-muted/50 transition-colors'
                href={`/story-builder?story=${example.key}`}
              >
                {example.name}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
