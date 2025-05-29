'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  SceneAssetsAtom,
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
  const [sceneAssets] = useAtom(SceneAssetsAtom);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🚨🚨🚨 FILE INPUT CHANGED! 🚨🚨🚨');
    console.log('🔧 FileUploadButton: handleFileSelect triggered');
    
    const files = event.target.files;
    console.log('🔧 FileUploadButton: Files:', files);
    console.log('🔧 FileUploadButton: Files length:', files?.length);
    
    const file = files?.[0];
    
    if (!file) {
      console.log('❌ FileUploadButton: No file selected - files array was empty or undefined');
      return;
    }

    console.log('📁 FileUploadButton: File selected details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });

    console.log('📊 FileUploadButton: Current assets count before upload:', sceneAssets.length);
    console.log('📊 FileUploadButton: Current assets before upload:', sceneAssets.map(a => ({ name: a.name, size: a.content.length })));

    try {
      setIsUploading(true);
      console.log(`🚀 FileUploadButton: Starting upload for file: ${file.name}`);
      await uploadSceneAsset(file);
      console.log(`✅ FileUploadButton: File uploaded successfully: ${file.name}`);
      
      // Log assets after upload attempt
      console.log('📊 FileUploadButton: Assets count after upload should be updated in next render');
    } catch (error) {
      console.error('❌ FileUploadButton: Error uploading file:', error);
      alert(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      // Reset the input value so the same file can be uploaded again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      console.log('🔄 FileUploadButton: Upload process completed, input reset');
    }
  };

  const triggerFileSelect = () => {
    console.log('👆 FileUploadButton: File select triggered by user click');
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type='file'
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <MenubarItem onClick={triggerFileSelect} disabled={isUploading}>
        {isUploading ? 'Uploading...' : 'Upload File'} <MenubarShortcut>⌘U</MenubarShortcut>
      </MenubarItem>
    </>
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
  const [, setCurrentView] = useAtom(CurrentViewAtom);
  const activeScene = useAtomValue(ActiveSceneAtom);

  return (
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
  );
}

function SceneSelector() {
  const story = useAtomValue(StoryAtom);
  const [currentView, setCurrentView] = useAtom(CurrentViewAtom);
  const activeScene = useAtomValue(ActiveSceneAtom);

  return (
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
  );
}

function AssetSelector() {
  const [sceneAssets] = useAtom(SceneAssetsAtom);
  
  // Log whenever assets change
  useEffect(() => {
    console.log('🔄 AssetSelector: Assets updated:', {
      count: sceneAssets.length,
      assets: sceneAssets.map(asset => ({ 
        name: asset.name, 
        size: asset.content.length,
        sizeKB: Math.round(asset.content.length / 1024)
      }))
    });
  }, [sceneAssets]);

  return (
    <div className='flex items-center gap-3 px-3'>
      <span className='text-sm text-foreground/70'>Assets:</span>
      <Select>
        <SelectTrigger className='w-[180px] h-7 text-sm border-0 bg-transparent'>
          <SelectValue placeholder={sceneAssets.length > 0 ? `${sceneAssets.length} asset(s)` : 'No assets'} />
        </SelectTrigger>
        <SelectContent>
          {sceneAssets.length === 0 ? (
            <SelectItem value='no-assets' disabled>
              No assets uploaded
            </SelectItem>
          ) : (
            sceneAssets.map((asset, index) => (
              <SelectItem key={`${asset.name}-${index}`} value={asset.name}>
                {asset.name} ({Math.round(asset.content.length / 1024)}KB)
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

function ActionButtons() {
  return (
    <div className='flex items-center gap-2 px-3'>
      <ExportButton />
      <DownloadStoryButtons />
    </div>
  );
}

function ControlsMenuBar() {
  return (
    <Menubar className='bg-secondary/80 border border-border/50 shadow-sm h-8 rounded-md'>
      <SceneSelector />
      <Separator orientation='vertical' className='h-6' />
      <AssetSelector />
      <Separator orientation='vertical' className='h-6' />
      <ActionButtons />
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
          <div className='hidden lg:flex items-center'>
            <ControlsMenuBar />
          </div>
          <MobileMenuButton />
        </div>
      </div>
    </header>
  );
}
