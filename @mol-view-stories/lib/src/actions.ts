import { MVSData, Snapshot } from 'molstar/lib/extensions/mvs/mvs-data';
import { Mat3, Mat4, Quat, Vec3 } from 'molstar/lib/mol-math/linear-algebra';
import { Euler } from 'molstar/lib/mol-math/linear-algebra/3d/euler';
import { Zip } from 'molstar/lib/mol-util/zip/zip';
import { decodeMsgPack } from 'molstar/lib/mol-io/common/msgpack/decode';
import { encodeMsgPack } from 'molstar/lib/mol-io/common/msgpack/encode';
import { deflate, inflate } from 'molstar/lib/mol-util/zip/zip';

import { CameraData, SceneData, Story, StoryContainer } from './types';
import { Task } from 'molstar/lib/mol-task';

const BuilderLib = {
  Vec3,
  Mat3,
  Mat4,
  Quat,
  Euler,
};

export const BuilderLibNamespaces = Object.keys(BuilderLib);

const createStateProvider = (code: string) => {
  return new Function('builder', 'index', '__lib__', code);
};

async function getMVSSnapshot(story: Story, scene: SceneData, index: number) {
  try {
    const stateProvider = createStateProvider(`
const { ${Object.keys(BuilderLib).join(', ')} } = __lib__;
async function _run_builder() {
      ${story.javascript}\n\n${scene.javascript}
}
return _run_builder();
`);
    const builder = MVSData.createBuilder();
    await stateProvider(builder, index, BuilderLib);
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
  for (let index = 0; index < scenes.length; index++) {
    const scene = scenes[index];
    const snapshot = await getMVSSnapshot(story, scene, index);
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

export async function readStoryContainer(bytes: Uint8Array): Promise<Story> {
  const inflated = await Task.create('Inflate Story Data', async (ctx) => {
    return await inflate(ctx, bytes);
  }).run();
  const decoded = decodeMsgPack(inflated) as StoryContainer;
  if (decoded.version !== 1) {
    throw new Error(`Unsupported story version: ${decoded.version}. Expected version 1.`);
  }
  return decoded.story;
}

export const SessionFileExtension = '.mvstory';

export async function createCompressedStoryContainer(story: Story): Promise<Uint8Array> {
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
  return new Uint8Array(deflated);
}
