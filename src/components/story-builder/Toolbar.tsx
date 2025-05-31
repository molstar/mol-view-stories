'use client';

import { Menubar } from '@/components/ui/menubar';
import { Separator } from '@/components/ui/separator';
import { ImportSessionDialog } from './file-operations';
import { FileMenu, SceneMenu, AssetsMenu, ViewSelector } from './menus';

export function StoriesToolBar() {
  return (
    <>
      <Menubar className='bg-secondary/80 border border-border/50 shadow-sm h-8 rounded-md'>
        <FileMenu />
        <Separator orientation='vertical' className='h-6' />
        <SceneMenu />
        <AssetsMenu />
        <Separator orientation='vertical' className='h-6' />
        <ViewSelector />
      </Menubar>
      <ImportSessionDialog />
    </>
  );
}






