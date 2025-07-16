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
  State,
} from './types';
import { Task } from 'molstar/lib/mol-task';
import { deflate, inflate, Zip } from 'molstar/lib/mol-util/zip/zip';
import { MVSData, Snapshot } from 'molstar/lib/extensions/mvs/mvs-data';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra';
import { authenticatedFetch, API_CONFIG } from '@/lib/auth-utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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

export async function fetchMyStoriesData(endpoint: string, isPublic: boolean = false, isAuthenticated: boolean) {
  if (!isAuthenticated) return [];

  try {
    const publicParam = isPublic ? '?public=true' : '';
    const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/${endpoint}${publicParam}`);

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
    fetchMyStoriesData('session', false, isAuthenticated),
    fetchMyStoriesData('session', true, isAuthenticated),
    fetchMyStoriesData('state', false, isAuthenticated),
    fetchMyStoriesData('state', true, isAuthenticated),
  ])
    .then(([sessionsPrivate, sessionsPublic, statesPrivate, statesPublic]) => {
      store.set(MyStoriesDataAtom, {
        'sessions-private': sessionsPrivate,
        'sessions-public': sessionsPublic,
        'states-private': statesPrivate,
        'states-public': statesPublic,
      });
      store.set(MyStoriesRequestStateAtom, { status: 'success' });
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
      setInitialStoryState(storyData.story);
    } else {
      throw new Error('No story data found in session');
    }
  } catch (err) {
    console.error('Error loading session:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to load session';
    toast.error(errorMessage);
  } finally {
    store.set(IsSessionLoadingAtom, false);
  }
}

export async function openItemInBuilder(router: ReturnType<typeof useRouter>, item: Session | State) {
  try {
    // For sessions, try to load story data into the builder
    if (item.type === 'session') {
      router.push(`/builder/?sessionId=${item.id}`);
    } else if (item.type === 'state') {
      // For states, open in external MVS Stories viewer (states are MVS data, not story format)
      const url = `https://molstar.org/demos/mvs-stories/?story-url=${API_CONFIG.baseUrl}/api/${item.type}/${item.id}/data?format=mvsj`;
      window.open(url, '_blank');
    } else {
      toast.error('Unknown item type');
    }
  } catch (err) {
    console.error('Error opening item:', err);
    toast.error(err instanceof Error ? err.message : 'Failed to open item');
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

export async function deleteState(stateId: string, isAuthenticated: boolean) {
  const store = getDefaultStore();

  if (!isAuthenticated) {
    toast.error('Authentication required');
    return false;
  }

  try {
    const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/state/${stateId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete state: ${response.statusText}`);
    }

    // Remove from local state
    const currentData = store.get(MyStoriesDataAtom);
    const updatedStates = (currentData['states-private'] as State[]).filter((state: State) => state.id !== stateId);

    store.set(MyStoriesDataAtom, {
      ...currentData,
      'states-private': updatedStates,
    });

    toast.success('State deleted successfully');
    return true;
  } catch (err) {
    console.error('Error deleting state:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to delete state';
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
      'states-private': [],
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
function cloneStory(story: Story): Story {
  return {
    metadata: { ...story.metadata },
    javascript: story.javascript,
    scenes: story.scenes.map(scene => ({
      id: scene.id,
      header: scene.header,
      key: scene.key,
      description: scene.description,
      javascript: scene.javascript,
      camera: scene.camera ? { ...scene.camera } : scene.camera,
      linger_duration_ms: scene.linger_duration_ms,
      transition_duration_ms: scene.transition_duration_ms,
    })),
    assets: story.assets.map(asset => ({
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
