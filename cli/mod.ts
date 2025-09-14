/**
 * @fileoverview MVS CLI - MolViewPack Story Creator
 * @module @zachcp/mvs-cli
 *
 * A command-line tool and programmatic API for creating and managing
 * MolViewPack molecular visualization stories.
 *
 * @example
 * ```ts
 * import { createStory, buildStory, watchStory } from "@zachcp/mvs-cli";
 *
 * // Create a new story programmatically
 * await createStory("my-protein-story");
 *
 * // Build a story to JSON
 * const json = await buildStory("./my-story");
 *
 * // Start a watch server
 * const { cleanup } = await watchStory("./my-story", { port: 8080 });
 * ```
 */

// Re-export command functions for programmatic use
export { createStory } from "./src/commands/create.ts";
export { buildStory, type BuildFormat } from "./src/commands/build.ts";
export { watchStory } from "./src/commands/watch.ts";
export { serveTemplate } from "./src/commands/serve.ts";

// Re-export types from molviewstory-types
export type { StoryContainer } from "@zachcp/molviewstory-types";

// Export version
export const VERSION = "0.1.0";

// Note: main.ts is the CLI entry point, not intended for programmatic import
// Use the individual command functions above for programmatic access
