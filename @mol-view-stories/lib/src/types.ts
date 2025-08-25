import { Vec3 } from 'molstar/lib/mol-math/linear-algebra';

export type StoryContainer = {
  version: 1;
  story: Story;
};

export type StoryMetadata = {
  title: string;
  author_note?: string;
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
