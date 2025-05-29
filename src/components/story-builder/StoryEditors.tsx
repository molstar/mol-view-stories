import { CurrentViewAtom, StoryAtom } from '@/app/appstate';
import { useAtomValue } from 'jotai';
import { SceneEditors } from './SceneEditors';
import { useEffect, useState } from 'react';
import { getMVSData } from '@/lib/story-builder';
import { generateStoriesHtml } from '@/lib/stories-html';

export function StoryEditors() {
  const view = useAtomValue(CurrentViewAtom);

  if (view.type === 'scene') return <SceneEditors />;
  if (view.type === 'story-options') {
    return (
      <div className='flex flex-col gap-4'>
        {/* Add any global story editors here */}
        <p>Story Editors Placeholder</p>
      </div>
    );
  }
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
      const data = await getMVSData(story.metadata, story.scenes);
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
