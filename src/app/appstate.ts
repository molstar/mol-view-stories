//
// All StoriesCreator App State will live here.
//
import { atom } from "jotai";
import { init_js_code, init_js_code_02 } from "./state/initial_data.mjs";

// types ------------------------------------------
type SceneData = {
  id: number; // unique key
  header: string; // title
  key: string; // internal key
  description: string; // markdown description
  javascript: string; // should define a builder that creates mvsData
};

// Stateless Functions ------------------------------------------

// Function to check if molstar is ready
const checkMolstarReady = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.molstar?.PluginExtensions?.mvs) {
      resolve(true);
      return;
    }

    let attempts = 0;
    const maxAttempts = 100; // 10 seconds at 100ms intervals
    
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

// Function to execute JavaScript code and return MVS data
const executeJavaScriptCode = async (code: string): Promise<unknown> => {
  try {
    // Create a function that executes the code in a controlled environment
    const evalFunction = new Function(`
      try {
        // Ensure molstar and its MVS extension are available
        if (!window.molstar || !window.molstar.PluginExtensions || !window.molstar.PluginExtensions.mvs) {
          throw new Error("Molstar MVS extension is not available");
        }

        // Execute the user code
        ${code}

        // Return the MVS data
        return mvsData;
      } catch (error) {
        console.error("Error executing JS code:", error);
        throw error;
      }
    `);

    const result = evalFunction();
    return result;
  } catch (error) {
    console.error("Error in executeJavaScriptCode:", error);
    throw error;
  }
};

// Base State Atoms ------------------------------------------

// All scenes data
export const ScenesAtom = atom<SceneData[]>([
  { 
    id: 1, 
    header: "Awesome Thing 01",
    key: "scene_01",
    description: "# Retinoic Acid Visualization\n\nShowing a protein structure with retinoic acid ligand in green cartoon representation.",
    javascript: init_js_code 
  },
  { 
    id: 2, 
    header: "Awesome Thing 02", 
    key: "scene_02",
    description: "# Alternative Visualization\n\nSame structure but with blue cartoon and orange ligand coloring.",
    javascript: init_js_code_02 
  },
]);

// Currently active scene ID
export const ActiveSceneIdAtom = atom(1);

// Molstar readiness state
export const MolstarReadyAtom = atom(false);

// Derived/Reactive Atoms ------------------------------------------

// Get the currently active scene
export const ActiveSceneAtom = atom((get) => {
  const scenes = get(ScenesAtom);
  const activeId = get(ActiveSceneIdAtom);
  return scenes.find(scene => scene.id === activeId) || scenes[0];
});

// Initialize Molstar (write-only atom)
export const InitializeMolstarAtom = atom(
  null,
  async (get, set) => {
    try {
      const isReady = await checkMolstarReady();
      set(MolstarReadyAtom, isReady);
      return isReady;
    } catch (error) {
      console.error("Error initializing Molstar:", error);
      set(MolstarReadyAtom, false);
      return false;
    }
  }
);

// Execute the active scene's JavaScript and generate MVS data
export const ActiveSceneMvsDataAtom = atom(
  null,
  async (get, set) => {
    const molstarReady = get(MolstarReadyAtom);
    const activeScene = get(ActiveSceneAtom);

    if (!molstarReady) {
      console.log("Molstar not ready, initializing...");
      const initialized = await set(InitializeMolstarAtom);
      if (!initialized) {
        console.error("Failed to initialize Molstar");
        return null;
      }
    }

    if (!activeScene?.javascript) {
      console.warn("No JavaScript code in active scene");
      return null;
    }

    try {
      console.log("Executing JavaScript for scene:", activeScene.id);
      const mvsData = await executeJavaScriptCode(activeScene.javascript);
      return mvsData;
    } catch (error) {
      console.error("Error executing scene JavaScript:", error);
      return null;
    }
  }
);

// Current MVS data for the viewer (read-only derived atom)
export const CurrentMvsDataAtom = atom<unknown>(null);

// Atom to trigger MVS data generation when active scene changes
export const UpdateMvsDataAtom = atom(
  null,
  async (get, set) => {
    try {
      const mvsData = await set(ActiveSceneMvsDataAtom);
      set(CurrentMvsDataAtom, mvsData);
      return mvsData;
    } catch (error) {
      console.error("Error updating MVS data:", error);
      set(CurrentMvsDataAtom, null);
      return null;
    }
  }
);

// Actions/Mutations ------------------------------------------

// Action to change active scene
export const SetActiveSceneAtom = atom(
  null,
  (get, set, sceneId: number) => {
    set(ActiveSceneIdAtom, sceneId);
    // Trigger MVS data update when scene changes
    set(UpdateMvsDataAtom);
  }
);

// Action to update a scene's data
export const UpdateSceneAtom = atom(
  null,
  (get, set, updatedScene: SceneData) => {
    const scenes = get(ScenesAtom);
    const newScenes = scenes.map(scene => 
      scene.id === updatedScene.id ? updatedScene : scene
    );
    set(ScenesAtom, newScenes);
    
    // If this is the active scene, update MVS data
    const activeId = get(ActiveSceneIdAtom);
    if (updatedScene.id === activeId) {
      set(UpdateMvsDataAtom);
    }
  }
);

// Action to add a new scene
export const AddSceneAtom = atom(
  null,
  (get, set, newScene: Omit<SceneData, 'id'>) => {
    const scenes = get(ScenesAtom);
    const maxId = Math.max(...scenes.map(s => s.id), 0);
    const sceneWithId: SceneData = {
      ...newScene,
      id: maxId + 1
    };
    set(ScenesAtom, [...scenes, sceneWithId]);
  }
);

// Action to remove a scene
export const RemoveSceneAtom = atom(
  null,
  (get, set, sceneId: number) => {
    const scenes = get(ScenesAtom);
    const newScenes = scenes.filter(scene => scene.id !== sceneId);
    set(ScenesAtom, newScenes);
    
    // If we removed the active scene, switch to the first available scene
    const activeId = get(ActiveSceneIdAtom);
    if (sceneId === activeId && newScenes.length > 0) {
      set(SetActiveSceneAtom, newScenes[0].id);
    }
  }
);