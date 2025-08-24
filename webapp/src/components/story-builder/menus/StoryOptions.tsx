'use client';

import { Button } from '@/components/ui/button';
import { CurrentViewAtom } from '@/app/appstate';
import { useAtom } from 'jotai';
import { WrenchIcon } from 'lucide-react';

export function StoryOptions() {
  const [currentView, setCurrentView] = useAtom(CurrentViewAtom);

  return (
    <Button
      className='rounded-none'
      onClick={() => setCurrentView({ type: 'story-options', subview: 'story-metadata' })}
      size='sm'
      variant={currentView.type === 'story-options' ? 'default' : 'ghost'}
    >
      <WrenchIcon />
      Story Options
    </Button>
  );
}
