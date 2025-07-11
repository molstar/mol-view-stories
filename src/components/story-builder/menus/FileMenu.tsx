'use client';

import { MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarTrigger } from '@/components/ui/menubar';
import { newStory } from '@/app/state/actions';
import { FileIcon } from 'lucide-react';
import { ImportSessionButton } from '../file-operations';

export function FileMenu() {
  return (
    <MenubarMenu>
      <MenubarTrigger className='text-sm flex items-center gap-1'>
        <FileIcon className='size-4' />
        File
      </MenubarTrigger>
      <MenubarContent>
        <MenubarItem onClick={() => newStory()}>New Story</MenubarItem>
        <MenubarSeparator />
        <ImportSessionButton />
      </MenubarContent>
    </MenubarMenu>
  );
}
