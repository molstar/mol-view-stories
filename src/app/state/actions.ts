// noinspection DuplicatedCode

import { generateStoriesHtml } from '@/app/state/template';
import { getDefaultStore } from 'jotai';
import { encodeMsgPack } from 'molstar/lib/mol-io/common/msgpack/encode';
import { decodeMsgPack } from 'molstar/lib/mol-io/common/msgpack/decode';
import { download } from 'molstar/lib/mol-util/download';
import { UUID } from 'molstar/lib/mol-util/uuid';
import { ExampleStories } from '../examples';
import {
  ActiveSceneAtom,
  ActiveSceneIdAtom,
  CurrentViewAtom,
  StoryAtom,
  MyStoriesDataAtom,
  MyStoriesRequestStateAtom,
  UserQuotaAtom,
  QuotaRequestStateAtom,
  IsSessionLoadingAtom,
  InitialStoryAtom,
  HasUnsavedChangesAtom,
  CurrentSessionIdAtom,
  SharedStoryAtom,
  LastSharedStoryAtom,
} from './atoms';
import {
  CameraData,
  SceneAsset,
  SceneData,
  SceneUpdate,
  Story,
  StoryContainer,
  StoryMetadata,
  Session,
  StoryItem,
} from './types';
import { Task } from 'molstar/lib/mol-task';
import { deflate, inflate, Zip } from 'molstar/lib/mol-util/zip/zip';
import { MVSData, Snapshot } from 'molstar/lib/extensions/mvs/mvs-data';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra';
import { authenticatedFetch } from '@/lib/auth-utils';
import { API_CONFIG } from '@/lib/config';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// Helper function to safely encode large Uint8Array to base64
function encodeUint8ArrayToBase64(data: Uint8Array): Promise<string> {
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1]; // Remove data: prefix
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Extended session interface that may include story data
export interface SessionWithData extends Session {
  data?: unknown;
}

export function addScene(options?: { duplicate?: boolean }) {
  const store = getDefaultStore();
  const view = store.get(CurrentViewAtom);
  if (view.type !== 'scene' && options?.duplicate) return;

  const story = store.get(StoryAtom);
  const current = store.get(ActiveSceneAtom);

  const newScene: SceneData =
    options?.duplicate && current
      ? {
          ...current,
          id: UUID.createv4(),
          key: '',
        }
      : {
          id: UUID.createv4(),
          header: 'New Scene',
          key: '',
          description: '',
          javascript: '',
        };

  store.set(StoryAtom, { ...story, scenes: [...story.scenes, newScene] });
  store.set(CurrentViewAtom, { type: 'scene', id: newScene.id, subview: 'scene-options' });
}

export function newStory() {
  const store = getDefaultStore();
  store.set(CurrentViewAtom, { type: 'story-options', subview: 'story-metadata' });
  store.set(StoryAtom, ExampleStories.Empty);
  store.set(CurrentSessionIdAtom, null); // Clear session ID for new story
  setInitialStoryState(ExampleStories.Empty);
}

const createStateProvider = (code: string) => {
  return new Function('builder', code);
};

async function getMVSSnapshot(story: Story, scene: SceneData) {
  try {
    const stateProvider = createStateProvider(`
async function _run_builder() {
      ${story.javascript}\n\n${scene.javascript}
}
return _run_builder();
`);
    const builder = MVSData.createBuilder();
    await stateProvider(builder);
    if (scene.camera) {
      builder.camera({
        position: adjustedCameraPosition(scene.camera),
        target: scene.camera.target as unknown as [number, number, number],
        up: scene.camera.up as unknown as [number, number, number],
      });
    }
    const snapshot = builder.getSnapshot({
      key: scene.key.trim() || undefined,
      title: scene.header,
      description: scene.description,
      linger_duration_ms: scene.linger_duration_ms || 5000,
      transition_duration_ms: scene.transition_duration_ms || 500,
    });

    return snapshot;
  } catch (error) {
    console.error('Error creating state provider:', error);
    throw error;
  }
}

