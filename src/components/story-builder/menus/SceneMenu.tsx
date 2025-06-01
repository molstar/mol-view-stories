'use client';

import {
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from '@/components/ui/menubar';
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
        <MenubarItem onClick={() => addScene()}>
          Add New Scene <MenubarShortcut>⌘⇧N</MenubarShortcut>
        </MenubarItem>
        <MenubarItem onClick={() => addScene({ duplicate: true })} disabled={!canModifyScene}>
          Duplicate Scene <MenubarShortcut>⌘D</MenubarShortcut>
        </MenubarItem>
        <MenubarItem onClick={() => removeCurrentScene()} disabled={!canModifyScene || story.scenes.length <= 1}>
          Delete Scene <MenubarShortcut>⌘⌫</MenubarShortcut>
        </MenubarItem>
        <MenubarSeparator />
        <MenubarItem onClick={() => moveCurrentScene(-1)} disabled={!canModifyScene}>
          Move Up <MenubarShortcut>⌘↑</MenubarShortcut>
        </MenubarItem>
        <MenubarItem onClick={() => moveCurrentScene(1)} disabled={!canModifyScene}>
          Move Down <MenubarShortcut>⌘↓</MenubarShortcut>
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  );
}
