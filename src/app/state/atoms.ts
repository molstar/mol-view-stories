import { ExampleStories } from '@/app/examples';
import { atom } from 'jotai';
import { type Camera } from 'molstar/lib/mol-canvas3d/camera';
import { CurrentView, Story, Session, StoryItem, UserQuota, AsyncStatus, ModalState, ConfirmationState } from './types';

// Auth State Atom - tracks authentication status
export const AuthStateAtom = atom<{ isAuthenticated: boolean }>({ isAuthenticated: false });

// Re-export types for external use
export type { CurrentView, Story, Session, StoryItem, UserQuota, AsyncStatus, ModalState, ConfirmationState } from './types';

// My Stories Data Structure - Unified approach
export type MyStoriesDataKey = 'sessions-private' | 'stories-public';

export type MyStoriesData = Record<MyStoriesDataKey, (Session | StoryItem)[]>;

// SaveDialog Types - Simplified structure
export type SaveType = 'session' | 'story';

export interface SaveDialogState {
  isOpen: boolean;
  status: 'idle' | 'saving' | 'success' | 'error';
  saveType: SaveType;
  sessionId?: string;
  formData: {
    title: string;
    description: string;
  };
  error?: string;
}

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
    if (
      currentScene.header !== initialScene.header ||
      currentScene.key !== initialScene.key ||
      currentScene.description !== initialScene.description ||
      currentScene.javascript !== initialScene.javascript ||
      currentScene.linger_duration_ms !== initialScene.linger_duration_ms ||
      currentScene.transition_duration_ms !== initialScene.transition_duration_ms ||
      JSON.stringify(currentScene.camera) !== JSON.stringify(initialScene.camera)
    ) {
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
  status: 'idle',
  saveType: 'session',
  sessionId: undefined,
  formData: {
    title: '',
    description: '',
  },
});

// My Stories State Atoms - Unified Data Structure with AsyncStatus
export const MyStoriesDataAtom = atom<MyStoriesData>({
  'sessions-private': [],
  'stories-public': [],
});

// Replace the old RequestState with unified AsyncStatus
export const MyStoriesStatusAtom = atom<AsyncStatus<MyStoriesData>>({ status: 'idle' });

// Derived atoms for granular access
export const MyStoriesSessionsAtom = atom((get) => get(MyStoriesDataAtom)['sessions-private'] as Session[]);
export const MyStoriesStoriesAtom = atom((get) => get(MyStoriesDataAtom)['stories-public'] as StoryItem[]);

// Quota State with unified AsyncStatus
export const UserQuotaAtom = atom<AsyncStatus<UserQuota>>({ status: 'idle' });

// Share Modal State - using unified ModalState pattern
export interface ShareModalData {
  itemId: string | null;
  itemTitle: string;
  itemType: 'story' | 'session';
  publicUri?: string;
}

export const ShareModalAtom = atom<ModalState<ShareModalData>>({
  isOpen: false,
  status: 'idle',
  data: {
    itemId: null,
    itemTitle: '',
    itemType: 'story',
    publicUri: undefined,
  },
});

// Unified Confirmation Dialog State - consolidates multiple confirmation dialogs
export const ConfirmationDialogAtom = atom<ConfirmationState>({
  isOpen: false,
  type: '',
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  data: null,
});

// Track if current story is shared - simplified state
export interface SharedStoryState {
  isShared: boolean;
  storyId?: string;
  publicUri?: string;
  title?: string;
}

// Base shared story state
const BaseSharedStoryAtom = atom<SharedStoryState>({
  isShared: false,
  storyId: undefined,
  publicUri: undefined,
  title: undefined,
});

// Derived atom that clears shared story state when not authenticated
export const SharedStoryAtom = atom(
  (get) => {
    // This will be set by the auth context
    const isAuthenticated = get(AuthStateAtom)?.isAuthenticated ?? false;
    const baseState = get(BaseSharedStoryAtom);
    
    // Clear shared story state when not authenticated
    if (!isAuthenticated) {
      return {
        isShared: false,
        storyId: undefined,
        publicUri: undefined,
        title: undefined,
      };
    }
    
    return baseState;
  },
  (get, set, newValue: SharedStoryState) => {
    set(BaseSharedStoryAtom, newValue);
  }
);

// Unsaved Changes Tracking Atoms
export const InitialStoryAtom = atom<Story>(ExampleStories.Empty);

// Track the story state when it was last shared (for story-specific unsaved changes)
export const LastSharedStoryAtom = atom<Story | null>(null);

// Optimized derived atom to detect unsaved changes
export const HasUnsavedChangesAtom = atom((get) => {
  const currentStory = get(StoryAtom);
  const initialStory = get(InitialStoryAtom);

  // Use optimized comparison that handles binary assets efficiently
  return !compareStories(currentStory, initialStory);
});

// Derived atom to detect story changes since last share
export const HasStoryChangesSinceShareAtom = atom((get) => {
  const currentStory = get(StoryAtom);
  const lastSharedStory = get(LastSharedStoryAtom);

  if (!lastSharedStory) {
    return false; // No story has been shared yet
  }

  // Use optimized comparison that handles binary assets efficiently
  return !compareStories(currentStory, lastSharedStory);
});

// Atom to track if we should show unsaved changes warning
export const ShowUnsavedChangesWarningAtom = atom<boolean>(false);
