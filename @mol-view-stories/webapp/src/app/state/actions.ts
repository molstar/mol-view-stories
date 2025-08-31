// noinspection DuplicatedCode

import { tryFindIfStoryIsShared } from '@/lib/data-utils';
import {
  createCompressedStoryContainer,
  createSelfHostedZip,
  getMVSData as getMVSDataLib,
  readStoryContainer,
  SessionFileExtension,
} from '@mol-view-stories/lib/src/actions';
import { generateStoriesHtml } from '@mol-view-stories/lib/src/html-template';
import { SceneAsset, SceneData, Story, StoryMetadata } from '@mol-view-stories/lib/src/types';
import { getDefaultStore } from 'jotai';
import { MVSData } from 'molstar/lib/extensions/mvs/mvs-data';
import { download } from 'molstar/lib/mol-util/download';
import { UUID } from 'molstar/lib/mol-util/uuid';
import { toast } from 'sonner';
import { ExampleStories } from '../examples';
import {
  ActiveSceneAtom,
  ActiveSceneIdAtom,
  CurrentViewAtom,
  IsDirtyAtom,
  MyStoriesDataAtom,
  SessionMetadataAtom,
  StoryAtom,
} from './atoms';
import { SceneUpdate, SessionItem, StoryItem } from './types';

// Extended session interface that may include story data
export interface SessionWithData extends SessionItem {
  data?: unknown;
}

export function setIsDirty(isDirty: boolean = true) {
  const store = getDefaultStore();
  store.set(IsDirtyAtom, isDirty);
}

export function setSessionIdUrl(sessionId: string | undefined) {
  const url = new URL(window.location.href);
  if (sessionId) {
    url.searchParams.set('session-id', sessionId);
  } else {
    url.searchParams.delete('session-id');
  }
  window.history.replaceState({}, '', url.toString());
}

export async function getMVSData(story: Story, scenes: SceneData[] = story.scenes): Promise<MVSData | Uint8Array> {
  try {
    toast.dismiss('state-build-error');
    return await getMVSDataLib(story, scenes);
  } catch (error) {
    console.error('Error fetching MVS data:', error);
    toast.error(`Failed to build state: ${error}`, { duration: 5000, id: 'state-build-error', closeButton: true });
    throw error;
  }
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
  setIsDirty();
}

export function newStory() {
  const store = getDefaultStore();
  store.set(CurrentViewAtom, { type: 'story-options', subview: 'story-metadata' });
  store.set(StoryAtom, ExampleStories.Empty);
  store.set(SessionMetadataAtom, null); // Clear session metadata for new stories
  setIsDirty(false);
  setSessionIdUrl(undefined);
}

// Should be sync with typing generation in the scripts directory

function normalizeStoryFilename(filename: string) {
  return (
    filename
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
      .toLowerCase()
      .substring(0, 20) || 'story'
  );
}

export async function downloadStory(story: Story, how: 'state' | 'html' | 'self-hosted') {
  // TODO:
  // - download as HTML with embedded state
  try {
    const data = await getMVSData(story);
    let blob: Blob;
    let filename: string;
    if (how === 'self-hosted') {
      const zip = await createSelfHostedZip(story);
      blob = new Blob([zip as Uint8Array<ArrayBuffer>], { type: 'application/zip' });
      filename = `${normalizeStoryFilename(story.metadata.title)}-self_hosted.zip`;
    } else if (how === 'html') {
      const htmlContent = generateStoriesHtml(
        { kind: 'embed', data },
        {
          title: story.metadata.title,
        }
      );
      blob = new Blob([htmlContent], { type: 'text/html' });
      filename = `${normalizeStoryFilename(story.metadata.title)}.html`;
    } else if (how === 'state') {
      blob =
        data instanceof Uint8Array
          ? new Blob([data as Uint8Array<ArrayBuffer>], { type: 'application/octet-stream' })
          : new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      filename = `${normalizeStoryFilename(story.metadata.title)}.${data instanceof Uint8Array ? 'mvsx' : 'mvsj'}`;
    } else {
      console.warn("Invalid download type specified. Use 'state' or 'html'.");
      return;
    }
    download(blob, filename);
  } catch (error) {
    console.error('Error generating MVS data:', error);
    toast.error(`Failed to export story: ${error}`, { duration: 5000, closeButton: true });
  }
}

export const exportState = async (story: Story) => {
  const container = await createCompressedStoryContainer(story);
  const blob = new Blob([container as Uint8Array<ArrayBuffer>], { type: 'application/octet-stream' });
  const filename = `story-${Date.now()}${SessionFileExtension}`;
  download(blob, filename);
};

export const importState = async (blob: Blob, options?: { throwOnError?: boolean; doNotCleanSessionId?: boolean }) => {
  const store = getDefaultStore();

  const bytes = new Uint8Array(await blob.arrayBuffer());
  let story: Story;
  try {
    story = await readStoryContainer(bytes);
  } catch (error) {
    if (options?.throwOnError) throw error;
    console.error('Error reading story container:', error);
    return;
  }
  store.set(CurrentViewAtom, { type: 'story-options', subview: 'story-metadata' });
  store.set(StoryAtom, story);
  store.set(SessionMetadataAtom, null); // Clear session metadata for imported sessions
  setIsDirty(false);
  if (!options?.doNotCleanSessionId) {
    setSessionIdUrl(undefined);
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
  setIsDirty();
}

export function modifySceneMetadata(update: Partial<StoryMetadata>) {
  const store = getDefaultStore();
  const story = store.get(StoryAtom);
  store.set(StoryAtom, { ...story, metadata: { ...story.metadata, ...update } });
  setIsDirty();
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
  setIsDirty();
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
  setIsDirty();
}

export function setStoryAssets(assets: SceneAsset[]) {
  const store = getDefaultStore();
  const story = store.get(StoryAtom);
  store.set(StoryAtom, { ...story, assets });
  setIsDirty();
}

export function addStoryAssets(newAssets: SceneAsset[]) {
  const store = getDefaultStore();
  const story = store.get(StoryAtom);
  store.set(StoryAtom, { ...story, assets: [...(story.assets || []), ...newAssets] });
  setIsDirty();
}

export function removeStoryAsset(assetName: string) {
  const store = getDefaultStore();
  const story = store.get(StoryAtom);
  const updatedAssets = (story.assets || []).filter((asset) => asset.name !== assetName);
  store.set(StoryAtom, { ...story, assets: updatedAssets });
  setIsDirty();
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

// Check if current story matches any shared stories (call explicitly when needed)
export function checkCurrentStoryAgainstSharedStories() {
  const store = getDefaultStore();
  const myStoriesData = store.get(MyStoriesDataAtom);
  if (myStoriesData['stories-public'].length > 0) {
    tryFindIfStoryIsShared(myStoriesData['stories-public'] as StoryItem[]);
  }
}

// Check if there are unsaved changes
export function hasUnsavedChanges(): boolean {
  const store = getDefaultStore();
  return store.get(IsDirtyAtom);
}
