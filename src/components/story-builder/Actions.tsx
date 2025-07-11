import { StoryAtom, downloadStory, exportState } from '@/app/appstate';
import { useAtomValue } from 'jotai';
import { DownloadIcon, ChevronDownIcon, LinkIcon, CloudIcon } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useAuth } from '@/app/providers';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { SaveDialog } from './file-operations/SaveDialog';
import { openSaveDialog } from '@/app/state/save-dialog-actions';
import { useSearchParams } from 'next/navigation';

export function StoryActionButtons() {
  const auth = useAuth();
  const story = useAtomValue(StoryAtom);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId') ?? undefined;

  return (
    <div className='flex gap-2'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline' size='sm' className='gap-1.5 text-sm font-medium'>
            <DownloadIcon className='size-4' />
            Export
            <ChevronDownIcon className='size-3.5 opacity-60' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='min-w-[160px]'>
          <DropdownMenuItem onClick={() => downloadStory(story, 'state')} className='gap-2'>
            <DownloadIcon className='size-4' />
            Download MolViewSpec
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => downloadStory(story, 'html')} className='gap-2'>
            <DownloadIcon className='size-4' />
            Download HTML
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => exportState(story)} className='gap-2'>
            <DownloadIcon className='size-4' />
            Download Session
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Tooltip delayDuration={250}>
        <TooltipTrigger asChild>
          <Button
            variant='outline'
            size='sm'
            className='gap-1.5 text-sm font-medium'
            onClick={() => openSaveDialog({ saveType: 'session', sessionId })}
            disabled={!auth.isAuthenticated}
          >
            <CloudIcon className='size-4' />
            Save
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {auth.isAuthenticated ? 'Save your session to the cloud' : 'You must be logged in to save sessions'}
        </TooltipContent>
      </Tooltip>

      <Tooltip delayDuration={250}>
        <TooltipTrigger asChild>
          <Button
            variant='outline'
            size='sm'
            className='gap-1.5 text-sm font-medium'
            onClick={() => openSaveDialog({ saveType: 'state' })}
            disabled={!auth.isAuthenticated}
            title={!auth.isAuthenticated ? 'You must be logged in to share stories' : ''}
          >
            <LinkIcon className='size-4' />
            Share
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {auth.isAuthenticated ? 'Share your session with others' : 'You must be logged in to share stories'}
        </TooltipContent>
      </Tooltip>

      <SaveDialog />
    </div>
  );
}
