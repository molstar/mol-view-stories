'use client';

import { useAuth } from '@/app/providers';
import { PublishModalAtom, StoryAtom } from '@/app/state/atoms';
import { usePublishStory } from '@/hooks/useStoriesQueries';
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
import { StoriesDropdown } from './StoriesDropdown';
import { StoryItem } from '@/app/state/types';
import { useState } from 'react';

export function PublishModal() {
  const story = useAtomValue(StoryAtom);
  const [publishModal, setState] = useAtom(PublishModalAtom);
  const auth = useAuth();
  const publishMutation = usePublishStory();

  // State for story selection
  const [selectedStory, setSelectedStory] = useState<StoryItem | null>(null);

  const handleClose = () => {
    setState((prev) => ({ ...prev, isOpen: false }));
    setSelectedStory(null); // Reset selection when closing
  };

  const publish = async () => {
    if (!auth.isAuthenticated) {
      toast.error('You must be logged in to publish stories');
      return;
    }

    try {
      setState((prev) => ({ ...prev, status: 'processing' }));

      // Use the mutation hook instead of direct function call
      await publishMutation.mutateAsync({
        storyId: selectedStory?.id, // Use selected story ID for overwriting
      });

      setState((prev) => ({ ...prev, isOpen: false }));
      setSelectedStory(null); // Reset selection after successful publish
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
          <StoriesDropdown
            onStorySelect={setSelectedStory}
            selectedStoryId={selectedStory?.id}
            label='Publishing options'
            placeholder='Choose how to publish this story...'
          />

          {selectedStory && (
            <div className='p-3 bg-amber-50 border border-amber-200 rounded-lg'>
              <p className='text-sm text-amber-800'>
                <strong>Warning:</strong> This will overwrite the existing story &quot;
                <span className='font-medium'>{selectedStory.title}</span>&quot;. The previous version will be
                permanently lost.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant='default' onClick={publish} disabled={publishModal.status === 'processing'}>
            <Share2 className='size-4' />
            {selectedStory ? 'Overwrite Story' : 'Publish New Story'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
