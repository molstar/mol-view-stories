'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, ExternalLink, Trash2, ArrowUpFromLine } from 'lucide-react';
import { toast } from 'sonner';
import { ShareModalAtom, HasStoryChangesSinceShareAtom, ConfirmationDialogAtom } from '@/app/state/atoms';
import { unshareStory, updateSharedStory } from '@/lib/content-crud';
import { useAuth } from '@/app/providers';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { API_CONFIG } from '@/lib/config';

export function ShareModal() {
  const shareModal = useAtomValue(ShareModalAtom);
  const setShareModal = useSetAtom(ShareModalAtom);
  const confirmationDialog = useAtomValue(ConfirmationDialogAtom);
  const setConfirmationDialog = useSetAtom(ConfirmationDialogAtom);
  const auth = useAuth();
  const hasStoryChangesSinceShare = useAtomValue(HasStoryChangesSinceShareAtom);

  const handleClose = () => {
    setShareModal(prev => ({ ...prev, isOpen: false }));
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  const openInMolstar = () => {
    if (!shareModal.data?.itemId) return;

    const publicUrl =
      shareModal.data.publicUri || `${API_CONFIG.baseUrl}/api/${shareModal.data.itemType}/${shareModal.data.itemId}/data?format=mvsj`;
    const molstarUrl = `https://molstar.org/demos/mvs-stories/?story-url=${encodeURIComponent(publicUrl)}`;
    window.open(molstarUrl, '_blank');
  };

  const handleUnshareConfirm = () => {
    if (!shareModal.data?.itemId) return;
    
    setConfirmationDialog({
      isOpen: true,
      type: 'unshare-share-modal',
      title: 'Remove',
      message: `Are you sure you want to remove the share for "${shareModal.data.itemTitle}"? This will permanently delete the public link and the story will no longer be accessible to others. Your saved session will not be affected.`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      data: { storyId: shareModal.data.itemId },
    });
  };

  const handleUpdateShare = async () => {
    if (!shareModal.data?.itemId || !auth.isAuthenticated) return;

    setConfirmationDialog(prev => ({ ...prev, data: { ...(prev.data as object || {}), isUpdating: true } }));
    try {
      const success = await updateSharedStory(shareModal.data.itemId, auth.isAuthenticated);
      if (success) {
        handleClose();
      }
    } catch {
      toast.error('Failed to update shared story');
    } finally {
      setConfirmationDialog(prev => ({ ...prev, data: { ...(prev.data as object || {}), isUpdating: false } }));
    }
  };

  const handleConfirmationAction = async () => {
    if (confirmationDialog.type === 'unshare-share-modal') {
      const storyId = (confirmationDialog.data as { storyId?: string })?.storyId;
      if (!storyId || !auth.isAuthenticated) return;

      setConfirmationDialog(prev => ({ ...prev, data: { ...(prev.data as object || {}), isLoading: true } }));
      try {
        const success = await unshareStory(storyId, auth.isAuthenticated);
        if (success) {
          setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
          handleClose();
        }
      } catch {
        toast.error('Failed to unshare story');
      } finally {
        setConfirmationDialog(prev => ({ ...prev, data: { ...(prev.data as object || {}), isLoading: false } }));
      }
    }
  };

  if (!shareModal.isOpen || !shareModal.data) {
    return null;
  }

  const publicUrl =
    shareModal.data.publicUri || `${API_CONFIG.baseUrl}/api/${shareModal.data.itemType}/${shareModal.data.itemId}/data?format=mvsj`;
  const molstarUrl = `https://molstar.org/demos/mvs-stories/?story-url=${encodeURIComponent(publicUrl)}`;

  const isUpdating = (confirmationDialog.data as { isUpdating?: boolean })?.isUpdating || false;
  const isUnsharing = (confirmationDialog.data as { isLoading?: boolean })?.isLoading || false;

  return (
    <>
      <Dialog open={shareModal.isOpen} onOpenChange={handleClose}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <ExternalLink className='h-5 w-5' />
              &ldquo;{shareModal.data.itemTitle}&rdquo; Story
            </DialogTitle>
            <DialogDescription>
              This {shareModal.data.itemType} has been saved and is now publicly accessible. Share the URL below or open it
              directly in Mol*. You can also update the shared content with your current changes.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='public-url'>Public URL</Label>
              <div className='flex gap-2'>
                <Input id='public-url' value={publicUrl} readOnly className='font-mono text-sm' />
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => copyToClipboard(publicUrl, 'Public URL')}
                >
                  <Copy className='h-4 w-4' />
                </Button>
              </div>
              <p className='text-xs text-muted-foreground'>This URL provides direct access to the molecular data</p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='molstar-url'>Mol* Viewer URL</Label>
              <div className='flex gap-2'>
                <Input id='molstar-url' value={molstarUrl} readOnly className='font-mono text-sm' />
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => copyToClipboard(molstarUrl, 'Mol* Viewer URL')}
                >
                  <Copy className='h-4 w-4' />
                </Button>
              </div>
              <p className='text-xs text-muted-foreground'>Opens the story in the interactive Molstar viewer</p>
            </div>
          </div>

          <div className='flex flex-col gap-2 pt-4'>
            <Button onClick={openInMolstar} className='w-full'>
              <ExternalLink className='size-4' />
              Open in Mol*
            </Button>

            <div className='flex gap-2'>
              <Tooltip delayDuration={250}>
                <TooltipTrigger asChild>
                  <Button
                    variant='outline'
                    onClick={handleUpdateShare}
                    disabled={isUpdating || !auth.isAuthenticated || !hasStoryChangesSinceShare}
                    className='flex-1'
                  >
                    <ArrowUpFromLine className='size-4' />
                    {isUpdating ? 'Updating...' : 'Update'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {!auth.isAuthenticated
                    ? 'You must be logged in to update stories'
                    : !hasStoryChangesSinceShare
                      ? 'No changes to update'
                      : 'Update the shared story with your current changes'}
                </TooltipContent>
              </Tooltip>

              <Button
                variant='destructive'
                onClick={handleUnshareConfirm}
                disabled={!auth.isAuthenticated}
                className='flex-1'
              >
                <Trash2 className='size-4' />
                Remove
              </Button>

              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmationDialog.isOpen && confirmationDialog.type === 'unshare-share-modal'}
        onOpenChange={(open) => setConfirmationDialog(prev => ({ ...prev, isOpen: open }))}
        title={confirmationDialog.title}
        description={confirmationDialog.message}
        confirmText={confirmationDialog.confirmText}
        cancelText={confirmationDialog.cancelText}
        onConfirm={handleConfirmationAction}
        isDestructive={true}
        isLoading={isUnsharing}
      />
    </>
  );
}
