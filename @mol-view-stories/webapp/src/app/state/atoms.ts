import { ExampleStories } from '@/app/examples';
import { Story } from '@mol-view-stories/lib/src/types';
import { atom } from 'jotai';
import { type Camera } from 'molstar/lib/mol-canvas3d/camera';
import {
  AsyncStatus,
  ConfirmationState,
  CurrentView,
  ModalState,
  SessionItem,
  SessionMetadata,
  StoryItem,
  UserQuota,
} from './types';

// Auth State Atom - tracks authentication status
export const AuthStateAtom = atom<{ isAuthenticated: boolean }>({ isAuthenticated: false });

// Re-export types for external use
export type {
  AsyncStatus,
  ConfirmationState,
  CurrentView,
  ModalState,
  SessionItem as Session,
  StoryItem,
  UserQuota,
} from './types';

// My Stories Data Structure - Unified approach
export type MyStoriesDataKey = 'sessions-private' | 'stories-public';

export type MyStoriesData = Record<MyStoriesDataKey, (SessionItem | StoryItem)[]>;

// Optimized story comparison function that ignores scene IDs (used for navigation only)
export function compareStories(currentStory: Story, initialStory: Story): boolean {
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

// For updating current scene
export const UpdateSceneAtom = atom<number | null>(null);

// UI State Atoms
export const OpenSessionAtom = atom<boolean>(false);

// My Stories State Atoms - Unified Data Structure with AsyncStatus
export const MyStoriesDataAtom = atom<MyStoriesData>({
  'sessions-private': [],
  'stories-public': [],
});

// Replace the old RequestState with unified AsyncStatus
export const MyStoriesStatusAtom = atom<AsyncStatus<MyStoriesData>>({ status: 'idle' });

// Derived atoms for granular access
export const MyStoriesSessionsAtom = atom((get) => get(MyStoriesDataAtom)['sessions-private'] as SessionItem[]);
export const MyStoriesStoriesAtom = atom((get) => get(MyStoriesDataAtom)['stories-public'] as StoryItem[]);

// Quota State with unified AsyncStatus
export const UserQuotaAtom = atom<AsyncStatus<UserQuota>>({ status: 'idle' });

export interface SaveDialogData {
  sessionId?: string;
  note: string;
}

// SaveDialog State Atoms
export const SaveDialogAtom = atom<ModalState<SaveDialogData>>({
  isOpen: false,
  status: 'idle',
  data: { note: '' },
});

// Share Modal State - using unified ModalState pattern
export interface PublishedStoryModalData {
  itemId: string | null;
  itemTitle: string;
  itemType: 'story' | 'session';
}

export const PublishedStoryModalAtom = atom<ModalState<PublishedStoryModalData>>({
  isOpen: false,
  status: 'idle',
  data: {
    itemId: null,
    itemTitle: '',
    itemType: 'story',
  },
});

export interface PublishModalData {
  overwriteId?: string;
}

export const PublishModalAtom = atom<ModalState<PublishModalData>>({
  isOpen: false,
  status: 'idle',
  data: {},
});

// Session metadata state - stores metadata when loading a session from my-stories
export const SessionMetadataAtom = atom<SessionMetadata | null>(null);

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

// Unsaved Changes Tracking Atoms
export const IsDirtyAtom = atom<boolean>(false);
