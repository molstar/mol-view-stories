'use client';

import { useAuth } from '@/app/providers';
import { PublishModalAtom, StoryAtom } from '@/app/state/atoms';
import { publishStory } from '@/app/state/save-dialog-actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAtom, useAtomValue } from 'jotai';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

export function PublishModal() {
  const story = useAtomValue(StoryAtom);
  const [publishModal, setState] = useAtom(PublishModalAtom);
  const auth = useAuth();

  const handleClose = () => {
    setState((prev) => ({ ...prev, isOpen: false }));
  };

  const publish = async () => {
    if (!auth.isAuthenticated) {
      toast.error('You must be logged in to publish stories');
      return;
    }
    try {
      setState((prev) => ({ ...prev, status: 'processing' }));
      await publishStory({ storyId: publishModal.data?.overwriteId ?? undefined });
      setState((prev) => ({ ...prev, isOpen: false }));
    } catch (err) {
      console.error('Failed to publish story: ', err);
      toast.error(`Failed to publish the story`);
    } finally {
      setState((prev) => ({ ...prev, status: 'idle' }));
    }
  };

  if (!publishModal.isOpen || !publishModal.data) {
    return null;
  }

  return (
    <Dialog open={publishModal.isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-w-md' onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>Publish Story</DialogTitle>
          <DialogDescription>
            Publish <b>{story.metadata.title}</b> to the cloud to make it accessible to anyone with a link
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div>Publish as a new story</div>
          <div>TODO: add dropdown to select a story to overwrite -- use title as initial guess?</div>
        </div>

        <DialogFooter>
          <Button variant='default' onClick={publish} disabled={publishModal.status === 'processing'}>
            <Share2 className='size-4' />
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
