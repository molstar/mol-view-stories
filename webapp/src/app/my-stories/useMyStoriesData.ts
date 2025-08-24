'use client';

import { useEffect, useCallback } from 'react';
import { useAtom } from 'jotai';
import { MyStoriesDataAtom, MyStoriesStatusAtom, UserQuotaAtom } from '@/app/state/atoms';
import { type SessionWithData } from '@/app/state/actions';
import { loadAllMyStoriesData, navigateToMyStoriesItem } from '@/lib/my-stories-api';
import {
  deleteSession,
  deleteStory,
  deleteAllUserContent,
  deleteAllSessions,
  deleteAllStories,
} from '@/lib/content-crud';
import { loadUserQuota } from '@/lib/storage-api';
import { SessionItem, StoryItem } from '@/app/state/types';
import { useRouter } from 'next/navigation';

export type { SessionWithData };

export function useMyStoriesData(isAuthenticated: boolean) {
  const [myStoriesData] = useAtom(MyStoriesDataAtom);
  const [myStoriesStatus] = useAtom(MyStoriesStatusAtom);
  const [quotaStatus] = useAtom(UserQuotaAtom);
  const router = useRouter();

  const loadAllData = useCallback(() => {
    loadAllMyStoriesData(isAuthenticated);
    loadUserQuota();
  }, [isAuthenticated]);

  const loadQuota = () => {
    loadUserQuota();
  };

  const handleOpenInBuilder = (item: SessionItem | StoryItem) => {
    navigateToMyStoriesItem(router, item);
  };

  const handleDeleteSession = async (sessionId: string) => {
    const success = await deleteSession(sessionId, isAuthenticated);
    if (success) {
      // Refresh quota after successful deletion
      loadUserQuota();
    }
    return success;
  };

  const handleDeleteStory = async (storyId: string) => {
    const success = await deleteStory(storyId, isAuthenticated);
    if (success) {
      // Refresh quota after successful deletion
      loadUserQuota();
    }
    return success;
  };

  const handleDeleteAllContent = async () => {
    const success = await deleteAllUserContent(isAuthenticated);
    if (success) {
      // Refresh quota after successful deletion
      loadUserQuota();
    }
    return success;
  };

  const handleDeleteAllSessions = async () => {
    const success = await deleteAllSessions(isAuthenticated);
    if (success) {
      // Refresh quota after successful deletion
      loadUserQuota();
    }
    return success;
  };

  const handleDeleteAllStories = async () => {
    const success = await deleteAllStories(isAuthenticated);
    if (success) {
      // Refresh quota after successful deletion
      loadUserQuota();
    }
    return success;
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated, loadAllData]);

  return {
    sessions: myStoriesData['sessions-private'] as SessionItem[],
    stories: myStoriesData['stories-public'] as StoryItem[],
    loading: myStoriesStatus.status === 'loading',
    error: myStoriesStatus.status === 'error' ? myStoriesStatus.error : null,
    quota: quotaStatus.status === 'success' ? quotaStatus.data : null,
    quotaLoading: quotaStatus.status === 'loading',
    quotaError: quotaStatus.status === 'error' ? quotaStatus.error : null,
    loadAllData,
    loadQuota,
    handleOpenInBuilder,
    handleDeleteSession,
    handleDeleteStory,
    handleDeleteAllContent,
    handleDeleteAllSessions,
    handleDeleteAllStories,
  };
}