function adjustedCameraPosition(camera: CameraData) {
  // MVS uses FOV-adjusted camera position, need to apply inverse here so it doesn't offset the view when loaded
  const f = camera.mode === 'orthographic' ? 1 / (2 * Math.tan(camera.fov / 2)) : 1 / (2 * Math.sin(camera.fov / 2));
  const delta = Vec3.sub(Vec3(), camera.position as Vec3, camera.target as Vec3);
  return Vec3.scaleAndAdd(Vec3(), camera.target as Vec3, delta, 1 / f) as unknown as [number, number, number];
}

export async function getMVSData(story: Story, scenes: SceneData[] = story.scenes): Promise<MVSData | Uint8Array> {
  // Async in case of creating a ZIP archite with static assets

  const snapshots: Snapshot[] = [];

  // TODO: not sure if Promise.all would be better here.
  for (const scene of scenes) {
    const snapshot = await getMVSSnapshot(story, scene);
    snapshots.push(snapshot);
  }
  const index: MVSData = {
    kind: 'multiple',
    metadata: {
      title: story.metadata.title,
      timestamp: new Date().toISOString(),
      version: `${MVSData.SupportedVersion}`,
    },
    snapshots,
  };

  if (!story.assets.length) {
    return index;
  }

  const encoder = new TextEncoder();
  const files: Record<string, Uint8Array> = {
    'index.mvsj': encoder.encode(JSON.stringify(index)),
  };
  for (const asset of story.assets) {
    files[asset.name] = asset.content;
  }

  const zip = await Zip(files).run();
  return new Uint8Array(zip);
}

export async function downloadStory(story: Story, how: 'state' | 'html') {
  // TODO:
  // - download as HTML with embedded state
  try {
    const data = await getMVSData(story);
    let blob: Blob;
    let filename: string;
    if (how === 'html') {
      const htmlContent = generateStoriesHtml(data);
      blob = new Blob([htmlContent], { type: 'text/html' });
      filename = `story-${Date.now()}.html`;
    } else if (how === 'state') {
      blob =
        data instanceof Uint8Array
          ? new Blob([data], { type: 'application/octet-stream' })
          : new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      filename = `story-${Date.now()}.${data instanceof Uint8Array ? 'mvsx' : 'mvsj'}`;
    } else {
      console.warn("Invalid download type specified. Use 'state' or 'html'.");
      return;
    }
    download(blob, filename);
  } catch (error) {
    console.error('Error generating MVS data:', error);
    return;
  }
}

export const SessionFileExtension = '.mvstory';

export const exportState = async (story: Story) => {
  const container: StoryContainer = {
    version: 1,
    story,
  };

  // Using message pack for:
  // - More efficient
  // - Ability to encode Uint8Array for file assets directly
  const encoded = encodeMsgPack(container);
  const deflated = await Task.create('Deflate Story Data', async (ctx) => {
    return await deflate(ctx, encoded, { level: 3 });
  }).run();
  const blob = new Blob([deflated], { type: 'application/octet-stream' });
  const filename = `story-${Date.now()}${SessionFileExtension}`;
  download(blob, filename);
};

export const importState = async (file: File) => {
  const store = getDefaultStore();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const inflated = await Task.create('Inflate Story Data', async (ctx) => {
    return await inflate(ctx, bytes);
  }).run();
  const decoded = decodeMsgPack(inflated) as StoryContainer;
  if (decoded.version !== 1) {
    console.warn(`Unsupported story version: ${decoded.version}. Expected version 1.`);
    return;
  }

  store.set(CurrentViewAtom, { type: 'story-options', subview: 'story-metadata' });
  store.set(StoryAtom, decoded.story);
  store.set(CurrentSessionIdAtom, null); // Clear session ID for imported stories (treat as new)
  setInitialStoryState(decoded.story);
};

