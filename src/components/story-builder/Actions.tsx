import { useAuth } from '@/app/providers';
import { downloadStory, exportState } from '@/app/state/actions';
import { IsDirtyAtom, PublishModalAtom, StoryAtom } from '@/app/state/atoms';
import { openSaveDialog } from '@/app/state/save-dialog-actions';
import { cn } from '@/lib/utils';
import { useAtomValue, useSetAtom } from 'jotai';
import { ArrowUpFromLineIcon, ChevronDownIcon, CloudIcon, DownloadIcon, Share2Icon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { SaveDialog } from './file-operations';
import { PublishModal } from './file-operations/PublishModal';
import { PublishedStoryModal } from './file-operations/PublishedStoryModal';

export function StoryActionButtons() {
  const auth = useAuth();
  const story = useAtomValue(StoryAtom);
  const setPublishModal = useSetAtom(PublishModalAtom);

  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const hasUnsavedChanges = useAtomValue(IsDirtyAtom);

  const handleSaveClick = () => {
    openSaveDialog({ saveType: 'session', sessionId });
  };

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
          <Button variant='outline' size='sm'>
            <DownloadIcon className='size-4 mr-1.5' />
            Export
            <ChevronDownIcon className='size-3 ml-1' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem
            onClick={async () => {
              try {
                await exportState(story);
              } catch (error) {
                console.error('Export failed:', error);
              }
            }}
          >
            <DownloadIcon className='size-4 mr-2' />
            Export Session (.mvs)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => downloadStory(story, 'html')}>
            <ArrowUpFromLineIcon className='size-4 mr-2' />
            Export Story (.html)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save button with yellow dot indicator for unsaved changes */}
      <Tooltip delayDuration={250}>
        <TooltipTrigger asChild>
          <Button
            onClick={handleSaveClick}
            size='sm'
            className={cn(
              'relative',
              hasUnsavedChanges && 'pr-7' // Add padding for dot
            )}
            variant='outline'
          >
            <CloudIcon className='size-4 mr-1.5' />
            Save
            {hasUnsavedChanges && (
              <div className='absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-background' />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {auth.isAuthenticated
            ? 'Save your session to the cloud'
            : hasUnsavedChanges
              ? 'Save your changes locally first, then log in to upload to cloud'
              : 'You must be logged in to save sessions'}
        </TooltipContent>
      </Tooltip>

      {/* Publish button - Green when shared, with yellow dot for changes */}
      <Tooltip delayDuration={250}>
        <TooltipTrigger asChild>
          <Button onClick={handlePublishClick} variant='default' size='sm' disabled={!auth.isAuthenticated}>
            <Share2Icon className='size-4 mr-1.5' />
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
    </div>
  );
}
