import { useAtomValue } from 'jotai';
import { useCallback, useEffect } from 'react';
import { HasUnsavedChangesAtom, StoryAtom } from '@/app/state/atoms';
import { setInitialStoryState } from '@/app/state/actions';
import { useAuth } from '@/app/providers';

export interface UnsavedChangesOptions {
  onUnsavedChanges?: (hasChanges: boolean) => void;
  enableBeforeUnload?: boolean;
}

export function useUnsavedChanges(options: UnsavedChangesOptions = {}) {
  const { onUnsavedChanges, enableBeforeUnload = true } = options;
  const hasUnsavedChanges = useAtomValue(HasUnsavedChangesAtom);
  const story = useAtomValue(StoryAtom);
  const auth = useAuth();

  // Call the callback when unsaved changes state changes
  useEffect(() => {
    onUnsavedChanges?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onUnsavedChanges]);

  // Handle browser beforeunload event to warn about unsaved changes
  useEffect(() => {
    if (!enableBeforeUnload) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, enableBeforeUnload]);

  // Function to mark current state as saved (useful when initializing from templates)
  const markAsSaved = useCallback(() => {
    setInitialStoryState(story);
  }, [story]);

  return {
    hasUnsavedChanges,
    isAuthenticated: auth.isAuthenticated,
    canSaveToCloud: auth.isAuthenticated && hasUnsavedChanges,
    canExportLocally: hasUnsavedChanges,
    markAsSaved,
  };
} 