export function modifyCurrentScene(update: SceneUpdate) {
  const store = getDefaultStore();
  const view = store.get(CurrentViewAtom);
  if (view.type !== 'scene') return;

  const story = store.get(StoryAtom);
  const sceneId = store.get(ActiveSceneIdAtom);
  const sceneIdx = story.scenes.findIndex((s) => s.id === sceneId);
  if (sceneIdx < 0) return;

  const scenes = [...story.scenes];
  scenes[sceneIdx] = {
    ...scenes[sceneIdx],
    ...update,
  };
  store.set(StoryAtom, { ...story, scenes });
}

export function modifySceneMetadata(update: Partial<StoryMetadata>) {
  const store = getDefaultStore();
  const story = store.get(StoryAtom);
  store.set(StoryAtom, { ...story, metadata: { ...story.metadata, ...update } });
}

export function moveCurrentScene(delta: number) {
  const store = getDefaultStore();
  const view = store.get(CurrentViewAtom);
  if (view.type !== 'scene') return;

  const story = store.get(StoryAtom);
  const sceneId = store.get(ActiveSceneIdAtom);
  const sceneIdx = story.scenes.findIndex((s) => s.id === sceneId);
  if (sceneIdx < 0) return;

  const scenes = [...story.scenes];
  let newIdx = (sceneIdx + delta) % scenes.length;
  if (newIdx < 0) newIdx += scenes.length; // Wrap around if negative
  if (newIdx === sceneIdx) return; // No change
  // shuffle the scenes array
  const scene = scenes[sceneIdx];
  scenes.splice(sceneIdx, 1);
  scenes.splice(newIdx, 0, scene);
  store.set(StoryAtom, { ...story, scenes });
}

export function removeCurrentScene() {
  const store = getDefaultStore();
  const view = store.get(CurrentViewAtom);
  if (view.type !== 'scene') return;

  const story = store.get(StoryAtom);
  if (story.scenes.length <= 1) {
    console.warn('Cannot remove the last scene.');
    return;
  }
  const sceneId = store.get(ActiveSceneIdAtom);
  const scenes = story.scenes.filter((s) => s.id !== sceneId);
  store.set(StoryAtom, { ...story, scenes });
  store.set(CurrentViewAtom, { type: 'scene', id: scenes[0].id, subview: 'scene-options' });
}

export function setStoryAssets(assets: SceneAsset[]) {
  const store = getDefaultStore();
  const story = store.get(StoryAtom);
  store.set(StoryAtom, { ...story, assets });
}

export function addStoryAssets(newAssets: SceneAsset[]) {
  const store = getDefaultStore();
  const story = store.get(StoryAtom);
  store.set(StoryAtom, { ...story, assets: [...(story.assets || []), ...newAssets] });
}

export function removeStoryAsset(assetName: string) {
  const store = getDefaultStore();
  const story = store.get(StoryAtom);
  const updatedAssets = (story.assets || []).filter((asset) => asset.name !== assetName);
  store.set(StoryAtom, { ...story, assets: updatedAssets });
}

export async function fetchMyStoriesData(endpoint: string, isAuthenticated: boolean) {
  if (!isAuthenticated) return [];

  try {
    const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/${endpoint}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    console.error(`Error fetching ${endpoint}:`, err);
    const errorMessage = err instanceof Error ? err.message : `Failed to fetch ${endpoint}`;
    toast.error(errorMessage);
    return [];
  }
}

