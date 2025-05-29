//
// StoriesCreator App State Coordinator
//
//  - This file serves as the main entry point for all application state.
//  - It re-exports the key atoms, types, and helper functions needed throughout the app.
//  - All application components either use local state or interact with the global state defined here.
//  - All state is maintines as JOTAI atoms
//
// Data Flow:
// 1. ScenesAtom holds the collection of scene data with JavaScript code
// 2. ActiveSceneIdAtom tracks which scene is currently selected
// 3. Helper functions compute the active scene and handle state updates
// 4. When scenes change, the JavaScript is executed via helper functions
// 5. CurrentMvsDataAtom holds the resulting visualization data for rendering
//

// Re-export types
export type { SceneData, SceneUpdate, CreateSceneData, CurrentView } from './state/types';

// Core state atoms
export {
  datastore,
  StoryAtom,
  CurrentViewAtom,
  ActiveSceneIdAtom,
  CameraSnapshotAtom as CameraPositionAtom,
  ActiveSceneAtom,
} from './state/atoms';

// Helper functions for state management
export * from './state/actions';
