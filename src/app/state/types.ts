import type { Camera } from 'molstar/lib/mol-canvas3d/camera';

export type StoryMetadata = {
  title: string;
};

export type Story = {
  metadata: StoryMetadata;
  javascript: string;
  scenes: SceneData[];
  assets: SceneAsset[];
};

// a file
export type SceneAsset = {
  name: string;
  content: Uint8Array;
};

export type SceneData = {
  id: string;
  header: string;
  key: string;
  description: string;
  javascript: string;
  camera?: Camera.Snapshot | null;
  linger_duration_ms?: number;
  transition_duration_ms?: number;
};

export type SceneUpdate = Partial<Omit<SceneData, 'id'>>;

export type CreateSceneData = Omit<SceneData, 'id'>;

export type CurrentView = { type: 'story-options' } | { type: 'scene'; id: string } | { type: 'preview' };
