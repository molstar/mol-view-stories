// Central dependency file for MVS CLI
// This file re-exports all necessary dependencies

// Standard library imports
export { exists } from '@std/fs';
export { basename, dirname, extname, join, relative } from '@std/path';
export { parse as parseYaml } from '@std/yaml';
export { walk } from '@std/fs';

// Local lib imports (replacing external package)
export type {
  Story,
  SceneData,
  StoryMetadata,
  SceneAsset,
  CameraData,
  StoryContainer,
} from '@mol-view-stories/lib/types';
export { StoryManager } from '@mol-view-stories/lib/StoryManager';
