import { Vec3 } from 'molstar/lib/mol-math/linear-algebra';

export type StoryContainer = {
  version: 1;
  story: Story;
};

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

export type CameraData = {
  mode: 'perspective' | 'orthographic';
  target: [number, number, number] | Vec3;
  position: [number, number, number] | Vec3;
  up: [number, number, number] | Vec3;
  fov: number;
};

export type SceneData = {
  id: string;
  header: string;
  key: string;
  description: string;
  javascript: string;
  camera?: CameraData | null;
  linger_duration_ms?: number;
  transition_duration_ms?: number;
};

export type SceneUpdate = Partial<Omit<SceneData, 'id'>>;

export type CreateSceneData = Omit<SceneData, 'id'>;

export type CurrentView = 
  | { type: 'story-options'; subview: 'story-metadata' | 'story-wide-code' | 'asset-upload' }
  | { type: 'scene'; id: string; subview: 'scene-options' | '3d-view' } 
  | { type: 'preview' };
