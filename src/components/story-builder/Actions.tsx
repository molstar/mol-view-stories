import { useAtomValue, useSetAtom } from 'jotai';
import {
  DownloadIcon,
  ArrowUpFromLineIcon,
  ChevronDownIcon,
  LinkIcon,
  CloudIcon,
  AlertCircle,
  Trash2,
  ScanEyeIcon,
} from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { StoryAtom, SharedStoryAtom, ShareModalAtom, HasStoryChangesSinceShareAtom, ConfirmationDialogAtom } from '@/app/state/atoms';
import {
  downloadStory,
  exportState,
  resetInitialStoryState,
} from '@/app/state/actions';
import { unshareStory, updateSharedStory } from '@/lib/content-crud';
import { ConfirmDialog } from '../ui/confirm-dialog';

export function StoryActionButtons() {
  const auth = useAuth();
  const story = useAtomValue(StoryAtom);
  const sharedStory = useAtomValue(SharedStoryAtom);
  const setShareModal = useSetAtom(ShareModalAtom);
  const confirmationDialog = useAtomValue(ConfirmationDialogAtom);
  const setConfirmationDialog = useSetAtom(ConfirmationDialogAtom);

  const { hasUnsavedChanges } = useUnsavedChanges();
  const hasStoryChangesSinceShare = useAtomValue(HasStoryChangesSinceShareAtom);

  const handleSaveClick = () => {
    if (!auth.isAuthenticated) {
      setConfirmationDialog({
        isOpen: true,
        type: 'unsaved-changes',
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Choose how to preserve your work.',
        confirmText: 'Save to Cloud',
        cancelText: 'Cancel',
        data: { hasUnsavedChanges: true },
      });
    } else {
      openSaveDialog({ saveType: 'session' });
    }
  };

  const handleShareClick = async () => {
    if (sharedStory.isShared) {
      setShareModal({
        isOpen: true,
        status: 'idle',
        data: {
          itemId: sharedStory.storyId!,
          itemTitle: sharedStory.title!,
          itemType: 'story',
          publicUri: sharedStory.publicUri,
        },
      });
    } else {
      await shareStory();
    }
  };

  const handleViewShare = () => {
    setShareModal({
      isOpen: true,
      status: 'idle',
      data: {
        itemId: sharedStory.storyId!,
        itemTitle: sharedStory.title!,
        itemType: 'story',
        publicUri: sharedStory.publicUri,
      },
    });
  };

  const handleUnshareConfirm = () => {
    setConfirmationDialog({
      isOpen: true,
      type: 'unshare-story',
      title: 'Remove',
      message: `Are you sure you want to remove the share for "${sharedStory.title}"? This will permanently delete the public link and the story will no longer be accessible to others. Your saved session will be unaffected.`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      data: { storyId: sharedStory.storyId },
    });
  };

  const handleUpdateShare = async () => {
    if (!sharedStory.storyId || !auth.isAuthenticated) return;

    setConfirmationDialog(prev => ({ ...prev, data: { ...(prev.data as object || {}), isUpdating: true } }));
    try {
      const success = await updateSharedStory(sharedStory.storyId, auth.isAuthenticated);
      if (success) {
        // Success is handled by the action
      }
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setConfirmationDialog(prev => ({ ...prev, data: { ...(prev.data as object || {}), isUpdating: false } }));
    }
  };

  const handleConfirmationAction = async () => {
    if (confirmationDialog.type === 'unshare-story') {
      const storyId = (confirmationDialog.data as { storyId?: string })?.storyId;
      if (!storyId || !auth.isAuthenticated) return;

      setConfirmationDialog(prev => ({ ...prev, data: { ...(prev.data as object || {}), isLoading: true } }));
      try {
        const success = await unshareStory(storyId, auth.isAuthenticated);
        if (success) {
          setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
        }
      } catch (error) {
        console.error('Unshare failed:', error);
      } finally {
        setConfirmationDialog(prev => ({ ...prev, data: { ...(prev.data as object || {}), isLoading: false } }));
      }
    } else if (confirmationDialog.type === 'unsaved-changes') {
      // Handle unsaved changes confirmation
      if (!auth.isAuthenticated) {
        try {
          const result = await auth.signinPopup();
          if (result.success) {
            openSaveDialog({ saveType: 'session' });
            setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
          }
        } catch (error) {
          console.error('Login failed:', error);
        }
      }
    }
  };

  const isUpdating = (confirmationDialog.data as { isUpdating?: boolean })?.isUpdating || false;
  const isUnsharing = (confirmationDialog.data as { isLoading?: boolean })?.isLoading || false;

  return (
    <div className='flex gap-2'>
      {/* Unsaved changes indicator button */}
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
              onClick={handleSaveClick}
            >
              <AlertCircle className='size-4' />
              Unsaved Changes
            </Button>
          </TooltipTrigger>
          <TooltipContent>You have unsaved changes. Log in to save or export.</TooltipContent>
        </Tooltip>
      )}

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
                resetInitialStoryState();
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

      {/* Share button - Green when shared, with yellow dot for changes */}
      {!sharedStory.isShared ? (
        <Tooltip delayDuration={250}>
          <TooltipTrigger asChild>
            <Button
              onClick={handleShareClick}
              variant='outline'
              size='sm'
              disabled={!auth.isAuthenticated}
            >
              <LinkIcon className='size-4 mr-1.5' />
              Share
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {auth.isAuthenticated ? 'Share your session with others' : 'You must be logged in to share stories'}
          </TooltipContent>
        </Tooltip>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size='sm'
              className={cn(
                'bg-green-600 hover:bg-green-700 text-white relative',
                hasStoryChangesSinceShare && 'pr-7' // Add padding for dot
              )}
            >
              <LinkIcon className='size-4 mr-1.5' />
              Shared
              <ChevronDownIcon className='size-3 ml-1' />
              {hasStoryChangesSinceShare && (
                <div className='absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-background' />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={handleViewShare} className='gap-2'>
              <ScanEyeIcon className='size-4' />
              View
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleUpdateShare}
              disabled={isUpdating || !hasStoryChangesSinceShare}
              className='gap-2'
            >
              <ArrowUpFromLineIcon className='size-4' />
              {isUpdating ? 'Updating...' : 'Update'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleUnshareConfirm}
              className='gap-2 text-destructive focus:text-destructive'
            >
              <Trash2 className='size-4' />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <SaveDialog />
      <ShareModal />

      {/* Unified Confirmation Dialog */}
      <ConfirmDialog
        open={confirmationDialog.isOpen}
        onOpenChange={(open) => setConfirmationDialog(prev => ({ ...prev, isOpen: open }))}
        title={confirmationDialog.title}
        description={confirmationDialog.message}
        confirmText={confirmationDialog.confirmText}
        cancelText={confirmationDialog.cancelText}
        onConfirm={handleConfirmationAction}
        isDestructive={confirmationDialog.type === 'unshare-story'}
        isLoading={isUnsharing}
      />

      {/* Unsaved Changes Dialog - Custom component for complex unsaved changes flow */}
      <UnsavedChangesDialog
        isOpen={confirmationDialog.isOpen && confirmationDialog.type === 'unsaved-changes'}
        onClose={() => setConfirmationDialog(prev => ({ ...prev, isOpen: false }))}
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
