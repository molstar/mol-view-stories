'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { CurrentViewAtom, StoryAtom, ActiveSceneAtom } from '@/app/appstate';
import { useAtom, useAtomValue } from 'jotai';
import { FrameIcon } from 'lucide-react';

export function SceneSelector() {
  const [currentView, setCurrentView] = useAtom(CurrentViewAtom);
  const story = useAtomValue(StoryAtom);
  const activeScene = useAtomValue(ActiveSceneAtom);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className='rounded-none' size='sm' variant={currentView.type === 'scene' ? 'default' : 'ghost'}>
          <FrameIcon />
          {currentView.type !== 'scene' && `${story.scenes.length} Scene${story.scenes.length !== 1 ? 's' : ''}`}
          {currentView.type === 'scene' && (
            <>
              Scene {story.scenes.findIndex((s) => s.id === activeScene?.id) + 1}/{story.scenes.length}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {story.scenes.map((scene, i) => (
          <DropdownMenuItem
            key={scene.id}
            onClick={() => setCurrentView({ type: 'scene', id: scene.id.toString(), subview: 'scene-options' })}
            className={currentView.type === 'scene' && activeScene?.id === scene.id.toString() ? 'bg-accent' : ''}
          >
            {i + 1}/{story.scenes.length}: {scene.header}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
