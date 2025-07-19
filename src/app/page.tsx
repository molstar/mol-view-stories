'use client';

import React from 'react';
import Link from 'next/link';
import { Header, Main } from '@/components/common';
import { ExampleStoryList } from './examples/list';
import { useAuth } from './providers';
import { User, Lock } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

function Features() {
  const features = [
    {
      title: 'Visual Scene Builder',
      description:
        'Create molecular scenes with an intuitive interface. Add structures, adjust views, and build your narrative step by step.',
      icon: (
        <svg className='w-8 h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
          />
        </svg>
      ),
    },
    {
      title: 'Code-Driven Visualizations',
      description:
        "Write JavaScript code to control molecular representations, animations, and interactions. Full access to MolStar's API.",
      icon: (
        <svg className='w-8 h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'
          />
        </svg>
      ),
    },
    {
      title: 'Interactive Stories',
      description:
        'Build multi-scene stories that guide viewers through complex molecular concepts with smooth transitions.',
      icon: (
        <svg className='w-8 h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
          />
        </svg>
      ),
    },
    {
      title: 'Real-time Preview',
      description:
        'See your changes instantly with live molecular rendering. Test interactions and refine your story as you build.',
      icon: (
        <svg className='w-8 h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
          />
        </svg>
      ),
    },
    {
      title: 'Export & Share',
      description:
        'Export your stories as self-contained files or share them directly. Perfect for presentations and educational content.',
      icon: (
        <svg className='w-8 h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z'
          />
        </svg>
      ),
    },
    {
      title: 'Powerful 3D Engine',
      description:
        "Built on MolStar's industry-leading molecular visualization engine. High-performance rendering for complex structures.",
      icon: (
        <svg className='w-8 h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
        </svg>
      ),
    },
  ];

  return (
    <section className='py-10 px-4 md:px-8 bg-background'>
      <div className='max-w-6xl mx-auto'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {features.map((feature, index) => (
            <div key={index} className='p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow'>
              <div className='text-primary mb-4'>{feature.icon}</div>
              <h3 className='text-xl font-semibold text-foreground mb-3'>{feature.title}</h3>
              <p className='text-muted-foreground leading-relaxed'>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const auth = useAuth();

  return (
    <>
      <Header />
      <Main className='flex-1'>
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
                href='/builder?template=Empty'
                className='bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors'
              >
                Start Building
              </Link>

              <div>
                <div className='flex justify-center'>
                  {auth.isAuthenticated ? (
                    <Link
                      href='/my-stories'
                      className='border border-primary/20 px-4 py-3 rounded-lg font-semibold text-primary hover:bg-primary/20 transition-colors flex items-center gap-2'
                    >
                      <User className='w-4 h-4' />
                      My Stories
                    </Link>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className='bg-muted/50 border border-border/50 px-4 py-3 rounded-lg font-semibold text-muted-foreground/50 cursor-not-allowed flex items-center gap-2 justify-center'>
                          <Lock className='w-4 h-4' />
                          My Stories
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Log in to access your stories</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
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
                href={`/builder?template=${example.key}`}
              >
                {example.name}
              </Link>
            ))}
          </div>

          {/* <div className='max-w-4xl mx-auto text-center'>
            <h2 className='text-3xl md:text-3xl font-bold text-foreground mb-6'>Public Stories</h2>
          </div>
          <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
            TODO: list last 10 shared stories
            TODO: "view all" button
          </div> */}
        </section>
        <Features />
      </Main>
    </>
  );
}
