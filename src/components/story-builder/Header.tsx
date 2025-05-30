'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ActiveSceneAtom,
  addScene,
  CurrentViewAtom,
  removeCurrentScene,
  StoryAtom,
  ActiveSceneIdAtom,
  exportState,
  downloadStory,
  StoryAssetsAtom,
} from '@/app/appstate';
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
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAtom, useAtomValue } from 'jotai';
import Image from 'next/image';
import { FileIcon, ImageIcon, FrameIcon, FolderIcon, EyeIcon } from 'lucide-react';



function FileUploadButton() {
  const [, setCurrentView] = useAtom(CurrentViewAtom);
  const activeScene = useAtomValue(ActiveSceneAtom);

  const handleUploadClick = () => {
    // Switch to the scene view with the upload tab
    setCurrentView({ type: 'scene', id: activeScene?.id });
    // Note: The actual tab switching to 'upload' will need to be handled
    // by the SceneEditors component or through additional state
  };

  return (
    <MenubarItem onClick={handleUploadClick}>
      Upload File <MenubarShortcut>⌘U</MenubarShortcut>
    </MenubarItem>
  );
}

function HeaderLogo() {
  return (
    <Link
      href='/'
      className='flex items-center gap-2 text-xl font-bold text-foreground hover:text-foreground/80 transition-colors'
    >
      <Image src='/favicon.ico' alt='MolViewStories' width={24} height={24} className='w-6 h-6' />
      MolViewStories
    </Link>
  );
}

function MainMenuBar() {
  const [currentView, setCurrentView] = useAtom(CurrentViewAtom);
  const activeScene = useAtomValue(ActiveSceneAtom);
  const story = useAtomValue(StoryAtom);
  const activeSceneId = useAtomValue(ActiveSceneIdAtom);
  const storyAssets = useAtomValue(StoryAssetsAtom);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportState(story, activeSceneId, {});
      console.log('Export completed successfully');
    } catch (error) {
      console.error('Error during export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Menubar className='bg-secondary/80 border border-border/50 shadow-sm h-8 rounded-md'>
      <MenubarMenu>
        <MenubarTrigger className='text-sm flex items-center gap-1'>
          <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
          </svg>
          File
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            New Story <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Open Story <MenubarShortcut>⌘O</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <FileUploadButton />
          <MenubarSeparator />
          <MenubarItem>
            Save <MenubarShortcut>⌘S</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Save As... <MenubarShortcut>⇧⌘S</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Exporting...' : 'Export JSON'}
          </MenubarItem>
          <MenubarItem onClick={() => downloadStory(story, 'state')}>
            Download Story
          </MenubarItem>
          <MenubarItem onClick={() => downloadStory(story, 'html')}>
            Download HTML
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className='text-sm flex items-center gap-1'>
          <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' />
          </svg>
          Scene
        </MenubarTrigger>
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
        <MenubarTrigger className='text-sm flex items-center gap-1'>
          <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V3a1 1 0 011 1v12a4 4 0 01-4 4H8a4 4 0 01-4-4V4a1 1 0 011-1V2M7 4h10M9 9h6m-6 4h6' />
          </svg>
          Frames
        </MenubarTrigger>
        <MenubarContent>
          {story.scenes.map((scene) => (
            <MenubarItem 
              key={scene.id} 
              onClick={() => setCurrentView({ type: 'scene', id: scene.id.toString() })}
              className={activeScene?.id === scene.id.toString() ? 'bg-accent' : ''}
            >
              {scene.header}
            </MenubarItem>
          ))}
        </MenubarContent>
      </MenubarMenu>

      <Separator orientation='vertical' className='h-6' />

      <MenubarMenu>
        <MenubarTrigger className='text-sm flex items-center gap-1'>
          <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 011-1h6a2 2 0 011 1v2M7 7h10' />
          </svg>
          Assets
        </MenubarTrigger>
        <MenubarContent>
          {storyAssets.length === 0 ? (
            <MenubarItem disabled>
              No assets uploaded
            </MenubarItem>
          ) : (
            storyAssets.map((asset, index) => (
              <MenubarItem key={`${asset.name}-${index}`}>
                {asset.name} ({Math.round(asset.content.length / 1024)}KB)
              </MenubarItem>
            ))
          )}
        </MenubarContent>
      </MenubarMenu>

      <Separator orientation='vertical' className='h-6' />

      <div className='flex items-center gap-2 px-3'>
        <span className='text-sm text-foreground/70'>Mode:</span>
        <span className='text-sm text-foreground/70'>Builder</span>
        <Switch 
          checked={currentView.type === 'preview'}
          onCheckedChange={(checked) => 
            setCurrentView(checked ? { type: 'preview' } : { type: 'scene', id: activeScene?.id })
          }
        />
        <span className='text-sm text-foreground/70'>Story</span>
      </div>
    </Menubar>
  );
}



function MobileMenuButton() {
  return (
    <div className='md:hidden'>
      <button className='text-foreground'>
        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
        </svg>
      </button>
    </div>
  );
}

export function Header() {
  return (
    <header className='bg-background border-b border-border'>
      <div className='flex justify-between items-center px-4 py-2 md:px-6'>
        <div className='flex items-center gap-6'>
          <HeaderLogo />
          <Separator orientation='vertical' className='h-6' />
          <div className='hidden lg:flex items-center'>
            <MainMenuBar />
          </div>
        </div>

        <div className='flex items-center gap-4'>
          <MobileMenuButton />
        </div>
      </div>
    </header>
  );
}
