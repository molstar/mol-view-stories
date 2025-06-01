'use client';

import { Button } from '@/components/ui/button';
import { CurrentViewAtom } from '@/app/appstate';
import { useAtom } from 'jotai';
import { EyeIcon } from 'lucide-react';

export function StoryPreview() {
  const [currentView, setCurrentView] = useAtom(CurrentViewAtom);

  return (
    <Button
      className='rounded-none'
      onClick={() =>
        setCurrentView((prev) =>
          prev.type === 'preview'
            ? (prev.previous ?? { type: 'story-options', subview: 'story-metadata' })
            : { type: 'preview', previous: currentView }
        )
      }
      size='sm'
      variant={currentView.type === 'preview' ? 'default' : 'ghost'}
    >
      <EyeIcon />
      Story Preview
    </Button>
  );
}
