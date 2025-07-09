'use client';

import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { 
  MyStoriesDataAtom,
  MyStoriesRequestStateAtom,
  UserQuotaAtom,
  QuotaRequestStateAtom
} from '@/app/state/atoms';
import { 
  loadAllMyStoriesData, 
  openItemInBuilder, 
  deleteSession, 
  deleteState, 
  deleteAllUserContent,
  fetchUserQuota,
  type SessionWithData 
} from '@/app/state/actions';
import { Session, State } from '@/app/state/types';

export type { SessionWithData };

export function useMyStoriesData(isAuthenticated: boolean) {
  const [myStoriesData] = useAtom(MyStoriesDataAtom);
  const [requestState] = useAtom(MyStoriesRequestStateAtom);
  const [quota] = useAtom(UserQuotaAtom);
  const [quotaRequestState] = useAtom(QuotaRequestStateAtom);

  const loadAllData = () => {
    loadAllMyStoriesData(isAuthenticated);
    fetchUserQuota(isAuthenticated);
  };

  const loadQuota = () => {
    fetchUserQuota(isAuthenticated);
  };

  const handleOpenInBuilder = (item: Session | State) => {
    openItemInBuilder(item, isAuthenticated);
  };

  const handleDeleteSession = async (sessionId: string) => {
    const success = await deleteSession(sessionId, isAuthenticated);
    if (success) {
      // Refresh quota after successful deletion
      fetchUserQuota(isAuthenticated);
    }
    return success;
  };

  const handleDeleteState = async (stateId: string) => {
    const success = await deleteState(stateId, isAuthenticated);
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
  }, [isAuthenticated]);

  return {
    sessions: myStoriesData['sessions-private'] as Session[],
    states: myStoriesData['states-private'] as State[],
    publicSessions: myStoriesData['sessions-public'] as Session[],
    publicStates: myStoriesData['states-public'] as State[],
    loading: requestState.status === 'loading',
    error: requestState.status === 'error' ? requestState.error : null,
    quota,
    quotaLoading: quotaRequestState.status === 'loading',
    quotaError: quotaRequestState.status === 'error' ? quotaRequestState.error : null,
    loadAllData,
    loadQuota,
    handleOpenInBuilder,
    handleDeleteSession,
    handleDeleteState,
    handleDeleteAllContent,
  };
} 