export function loadAllMyStoriesData(isAuthenticated: boolean) {
  const store = getDefaultStore();

  // Set loading state
  store.set(MyStoriesRequestStateAtom, { status: 'loading' });

  // Fetch all data in parallel
  Promise.all([
    fetchMyStoriesData('session', isAuthenticated), // Sessions are always private, require auth
    fetchMyStoriesData('story', isAuthenticated), // Stories are always public, but we still need auth to create/manage them
  ])
    .then(([sessionsPrivate, storiesPublic]) => {
      store.set(MyStoriesDataAtom, {
        'sessions-private': sessionsPrivate,
        'stories-public': storiesPublic,
      });
      store.set(MyStoriesRequestStateAtom, { status: 'success' });

      // Check if current story matches any shared stories
      checkIfCurrentStoryIsShared(storiesPublic);
    })
    .catch((error) => {
      console.error('Error loading my stories data:', error);
      store.set(MyStoriesRequestStateAtom, { status: 'error', error: error.message });
    });
}

export async function loadSession(sessionId: string) {
  const store = getDefaultStore();
  try {
    store.set(IsSessionLoadingAtom, true);

    const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/session/${sessionId}/data`);

    if (!response.ok) {
      throw new Error(`Failed to fetch session data: ${response.statusText}`);
    }

    const sessionResponse = await response.json();
    const storyData = sessionResponse;

    if (storyData?.story) {
      store.set(StoryAtom, storyData.story);
      store.set(CurrentViewAtom, { type: 'story-options', subview: 'story-metadata' });
      store.set(CurrentSessionIdAtom, sessionId); // Track that we're editing an existing session
      setInitialStoryState(storyData.story);
    } else {
      throw new Error('No story data found in session');
    }
  } catch (err) {
    console.error('Error loading session:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to load session';
    toast.error(errorMessage);
    store.set(CurrentSessionIdAtom, null); // Clear session ID on error
  } finally {
    store.set(IsSessionLoadingAtom, false);
  }
}

export async function openItemInBuilder(router: ReturnType<typeof useRouter>, item: Session | StoryItem) {
  try {
    // For sessions, try to load story data into the builder
    if (item.type === 'session') {
      router.push(`/builder/?sessionId=${item.id}`);
    } else if (item.type === 'story') {
      // For stories, open in external MVS Stories viewer (stories are MVS data, not story format)
      let storyUrl: string;

      if (item.public_uri) {
        // Use the backend-provided public_uri if available
        storyUrl = item.public_uri;
      } else {
        // Stories are always public, use the public API endpoint
        storyUrl = `${API_CONFIG.baseUrl}/api/story/${item.id}/data`;
      }

      const molstarUrl = `https://molstar.org/demos/mvs-stories/?story-url=${encodeURIComponent(storyUrl)}`;
      window.open(molstarUrl, '_blank');
    } else {
      toast.error('Unknown item type');
    }
  } catch (err) {
    console.error('Error opening item:', err);
    toast.error(err instanceof Error ? err.message : 'Failed to open item');
  }
}

// Check if the current story matches any of the user's shared stories
function checkIfCurrentStoryIsShared(sharedStories: StoryItem[]) {
  const store = getDefaultStore();
  const currentStory = store.get(StoryAtom);

  // Find a matching shared story by comparing metadata and content
  const matchingStory = sharedStories.find((sharedStory) => {
    // For now, we'll do a simple comparison based on title
    // In a more robust implementation, you might want to compare the actual story content
    return sharedStory.title === currentStory.metadata.title;
  });

  if (matchingStory) {
    // Use the public_uri from response and append /data?format=mvsj
    const correctPublicUri = matchingStory.public_uri
      ? `${matchingStory.public_uri}/data?format=mvsj`
      : `${API_CONFIG.baseUrl}/api/story/${matchingStory.id}/data?format=mvsj`;

    store.set(SharedStoryAtom, {
      isShared: true,
      storyId: matchingStory.id,
      publicUri: correctPublicUri,
      title: matchingStory.title,
    });

    // Set the last shared story to current state when a match is found
    store.set(LastSharedStoryAtom, cloneStory(currentStory));
  }
}

