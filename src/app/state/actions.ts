import { generateStoriesHtml } from '@/lib/stories-html';
import { getDefaultStore } from 'jotai';
import { encodeMsgPack } from 'molstar/lib/mol-io/common/msgpack/encode';
import { decodeMsgPack } from 'molstar/lib/mol-io/common/msgpack/decode';
import { download } from 'molstar/lib/mol-util/download';
import { UUID } from 'molstar/lib/mol-util/uuid';
import { getMVSData } from '../../lib/story-builder';
import { ExampleStories } from '../examples';
import { ActiveSceneAtom, ActiveSceneIdAtom, CurrentViewAtom, StoryAtom } from './atoms';
import { SceneAsset, SceneData, SceneUpdate, Story, StoryContainer, StoryMetadata } from './types';
import { Task } from 'molstar/lib/mol-task';
import { deflate, inflate } from 'molstar/lib/mol-util/zip/zip';

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
  store.set(CurrentViewAtom, { type: 'scene', id: newScene.id });
}

export function newStory() {
  const store = getDefaultStore();
  store.set(CurrentViewAtom, { type: 'story-options' });
  store.set(StoryAtom, ExampleStories.Empty);
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

// TODO better extension?
export const SessionFileExtension = '.mvsession';

export const exportState = async (story: Story) => {
  const container: StoryContainer = {
    version: 1,
    story,
  };

  // Using message pack for:
  // - More efficient
  // - Ablity to encode Uint8Array for file assets directly
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

  store.set(CurrentViewAtom, { type: 'story-options' });
  store.set(StoryAtom, decoded.story);
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
  store.set(CurrentViewAtom, { type: 'scene', id: scenes[0].id });
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
