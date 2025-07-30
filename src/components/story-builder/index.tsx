import { useAtomValue, useStore } from 'jotai/index';
import { CurrentViewAtom, IsSessionLoadingAtom, SessionMetadataAtom, StoryAtom } from '@/app/state/atoms';
import { SceneEditors } from '@/components/story-builder/SceneEditor';
import { StoryOptions } from '@/components/story-builder/StoryOptions';
import { useLayoutEffect, useState, useEffect } from 'react';
import { ExampleStories } from '@/app/examples';
import { Header } from '@/components/common';
import { StoriesToolBar } from '@/components/story-builder/Toolbar';
import { getMVSData, setIsDirty } from '@/app/state/actions';
import { loadSession } from '@/lib/my-stories-api';
import { generateStoriesHtml } from '@/app/state/template';
import { StoryActionButtons } from './Actions';
import { useUnsavedChanges, useUnsavedChangesWarning } from '@/hooks/useUnsavedChanges';

export default function StoryBuilderPage() {
  const store = useStore();
  const isLoading = useAtomValue(IsSessionLoadingAtom);

  // Enable browser beforeunload warning for tab closing/direct URL navigation
  // This is separate from internal navigation (HeaderLogo, LoginButton) which use custom modals
  const { hasUnsavedChanges } = useUnsavedChanges({ enableBeforeUnload: true });

  // Enable back button warning for browser navigation
  useUnsavedChangesWarning(hasUnsavedChanges);

  // Client-side initialization - runs immediately after mount
  useLayoutEffect(() => {
    const searchParams = new URL(window.location.href).searchParams;
    const sessionId = searchParams.get('sessionId');
    const templateName = searchParams.get('template');

    if (sessionId) {
      loadSession(sessionId);
      return;
    }

    // Only process template if no saved state was restored
    if (!templateName) return;

    let story = ExampleStories[templateName as keyof typeof ExampleStories];
    if (!story) story = ExampleStories.Empty;

    store.set(CurrentViewAtom, { type: 'story-options', subview: 'story-metadata' });
    store.set(StoryAtom, story);
    store.set(SessionMetadataAtom, null);

    // clear search params
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('template');
      window.history.replaceState({}, '', url.toString());
    } catch (error) {
      // window APIs might not be available
      console.warn('Failed to clear search params:', error);
    }
  }, [store]);

  // Clean up isDirty state when component unmounts (user navigates away from builder)
  useEffect(() => {
    return () => {
      // Reset isDirty state when leaving the builder page
      setIsDirty(false);
    };
  }, []);

  return (
    <div className='flex flex-col h-screen'>
      <Header actions={<StoryActionButtons />}>
        <StoryTitle />
      </Header>
      <main className='flex-1 flex flex-col gap-6 lg:gap-8 px-4 py-6 md:px-8 md:py-8 max-w-[1600px] mx-auto w-full h-full'>
        {isLoading && (
          <div className='absolute inset-0 bg-white/80 flex items-center justify-center z-50'>
            <div className='text-lg font-semibold'>Loading session...</div>
          </div>
        )}
        {!isLoading && (
          <>
            <StoriesToolBar />
            <div className='flex gap-6 lg:gap-8 flex-1 h-full min-h-0'>
              <StoryBuilderRoot />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StoryTitle() {
  const isLoading = useAtomValue(IsSessionLoadingAtom);
  const story = useAtomValue(StoryAtom);
  if (isLoading) {
    return <>Loading...</>;
  }
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

  useLayoutEffect(() => {
    let isMounted = true;

    async function build() {
      try {
        const data = await getMVSData(story);
        if (!isMounted) return;

        const htmlContent = generateStoriesHtml(data, {
          title: story.metadata.title,
        });
        if (typeof window !== 'undefined') {
          const src = URL.createObjectURL(new Blob([htmlContent], { type: 'text/html' }));
          setSrc(src);
        }
      } catch (error) {
        console.error('Failed to build preview:', error);
      }
    }

    build();
    return () => {
      isMounted = false;
    };
  }, [story]);

  if (!src) {
    return <div className='w-full h-full flex items-center justify-center'>Loading preview...</div>;
  }

  // TODO: figure out how to do 100% height for the iframe (wasn't working and ran out of time)
  return <iframe className='border-0' height='800px' width='100%' src={src} />;
}
