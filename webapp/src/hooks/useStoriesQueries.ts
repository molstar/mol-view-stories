import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchMyStoriesData, fetchStoryFormat } from '@/lib/my-stories-api';
import {
  deleteSession,
  deleteStory,
  deleteAllSessions,
  deleteAllStories,
  deleteAllUserContent,
} from '@/lib/content-crud';
import { publishStory } from '@/app/state/save-dialog-actions';
import { SessionItem, StoryItem } from '@/app/state/types';
import { loadUserQuota } from '@/lib/storage-api';

// Query Keys - centralized to avoid typos and ensure consistency
export const QUERY_KEYS = {
  sessions: ['sessions'] as const,
  stories: ['stories'] as const,
  allMyStories: ['my-stories'] as const,
  storyFormat: (storyId: string) => ['story-format', storyId] as const,
} as const;

// Query Hooks

/**
 * Hook to fetch user's private sessions
 */
export function useSessions(isAuthenticated: boolean) {
  return useQuery({
    queryKey: QUERY_KEYS.sessions,
    queryFn: () => fetchMyStoriesData('session', isAuthenticated),
    enabled: isAuthenticated, // Only run query when user is authenticated
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
  });
}

/**
 * Hook to fetch user's public stories
 */
export function useStories(isAuthenticated: boolean) {
  return useQuery({
    queryKey: QUERY_KEYS.stories,
    queryFn: () => fetchMyStoriesData('story', isAuthenticated),
    enabled: isAuthenticated, // Only run query when user is authenticated
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes (stories change less often)
  });
}

/**
 * Hook to fetch the format (mvsj or mvsx) of a specific story
 * This query doesn't require authentication and is used for resolving viewer URLs
 */
export function useStoryFormat(storyId: string | null | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.storyFormat(storyId || ''),
    queryFn: () => fetchStoryFormat(storyId!),
    enabled: !!storyId, // Only run query when storyId is available
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes (format rarely changes)
    retry: 2, // Retry failed requests twice
  });
}

/**
 * Hook to fetch both sessions and stories in parallel
 * This provides the same interface as the current useMyStoriesData
 */
export function useMyStoriesData(isAuthenticated: boolean) {
  const sessionsQuery = useSessions(isAuthenticated);
  const storiesQuery = useStories(isAuthenticated);

  return {
    // Data
    sessions: (sessionsQuery.data as SessionItem[]) ?? [],
    stories: (storiesQuery.data as StoryItem[]) ?? [],

    // Loading states
    loading: sessionsQuery.isLoading || storiesQuery.isLoading,
    error: sessionsQuery.error?.message || storiesQuery.error?.message || null,

    // Refetch functions
    loadAllData: () => {
      sessionsQuery.refetch();
      storiesQuery.refetch();
      loadUserQuota();
    },

    // Individual query objects for more granular control
    sessionsQuery,
    storiesQuery,
  };
}

// Mutation Hooks

/**
 * Hook to publish/update a story with automatic cache invalidation
 */
export function usePublishStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storyId }: { storyId?: string }) => publishStory({ storyId }),
    onSuccess: () => {
      // Invalidate and refetch stories to show the new/updated story
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stories });
    },
    onError: (error) => {
      console.error('Failed to publish story (mutation):', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to publish story';
      if (!errorMessage.includes('too large') && !errorMessage.includes('maximum allowed')) {
        toast.error('Failed to publish story');
      }
    },
  });
}

/**
 * Hook to delete a session with automatic cache invalidation
 */
export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, isAuthenticated }: { sessionId: string; isAuthenticated: boolean }) =>
      deleteSession(sessionId, isAuthenticated),
    onSuccess: () => {
      // Invalidate sessions to remove the deleted session from the list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions });
      toast.success('Session deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete session:', error);
      toast.error('Failed to delete session');
    },
  });
}

/**
 * Hook to delete a story with automatic cache invalidation
 */
export function useDeleteStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storyId, isAuthenticated }: { storyId: string; isAuthenticated: boolean }) =>
      deleteStory(storyId, isAuthenticated),
    onSuccess: () => {
      // Invalidate stories to remove the deleted story from the list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stories });
      toast.success('Story deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete story:', error);
      toast.error('Failed to delete story');
    },
  });
}

/**
 * Hook to delete all sessions with automatic cache invalidation
 */
export function useDeleteAllSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ isAuthenticated }: { isAuthenticated: boolean }) => deleteAllSessions(isAuthenticated),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions });
    },
    onError: (error) => {
      console.error('Failed to delete all sessions:', error);
    },
  });
}

/**
 * Hook to delete all stories with automatic cache invalidation
 */
export function useDeleteAllStories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ isAuthenticated }: { isAuthenticated: boolean }) => deleteAllStories(isAuthenticated),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stories });
    },
    onError: (error) => {
      console.error('Failed to delete all stories:', error);
    },
  });
}

/**
 * Hook to delete all user content with automatic cache invalidation
 */
export function useDeleteAllContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ isAuthenticated }: { isAuthenticated: boolean }) => deleteAllUserContent(isAuthenticated),
    onSuccess: () => {
      // Invalidate both sessions and stories
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stories });
    },
    onError: (error) => {
      console.error('Failed to delete all content:', error);
    },
  });
}
