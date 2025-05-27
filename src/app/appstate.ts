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

// Monaco Editor State ------------------------------------------
// Current code in the editor
export const CurrentCodeAtom = atom("");

// Editor readiness state
export const EditorReadyAtom = atom(false);

// Code execution state
export const CodeExecutingAtom = atom(false);

// Derived/Reactive Atoms ------------------------------------------

// Get the currently active scene
export const ActiveSceneAtom = atom((get) => {
  const scenes = get(ScenesAtom);
  const activeId = get(ActiveSceneIdAtom);
  return scenes.find(scene => scene.id === activeId) || scenes[0];
});

// Sync code with active scene (read-only derived atom)
export const ActiveSceneCodeAtom = atom((get) => {
  const activeScene = get(ActiveSceneAtom);
  return activeScene?.javascript || "";
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

// Execute JavaScript code and generate MVS data
export const ExecuteCodeAtom = atom(
  null,
  async (get, set, code?: string) => {
    const molstarReady = get(MolstarReadyAtom);
    const currentCode = code || get(CurrentCodeAtom);

    set(CodeExecutingAtom, true);

    try {
      if (!molstarReady) {
        console.log("Molstar not ready, initializing...");
        const initialized = await set(InitializeMolstarAtom);
        if (!initialized) {
          console.error("Failed to initialize Molstar");
          set(CodeExecutingAtom, false);
          return null;
        }
      }

      if (!currentCode) {
        console.warn("No JavaScript code to execute");
        set(CodeExecutingAtom, false);
        return null;
      }

      console.log("Executing JavaScript code...");
      const mvsData = await executeJavaScriptCode(currentCode);
      set(CodeExecutingAtom, false);
      return mvsData;
    } catch (error) {
      console.error("Error executing JavaScript code:", error);
      set(CodeExecutingAtom, false);
      return null;
    }
  }
);

// Current MVS data for the viewer (read-only derived atom)
export const CurrentMvsDataAtom = atom<unknown>(null);

// Atom to trigger MVS data generation and update viewer
export const UpdateMvsDataAtom = atom(
  null,
  async (get, set, code?: string) => {
    try {
      const mvsData = await set(ExecuteCodeAtom, code);
      set(CurrentMvsDataAtom, mvsData);
      return mvsData;
    } catch (error) {
      console.error("Error updating MVS data:", error);
      set(CurrentMvsDataAtom, null);
      return null;
    }
  }
);

// Monaco Editor Actions ------------------------------------------

// Initialize editor with active scene code
export const InitializeEditorAtom = atom(
  null,
  (get, set) => {
    const activeSceneCode = get(ActiveSceneCodeAtom);
    set(CurrentCodeAtom, activeSceneCode);
    set(EditorReadyAtom, true);
    console.log("Editor initialized with active scene code");
  }
);

// Update current code in editor
export const UpdateCodeAtom = atom(
  null,
  (get, set, newCode: string) => {
    set(CurrentCodeAtom, newCode);
  }
);

// Execute current code and update visualization
export const ExecuteCurrentCodeAtom = atom(
  null,
  async (get, set) => {
    const currentCode = get(CurrentCodeAtom);
    return await set(UpdateMvsDataAtom, currentCode);
  }
);

// Actions/Mutations ------------------------------------------

// Action to change active scene
export const SetActiveSceneAtom = atom(
  null,
  (get, set, sceneId: number) => {
    set(ActiveSceneIdAtom, sceneId);
    
    // Update editor with new scene's code
    const scenes = get(ScenesAtom);
    const newActiveScene = scenes.find(scene => scene.id === sceneId);
    if (newActiveScene) {
      set(CurrentCodeAtom, newActiveScene.javascript);
      // Trigger MVS data update with new scene's code
      set(UpdateMvsDataAtom, newActiveScene.javascript);
    }
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
    
    // If this is the active scene, update editor and MVS data
    const activeId = get(ActiveSceneIdAtom);
    if (updatedScene.id === activeId) {
      set(CurrentCodeAtom, updatedScene.javascript);
      set(UpdateMvsDataAtom, updatedScene.javascript);
    }
  }
);

// Action to save current editor code to active scene
export const SaveCodeToSceneAtom = atom(
  null,
  (get, set) => {
    const activeScene = get(ActiveSceneAtom);
    const currentCode = get(CurrentCodeAtom);
    
    if (activeScene) {
      const updatedScene: SceneData = {
        ...activeScene,
        javascript: currentCode
      };
      set(UpdateSceneAtom, updatedScene);
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