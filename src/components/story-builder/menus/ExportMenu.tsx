'use client';

import {
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from '@/components/ui/menubar';
import { downloadStory, StoryAtom } from '@/app/appstate';
import { useAtomValue } from 'jotai';
import { DownloadIcon } from 'lucide-react';

export function ExportMenu() {
  const story = useAtomValue(StoryAtom);

  return (
    <MenubarMenu>
      <MenubarTrigger className='text-sm flex items-center gap-1'>
        <DownloadIcon className='size-4' />
        Export
      </MenubarTrigger>
      <MenubarContent>
        <MenubarItem onClick={() => downloadStory(story, 'state')}>Download Story</MenubarItem>
        <MenubarItem onClick={() => downloadStory(story, 'html')}>Download HTML</MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  );
}