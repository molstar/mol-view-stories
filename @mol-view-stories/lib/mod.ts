/**
 * @module mol-view-stories
 *
 * A TypeScript library for working with Molstar molecular viewer stories.
 *
 * This library provides tools for creating, managing, and exporting molecular
 * visualization stories in various formats including JSON, compressed containers,
 * MVS data, and standalone HTML files.
 *
 * @example
 * ```ts
 * import { StoryManager } from "@molstar/mol-view-stories";
 *
 * const manager = new StoryManager();
 * manager.setMetadata({ title: "My Story", author_note: "Created with StoryManager" });
 *
 * const sceneId = manager.addScene({
 *   header: "Scene 1",
 *   description: "First scene",
 *   javascript: "// scene code"
 * });
 *
 * const json = manager.exportToJson();
 * ```
 */

// Export main StoryManager class
export { StoryManager } from './src/story-manager.ts';

// Export all types
export type { Story, StoryContainer, StoryMetadata, SceneData, SceneAsset, CameraData } from './src/types.ts';

// Export constants and utilities
export { SessionFileExtension, BuilderLibNamespaces, adjustedCameraPosition } from './src/utils.ts';

// Export HTML template generator
export { generateStoriesHtml } from './src/html-template.ts';