// Delete Actions
export async function deleteSession(sessionId: string, isAuthenticated: boolean) {
  const store = getDefaultStore();

  if (!isAuthenticated) {
    toast.error('Authentication required');
    return false;
  }

  try {
    const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/session/${sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete session: ${response.statusText}`);
    }

    // Remove from local state
    const currentData = store.get(MyStoriesDataAtom);
    const updatedSessions = (currentData['sessions-private'] as Session[]).filter(
      (session: Session) => session.id !== sessionId
    );

    store.set(MyStoriesDataAtom, {
      ...currentData,
      'sessions-private': updatedSessions,
    });

    toast.success('Session deleted successfully');
    return true;
  } catch (err) {
    console.error('Error deleting session:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to delete session';
    toast.error(errorMessage);
    return false;
  }
}

export async function deleteStory(storyId: string, isAuthenticated: boolean) {
  const store = getDefaultStore();

  if (!isAuthenticated) {
    toast.error('Authentication required');
    return false;
  }

  try {
    const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/story/${storyId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete story: ${response.statusText}`);
    }

    // Remove from local state
    const currentData = store.get(MyStoriesDataAtom);
    const updatedStories = (currentData['stories-public'] as StoryItem[]).filter(
      (story: StoryItem) => story.id !== storyId
    );

    store.set(MyStoriesDataAtom, {
      ...currentData,
      'stories-public': updatedStories,
    });

    toast.success('Story deleted successfully');
    return true;
  } catch (err) {
    console.error('Error deleting story:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to delete story';
    toast.error(errorMessage);
    return false;
  }
}

export async function unshareStory(storyId: string, isAuthenticated: boolean) {
  const store = getDefaultStore();

  if (!isAuthenticated) {
    toast.error('Authentication required');
    return false;
  }

  try {
    const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/story/${storyId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to unshare story: ${response.statusText}`);
    }

    // Remove from local state
    const currentData = store.get(MyStoriesDataAtom);
    const updatedStories = (currentData['stories-public'] as StoryItem[]).filter(
      (story: StoryItem) => story.id !== storyId
    );

    store.set(MyStoriesDataAtom, {
      ...currentData,
      'stories-public': updatedStories,
    });

    // Reset shared story state if this was the currently shared story
    const sharedStory = store.get(SharedStoryAtom);
    if (sharedStory.storyId === storyId) {
      store.set(SharedStoryAtom, {
        isShared: false,
        storyId: undefined,
        publicUri: undefined,
        title: undefined,
      });
    }

    toast.success('Story share removed successfully');
    return true;
  } catch (err) {
    console.error('Error unsharing story:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to remove story share';
    toast.error(errorMessage);
    return false;
  }
}

export async function updateSharedStory(storyId: string, isAuthenticated: boolean) {
  const store = getDefaultStore();

  if (!isAuthenticated) {
    toast.error('Authentication required');
    return false;
  }

  try {
    const story = store.get(StoryAtom);

    // Prepare story data for update
    const data = await getMVSData(story);

    // Prepare request body for story update
    const requestBody: {
      title: string;
      description: string;
      data: unknown;
    } = {
      title: story.metadata.title || 'Untitled Story',
      description: '',
      data: undefined, // to be filled below
    };

    // Handle data based on type
    if (data instanceof Uint8Array) {
      requestBody.data = await encodeUint8ArrayToBase64(data);
    } else if (typeof data === 'string') {
      requestBody.data = JSON.parse(data);
    } else {
      requestBody.data = data;
    }

    const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/story/${storyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Failed to update story: ${response.statusText}`);
    }

    // Set the last shared story to current state (but don't reset initial story state)
    store.set(LastSharedStoryAtom, cloneStory(story));

    // Update shared story state with new title
    const sharedStory = store.get(SharedStoryAtom);
    if (sharedStory.storyId === storyId) {
      store.set(SharedStoryAtom, {
        ...sharedStory,
        title: requestBody.title,
      });
    }

    toast.success('Story updated successfully!', {
      description: `Updated "${requestBody.title}"`,
    });

    return true;
  } catch (err) {
    console.error('Error updating story:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to update story';
    toast.error(errorMessage);
    return false;
  }
}

