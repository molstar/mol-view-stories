//   - drag and drop box.

import type { Camera } from "molstar/lib/mol-canvas3d/camera";

export type StoryMetadata = {
  title: string;
}

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

export type Story = {
  metadata: StoryMetadata;
  scenes: SceneData[];
  // TODO: assets?: ...
}

export type SceneUpdate = Partial<Omit<SceneData, "id">>;

export type CreateSceneData = Omit<SceneData, "id">;
