// Central dependency file for MVS CLI
// This file re-exports all necessary dependencies for both server and browser use

// Standard library imports
export { exists } from "@std/fs";
export { basename, dirname, extname, join, relative } from "@std/path";
export { parse as parseYaml } from "@std/yaml";
export { walk } from "@std/fs";

// MVS Story types and utilities
export { MVSData, StoryContainer } from "@zachcp/molviewstory-types";

// For browser consumption, we need to export molstar viewer creation
// This will be bundled separately for browser use
export type { PluginUIContext } from "npm:molstar@5.0.0-dev.8/lib/mol-plugin-ui/context";
export { createPluginUI } from "npm:molstar@5.0.0-dev.8/lib/mol-plugin-ui";
export { DefaultPluginUISpec } from "npm:molstar@5.0.0-dev.8/lib/mol-plugin-ui/spec";
