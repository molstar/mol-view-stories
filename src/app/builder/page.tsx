'use client';

import dynamic from 'next/dynamic';

const StoryBuilderPage = dynamic(() => import('@/components/story-builder'), { ssr: false });
// const StoryBuilderPage = dynamic(() => import('@/components/story-builder'), { ssr: false });

export default function StoryBuilder() {
  return <StoryBuilderPage />;
}
