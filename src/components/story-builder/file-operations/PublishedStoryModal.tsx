'use client';

import { PublishedStoryModalAtom } from '@/app/state/atoms';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resolvePublicStoryUrl, resolveViewerUrl } from '@/lib/my-stories-api';
import { useStoryFormat } from '@/hooks/useStoriesQueries';
import { useAtom } from 'jotai';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export function PublishedStoryModal() {
  const [shareModal, setShareModal] = useAtom(PublishedStoryModalAtom);

  // Fetch the story format dynamically
  const { data: storyFormat, isLoading: isLoadingFormat } = useStoryFormat(shareModal.data?.itemId);

  const handleClose = () => {
    setShareModal((prev) => ({ ...prev, isOpen: false }));
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

  if (!shareModal.isOpen || !shareModal.data) {
    return null;
  }

  const publicUrl = resolvePublicStoryUrl(shareModal.data.itemId!);
  // Use the fetched format, fallback to 'mvsj' while loading
  const molstarUrl = resolveViewerUrl(shareModal.data.itemId!, storyFormat || 'mvsj');

  return (
    <Dialog open={shareModal.isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-w-md' onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>Published Story</DialogTitle>
          <DialogDescription>
            <b>{shareModal.data.itemTitle}</b> has been saved and is now publicly accessible.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='public-url'>Public URL</Label>
            <p className='text-xs text-muted-foreground'>Provides direct access to the story data</p>
            <div className='flex gap-2'>
              <Input id='public-url' value={publicUrl} readOnly className='font-mono text-sm' />
              <Button variant='outline' size='sm' onClick={() => copyToClipboard(publicUrl, 'Public URL')}>
                <Copy className='h-4 w-4' />
              </Button>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='molstar-url'>Mol* Stories Viewer URL</Label>
            <p className='text-xs text-muted-foreground'>
              Opens the story in the Mol* Stories Viewer
              {isLoadingFormat && <span className='ml-1'>(detecting format...)</span>}
              {storyFormat && <span className='ml-1'>({storyFormat.toUpperCase()} format)</span>}
            </p>
            <div className='flex gap-2'>
              <Input id='molstar-url' value={molstarUrl} readOnly className='font-mono text-sm' />
              <Button variant='outline' size='sm' onClick={() => copyToClipboard(molstarUrl, 'Mol* Viewer URL')}>
                <Copy className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>

        <Button asChild className='w-full'>
          <a href={molstarUrl} target='_blank' rel='noopener noreferrer'>
            <ExternalLink className='size-4 mr-2' />
            Open in Mol* Stories Viewer
          </a>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
