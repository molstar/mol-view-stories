import { useAuth } from '@/app/providers';
import { IsDirtyAtom } from '@/app/state/atoms';
import { useAtomValue } from 'jotai';
import { useEffect, useCallback, useRef } from 'react';

export interface UnsavedChangesOptions {
  onUnsavedChanges?: (hasChanges: boolean) => void;
  enableBeforeUnload?: boolean;
}

let globalBeforeUnloadDisabled = false;

export function useUnsavedChanges(options: UnsavedChangesOptions = {}) {
  const { onUnsavedChanges, enableBeforeUnload = true } = options;
  const hasUnsavedChanges = useAtomValue(IsDirtyAtom);
  const auth = useAuth();
  const listenerRef = useRef<((event: BeforeUnloadEvent) => string | void) | null>(null);

  // Call the callback when unsaved changes state changes
  useEffect(() => {
    onUnsavedChanges?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onUnsavedChanges]);

  // Handle browser beforeunload event to warn about unsaved changes
  useEffect(() => {
    if (!enableBeforeUnload) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Check global disable flag first
      if (globalBeforeUnloadDisabled) return;
      
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
      }
    };

    listenerRef.current = handleBeforeUnload;
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      listenerRef.current = null;
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, enableBeforeUnload]);

  const disableUnsavedChanges = useCallback(() => {
    globalBeforeUnloadDisabled = true;
  }, []);

  return {
    hasUnsavedChanges,
    isAuthenticated: auth.isAuthenticated,
    canSaveToCloud: auth.isAuthenticated && hasUnsavedChanges,
    canExportLocally: hasUnsavedChanges,
    disableUnsavedChanges,
  };
}
