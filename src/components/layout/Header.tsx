'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { datastore, ActiveSceneAtom, addScene, CurrentViewAtom, removeCurrentScene, StoryAtom } from '@/app/appstate';
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

export function Header() {
  const pathname = usePathname();
  const story = useAtomValue(StoryAtom, { store: datastore });
  const [currentView, setCurrentView] = useAtom(CurrentViewAtom);
  const activeScene = useAtomValue(ActiveSceneAtom);

  const isActive = (path: string) => pathname === path;
  const isStoryBuilder = pathname === '/story-builder';

  return (
    <header className='bg-background border-b border-border'>
      {/* Main Header */}
      <div className='flex justify-between items-center px-4 py-3 md:px-8 md:py-4'>
        <div className='flex items-center gap-8'>
          <Link href='/' className='text-3xl font-bold text-foreground hover:text-foreground/80 transition-colors'>
            MolViewStories
          </Link>

          <nav className='hidden md:flex items-center gap-6'>
            <Link
              href='/'
              className={`text-sm font-medium transition-colors ${
                isActive('/') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Home
            </Link>
            <Link
              href='/story-builder'
              className={`text-sm font-medium transition-colors ${
                isActive('/story-builder') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Story Builder
            </Link>
            <Link
              href='/story-view'
              className={`text-sm font-medium transition-colors ${
                isActive('/story-view') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              View Stories
            </Link>
          </nav>

          {/* Control Bar Inline */}
          <div className='hidden lg:flex items-center'>
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
            </div>
          </div>

          <div className='flex items-center gap-4'>
            <div className='hidden lg:flex items-center gap-2'>
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

            <div className='hidden lg:flex items-center gap-2'>
              <ExportButton />
              <DownloadStoryButtons />
            </div>

            {/* Mobile menu button - you can expand this later */}
            <div className='md:hidden'>
              <button className='text-foreground'>
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
                </svg>
              </button>
            </div>
          </div>
        </div>
    </header>
  );
}
