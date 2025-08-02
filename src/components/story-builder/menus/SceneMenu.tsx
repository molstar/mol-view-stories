'use client';

import { MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarTrigger } from '@/components/ui/menubar';
import { addScene, removeCurrentScene, CurrentViewAtom, StoryAtom } from '@/app/appstate';
import { moveCurrentScene } from '@/app/state/actions';
import { useAtomValue } from 'jotai';
import { ImageIcon } from 'lucide-react';

export function SceneMenu() {
  const currentView = useAtomValue(CurrentViewAtom);
  const story = useAtomValue(StoryAtom);
  const canModifyScene = currentView.type === 'scene' && story.scenes.length >= 1;

  return (
    <MenubarMenu>
      <MenubarTrigger className='text-sm flex items-center gap-1'>
        <ImageIcon className='size-4' />
        Scene
      </MenubarTrigger>
      <MenubarContent>
        <MenubarItem onClick={() => addScene()}>Add New Scene</MenubarItem>
        <MenubarItem onClick={() => addScene({ duplicate: true })} disabled={!canModifyScene}>
          Duplicate Scene
        </MenubarItem>
        <MenubarItem onClick={() => removeCurrentScene()} disabled={!canModifyScene || story.scenes.length <= 1}>
          Delete Scene
        </MenubarItem>
        <MenubarSeparator />
        <MenubarItem onClick={() => moveCurrentScene(-1)} disabled={!canModifyScene}>
          Move Up
        </MenubarItem>
        <MenubarItem onClick={() => moveCurrentScene(1)} disabled={!canModifyScene}>
          Move Down
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  );
}
