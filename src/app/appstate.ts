//
// StoriesCreator App State Coordinator
//
// This file serves as the main entry point for all application state.
// It re-exports the key atoms and types needed throughout the app.
//
// Data Flow:
// 1. ScenesAtom holds the collection of scene data with JavaScript code
// 2. ActiveSceneIdAtom tracks which scene is currently selected
// 3. ActiveSceneAtom derives the current scene from the above two atoms
// 4. When scenes change via SetActiveSceneAtom, the JavaScript is executed
// 5. ExecuteCodeAtom processes the JavaScript and updates CurrentMvsDataAtom
// 6. CurrentMvsDataAtom holds the resulting visualization data for rendering
//

// Re-export types
export type { SceneData, SceneUpdate, CreateSceneData } from "./state/types";

// Re-export core state atoms
export {
  ScenesAtom,
  ActiveSceneIdAtom,
  CurrentMvsDataAtom,
  ActiveSceneAtom,
} from "./state/atoms";

// Re-export action atoms
export {
  ExecuteCodeAtom,
  SetActiveSceneAtom,
  UpdateSceneAtom,
  AddSceneAtom,
  RemoveSceneAtom,
} from "./state/atoms";