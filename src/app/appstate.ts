//
// MolViewStory App State
//
//  - This file serves as the main entry point for all application state.
//  - It re-exports the key atoms, types, and helper functions needed throughout the app.
//  - All application components either use local state or interact with the global state defined here.
//  - All state is maintained as JOTAI `atom`s
// ```
// └── state
//  ├── actions.ts     // Fns that change state
//  ├── atoms.ts       // state defined here
//  ├── template.ts    // templates
//  └── types.ts       // all of the project types.
// ```
//

// Re-export types
export type { SceneData, SceneUpdate, CreateSceneData, CurrentView, SceneAsset } from './state/types';

// Core state atoms.
//
// If you want to use/mutate a value in a React Component, import the Atom directly `with useAtom`.
//
export {
  StoryAtom,
  CurrentViewAtom,
  ActiveSceneIdAtom,
  CameraSnapshotAtom as CameraPositionAtom,
  ActiveSceneAtom,
  StoryAssetsAtom,
  OpenSessionAtom,
} from './state/atoms';

// Helper functions for state management
export {
  addScene,
  downloadStory,
  exportState,
  modifyCurrentScene,
  modifySceneMetadata,
  removeCurrentScene,
  addStoryAssets,
  removeStoryAsset,
} from './state/actions';
