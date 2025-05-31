// noinspection DuplicatedCode

import { generateStoriesHtml } from '@/app/state/template';
import { getDefaultStore } from 'jotai';
import { encodeMsgPack } from 'molstar/lib/mol-io/common/msgpack/encode';
import { decodeMsgPack } from 'molstar/lib/mol-io/common/msgpack/decode';
import { download } from 'molstar/lib/mol-util/download';
import { UUID } from 'molstar/lib/mol-util/uuid';
import { ExampleStories } from '../examples';
import { ActiveSceneAtom, ActiveSceneIdAtom, CurrentViewAtom, StoryAtom } from './atoms';
import { CameraData, SceneAsset, SceneData, SceneUpdate, Story, StoryContainer, StoryMetadata } from './types';
import { Task } from 'molstar/lib/mol-task';
import { deflate, inflate, Zip } from 'molstar/lib/mol-util/zip/zip';
import { MVSData, Snapshot } from 'molstar/lib/extensions/mvs/mvs-data';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra';

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
  store.set(CurrentViewAtom, { type: 'story-options' });
  store.set(StoryAtom, ExampleStories.Empty);
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

// TODO better extension?
export const SessionFileExtension = '.mvsession';

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
