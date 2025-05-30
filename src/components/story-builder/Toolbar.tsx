'use client';

import {
  ActiveSceneAtom,
  addScene,
  CurrentViewAtom,
  downloadStory,
  exportState,
  OpenSessionAtom,
  removeCurrentScene,
  StoryAssetsAtom,
  StoryAtom,
} from '@/app/appstate';
import { importState, moveCurrentScene, newStory, SessionFileExtension } from '@/app/state/actions';
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
  Upload,
  WrenchIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

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

function ExportSessionButton() {
  const story = useAtomValue(StoryAtom);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportState(story);
      console.log('Export completed successfully');
    } catch (error) {
      console.error('Error during export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <MenubarItem onClick={handleExport} disabled={isExporting}>
      {isExporting ? 'Exporting...' : 'Export Session'}
    </MenubarItem>
  );
}

function ImportSessionButton() {
  const [, setIsOpen] = useAtom(OpenSessionAtom);

  return <MenubarItem onClick={() => setIsOpen(true)}>Import Session</MenubarItem>;
}

function ImportSessionDialog() {
  const [isOpen, setIsOpen] = useAtom(OpenSessionAtom);
  // TODO: there is a lot better way to do this with "useAsyncAction"-like hook
  // ...perhaps add that later and use it wherever we handle async actions
  const [status, setStatus] = useState<{ kind: 'loading' } | { kind: 'error'; message: string } | null>();

  useEffect(() => {
    if (isOpen) {
      setStatus(null);
    }
  }, [isOpen]);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      console.warn('No files accepted for import');
      setIsOpen(false);
      return;
    }
    setStatus({ kind: 'loading' });
    try {
      await importState(acceptedFiles[0]);
      setIsOpen(false);
    } catch (err) {
      console.error('Error importing session:', err);
      setStatus({ kind: 'error', message: 'Failed to import session. Please ensure the file is valid.' });
    } finally {
      setStatus(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled: status?.kind === 'loading',
    accept: {
      'application/octet-stream': [SessionFileExtension],
    },
  });

  return (
    <Dialog open={isOpen}>
      <DialogContent onClose={() => setIsOpen(false)}>
        <DialogHeader>
          <DialogTitle>Import Session</DialogTitle>
          <div className='space-y-4'>
            {status?.kind === 'error' && <p className='text-red-500'>{status.message}</p>}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors min-h-[200px] flex flex-col items-center justify-center ${
                isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className='h-12 w-12 text-gray-400 mb-4' />
              {isDragActive ? (
                <p className='text-blue-600'>Drop the file here...</p>
              ) : (
                <div className='space-y-2'>
                  <p className='text-gray-600'>Drag & drop session file here, or click to select files</p>
                  <p className='text-sm text-gray-400'>.mvsession</p>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
