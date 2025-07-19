import { useAuth } from '@/app/providers';
import { IsDirtyAtom } from '@/app/state/atoms';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';

export interface UnsavedChangesOptions {
  onUnsavedChanges?: (hasChanges: boolean) => void;
  enableBeforeUnload?: boolean;
}

export function useUnsavedChanges(options: UnsavedChangesOptions = {}) {
  const { onUnsavedChanges, enableBeforeUnload = true } = options;
  const hasUnsavedChanges = useAtomValue(IsDirtyAtom);
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

  return {
    hasUnsavedChanges,
    isAuthenticated: auth.isAuthenticated,
    canSaveToCloud: auth.isAuthenticated && hasUnsavedChanges,
    canExportLocally: hasUnsavedChanges,
  };
}
