'use client';

import { useAtomValue } from 'jotai';
import { getDefaultStore } from 'jotai';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ShareModalAtom, HasStoryChangesSinceShareAtom } from '@/app/state/atoms';
import { API_CONFIG } from '@/lib/config';
import { Copy, ExternalLink, CheckIcon, Trash2, LinkIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { unshareStory, updateSharedStory } from '@/app/state/actions';
import { useAuth } from '@/app/providers';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

export function ShareModal() {
  const shareModal = useAtomValue(ShareModalAtom);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isUnsharing, setIsUnsharing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUnshareConfirm, setShowUnshareConfirm] = useState(false);
  const auth = useAuth();
  const { hasUnsavedChanges } = useUnsavedChanges();
  const hasStoryChangesSinceShare = useAtomValue(HasStoryChangesSinceShareAtom);

  const handleClose = () => {
    const store = getDefaultStore();
    store.set(ShareModalAtom, {
      isOpen: false,
      itemId: null,
      itemTitle: '',
      itemType: 'story',
      publicUri: undefined,
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUrl(text);
      toast.success(`${label} copied to clipboard!`);
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  const openInMolstar = () => {
    if (!shareModal.itemId) return;
    
    const publicUrl = shareModal.publicUri || `${API_CONFIG.baseUrl}/api/${shareModal.itemType}/${shareModal.itemId}/data?format=mvsj`;
    const molstarUrl = `https://molstar.org/demos/mvs-stories/?story-url=${encodeURIComponent(publicUrl)}`;
    window.open(molstarUrl, '_blank');
  };

  const handleUnshare = async () => {
    if (!shareModal.itemId || !auth.isAuthenticated) return;
    
    setIsUnsharing(true);
    try {
      const success = await unshareStory(shareModal.itemId, auth.isAuthenticated);
      if (success) {
        handleClose();
      }
    } finally {
      setIsUnsharing(false);
    }
  };

  const handleUpdateShare = async () => {
    if (!shareModal.itemId || !auth.isAuthenticated) return;
    
    setIsUpdating(true);
    try {
      const success = await updateSharedStory(shareModal.itemId, auth.isAuthenticated);
      if (success) {
        handleClose();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  if (!shareModal.isOpen || !shareModal.itemId) {
    return null;
  }

  const publicUrl = shareModal.publicUri || `${API_CONFIG.baseUrl}/api/${shareModal.itemType}/${shareModal.itemId}/data?format=mvsj`;
  const molstarUrl = `https://molstar.org/demos/mvs-stories/?story-url=${encodeURIComponent(publicUrl)}`;

  return (
    <Dialog open={shareModal.isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <ExternalLink className='size-5' />
            &ldquo;{shareModal.itemTitle}&rdquo; Story
          </DialogTitle>
          <DialogDescription>
            This {shareModal.itemType} has been saved and is now publicly accessible. 
            Share the URL below or open it directly in Mol*. You can also update the shared content with your current changes.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='public-url'>Public URL</Label>
            <div className='flex gap-2'>
              <Input
                id='public-url'
                value={publicUrl}
                readOnly
                className='font-mono text-sm'
              />
              <Button
                variant='outline'
                size='sm'
                onClick={() => copyToClipboard(publicUrl, 'URL')}
                className='flex-shrink-0'
              >
                {copiedUrl === publicUrl ? (
                  <CheckIcon className='size-4 text-green-600' />
                ) : (
                  <Copy className='size-4' />
                )}
              </Button>
            </div>
            <p className='text-xs text-muted-foreground'>
              This URL provides direct access to the molecular data
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='molstar-url'>Mol* Viewer URL</Label>
            <div className='flex gap-2'>
              <Input
                id='molstar-url'
                value={molstarUrl}
                readOnly
                className='font-mono text-sm'
              />
              <Button
                variant='outline'
                size='sm'
                onClick={() => copyToClipboard(molstarUrl, 'Molstar URL')}
                className='flex-shrink-0'
              >
                {copiedUrl === molstarUrl ? (
                  <CheckIcon className='size-4 text-green-600' />
                ) : (
                  <Copy className='size-4' />
                )}
              </Button>
            </div>
            <p className='text-xs text-muted-foreground'>
              Opens the story in the interactive Molstar viewer
            </p>
          </div>
        </div>

        <div className='flex justify-between pt-4'>
          <Button variant='outline' onClick={openInMolstar} className='gap-2'>
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
                  className='gap-2'
                >
                  <LinkIcon className='size-4' />
                  {isUpdating ? 'Updating...' : 'Update'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {!auth.isAuthenticated 
                  ? 'You must be logged in to update stories'
                  : !hasStoryChangesSinceShare
                  ? 'No changes to update'
                  : 'Update the shared story with your current changes'
                }
              </TooltipContent>
            </Tooltip>
            
            <Button 
              variant='destructive' 
              onClick={() => setShowUnshareConfirm(true)}
              disabled={!auth.isAuthenticated}
              className='gap-2'
            >
              <Trash2 className='size-4' />
              Remove
            </Button>
            
            <Button onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
      
      <ConfirmDialog
        open={showUnshareConfirm}
        onOpenChange={setShowUnshareConfirm}
        title="Remove"
        description={`Are you sure you want to remove the share for "${shareModal.itemTitle}"? This will permanently delete the public link and the story will no longer be accessible to others. Your saved session will not be affected.`}
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={handleUnshare}
        isDestructive={true}
        isLoading={isUnsharing}
      />
    </Dialog>
  );
} 