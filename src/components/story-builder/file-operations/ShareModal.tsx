'use client';

import { useAtomValue } from 'jotai';
import { getDefaultStore } from 'jotai';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShareModalAtom } from '@/app/state/atoms';
import { API_CONFIG } from '@/lib/config';
import { Copy, ExternalLink, CheckIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function ShareModal() {
  const shareModal = useAtomValue(ShareModalAtom);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleClose = () => {
    const store = getDefaultStore();
    store.set(ShareModalAtom, {
      isOpen: false,
      itemId: null,
      itemTitle: '',
      itemType: 'state',
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUrl(text);
      toast.success(`${label} copied to clipboard!`);
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  const openInMolstar = () => {
    if (!shareModal.itemId) return;
    
    const molstarUrl = `https://molstar.org/demos/mvs-stories/?story-url=${API_CONFIG.baseUrl}/api/${shareModal.itemType}/${shareModal.itemId}/data?format=mvsj`;
    window.open(molstarUrl, '_blank');
  };

  if (!shareModal.isOpen || !shareModal.itemId) {
    return null;
  }

  const publicUrl = `${API_CONFIG.baseUrl}/api/${shareModal.itemType}/${shareModal.itemId}/data?format=mvsj`;
  const molstarUrl = `https://molstar.org/demos/mvs-stories/?story-url=${API_CONFIG.baseUrl}/api/${shareModal.itemType}/${shareModal.itemId}/data?format=mvsj`;

  return (
    <Dialog open={shareModal.isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <ExternalLink className='size-5' />
            Share "{shareModal.itemTitle}"
          </DialogTitle>
          <DialogDescription>
            Your {shareModal.itemType} has been saved and is now publicly accessible. 
            Share the URL below or open it directly in Molstar.
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
            <Label htmlFor='molstar-url'>Molstar Viewer URL</Label>
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
            Open in Molstar
          </Button>
          
          <Button onClick={handleClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 