'use client';

import {
  ActiveSceneAtom,
  addScene,
  CurrentViewAtom,
  downloadStory,
  removeCurrentScene,
  StoryAssetsAtom,
  StoryAtom,
} from '@/app/appstate';
import { moveCurrentScene, newStory } from '@/app/state/actions';
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
import {
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  FileIcon,
  FolderIcon,
  FrameIcon,
  ImageIcon,
  WrenchIcon,
} from 'lucide-react';
import { Button } from '../ui/button';
import { ExportSessionButton, ImportSessionButton, ImportSessionDialog } from './file-operations';

export function StoriesToolBar() {
  const [currentView, setCurrentView] = useAtom(CurrentViewAtom);
  const activeScene = useAtomValue(ActiveSceneAtom);
  const story = useAtomValue(StoryAtom);
  const storyAssets = useAtomValue(StoryAssetsAtom);
  const canModifyScene = currentView.type === 'scene' && story.scenes.length >= 1;

  return (
    <>
      <Menubar className='bg-secondary/80 border border-border/50 shadow-sm h-8 rounded-md'>
        <MenubarMenu>
          <MenubarTrigger className='text-sm flex items-center gap-1'>
            <FileIcon className='size-4' />
            File
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={() => newStory()}>New Story</MenubarItem>
            <MenubarSeparator />
            <ImportSessionButton />
            <ExportSessionButton />
          </MenubarContent>
        </MenubarMenu>

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

        <Separator orientation='vertical' className='h-6' />

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
          Story Options
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
          Story Preview
        </Button>
      </Menubar>
      <ImportSessionDialog />
    </>
  );
}






