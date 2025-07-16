import { ExampleStories } from '@/app/examples';
import { atom } from 'jotai';
import { type Camera } from 'molstar/lib/mol-canvas3d/camera';
import { CurrentView, Story, Session, State, Visibility, UserQuota } from './types';

// Re-export types for external use
export type { Visibility } from './types';

// Request State Types
export type RequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success' }
  | { status: 'error'; error: string };

// My Stories Data Structure - Unified approach
export type MyStoriesDataKey = 'sessions-private' | 'sessions-public' | 'states-private' | 'states-public';

export type MyStoriesData = Record<MyStoriesDataKey, (Session | State)[]>;

// SaveDialog Types
export type SaveType = 'session' | 'state';

export type SaveFormData = {
  title: string;
  description: string;
  visibility: Visibility;
};

export type SaveDialogState = {
  isOpen: boolean;
  saveType: SaveType;
  sessionId?: string; // Optional for state saves
  isSaving: boolean;
  formData: SaveFormData;
};

// Optimized story comparison function that ignores scene IDs (used for navigation only)
function compareStories(currentStory: Story, initialStory: Story): boolean {
  // Fast path: reference equality
  if (currentStory === initialStory) return true;
  
  // Compare metadata and javascript
  if (JSON.stringify(currentStory.metadata) !== JSON.stringify(initialStory.metadata)) {
    return false;
  }
  if (currentStory.javascript !== initialStory.javascript) {
    return false;
  }
  
  // Compare scenes (excluding IDs which are for navigation only)
  if (currentStory.scenes.length !== initialStory.scenes.length) {
    return false;
  }
  
  for (let i = 0; i < currentStory.scenes.length; i++) {
    const currentScene = currentStory.scenes[i];
    const initialScene = initialStory.scenes[i];
    
    // Compare all scene properties except ID
    if (currentScene.header !== initialScene.header ||
        currentScene.key !== initialScene.key ||
        currentScene.description !== initialScene.description ||
        currentScene.javascript !== initialScene.javascript ||
        currentScene.linger_duration_ms !== initialScene.linger_duration_ms ||
        currentScene.transition_duration_ms !== initialScene.transition_duration_ms ||
        JSON.stringify(currentScene.camera) !== JSON.stringify(initialScene.camera)) {
      return false;
    }
  }
  
  // Compare assets separately to avoid expensive JSON.stringify on Uint8Arrays
  if (currentStory.assets.length !== initialStory.assets.length) {
    return false;
  }
  
  return currentStory.assets.every((currentAsset, i) => {
    const initialAsset = initialStory.assets[i];
    if (currentAsset.name !== initialAsset.name) return false;
    if (currentAsset.content.length !== initialAsset.content.length) return false;
    
    // Byte-by-byte comparison for binary content
    for (let j = 0; j < currentAsset.content.length; j++) {
      if (currentAsset.content[j] !== initialAsset.content[j]) return false;
    }
    
    return true;
  });
}

// Core State Atoms

export const IsSessionLoadingAtom = atom<boolean>(false);

// Track the session ID if editing an existing saved story
export const CurrentSessionIdAtom = atom<string | null>(null);

export const StoryAtom = atom<Story>(ExampleStories.Empty);

export const CurrentViewAtom = atom<CurrentView>({ type: 'story-options', subview: 'story-metadata' });

export const ActiveSceneIdAtom = atom<string | undefined>((get) => {
  const view = get(CurrentViewAtom);
  return view.type === 'scene' ? view.id : undefined;
});

export const CameraSnapshotAtom = atom<Camera.Snapshot | null>(null);

// Derived atom for story assets
export const StoryAssetsAtom = atom((get) => {
  const story = get(StoryAtom);
  return story.assets || [];
});

// Derived atoms for automatic JavaScript execution
export const ActiveSceneAtom = atom((get) => {
  const story = get(StoryAtom);
  const activeId = get(ActiveSceneIdAtom);
  return story.scenes.find((scene) => scene.id === activeId) || story.scenes[0];
});

// UI State Atoms
export const OpenSessionAtom = atom<boolean>(false);

// SaveDialog State Atoms
export const SaveDialogAtom = atom<SaveDialogState>({
  isOpen: false,
  saveType: 'session',
  sessionId: undefined,
  isSaving: false,
  formData: {
    title: '',
    description: '',
    visibility: 'private',
  },
});

// Derived atoms for SaveDialog
export const SaveDialogFormDataAtom = atom(
  (get) => get(SaveDialogAtom).formData,
  (get, set, formData: SaveFormData) => {
    const current = get(SaveDialogAtom);
    set(SaveDialogAtom, { ...current, formData });
  }
);

export const SaveDialogSaveTypeAtom = atom(
  (get) => get(SaveDialogAtom).saveType,
  (get, set, saveType: SaveType) => {
    const current = get(SaveDialogAtom);
    set(SaveDialogAtom, { ...current, saveType });
  }
);

export const SaveDialogIsSavingAtom = atom(
  (get) => get(SaveDialogAtom).isSaving,
  (get, set, isSaving: boolean) => {
    const current = get(SaveDialogAtom);
    set(SaveDialogAtom, { ...current, isSaving });
  }
);

export const SaveDialogIsOpenAtom = atom(
  (get) => get(SaveDialogAtom).isOpen,
  (get, set, isOpen: boolean) => {
    const current = get(SaveDialogAtom);
    set(SaveDialogAtom, { ...current, isOpen });
  }
);

// My Stories State Atoms - Unified Data Structure
export const MyStoriesDataAtom = atom<MyStoriesData>({
  'sessions-private': [],
  'sessions-public': [],
  'states-private': [],
  'states-public': [],
});

// Unified request state
export const MyStoriesRequestStateAtom = atom<RequestState>({ status: 'idle' });

// Derived atoms for granular access
export const MyStoriesSessionsAtom = atom((get) => get(MyStoriesDataAtom)['sessions-private'] as Session[]);
export const MyStoriesStatesAtom = atom((get) => get(MyStoriesDataAtom)['states-private'] as State[]);
export const MyStoriesPublicSessionsAtom = atom((get) => get(MyStoriesDataAtom)['sessions-public'] as Session[]);
export const MyStoriesPublicStatesAtom = atom((get) => get(MyStoriesDataAtom)['states-public'] as State[]);

// Quota State Atoms
export const UserQuotaAtom = atom<UserQuota | null>(null);
export const QuotaRequestStateAtom = atom<RequestState>({ status: 'idle' });

// Share Modal State Atoms
export interface ShareModalData {
  isOpen: boolean;
  itemId: string | null;
  itemTitle: string;
  itemType: 'state' | 'session';
  publicUri?: string;
}

export const ShareModalAtom = atom<ShareModalData>({
  isOpen: false,
  itemId: null,
  itemTitle: '',
  itemType: 'state',
  publicUri: undefined,
});

// Unsaved Changes Tracking Atoms
export const InitialStoryAtom = atom<Story>(ExampleStories.Empty);

// Optimized derived atom to detect unsaved changes
export const HasUnsavedChangesAtom = atom((get) => {
  const currentStory = get(StoryAtom);
  const initialStory = get(InitialStoryAtom);
  
  // Use optimized comparison that handles binary assets efficiently
  return !compareStories(currentStory, initialStory);
});

// Atom to track if we should show unsaved changes warning
export const ShowUnsavedChangesWarningAtom = atom<boolean>(false);
