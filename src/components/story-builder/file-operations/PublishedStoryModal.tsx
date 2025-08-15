'use client';

import { PublishedStoryModalAtom } from '@/app/state/atoms';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { resolvePublicStoryUrl, resolveViewerUrl, resolveSessionBuilderUrl } from '@/lib/my-stories-api';
import { useStoryFormat } from '@/hooks/useStoriesQueries';
import { API_CONFIG } from '@/lib/config';
import { useAtom } from 'jotai';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export function PublishedStoryModal() {
  const [shareModal, setShareModal] = useAtom(PublishedStoryModalAtom);

  // Fetch the story format dynamically only when dialog is open
  const { data: storyFormat, isLoading: isLoadingFormat } = useStoryFormat(
    shareModal.isOpen ? shareModal.data?.itemId : null
  );

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
  // Create public session URL
  const sessionUrl = `${API_CONFIG.baseUrl}/api/story/${shareModal.data.itemId}/session-data`;
  // Create session builder URL pointing to production MolViewStories
  const sessionBuilderUrl = resolveSessionBuilderUrl(shareModal.data.itemId!);

  const openSessionInViewer = async () => {
    try {
      // Check if session data is available
      const response = await fetch(sessionUrl, { method: 'HEAD' });
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Session data not available for this story');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      // Open in production mol-view-stories builder (external link)
      window.open(sessionBuilderUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Failed to load session:', error);
      toast.error('Failed to load session data');
    }
  };

  return (
    <Dialog open={shareModal.isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-w-md pb-7' onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>Published Story</DialogTitle>
          <DialogDescription>
            <b>{shareModal.data.itemTitle}</b> has been saved and is publicly accessible.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue='viewer' className='space-y-4'>
          <TabsList className='mt-2 w-full flex'>
            <TabsTrigger value='viewer'>Story Viewer</TabsTrigger>
            <TabsTrigger value='links'>Data Links</TabsTrigger>
          </TabsList>
          <TabsContent value='viewer' className='space-y-4 !flex-none -mb-1'>
            {!isLoadingFormat && (
              <div className='space-y-2'>
                <Label htmlFor='molstar-url'>Stories Viewer URL</Label>
                <p className='text-xs text-muted-foreground'>
                  Opens the story in the Mol* Stories Viewer
                  {storyFormat && <span className='ml-1'>({storyFormat.toUpperCase()} format)</span>}
                </p>
                <div className='flex gap-2'>
                  <Input id='molstar-url' value={molstarUrl} readOnly className='font-mono text-sm' />
                  <Button variant='outline' size='sm' onClick={() => copyToClipboard(molstarUrl, 'Stories Viewer URL')}>
                    <Copy className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            )}

            <div className='flex gap-2 mb-0'>
              <Button asChild className='flex-1' disabled={isLoadingFormat}>
                <a href={molstarUrl} target='_blank' rel='noopener noreferrer'>
                  <ExternalLink className='size-4 mr-2' />
                  {isLoadingFormat ? 'Detecting format...' : 'Open Story'}
                </a>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value='links' className='space-y-4 !flex-none'>
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
              <Label htmlFor='session-url'>Public Session URL</Label>
              <p className='text-xs text-muted-foreground'>Provides direct access to the session data</p>
              <div className='flex gap-2'>
                <Input id='session-url' value={sessionUrl} readOnly className='font-mono text-sm' />
                <Button variant='outline' size='sm' onClick={() => copyToClipboard(sessionUrl, 'Session URL')}>
                  <Copy className='h-4 w-4' />
                </Button>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='session-builder-url'>Session Builder URL</Label>
              <p className='text-xs text-muted-foreground'>Open this session in the mol-view-stories builder</p>
              <div className='flex gap-2'>
                <Input id='session-builder-url' value={sessionBuilderUrl} readOnly className='font-mono text-sm' />
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => copyToClipboard(sessionBuilderUrl, 'Session Builder URL')}
                >
                  <Copy className='h-4 w-4' />
                </Button>
              </div>
            </div>

            <div className='flex gap-2 mb-1'>
              <Button variant='outline' className='flex-1' onClick={openSessionInViewer}>
                <ExternalLink className='size-4 mr-2' />
                Open Session
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
