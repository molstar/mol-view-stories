import { useAtomValue, useSetAtom } from 'jotai';
import { DownloadIcon, ArrowUpFromLineIcon,ChevronDownIcon, LinkIcon, CloudIcon, AlertCircle, Trash2, ScanEyeIcon } from 'lucide-react';
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
import { StoryAtom, SharedStoryAtom, ShareModalAtom, HasStoryChangesSinceShareAtom } from '@/app/state/atoms';
import { downloadStory, exportState, resetInitialStoryState, unshareStory, updateSharedStory } from '@/app/state/actions';
import { ConfirmDialog } from '../ui/confirm-dialog';

export function StoryActionButtons() {
  const auth = useAuth();
  const story = useAtomValue(StoryAtom);
  const sharedStory = useAtomValue(SharedStoryAtom);
  const setShareModal = useSetAtom(ShareModalAtom);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showUnshareConfirm, setShowUnshareConfirm] = useState(false);
  const [isUnsharing, setIsUnsharing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { hasUnsavedChanges } = useUnsavedChanges();
  const hasStoryChangesSinceShare = useAtomValue(HasStoryChangesSinceShareAtom);

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
    if (sharedStory.isShared) {
      // Story is already shared, always show the share modal
      setShareModal({
        isOpen: true,
        itemId: sharedStory.storyId!,
        itemTitle: sharedStory.title!,
        itemType: 'story',
        publicUri: sharedStory.publicUri,
      });
    } else {
      // Story is not shared yet, trigger the share process
      await shareStory();
    }
  };

  const handleUnshare = async () => {
    if (!sharedStory.storyId || !auth.isAuthenticated) return;
    
    setIsUnsharing(true);
    try {
      const success = await unshareStory(sharedStory.storyId, auth.isAuthenticated);
      if (success) {
        setShowUnshareConfirm(false);
      }
    } finally {
      setIsUnsharing(false);
    }
  };

  const handleUpdateShare = async () => {
    if (!sharedStory.storyId || !auth.isAuthenticated) return;
    
    setIsUpdating(true);
    try {
      const success = await updateSharedStory(sharedStory.storyId, auth.isAuthenticated);
      if (success) {
        // Close the share modal if it's open
        setShareModal({
          isOpen: false,
          itemId: null,
          itemTitle: '',
          itemType: 'story',
          publicUri: undefined,
        });
      }
    } finally {
      setIsUpdating(false);
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
            You have unsaved changes. Log in to save or export.
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

      {sharedStory.isShared ? (
        // Dropdown menu for shared stories
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='default'
              size='sm'
              className='gap-1.5 text-sm font-medium bg-green-600 hover:bg-green-700 text-white border-green-600'
              disabled={!auth.isAuthenticated}
            >
              <LinkIcon className='size-4' />
              View Share
              <span className='w-2 h-2 bg-white rounded-full' />
              {hasStoryChangesSinceShare && <span className='w-2 h-2 bg-amber-500 rounded-full' />}
              <ChevronDownIcon className='size-3.5 opacity-60' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='min-w-[160px]'>
            <DropdownMenuItem onClick={handleShareClick} className='gap-2'>
              <ScanEyeIcon className='size-4' />
              View
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleUpdateShare}
              disabled={isUpdating || !hasStoryChangesSinceShare}
              className='gap-2'
              title={!hasStoryChangesSinceShare ? 'No changes to update' : ''}
            >
              <ArrowUpFromLineIcon className='size-4' />
              {isUpdating ? 'Updating...' : 'Update'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setShowUnshareConfirm(true)} 
              className='gap-2 text-destructive focus:text-destructive'
            >
              <Trash2 className='size-4' />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        // Regular button for unshared stories
        <Tooltip delayDuration={250}>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              className='gap-1.5 text-sm font-medium'
              onClick={handleShareClick}
              disabled={!auth.isAuthenticated}
              title={!auth.isAuthenticated ? 'You must be logged in to share stories' : ''}
            >
              <LinkIcon className='size-4' />
              Share
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {auth.isAuthenticated 
              ? 'Share your session with others'
              : 'You must be logged in to share stories'
            }
          </TooltipContent>
        </Tooltip>
      )}

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
      
      <ConfirmDialog
        open={showUnshareConfirm}
        onOpenChange={setShowUnshareConfirm}
        title="Remove"
        description={`Are you sure you want to remove the share for "${sharedStory.title}"? This will permanently delete the public link and the story will no longer be accessible to others. Your saved session will be unaffected.`}
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={handleUnshare}
        isDestructive={true}
        isLoading={isUnsharing}
      />
    </div>
  );
}
