import { MVSData } from "molstar/lib/extensions/mvs/mvs-data";
import { SceneData, StoryMetadata } from "./types";

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
        position: scene.camera.position as unknown as [number, number, number],
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
    console.error("Error creating state provider:", error);
    throw error;
  }
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
  }
}