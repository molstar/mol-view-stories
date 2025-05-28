import { atom } from "jotai";
import { SceneData, SceneUpdate, CreateSceneData } from "./types";
import { init_js_code, init_js_code_02 } from "./initial_data.mjs";
import { executeJavaScriptCode } from "./code-execution";

// Core State Atoms
export const ScenesAtom = atom<SceneData[]>([
  {
    id: 1,
    header: "Awesome Thing 01",
    key: "scene_01",
    description:
      "# Retinoic Acid Visualization\n\nShowing a protein structure with retinoic acid ligand in green cartoon representation.",
    javascript: init_js_code,
  },
  {
    id: 2,
    header: "Awesome Thing 02",
    key: "scene_02",
    description:
      "# Alternative Visualization\n\nSame structure but with blue cartoon and orange ligand coloring.",
    javascript: init_js_code_02,
  },
]);

export const ActiveSceneIdAtom = atom(1);
export const CurrentMvsDataAtom = atom<unknown>(null);

// Derived Atoms
export const ActiveSceneAtom = atom((get) => {
  const scenes = get(ScenesAtom);
  const activeId = get(ActiveSceneIdAtom);
  return scenes.find((scene) => scene.id === activeId) || scenes[0];
});

// Action Atoms
export const ExecuteCodeAtom = atom(null, async (get, set, code: string) => {
  try {
    const mvsData = await executeJavaScriptCode(code);
    set(CurrentMvsDataAtom, mvsData);
    return mvsData;
  } catch (error) {
    console.error("Error executing JavaScript code:", error);
    set(CurrentMvsDataAtom, null);
    throw error;
  }
});

export const SetActiveSceneAtom = atom(
  null,
  async (get, set, sceneId: number) => {
    set(ActiveSceneIdAtom, sceneId);
    const activeScene = get(ActiveSceneAtom);
    await set(ExecuteCodeAtom, activeScene.javascript);
  },
);

export const UpdateSceneAtom = atom(
  null,
  async (get, set, sceneId: number, updates: SceneUpdate) => {
    const scenes = get(ScenesAtom);
    const updatedScenes = scenes.map((scene) =>
      scene.id === sceneId ? { ...scene, ...updates } : scene,
    );
    set(ScenesAtom, updatedScenes);

    const activeId = get(ActiveSceneIdAtom);
    if (sceneId === activeId && updates.javascript) {
      await set(ExecuteCodeAtom, updates.javascript);
    }
  },
);

export const AddSceneAtom = atom(
  null,
  (get, set, scene: CreateSceneData) => {
    const scenes = get(ScenesAtom);
    const maxId = Math.max(...scenes.map((s) => s.id), 0);
    const newScene: SceneData = { ...scene, id: maxId + 1 };
    set(ScenesAtom, [...scenes, newScene]);
    return newScene.id;
  },
);

export const RemoveSceneAtom = atom(null, (get, set, sceneId: number) => {
  const scenes = get(ScenesAtom);
  const newScenes = scenes.filter((scene) => scene.id !== sceneId);
  set(ScenesAtom, newScenes);

  const activeId = get(ActiveSceneIdAtom);
  if (sceneId === activeId && newScenes.length > 0) {
    set(SetActiveSceneAtom, newScenes[0].id);
  }
});

export const ExportStateAtom = atom(null, async (get) => {
  const scenes = get(ScenesAtom);
  const activeSceneId = get(ActiveSceneIdAtom);
  const currentMvsData = get(CurrentMvsDataAtom);
  const activeScene = get(ActiveSceneAtom);

  console.log(`🚀 Starting export process for ${scenes.length} scenes...`);

  // Execute JavaScript for each scene and capture the resulting JSON data
  const scenesWithExecutedData = await Promise.all(
    scenes.map(async (scene) => {
      try {
        console.log(`⚡ Executing JavaScript for scene ${scene.id}: "${scene.header}"`);
        const executedData = await executeJavaScriptCode(scene.javascript);
        console.log(`✅ Successfully executed scene ${scene.id}, data size:`, JSON.stringify(executedData).length, 'characters');
        return {
          id: scene.id,
          header: scene.header,
          key: scene.key,
          description: scene.description,
          executedData
        };
      } catch (error) {
        console.error(`❌ Error executing JavaScript for scene ${scene.id}:`, error);
        return {
          id: scene.id,
          header: scene.header,
          key: scene.key,
          description: scene.description,
          executedData: null,
          executionError: error instanceof Error ? error.message : String(error)
        };
      }
    })
  );

  const exportData = {
    scenes: scenesWithExecutedData,
    activeSceneId,
    activeScene: {
      id: activeScene.id,
      header: activeScene.header,
      key: activeScene.key,
      description: activeScene.description,
      executedData: currentMvsData
    },
    exportTimestamp: new Date().toISOString(),
    version: "1.0.0"
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  console.log("📋 StoriesCreator Complete Export (JavaScript executed and replaced with JSON data):");
  console.log(jsonString);
  console.log(`📊 Export Summary: ${scenesWithExecutedData.length} scenes processed, ${scenesWithExecutedData.filter(s => s.executedData).length} successful executions`);
  
  return exportData;
});