'use client';

import {
  ActiveSceneAtom,
  ActiveSceneIdAtom,
  addScene,
  CurrentViewAtom,
  downloadStory,
  exportState,
  removeCurrentScene,
  StoryAssetsAtom,
  StoryAtom,
} from '@/app/appstate';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from '@/components/ui/menubar';
import { Separator } from '@/components/ui/separator';
import { useAtom, useAtomValue } from 'jotai';
import { WrenchIcon, EyeIcon, FileIcon, FolderIcon, FrameIcon, ImageIcon, CopyIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';

function FileUploadButton() {
  const [, setCurrentView] = useAtom(CurrentViewAtom);
  const activeScene = useAtomValue(ActiveSceneAtom);

  const handleUploadClick = () => {
    setCurrentView({ type: 'scene', id: activeScene?.id });
  };
  return (
    <MenubarItem onClick={handleUploadClick}>
      Upload File <MenubarShortcut>⌘U</MenubarShortcut>
    </MenubarItem>
  );
}

export function StoriesToolBar() {
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
          <FileIcon className='size-4' />
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
          <MenubarItem onClick={() => downloadStory(story, 'state')}>Download Story</MenubarItem>
          <MenubarItem onClick={() => downloadStory(story, 'html')}>Download HTML</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className='text-sm flex items-center gap-1'>
          <ImageIcon className='size-4' />
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
          <FolderIcon className='size-4' />
          Assets
        </MenubarTrigger>
        <MenubarContent>
          {storyAssets.length === 0 ? (
            <MenubarItem disabled>No assets uploaded</MenubarItem>
          ) : (
            storyAssets.map((asset, index) => (
              <MenubarItem
                key={`${asset.name}-${index}`}
                onClick={() => {
                  navigator.clipboard.writeText(asset.name);
                }}
                title='Click to copy asset name'
              >
                <CopyIcon className='size-4' /> {asset.name} ({Math.round(asset.content.length / 1024)}KB)
              </MenubarItem>
            ))
          )}
        </MenubarContent>
      </MenubarMenu>

      <Separator orientation='vertical' className='h-6' />

      <span className='text-sm text-foreground/70 ms-4 me-2'>View:</span>
          
      <Button
        className='rounded-none'
        onClick={() => setCurrentView({ type: 'story-options' })}
        size='sm'
        variant={currentView.type === 'story-options' ? 'default' : 'ghost'}
      >
        <WrenchIcon />
        Options
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className='rounded-none' size='sm' variant={currentView.type === 'scene' ? 'default' : 'ghost'}>
            <FrameIcon />
            {currentView.type !== 'scene' && `${story.scenes.length} Scene${story.scenes.length !== 1 ? 's' : ''}`}
            {currentView.type === 'scene' && (
              <>
                Scene {story.scenes.findIndex((s) => s.id === activeScene?.id) + 1}/{story.scenes.length}
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {story.scenes.map((scene, i) => (
            <DropdownMenuItem
              key={scene.id}
              onClick={() => setCurrentView({ type: 'scene', id: scene.id.toString() })}
              className={currentView.type === 'scene' && activeScene?.id === scene.id.toString() ? 'bg-accent' : ''}
            >
              {i + 1}/{story.scenes.length}: {scene.header}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        className='rounded-none'
        onClick={() => setCurrentView({ type: 'preview' })}
        size='sm'
        variant={currentView.type === 'preview' ? 'default' : 'ghost'}
      >
        <EyeIcon />
        Preview
      </Button>
    </Menubar>
  );
}
