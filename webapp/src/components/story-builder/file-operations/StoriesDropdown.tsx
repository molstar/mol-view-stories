'use client';

import { useStories } from '@/hooks/useStoriesQueries';
import { useAuth } from '@/app/providers';
import { StoryItem } from '@/app/state/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Share2 } from 'lucide-react';

interface StoriesDropdownProps {
  onStorySelect?: (story: StoryItem | null) => void;
  selectedStoryId?: string;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

export function StoriesDropdown({
  onStorySelect,
  selectedStoryId,
  placeholder = 'Select a story to overwrite...',
  label = 'Overwrite existing story',
  disabled = false,
}: StoriesDropdownProps) {
  const auth = useAuth();
  const { data: stories, isLoading, error } = useStories(auth.isAuthenticated);

  const handleValueChange = (value: string) => {
    if (value === 'none') {
      onStorySelect?.(null);
      return;
    }

    const selectedStory = stories?.find((story: StoryItem) => story.id === value);
    onStorySelect?.(selectedStory || null);
  };

  if (!auth.isAuthenticated) {
    return (
      <div className='space-y-2'>
        <Label className='text-sm text-muted-foreground'>{label}</Label>
        <p className='text-sm text-muted-foreground'>Please log in to see your published stories</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='space-y-2'>
        <Label className='text-sm text-muted-foreground'>{label}</Label>
        <p className='text-sm text-destructive'>Failed to load stories: {error.message}</p>
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      <Label htmlFor='story-select'>{label}</Label>
      <Select onValueChange={handleValueChange} value={selectedStoryId || 'none'} disabled={disabled || isLoading}>
        <SelectTrigger id='story-select' className='w-full'>
          <SelectValue placeholder={isLoading ? 'Loading stories...' : placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='none'>
            <span className='text-muted-foreground'>Publish as new story, or overwrite an existing story</span>
          </SelectItem>

          {isLoading && (
            <SelectItem value='loading' disabled>
              <div className='flex items-center gap-2'>
                <Loader2 className='h-4 w-4 animate-spin' />
                <span>Loading stories...</span>
              </div>
            </SelectItem>
          )}

          {stories && stories.length === 0 && !isLoading && (
            <SelectItem value='empty' disabled>
              <span className='text-muted-foreground'>No published stories found</span>
            </SelectItem>
          )}

          {stories?.map((story: StoryItem) => (
            <SelectItem key={story.id} value={story.id}>
              <div className='flex items-center gap-2 w-full'>
                <Share2 className='h-4 w-4 flex-shrink-0' />
                <div className='flex flex-col items-start min-w-0 flex-1'>
                  <span className='font-medium truncate w-full'>{story.title}</span>
                  {story.description && (
                    <span className='text-xs text-muted-foreground truncate w-full'>{story.description}</span>
                  )}
                  <span className='text-xs text-muted-foreground'>
                    Updated {new Date(story.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {stories && stories.length > 0 && (
        <p className='text-xs text-muted-foreground'>
          Found {stories.length} published {stories.length === 1 ? 'story' : 'stories'}
        </p>
      )}
    </div>
  );
}
