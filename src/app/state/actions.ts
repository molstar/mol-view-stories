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
import { checkIfCurrentStoryIsShared } from '@/lib/data-utils';

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
  
  // Clear persisted session context when starting fresh
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('currentSessionId');
  }
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
  
  // Clear persisted session context when importing
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('currentSessionId');
  }
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
}

// Check if current story matches any shared stories (call explicitly when needed)
export function checkCurrentStoryAgainstSharedStories() {
  const store = getDefaultStore();
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
