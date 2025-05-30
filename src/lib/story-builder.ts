import { MVSData } from 'molstar/lib/extensions/mvs/mvs-data';
import { Camera } from 'molstar/lib/mol-canvas3d/camera';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra';
import { SceneData, StoryMetadata } from '../app/state/types';

const createStateProvider = (code: string) => {
  return new Function('builder', code);
};

export function getMVSSnapshot(scene: SceneData) {
  try {
    const stateProvider = createStateProvider(scene.javascript);
    const builder = MVSData.createBuilder();
    stateProvider(builder);
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
      transition_duration_ms: scene.transition_duration_ms,
    });

    return snapshot;
  } catch (error) {
    console.error('Error creating state provider:', error);
    throw error;
  }
}

function adjustedCameraPosition(camera: Camera.Snapshot) {
  // MVS uses FOV-adjusted camera position, need to apply inverse here so it doesn't offset the view when loaded
  const f = camera.mode === 'orthographic' ? 1 / (2 * Math.tan(camera.fov / 2)) : 1 / (2 * Math.sin(camera.fov / 2));
  const delta = Vec3.sub(Vec3(), camera.position, camera.target);
  return Vec3.scaleAndAdd(Vec3(), camera.target, delta, 1 / f) as unknown as [number, number, number];
}

export async function getMVSData(story: StoryMetadata, scenes: SceneData[]): Promise<MVSData | Uint8Array> {
  // Async in case of creating a ZIP archite with static assets

  const snapshots = scenes.map(getMVSSnapshot);
  return {
    kind: 'multiple',
    metadata: {
      title: story.title,
      timestamp: new Date().toISOString(),
      version: `${MVSData.SupportedVersion}`,
    },
    snapshots,
  };
}
