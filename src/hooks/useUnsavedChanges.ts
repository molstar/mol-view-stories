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
    if (!enableBeforeUnload || typeof window === 'undefined') return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Check global disable flag first
      if (globalBeforeUnloadDisabled) return;
      
      if (hasUnsavedChanges) {
        const confirmLeave = window.confirm(
          'You have unsaved changes. Are you sure you want to leave this page?'
        );
        
        if (!confirmLeave) {
          event.preventDefault();
          event.returnValue = '';
          return event.returnValue;
        }
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

export function useUnsavedChangesWarning(hasUnsavedChanges: boolean) {
  const dummyStatePushed = useRef(false);
  const ignorePopState = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Push dummy history state once when unsaved changes appear
    if (hasUnsavedChanges && !dummyStatePushed.current) {
      try {
        window.history.pushState(null, '', window.location.href);
        dummyStatePushed.current = true;
      } catch (error) {
        console.warn('Failed to push history state:', error);
      }
    }

    // Remove dummy state when no unsaved changes (go back once)
    if (!hasUnsavedChanges && dummyStatePushed.current) {
      try {
        window.history.back();
        dummyStatePushed.current = false;
      } catch (error) {
        console.warn('Failed to go back in history:', error);
      }
    }
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = (event: PopStateEvent) => {
      if (ignorePopState.current) {
        return;
      }

      if (hasUnsavedChanges) {
        const confirmLeave = window.confirm(
          'You have unsaved changes. Are you sure you want to leave this page?'
        );

        if (!confirmLeave) {
          ignorePopState.current = true;
          try {
            window.history.pushState(null, '', window.location.href);
          } catch (error) {
            console.warn('Failed to push history state:', error);
          }

          // Reset flag after a short delay to avoid infinite loops
          setTimeout(() => {
            ignorePopState.current = false;
          }, 0);
        } else {
          // Go back two steps: one for the dummy state we injected, one for the actual back button press
          try {
            window.history.back();
          } catch (error) {
            console.warn('Failed to go back in history:', error);
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges]);
}
