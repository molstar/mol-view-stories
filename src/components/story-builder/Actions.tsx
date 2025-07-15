import { useAtomValue } from 'jotai';
import { DownloadIcon, ChevronDownIcon, LinkIcon, CloudIcon, AlertCircle } from 'lucide-react';
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
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { StoryAtom } from '@/app/state/atoms';
import { downloadStory, exportState, resetInitialStoryState } from '@/app/state/actions';

export function StoryActionButtons() {
  const auth = useAuth();
  const story = useAtomValue(StoryAtom);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId') ?? undefined;
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  
  const { hasUnsavedChanges } = useUnsavedChanges();

  const handleSaveClick = () => {
    if (!auth.isAuthenticated && hasUnsavedChanges) {
      // Show dialog that guides through local save → login → import flow
      setShowUnsavedDialog(true);
    } else if (auth.isAuthenticated) {
      // Always allow direct save for authenticated users
      openSaveDialog({ saveType: 'session', sessionId });
    }
    // Note: If !auth.isAuthenticated && !hasUnsavedChanges, button is disabled
  };

  const handleExportSession = async () => {
    try {
      await exportState(story);
      // Mark changes as saved since user has successfully exported
      resetInitialStoryState();
    } catch (error) {
      console.error('Export session failed:', error);
    }
  };

  return (
    <div className='flex gap-2'>
      {/* Unsaved changes indicator */}
      {hasUnsavedChanges && (
        <Tooltip delayDuration={250}>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              className={cn(
                'gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700',
                'hover:bg-amber-50 border border-amber-200'
              )}
              onClick={() => setShowUnsavedDialog(true)}
            >
              <AlertCircle className='size-4' />
              Unsaved Changes
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            You have unsaved changes. Click to save or export.
          </TooltipContent>
        </Tooltip>
      )}

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
          <DropdownMenuItem onClick={handleExportSession} className='gap-2'>
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
            onClick={handleSaveClick}
            disabled={!auth.isAuthenticated}
          >
            <CloudIcon className='size-4' />
            Save
            {hasUnsavedChanges && <span className='w-2 h-2 bg-amber-500 rounded-full' />}
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
      
      <UnsavedChangesDialog
        isOpen={showUnsavedDialog}
        onClose={() => setShowUnsavedDialog(false)}
        onLoginAndSave={() => {
          // After login, the user can manually save
          setShowUnsavedDialog(false);
        }}
        onExportLocally={() => {
          // Export is handled in the dialog
        }}
        onDiscardChanges={() => {
          // Changes are now properly discarded in the dialog
        }}
      />
    </div>
  );
}