export async function deleteAllUserContent(isAuthenticated: boolean) {
  const store = getDefaultStore();

  if (!isAuthenticated) {
    toast.error('Authentication required');
    return false;
  }

  try {
    const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/user/delete-all`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete all content: ${response.statusText}`);
    }

    // Clear local state
    const currentData = store.get(MyStoriesDataAtom);
    store.set(MyStoriesDataAtom, {
      ...currentData,
      'sessions-private': [],
      'stories-public': [],
    });

    toast.success('All content deleted successfully');
    return true;
  } catch (err) {
    console.error('Error deleting all content:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to delete all content';
    toast.error(errorMessage);
    return false;
  }
}

export async function fetchUserQuota(isAuthenticated: boolean) {
  const store = getDefaultStore();

  if (!isAuthenticated) {
    store.set(UserQuotaAtom, null);
    store.set(QuotaRequestStateAtom, { status: 'idle' });
    return;
  }

  store.set(QuotaRequestStateAtom, { status: 'loading' });

  try {
    const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/user/quota`);

    if (!response.ok) {
      throw new Error(`Failed to fetch quota: ${response.statusText}`);
    }

    const quota = await response.json();
    store.set(UserQuotaAtom, quota);
    store.set(QuotaRequestStateAtom, { status: 'success' });
  } catch (err) {
    console.error('Error fetching quota:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch quota';
    store.set(QuotaRequestStateAtom, { status: 'error', error: errorMessage });
  }
}

// Unsaved Changes Tracking Utilities
export function cloneStory(story: Story): Story {
  return {
    metadata: { ...story.metadata },
    javascript: story.javascript,
    scenes: story.scenes.map((scene) => ({
      id: scene.id,
      header: scene.header,
      key: scene.key,
      description: scene.description,
      javascript: scene.javascript,
      camera: scene.camera ? { ...scene.camera } : scene.camera,
      linger_duration_ms: scene.linger_duration_ms,
      transition_duration_ms: scene.transition_duration_ms,
    })),
    assets: story.assets.map((asset) => ({
      name: asset.name,
      content: new Uint8Array(asset.content), // Properly clone binary data
    })),
  };
}

// Set the initial story state (call when loading a story from session or creating new)
export function setInitialStoryState(story: Story) {
  const store = getDefaultStore();
  // Use optimized clone to avoid expensive JSON operations on binary assets
  store.set(InitialStoryAtom, cloneStory(story));

  // Reset shared story state when loading a new story
  store.set(SharedStoryAtom, {
    isShared: false,
    storyId: undefined,
    publicUri: undefined,
    title: undefined,
  });

  // Reset last shared story state when loading a new story
  store.set(LastSharedStoryAtom, null);

  // Check if this story matches any of the user's shared stories
  const myStoriesData = store.get(MyStoriesDataAtom);
  if (myStoriesData['stories-public'].length > 0) {
    checkIfCurrentStoryIsShared(myStoriesData['stories-public'] as StoryItem[]);
  }
}

// Reset initial state to current state (call after successful save)
export function resetInitialStoryState() {
  const store = getDefaultStore();
  const currentStory = store.get(StoryAtom);
  store.set(InitialStoryAtom, cloneStory(currentStory));
}

// Check if there are unsaved changes
export function hasUnsavedChanges(): boolean {
  const store = getDefaultStore();
  return store.get(HasUnsavedChangesAtom);
}

// Discard changes by reverting to initial state
export function discardChanges() {
  const store = getDefaultStore();
  const initialStory = store.get(InitialStoryAtom);

  // Revert to initial state (clone to avoid reference issues)
  store.set(StoryAtom, cloneStory(initialStory));

  // Reset initial state to mark as "saved" (no unsaved changes)
  resetInitialStoryState();
}
