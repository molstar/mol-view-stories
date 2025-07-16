'use client';

import { useEffect, useCallback } from 'react';
import { useAtom } from 'jotai';
import { MyStoriesDataAtom, MyStoriesRequestStateAtom, UserQuotaAtom, QuotaRequestStateAtom } from '@/app/state/atoms';
import {
  loadAllMyStoriesData,
  openItemInBuilder,
  deleteSession,
  deleteStory,
  deleteAllUserContent,
  fetchUserQuota,
  type SessionWithData,
} from '@/app/state/actions';
import { Session, StoryItem } from '@/app/state/types';
import { useRouter } from 'next/navigation';

export type { SessionWithData };

export function useMyStoriesData(isAuthenticated: boolean) {
  const [myStoriesData] = useAtom(MyStoriesDataAtom);
  const [requestState] = useAtom(MyStoriesRequestStateAtom);
  const [quota] = useAtom(UserQuotaAtom);
  const [quotaRequestState] = useAtom(QuotaRequestStateAtom);
  const router = useRouter();

  const loadAllData = useCallback(() => {
    loadAllMyStoriesData(isAuthenticated);
    fetchUserQuota(isAuthenticated);
  }, [isAuthenticated]);

  const loadQuota = () => {
    fetchUserQuota(isAuthenticated);
  };

  const handleOpenInBuilder = (item: Session | StoryItem) => {
    openItemInBuilder(router, item);
  };

  const handleDeleteSession = async (sessionId: string) => {
    const success = await deleteSession(sessionId, isAuthenticated);
    if (success) {
      // Refresh quota after successful deletion
      fetchUserQuota(isAuthenticated);
    }
    return success;
  };

  const handleDeleteStory = async (storyId: string) => {
    const success = await deleteStory(storyId, isAuthenticated);
    if (success) {
      // Refresh quota after successful deletion
      fetchUserQuota(isAuthenticated);
    }
    return success;
  };

  const handleDeleteAllContent = async () => {
    const success = await deleteAllUserContent(isAuthenticated);
    if (success) {
      // Refresh quota after successful deletion
      fetchUserQuota(isAuthenticated);
    }
    return success;
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated, loadAllData]);

  return {
    sessions: myStoriesData['sessions-private'] as Session[],
    stories: myStoriesData['stories-public'] as StoryItem[],
    loading: requestState.status === 'loading',
    error: requestState.status === 'error' ? requestState.error : null,
    quota,
    quotaLoading: quotaRequestState.status === 'loading',
    quotaError: quotaRequestState.status === 'error' ? quotaRequestState.error : null,
    loadAllData,
    loadQuota,
    handleOpenInBuilder,
    handleDeleteSession,
    handleDeleteStory,
    handleDeleteAllContent,
  };
}
