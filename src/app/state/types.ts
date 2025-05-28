//   - drag and drop box.
//
//   - Scenes horizontal // tab etc.
//
// camera buttons will allow you to update/keep the camera data in the view
// keep those on the left
//  - postion // target // up <- we need those 3.
//
//
export type SceneData = {
  id: number;
  header: string;
  key: string;
  description: string;
  javascript: string;
  // add the camera
  // linger_duration (ms)
  // transition_duration (ms)
};

export type SceneUpdate = Partial<Omit<SceneData, "id">>;

export type CreateSceneData = Omit<SceneData, "id">;
