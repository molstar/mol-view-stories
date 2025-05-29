'use client';

import React from 'react';
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
  uploadSceneAsset,
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
import { useAtom, useAtomValue } from 'jotai';
import Image from 'next/image';
import { useState, useRef } from 'react';

function ExportButton() {
  const story = useAtomValue(StoryAtom);
  const activeSceneId = useAtomValue(ActiveSceneIdAtom);
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
    <Button onClick={handleExport} disabled={isExporting} variant='default' size='sm' className='h-6'>
      {isExporting ? 'Exporting...' : 'Export JSON'}
    </Button>
  );
}

function DownloadStoryButtons() {
  const story = useAtomValue(StoryAtom);

  return (
    <>
      <Button onClick={() => downloadStory(story, 'state')} variant='default' size='sm' className='h-6'>
        Download Story
      </Button>
      <Button onClick={() => downloadStory(story, 'html')} variant='default' size='sm' className='h-6'>
        Download HTML
      </Button>
    </>
  );
}

function FileUploadButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await uploadSceneAsset(file);
      console.log(`File uploaded successfully: ${file.name}`);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
      // Reset the input value so the same file can be uploaded again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdb,.cif,.mmcif,.mol,.sdf,.xyz,.gro"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <MenubarItem onClick={triggerFileSelect} disabled={isUploading}>
        {isUploading ? 'Uploading...' : 'Upload File'} <MenubarShortcut>⌘U</MenubarShortcut>
      </MenubarItem>
    </>
  );
}

export function Header() {
  const story = useAtomValue(StoryAtom);
  const [currentView, setCurrentView] = useAtom(CurrentViewAtom);
  const activeScene = useAtomValue(ActiveSceneAtom);

  return (
    <header className='bg-background border-b border-border'>
      {/* Main Header */}
      <div className='flex justify-between items-center px-4 py-2 md:px-6'>
        <div className='flex items-center gap-6'>
          <Link
            href='/'
            className='flex items-center gap-2 text-xl font-bold text-foreground hover:text-foreground/80 transition-colors'
          >
            <Image src='/favicon.ico' alt='MolViewStories' width={24} height={24} className='w-6 h-6' />
            MolViewStories
          </Link>

          <Separator orientation='vertical' className='h-6' />

          {/* Control Bar Inline */}
          <div className='hidden lg:flex items-center'>
            <Menubar className='bg-secondary/80 border border-border/50 shadow-sm h-8 rounded-md'>
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
                  <FileUploadButton />
                  <MenubarSeparator />
                  <MenubarItem>
                    Save <MenubarShortcut>⌘S</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem>
                    Save As... <MenubarShortcut>⇧⌘S</MenubarShortcut>
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>

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
                  <MenubarItem onClick={() => setCurrentView({ type: 'preview' })}>Story Preview</MenubarItem>
                  <MenubarItem onClick={() => setCurrentView({ type: 'scene', id: activeScene?.id })}>
                    Builder Preview
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </div>
        </div>

        <div className='flex items-center gap-4'>
          <div className='hidden lg:flex items-center'>
            <Menubar className='bg-secondary/80 border border-border/50 shadow-sm h-8 rounded-md'>
              <div className='flex items-center gap-3 px-3'>
                <span className='text-sm text-foreground/70'>Scenes:</span>
                <Select
                  value={currentView.type === 'scene' ? activeScene?.id : undefined}
                  onValueChange={(value) => setCurrentView({ type: 'scene', id: value })}
                >
                  <SelectTrigger className='w-[180px] h-7 text-sm border-0 bg-transparent'>
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

              <Separator orientation='vertical' className='h-6' />

              <div className='flex items-center gap-2 px-3'>
                <ExportButton />
                <DownloadStoryButtons />
              </div>
            </Menubar>
          </div>

          {/* Mobile menu button - you can expand this later */}
          <div className='md:hidden'>
            <button className='text-foreground'>
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
