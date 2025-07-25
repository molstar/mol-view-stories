'use client';

import { useAuth } from '@/app/providers';
import { PublishModalAtom, StoryAtom } from '@/app/state/atoms';
import { usePublishStory, useStories } from '@/hooks/useStoriesQueries';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAtom, useAtomValue } from 'jotai';
import { Share2, Search, Plus, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { StoryItem } from '@/app/state/types';
import { useState, useMemo, useEffect } from 'react';

export function PublishModal() {
  const story = useAtomValue(StoryAtom);
  const [publishModal, setState] = useAtom(PublishModalAtom);
  const auth = useAuth();
  const publishMutation = usePublishStory();
  const { data: stories, isLoading } = useStories(auth.isAuthenticated);

  // State for story selection and search
  const [selectedStory, setSelectedStory] = useState<StoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('new');

  const handleClose = () => {
    setState((prev) => ({ ...prev, isOpen: false }));
    setSelectedStory(null);
    setSearchQuery('');
    setActiveTab('new');
  };

  // Filter stories based on search query
  const filteredStories = useMemo(() => {
    if (!stories || !searchQuery.trim()) return stories || [];

    return stories.filter(
      (story: StoryItem) =>
        story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (story.description && story.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [stories, searchQuery]);

  const publish = async () => {
    if (!auth.isAuthenticated) {
      toast.error('You must be logged in to publish stories');
      return;
    }

    try {
      setState((prev) => ({ ...prev, status: 'processing' }));

      // Use the mutation hook instead of direct function call
      await publishMutation.mutateAsync({
        storyId: activeTab === 'overwrite' ? selectedStory?.id : undefined,
      });

      setState((prev) => ({ ...prev, isOpen: false }));
      setSelectedStory(null);
      setSearchQuery('');
      setActiveTab('new');
    } catch (err) {
      console.error('Failed to publish story: ', err);
      toast.error(`Failed to publish the story`);
    } finally {
      setState((prev) => ({ ...prev, status: 'idle' }));
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'new') {
      setSelectedStory(null);
    } else if (value === 'overwrite' && stories && stories.length > 0) {
      setSelectedStory(stories[0]);
    }
  };

  const handleStorySelect = (story: StoryItem) => {
    setSelectedStory(story);
  };

  // Auto-select first story when overwrite tab is active and stories are loaded
  useEffect(() => {
    if (activeTab === 'overwrite' && stories && stories.length > 0 && !selectedStory) {
      setSelectedStory(stories[0]);
    }
  }, [activeTab, stories, selectedStory]);

  if (!publishModal.isOpen || !publishModal.data) {
    return null;
  }

  return (
    <Dialog open={publishModal.isOpen} onOpenChange={handleClose}>
      <DialogContent className='w-lg' onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>Publish Story</DialogTitle>
          <DialogDescription>
            Publish <b>{story.metadata.title}</b> to the cloud to make it accessible to anyone with a link
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className='grid grid-cols-2 w-full'>
            <TabsTrigger value='new' className='flex items-center gap-2'>
              <Plus className='h-4 w-4' />
              New Story
            </TabsTrigger>
            <TabsTrigger value='overwrite' className='flex items-center gap-2'>
              <Share2 className='h-4 w-4' />
              Overwrite
            </TabsTrigger>
          </TabsList>

          <TabsContent value='new' className='space-y-4'>
            <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
              <div className='flex items-start gap-3'>
                <Plus className='h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0' />
                <div>
                  <h4 className='font-medium text-blue-900'>Publish New Story</h4>
                  <p className='text-sm text-blue-700 mt-1'>
                    This will publish a new story titled &quot;{story.metadata.title}&quot;
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value='overwrite' className='space-y-4 relative'>
            {!auth.isAuthenticated ? (
              <div className='p-4 bg-amber-50 border border-amber-200 rounded-lg'>
                <p className='text-sm text-amber-800'>Please log in to see your published stories</p>
              </div>
            ) : isLoading ? (
              <div className='p-4 bg-gray-50 border border-gray-200 rounded-lg'>
                <p className='text-sm text-gray-600'>Loading your published stories...</p>
              </div>
            ) : stories && stories.length === 0 ? (
              <div className='p-4 bg-gray-50 border border-gray-200 rounded-lg'>
                <p className='text-sm text-gray-600'>No published stories found. Create your first story!</p>
              </div>
            ) : (
              <div className='w-full space-y-2'>
                <div className='space-y-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='story-search'>Search existing stories</Label>
                    <div className='relative'>
                      <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                      <Input
                        id='story-search'
                        placeholder='Search by story title'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className='pl-10'
                      />
                    </div>
                  </div>
                  {filteredStories.length === 0 ? (
                    <div className='p-3 text-sm text-gray-500 text-center'>
                      {searchQuery ? 'No stories match your search' : 'No stories available'}
                    </div>
                  ) : (
                    <div className='space-y-1 max-h-48 overflow-y-auto'>
                      {filteredStories.map((storyItem: StoryItem) => (
                        <button
                          key={storyItem.id}
                          onClick={() => handleStorySelect(storyItem)}
                          className={`w-full p-3 text-left rounded-lg border transition-colors ${
                            selectedStory?.id === storyItem.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className='flex items-start gap-3' title={storyItem.title}>
                            {/* <Share2 className='h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0' /> */}
                            <div className='flex-1 min-w-0'>
                              <div className='font-medium text-gray-900 text-sm truncate'>{storyItem.title}</div>
                              {storyItem.description && (
                                <div className='text-sm text-gray-600 truncate mt-1'>{storyItem.description}</div>
                              )}
                              <div className='text-xs text-gray-500 mt-1'>
                                Published on {new Date(storyItem.updated_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedStory && (
                  <div className='p-3 bg-amber-50 border border-amber-200 rounded-lg'>
                    <div className='flex items-start gap-2'>
                      <AlertTriangle className='h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0' />
                      <p className='text-sm text-amber-800'>
                        <strong>Warning:</strong> This will overwrite the selected story and the previous version will
                        be permanently lost
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant='default'
            onClick={publish}
            disabled={publishModal.status === 'processing' || (activeTab === 'overwrite' && !selectedStory)}
          >
            <Share2 className='size-4' />
            {activeTab === 'overwrite' && selectedStory ? 'Overwrite Selected Story' : 'Publish New Story'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
