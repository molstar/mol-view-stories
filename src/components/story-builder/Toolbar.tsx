'use client';

import { Menubar } from '@/components/ui/menubar';
import { Separator } from '@/components/ui/separator';
import { ImportSessionDialog } from './file-operations';
import { FileMenu, SceneMenu, StoryPreview, StoryOptions, SceneSelector } from './menus';

export function StoriesToolBar() {
  return (
    <>
      <div className="space-y-1">
        {/* Toolbar with Container Grouping and Labels */}
        <div className="flex items-start gap-2">
          {/* Story Controls Container */}
          <div className="flex flex-col">
            <div className="text-xs text-muted-foreground/70 font-medium px-1 mb-1">Story</div>
            <div className="h-0.5 bg-blue-500/60 rounded-full mb-1"></div>
            <div className="bg-secondary/80 border border-border/50 shadow-sm rounded-md">
              <Menubar className="bg-transparent border-0 shadow-none h-8">
                <FileMenu />
                <Separator orientation='vertical' className='h-6' />
                <StoryOptions />
              </Menubar>
            </div>
          </div>
          
          {/* Scene Controls Container */}
          <div className="flex flex-col">
            <div className="text-xs text-muted-foreground/70 font-medium px-1 mb-1">Scene</div>
            <div className="h-0.5 bg-green-500/60 rounded-full mb-1"></div>
            <div className="bg-secondary/80 border border-border/50 shadow-sm rounded-md">
              <Menubar className="bg-transparent border-0 shadow-none h-8">
                <SceneMenu />
                <Separator orientation='vertical' className='h-6' />
                <SceneSelector />
              </Menubar>
            </div>
          </div>
          
          {/* Story Preview Controls Container */}
          <div className="flex flex-col">
            <div className="text-xs text-muted-foreground/70 font-medium px-1 mb-1">Story Preview</div>
            <div className="h-0.5 bg-purple-500/60 rounded-full mb-1"></div>
            <div className="bg-secondary/80 border border-border/50 shadow-sm rounded-md">
              <Menubar className="bg-transparent border-0 shadow-none h-8">
                <StoryPreview />
              </Menubar>
            </div>
          </div>
        </div>
      </div>
      <ImportSessionDialog />
    </>
  );
}






