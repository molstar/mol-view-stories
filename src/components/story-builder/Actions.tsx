import { useAuth } from '@/app/providers';
import { downloadStory, exportState, newStory } from '@/app/state/actions';
import { IsDirtyAtom, OpenSessionAtom, PublishModalAtom, StoryAtom } from '@/app/state/atoms';
import { openSaveDialog } from '@/app/state/save-dialog-actions';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  BookOpen,
  ChevronDownIcon,
  CloudIcon,
  Download,
  FileCodeIcon,
  FileType,
  Library,
  Plus,
  Share2Icon,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { TooltipWrapper } from '../common';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { ImportSessionDialog, SaveDialog } from './file-operations';
import { PublishModal } from './file-operations/PublishModal';
import { PublishedStoryModal } from './file-operations/PublishedStoryModal';

export function StoryActionButtons() {
  const auth = useAuth();
  const story = useAtomValue(StoryAtom);
  const setPublishModal = useSetAtom(PublishModalAtom);
  const setImportSessionModal = useSetAtom(OpenSessionAtom);

  const hasUnsavedChanges = useAtomValue(IsDirtyAtom);

  const handlePublishClick = () => {
    setPublishModal({
      isOpen: true,
      status: 'idle',
      data: {},
    });
  };

  return (
    <div className='flex gap-2'>
      {/* Export dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline' size='sm' className='relative'>
            <BookOpen className='size-4 mr-1' />
            Story
            <ChevronDownIcon className='size-3 ml-1' />
            {hasUnsavedChanges && (
              <div className='absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-background' />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem onClick={newStory}>
            <Plus className='size-4 mr-2' />
            New Story
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <TooltipWrapper
            side='left'
            tooltip={!auth.isAuthenticated ? 'You must be logged in to save sessions' : 'Save session to the cloud'}
          >
            <DropdownMenuItem onClick={openSaveDialog} disabled={!auth.isAuthenticated}>
              <CloudIcon className='size-4 mr-2' />
              Save Session
            </DropdownMenuItem>
          </TooltipWrapper>
          <DropdownMenuSeparator />
          <TooltipWrapper side='left' tooltip='Download session to your device'>
            <DropdownMenuItem
              onClick={async () => {
                try {
                  await exportState(story);
                } catch (error) {
                  toast.error('Export failed');
                  console.error('Export failed:', error);
                }
              }}
              disabled={!auth.isAuthenticated}
            >
              <Download className='size-4 mr-2' />
              Download Session
            </DropdownMenuItem>
          </TooltipWrapper>
          <TooltipWrapper side='left' tooltip='Open downloaded session file'>
            <DropdownMenuItem onClick={() => setImportSessionModal(true)}>
              <Upload className='size-4 mr-2' />
              Load Session
            </DropdownMenuItem>
          </TooltipWrapper>
          <DropdownMenuSeparator />
          <TooltipWrapper
            side='left'
            tooltip='Export the current story state as a MolViewSpec state openable in Mol* and other compatible viewers'
          >
            <DropdownMenuItem onClick={() => downloadStory(story, 'state')}>
              <FileType className='size-4 mr-2' />
              Export MolViewSpec State
            </DropdownMenuItem>
          </TooltipWrapper>
          <TooltipWrapper side='left' tooltip='Export the current story as a standalone HTML file'>
            <DropdownMenuItem onClick={() => downloadStory(story, 'html')}>
              <FileCodeIcon className='size-4 mr-2' />
              Export HTML
            </DropdownMenuItem>
          </TooltipWrapper>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Publish button - Green when shared, with yellow dot for changes */}
      <Tooltip delayDuration={250}>
        <TooltipTrigger asChild>
          <Button onClick={handlePublishClick} variant='default' size='sm' disabled={!auth.isAuthenticated}>
            <Share2Icon className='size-4 mr-1' />
            Publish
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {auth.isAuthenticated ? 'Share your session with others' : 'You must be logged in to share stories'}
        </TooltipContent>
      </Tooltip>

      <SaveDialog />
      <PublishModal />
      <PublishedStoryModal />
      <ImportSessionDialog />
    </div>
  );
}
