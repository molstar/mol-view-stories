//
// All StoriesCreator App State will live here.
//
import { atom } from "jotai";
import { init_js_code, init_js_code_02 } from "./state/initial_data.mjs";

// types ------------------------------------------
type SceneData = {
  id: number;
  header: string;
  key: string;
  description: string;
  javascript: string;
};

// Utility Functions ------------------------------------------



const executeJavaScriptCode = async (code: string): Promise<unknown> => {
  try {
    const evalFunction = new Function(`
      try {
        ${code}
        return mvsData;
      } catch (error) {
        console.error("Error executing JS code:", error);
        throw error;
      }
    `);
    return evalFunction();
  } catch (error) {
    console.error("Error in executeJavaScriptCode:", error);
    throw error;
  }
};

// Core State Atoms ------------------------------------------

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

// Derived Atoms ------------------------------------------

export const ActiveSceneAtom = atom((get) => {
  const scenes = get(ScenesAtom);
  const activeId = get(ActiveSceneIdAtom);
  return scenes.find((scene) => scene.id === activeId) || scenes[0];
});

// Core Actions ------------------------------------------

// Execute JavaScript code and return MVS data
export const ExecuteCodeAtom = atom(null, async (get, set, code: string) => {
  try {
    if (!code) {
      throw new Error("No JavaScript code to execute");
    }

    const mvsData = await executeJavaScriptCode(code);
    set(CurrentMvsDataAtom, mvsData);
    return mvsData;
  } catch (error) {
    console.error("Error executing JavaScript code:", error);
    set(CurrentMvsDataAtom, null);
    throw error;
  }
});

// Change active scene
export const SetActiveSceneAtom = atom(null, async (get, set, sceneId: number) => {
  set(ActiveSceneIdAtom, sceneId);
  const activeScene = get(ActiveSceneAtom);
  // Execute the scene's JavaScript to update visualization
  await set(ExecuteCodeAtom, activeScene.javascript);
});

// Update a scene's content
export const UpdateSceneAtom = atom(
  null,
  async (get, set, sceneId: number, updates: Partial<Omit<SceneData, 'id'>>) => {
    const scenes = get(ScenesAtom);
    const updatedScenes = scenes.map((scene) =>
      scene.id === sceneId ? { ...scene, ...updates } : scene
    );
    set(ScenesAtom, updatedScenes);

    // If updating the active scene and JavaScript changed, execute it
    const activeId = get(ActiveSceneIdAtom);
    if (sceneId === activeId && updates.javascript) {
      await set(ExecuteCodeAtom, updates.javascript);
    }
  },
);

// Scene collection management
export const AddSceneAtom = atom(
  null,
  (get, set, scene: Omit<SceneData, "id">) => {
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

  // Handle active scene cleanup
  const activeId = get(ActiveSceneIdAtom);
  if (sceneId === activeId && newScenes.length > 0) {
    set(SetActiveSceneAtom, newScenes[0].id);
  }
});