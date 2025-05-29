'use client';

import { ActiveSceneAtom, addScene, CurrentViewAtom, removeCurrentScene, StoryAtom } from '@/app/appstate';
import { DownloadStoryButtons, ExportButton } from '@/components/story-builder/ExportButton';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from '@/components/ui/menubar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAtom, useAtomValue } from 'jotai';

export function Controls() {
  const story = useAtomValue(StoryAtom);
  const [currentView, setCurrentView] = useAtom(CurrentViewAtom);
  const activeScene = useAtomValue(ActiveSceneAtom);

  return (
    <div className='space-y-3'>
      {/* Command Bar */}
      <div className='bg-muted/50 border border-border rounded-lg p-2'>
        <div className='flex justify-between gap-2 items-center'>
          <Menubar className='bg-transparent border-0 shadow-none h-8'>
            <MenubarMenu>
              <MenubarTrigger className='text-sm'>File</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>
                  New Story <MenubarShortcut>⌘N</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Open Story <MenubarShortcut>⌘O</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem>
                  Save <MenubarShortcut>⌘S</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Save As... <MenubarShortcut>⇧⌘S</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem>
                  Export PDF <MenubarShortcut>⌘E</MenubarShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>

            <Separator orientation='vertical' className='h-6' />

            <MenubarMenu>
              <MenubarTrigger className='text-sm'>Edit</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>
                  Undo <MenubarShortcut>⌘Z</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem>
                  Cut <MenubarShortcut>⌘X</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Copy <MenubarShortcut>⌘C</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Paste <MenubarShortcut>⌘V</MenubarShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>

            <Separator orientation='vertical' className='h-6' />

            <MenubarMenu>
              <MenubarTrigger className='text-sm'>Scene</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={() => addScene()}>
                  Add New Scene <MenubarShortcut>⌘⇧N</MenubarShortcut>
                </MenubarItem>
                <MenubarItem onClick={() => addScene({ duplicate: true })}>
                  Duplicate Scene <MenubarShortcut>⌘D</MenubarShortcut>
                </MenubarItem>
                <MenubarItem onClick={() => removeCurrentScene()}>
                  Delete Scene <MenubarShortcut>⌘⌫</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem>
                  Move Up <MenubarShortcut>⌘↑</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Move Down <MenubarShortcut>⌘↓</MenubarShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>

            <Separator orientation='vertical' className='h-6' />

            <MenubarMenu>
              <MenubarTrigger className='text-sm'>View</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={() => setCurrentView({ type: 'preview' })}>
                  Story Preview <MenubarShortcut>⌘P</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Full Screen <MenubarShortcut>⌘⌃F</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem>
                  Zoom In <MenubarShortcut>⌘+</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Zoom Out <MenubarShortcut>⌘-</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Reset Zoom <MenubarShortcut>⌘0</MenubarShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>

          <div className='flex items-center gap-2 ms-8'>
            <span className='text-sm text-muted-foreground'>Current Scene:</span>
            <Select
              value={currentView.type === 'scene' ? activeScene?.id : undefined}
              onValueChange={(value) => setCurrentView({ type: 'scene', id: value })}
            >
              <SelectTrigger className='w-[200px] h-8'>
                <SelectValue placeholder='Select a scene'>{activeScene?.header || 'Select a scene'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {story.scenes.map((scene) => (
                  <SelectItem key={scene.id} value={scene.id.toString()}>
                    {scene.header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex-1' />
          <ExportButton />
          <DownloadStoryButtons />
        </div>
      </div>
    </div>
  );
}
