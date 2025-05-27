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

const checkMolstarReady = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.molstar?.PluginExtensions?.mvs) {
      resolve(true);
      return;
    }

    let attempts = 0;
    const maxAttempts = 100;

    const checkInterval = setInterval(() => {
      attempts++;
      if (window.molstar?.PluginExtensions?.mvs) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.error("Timed out waiting for Molstar MVS extension");
        resolve(false);
      }
    }, 100);
  });
};

const executeJavaScriptCode = async (code: string): Promise<unknown> => {
  try {
    const evalFunction = new Function(`
      try {
        if (!window.molstar?.PluginExtensions?.mvs) {
          throw new Error("Molstar MVS extension is not available");
        }
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

// Helper function to sync editors with active scene
const syncEditorsWithScene = (set: any, scene: SceneData) => {
  set(CurrentCodeAtom, scene.javascript);
  set(CurrentMarkdownAtom, scene.description);
};

// Helper function to update scene in collection
const updateSceneInCollection = (
  scenes: SceneData[],
  updatedScene: SceneData,
): SceneData[] => {
  return scenes.map((scene) =>
    scene.id === updatedScene.id ? updatedScene : scene,
  );
};

// Base State Atoms ------------------------------------------

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
export const MolstarReadyAtom = atom(false);
export const CurrentCodeAtom = atom("");
export const CurrentMarkdownAtom = atom("");
export const EditorReadyAtom = atom(false);
export const MarkdownEditorReadyAtom = atom(false);
export const CodeExecutingAtom = atom(false);
export const CurrentMvsDataAtom = atom<unknown>(null);

// Derived Atoms ------------------------------------------

export const ActiveSceneAtom = atom((get) => {
  const scenes = get(ScenesAtom);
  const activeId = get(ActiveSceneIdAtom);
  return scenes.find((scene) => scene.id === activeId) || scenes[0];
});

// Consolidated Action Atoms ------------------------------------------

// Initialize Molstar
export const InitializeMolstarAtom = atom(null, async (get, set) => {
  try {
    const isReady = await checkMolstarReady();
    set(MolstarReadyAtom, isReady);
    return isReady;
  } catch (error) {
    console.error("Error initializing Molstar:", error);
    set(MolstarReadyAtom, false);
    return false;
  }
});

// Execute code and return MVS data
export const ExecuteCodeAtom = atom(null, async (get, set, code: string) => {
  const molstarReady = get(MolstarReadyAtom);
  set(CodeExecutingAtom, true);

  try {
    if (!molstarReady) {
      const initialized = await set(InitializeMolstarAtom);
      if (!initialized) {
        throw new Error("Failed to initialize Molstar");
      }
    }

    if (!code) {
      throw new Error("No JavaScript code to execute");
    }

    const mvsData = await executeJavaScriptCode(code);
    return mvsData;
  } catch (error) {
    console.error("Error executing JavaScript code:", error);
    throw error;
  } finally {
    set(CodeExecutingAtom, false);
  }
});

// Update MVS data and viewer
export const UpdateMvsDataAtom = atom(null, async (get, set, code?: string) => {
  try {
    const codeToExecute = code || get(CurrentCodeAtom);
    const mvsData = await set(ExecuteCodeAtom, codeToExecute);
    set(CurrentMvsDataAtom, mvsData);
    return mvsData;
  } catch (error) {
    console.error("Error updating MVS data:", error);
    set(CurrentMvsDataAtom, null);
    return null;
  }
});

// Unified editor initialization
export const InitializeEditorsAtom = atom(null, (get, set) => {
  const activeScene = get(ActiveSceneAtom);
  syncEditorsWithScene(set, activeScene);
  set(EditorReadyAtom, true);
  set(MarkdownEditorReadyAtom, true);
  console.log("Editors initialized with active scene");
});

// Simple content updates
export const UpdateCurrentContentAtom = atom(
  null,
  (get, set, updates: { code?: string; markdown?: string }) => {
    if (updates.code !== undefined) {
      set(CurrentCodeAtom, updates.code);
    }
    if (updates.markdown !== undefined) {
      set(CurrentMarkdownAtom, updates.markdown);
    }
  },
);

// Scene Management ------------------------------------------

// Change active scene with full sync
export const SetActiveSceneAtom = atom(null, (get, set, sceneId: number) => {
  set(ActiveSceneIdAtom, sceneId);
  const activeScene = get(ActiveSceneAtom);
  syncEditorsWithScene(set, activeScene);
  set(UpdateMvsDataAtom, activeScene.javascript);
});

// Update scene data
export const UpdateSceneAtom = atom(
  null,
  (get, set, updatedScene: SceneData) => {
    const scenes = get(ScenesAtom);
    const newScenes = updateSceneInCollection(scenes, updatedScene);
    set(ScenesAtom, newScenes);

    // Sync if this is the active scene
    const activeId = get(ActiveSceneIdAtom);
    if (updatedScene.id === activeId) {
      syncEditorsWithScene(set, updatedScene);
      set(UpdateMvsDataAtom, updatedScene.javascript);
    }
  },
);

// Save current editor content to active scene
export const SaveCurrentContentToSceneAtom = atom(
  null,
  (get, set, contentType: "code" | "markdown" | "both" = "both") => {
    const activeScene = get(ActiveSceneAtom);
    if (!activeScene) return;

    const currentCode = get(CurrentCodeAtom);
    const currentMarkdown = get(CurrentMarkdownAtom);

    const updates: Partial<SceneData> = {};

    if (contentType === "code" || contentType === "both") {
      updates.javascript = currentCode;
    }
    if (contentType === "markdown" || contentType === "both") {
      updates.description = currentMarkdown;
    }

    const updatedScene: SceneData = { ...activeScene, ...updates };
    set(UpdateSceneAtom, updatedScene);
  },
);

// Scene collection management
export const ManageScenesAtom = atom(
  null,
  (
    get,
    set,
    action:
      | { type: "add"; scene: Omit<SceneData, "id"> }
      | { type: "remove"; sceneId: number },
  ) => {
    const scenes = get(ScenesAtom);

    switch (action.type) {
      case "add": {
        const maxId = Math.max(...scenes.map((s) => s.id), 0);
        const newScene: SceneData = { ...action.scene, id: maxId + 1 };
        set(ScenesAtom, [...scenes, newScene]);
        break;
      }
      case "remove": {
        const newScenes = scenes.filter((scene) => scene.id !== action.sceneId);
        set(ScenesAtom, newScenes);

        // Handle active scene cleanup
        const activeId = get(ActiveSceneIdAtom);
        if (action.sceneId === activeId && newScenes.length > 0) {
          set(SetActiveSceneAtom, newScenes[0].id);
        }
        break;
      }
    }
  },
);

// Convenience Actions ------------------------------------------

// Execute current code
export const ExecuteCurrentCodeAtom = atom(null, async (get, set) => {
  const currentCode = get(CurrentCodeAtom);
  return await set(UpdateMvsDataAtom, currentCode);
});

// Backward compatibility exports (deprecated - use the consolidated versions above)
export const UpdateCodeAtom = atom(null, (get, set, newCode: string) =>
  set(UpdateCurrentContentAtom, { code: newCode }),
);

export const UpdateMarkdownAtom = atom(null, (get, set, newMarkdown: string) =>
  set(UpdateCurrentContentAtom, { markdown: newMarkdown }),
);

export const SaveCodeToSceneAtom = atom(null, (get, set) =>
  set(SaveCurrentContentToSceneAtom, "code"),
);

export const SaveMarkdownToSceneAtom = atom(null, (get, set) =>
  set(SaveCurrentContentToSceneAtom, "markdown"),
);

export const AddSceneAtom = atom(
  null,
  (get, set, newScene: Omit<SceneData, "id">) =>
    set(ManageScenesAtom, { type: "add", scene: newScene }),
);

export const RemoveSceneAtom = atom(null, (get, set, sceneId: number) =>
  set(ManageScenesAtom, { type: "remove", sceneId }),
);
