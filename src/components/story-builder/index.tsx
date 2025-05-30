import { CurrentViewAtom, StoryAtom } from '@/app/appstate';
import { generateStoriesHtml } from '@/lib/stories-html';
import { getMVSData } from '@/lib/story-builder';
import { useAtomValue, useStore } from 'jotai';
import { useEffect, useState } from 'react';
import { Header } from '../common';
import { SceneEditors } from './SceneEditor';
import { StoryOptions } from './StoryOptions';
import { StoriesToolBar } from './Toolbar';
import { ExampleStories } from '@/app/examples';
import { useSearchParams } from 'next/navigation';

export default function StoryBuilderPage() {
  const store = useStore();
  const searchParams = useSearchParams();
  const templateName = searchParams.get('template');

  useEffect(() => {
    if (!templateName) return;

    let story = ExampleStories[templateName as keyof typeof ExampleStories];
    if (!story) story = ExampleStories.Empty;

    store.set(CurrentViewAtom, { type: 'story-options' });
    store.set(StoryAtom, story);

    // clear search params
    const url = new URL(window.location.href);
    url.searchParams.delete('template');
    window.history.replaceState({}, '', url.toString());
  }, [store, templateName]);

  return (
    <div className='flex flex-col min-h-screen'>
      <Header>
        <StoryTitle />
      </Header>
      <main className='flex-1 flex flex-col gap-6 lg:gap-8 px-4 py-6 md:px-8 md:py-8 max-w-[1600px] mx-auto w-full h-full'>
        <StoriesToolBar />
        <div className='flex gap-6 lg:gap-8 flex-1 h-full min-h-0'>
          <StoryBuilderRoot />
        </div>
      </main>
    </div>
  );
}

function StoryTitle() {
  const story = useAtomValue(StoryAtom);
  return <>{story.metadata.title || 'Untitled Story'}</>;
}

function StoryBuilderRoot() {
  const view = useAtomValue(CurrentViewAtom);

  if (view.type === 'scene') return <SceneEditors />;
  if (view.type === 'story-options') return <StoryOptions />;
  if (view.type === 'preview') {
    return <StoryPreview />;
  }

  return null;
}

function StoryPreview() {
  const story = useAtomValue(StoryAtom);
  const [src, setSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    async function build() {
      const data = await getMVSData(story);
      if (!mounted) return;
      const htmlContent = generateStoriesHtml(data);
      const src = URL.createObjectURL(new Blob([htmlContent], { type: 'text/html' }));
      setSrc(src);
    }
    build();
    return () => {
      mounted = false;
    };
  }, [story]);

  if (!src) {
    return <div className='w-full h-full flex items-center justify-center'>Loading...</div>;
  }

  // TODO: figure out how to do 100% height for the iframe (wasn't working and ran out of time)
  return <iframe className='border-0' height='800px' width='100%' src={src} />;
}
