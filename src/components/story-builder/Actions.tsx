import { useAtomValue, useSetAtom } from 'jotai';
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
import { SaveDialog, ShareModal } from './file-operations';
import { openSaveDialog, shareStory } from '@/app/state/save-dialog-actions';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { StoryAtom, SharedStoryAtom, ShareModalAtom } from '@/app/state/atoms';
import { downloadStory, exportState, resetInitialStoryState } from '@/app/state/actions';

export function StoryActionButtons() {
  const auth = useAuth();
  const story = useAtomValue(StoryAtom);
  const sharedStory = useAtomValue(SharedStoryAtom);
  const setShareModal = useSetAtom(ShareModalAtom);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  
  const { hasUnsavedChanges } = useUnsavedChanges();

  const handleSaveClick = () => {
    if (!auth.isAuthenticated && hasUnsavedChanges) {
      // Show dialog that guides through local save → login → import flow
      setShowUnsavedDialog(true);
    } else if (auth.isAuthenticated) {
      // Always allow direct save for authenticated users
      openSaveDialog({ saveType: 'session' });
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

  const handleShareClick = async () => {
    if (sharedStory.isShared && !hasUnsavedChanges) {
      // Story is already shared and no changes have been made, show the share modal directly
      setShareModal({
        isOpen: true,
        itemId: sharedStory.storyId!,
        itemTitle: sharedStory.title!,
        itemType: 'story',
        publicUri: sharedStory.publicUri,
      });
    } else {
      // Story is not shared yet, or has been modified since last share, trigger the share process
      await shareStory();
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
            variant={sharedStory.isShared && !hasUnsavedChanges ? 'default' : 'outline'}
            size='sm'
            className={cn(
              'gap-1.5 text-sm font-medium',
              sharedStory.isShared && !hasUnsavedChanges && 'bg-green-600 hover:bg-green-700 text-white border-green-600'
            )}
            onClick={handleShareClick}
            disabled={!auth.isAuthenticated}
            title={!auth.isAuthenticated ? 'You must be logged in to share stories' : ''}
          >
            <LinkIcon className='size-4' />
            {sharedStory.isShared && !hasUnsavedChanges ? 'View Share' : 'Share'}
            {sharedStory.isShared && !hasUnsavedChanges && <span className='w-2 h-2 bg-white rounded-full' />}
            {hasUnsavedChanges && sharedStory.isShared && <span className='w-2 h-2 bg-amber-500 rounded-full' />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {auth.isAuthenticated 
            ? sharedStory.isShared && !hasUnsavedChanges
              ? `View sharing options for "${sharedStory.title}"` 
              : hasUnsavedChanges && sharedStory.isShared
              ? 'Story has been modified since last share. Click to share updated version.'
              : 'Share your session with others'
            : 'You must be logged in to share stories'
          }
        </TooltipContent>
      </Tooltip>

      <SaveDialog />
      <ShareModal />
      
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
