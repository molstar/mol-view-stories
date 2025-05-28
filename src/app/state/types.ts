export type SceneData = {
  id: number;
  header: string;
  key: string;
  description: string;
  javascript: string;
};

export type SceneUpdate = Partial<Omit<SceneData, "id">>;

export type CreateSceneData = Omit<SceneData, "id">;