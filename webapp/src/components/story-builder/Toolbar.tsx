'use client';

import { Menubar } from '@/components/ui/menubar';
import { Separator } from '@/components/ui/separator';
import { SceneMenu, StoryPreview, StoryOptions, SceneSelector } from './menus';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAtom, useAtomValue } from 'jotai';
import { ActiveSceneAtom, CurrentViewAtom, StoryAtom } from '@/app/appstate';

export function StoriesToolBar() {
  return (
    <>
      <div className='space-y-1'>
        {/* Toolbar with Container Grouping and Labels */}
        <div className='flex items-start gap-2'>
          {/* Story Controls Container */}
          <div className='flex flex-col'>
            <div className='text-xs text-muted-foreground/70 font-medium px-1 mb-1'>Story</div>
            <div className='h-0.5 bg-blue-500/60 rounded-full mb-1'></div>
            <div className='bg-secondary/80 border border-border/50 shadow-sm rounded-md'>
              <Menubar className='bg-transparent border-0 shadow-none h-8'>
                <StoryOptions />
              </Menubar>
            </div>
          </div>

          {/* Scene Controls Container */}
          <div className='flex flex-col'>
            <div className='text-xs text-muted-foreground/70 font-medium px-1 mb-1'>Scene</div>
            <div className='h-0.5 bg-green-500/60 rounded-full mb-1'></div>
            <div className='bg-secondary/80 border border-border/50 shadow-sm rounded-md'>
              <Menubar className='bg-transparent border-0 shadow-none h-8'>
                <SceneMenu />
                <Separator orientation='vertical' className='h-6' />
                <SceneSelector />
                <NextScene dir={-1} />
                <NextScene dir={1} />
              </Menubar>
            </div>
          </div>

          {/* Story Preview Controls Container */}
          <div className='flex flex-col'>
            <div className='text-xs text-muted-foreground/70 font-medium px-1 mb-1'>Story Preview</div>
            <div className='h-0.5 bg-purple-500/60 rounded-full mb-1'></div>
            <div className='bg-secondary/80 border border-border/50 shadow-sm rounded-md'>
              <Menubar className='bg-transparent border-0 shadow-none h-8'>
                <StoryPreview />
              </Menubar>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function NextScene({ dir }: { dir: -1 | 1 }) {
  const [currentView, setCurrentView] = useAtom(CurrentViewAtom);
  const story = useAtomValue(StoryAtom);
  const activeScene = useAtomValue(ActiveSceneAtom);

  const Icon = dir < 0 ? ChevronLeft : ChevronRight;
  const onClick = () => {
    if (currentView.type !== 'scene') {
      setCurrentView({ type: 'scene', id: story.scenes[0].id.toString(), subview: 'scene-options' });
      return;
    }

    let idx = story.scenes.findIndex((s) => s.id === activeScene.id);
    idx += dir;
    if (idx < 0) idx = story.scenes.length - 1;
    if (idx >= story.scenes.length) idx = 0;

    setCurrentView({ type: 'scene', id: story.scenes[idx].id.toString(), subview: 'scene-options' });
  };
  return (
    <Button
      className='text-sm has-[>svg]:px-1 cursor-pointer rounded-none'
      variant='link'
      onClick={onClick}
      title={dir < 0 ? 'Previous Scene' : 'Next Scene'}
    >
      <Icon className='size-4' />
    </Button>
  );
}
