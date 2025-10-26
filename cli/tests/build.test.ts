import { assertEquals, assertExists, assertRejects } from '@std/assert';
import { join } from '@std/path';
import { ensureDir, ensureFile } from '@std/fs';
import { parseStoryFolder, parseSceneFolder, parseAssetsFolder } from '../src/commands/build.ts';
import type { Story, SceneData, SceneAsset } from '@mol-view-stories/lib/types';

// Helper to create a temporary test directory
async function createTestStoryStructure(baseDir: string): Promise<string> {
  const storyDir = join(baseDir, 'test-story');

  // Create directory structure
  await ensureDir(join(storyDir, 'scenes', 'scene1'));
  await ensureDir(join(storyDir, 'scenes', 'scene2'));
  await ensureDir(join(storyDir, 'assets'));

  // Create story.yaml with new format (no metadata wrapper, scenes key required)
  const storyYaml = `
title: Test Story
author_note: A test story for unit testing
scenes:
  - folder: scene1
  - folder: scene2
`;
  await Deno.writeTextFile(join(storyDir, 'story.yaml'), storyYaml);

  // Create global_js inline in story.yaml
  const storyYamlWithJs = `
title: Test Story
author_note: A test story for unit testing
global_js: |
  // Global story JavaScript
  console.log('Story initialized');
scenes:
  - folder: scene1
  - folder: scene2
`;
  await Deno.writeTextFile(join(storyDir, 'story.yaml'), storyYamlWithJs);

  // Create scene1 files
  const scene1Yaml = `
header: Scene One
key: scene-one
camera:
  mode: perspective
  target: [0, 0, 0]
  position: [10, 10, 10]
  up: [0, 1, 0]
  fov: 45
linger_duration_ms: 3000
transition_duration_ms: 1000
`;
  await Deno.writeTextFile(join(storyDir, 'scenes', 'scene1', 'scene1.yaml'), scene1Yaml);

  const scene1Md = `
# Scene One Description

This is the first scene of our test story.
`;
  await Deno.writeTextFile(join(storyDir, 'scenes', 'scene1', 'scene1.md'), scene1Md);

  const scene1Js = `
// Scene 1 JavaScript
console.log('Scene 1 loaded');
`;
  await Deno.writeTextFile(join(storyDir, 'scenes', 'scene1', 'scene1.js'), scene1Js);

  // Create scene2 files
  const scene2Yaml = `
header: Scene Two
key: scene-two
linger_duration_ms: 2000
transition_duration_ms: 500
`;
  await Deno.writeTextFile(join(storyDir, 'scenes', 'scene2', 'scene2.yaml'), scene2Yaml);

  const scene2Md = `
# Scene Two Description

This is the second scene.
`;
  await Deno.writeTextFile(join(storyDir, 'scenes', 'scene2', 'scene2.md'), scene2Md);

  const scene2Js = `
// Scene 2 JavaScript
console.log('Scene 2 loaded');
`;
  await Deno.writeTextFile(join(storyDir, 'scenes', 'scene2', 'scene2.js'), scene2Js);

  // Create asset files
  const assetContent = new Uint8Array([1, 2, 3, 4, 5]);
  await Deno.writeFile(join(storyDir, 'assets', 'test.pdb'), assetContent);

  const assetContent2 = new Uint8Array([6, 7, 8, 9, 10]);
  await Deno.writeFile(join(storyDir, 'assets', 'molecule.cif'), assetContent2);

  return storyDir;
}

// Test parseStoryFolder
Deno.test('parseStoryFolder - Complete Story Structure', async (t) => {
  const tempDir = await Deno.makeTempDir();

  try {
    await t.step('should parse a complete story folder', async () => {
      const storyDir = await createTestStoryStructure(tempDir);
      const story = await parseStoryFolder(storyDir);

      assertExists(story);
      assertEquals(story.metadata.title, 'Test Story');
      assertEquals(story.scenes.length, 2);
      assertEquals(story.assets.length, 2);

      // Check global JavaScript
      assertEquals(story.javascript.includes('Story initialized'), true);

      // Check first scene
      const scene1 = story.scenes[0];
      assertEquals(scene1.header, 'Scene One');
      assertEquals(scene1.key, 'scene-one');
      assertEquals(scene1.description.includes('Scene One Description'), true);
      assertEquals(scene1.javascript.includes('Scene 1 loaded'), true);
      assertExists(scene1.camera);
      assertEquals(scene1.camera?.mode, 'perspective');
      assertEquals(scene1.linger_duration_ms, 3000);

      // Check second scene
      const scene2 = story.scenes[1];
      assertEquals(scene2.header, 'Scene Two');
      assertEquals(scene2.key, 'scene-two');
      assertEquals(scene2.description.includes('Scene Two Description'), true);
      assertEquals(scene2.javascript.includes('Scene 2 loaded'), true);
      assertEquals(scene2.linger_duration_ms, 2000);

      // Check assets
      const asset1 = story.assets.find((a) => a.name === 'test.pdb');
      assertExists(asset1);
      assertEquals(Array.from(asset1.content), [1, 2, 3, 4, 5]);

      const asset2 = story.assets.find((a) => a.name === 'molecule.cif');
      assertExists(asset2);
      assertEquals(Array.from(asset2.content), [6, 7, 8, 9, 10]);
    });

    await t.step('should handle missing story.yaml', async () => {
      const invalidDir = join(tempDir, 'invalid-story');
      await ensureDir(invalidDir);

      await assertRejects(async () => await parseStoryFolder(invalidDir), Error, 'story.yaml not found');
    });

    await t.step('should handle missing optional files gracefully', async () => {
      const minimalDir = join(tempDir, 'minimal-story');
      await ensureDir(minimalDir);

      // Create story.yaml with new format - must have scenes key
      const storyYaml = `
title: Minimal Story
scenes: []
`;
      await Deno.writeTextFile(join(minimalDir, 'story.yaml'), storyYaml);

      const story = await parseStoryFolder(minimalDir);

      assertExists(story);
      assertEquals(story.metadata.title, 'Minimal Story');
      assertEquals(story.scenes.length, 0);
      assertEquals(story.assets.length, 0);
      assertEquals(story.javascript, ''); // Should be empty when global_js is missing
    });
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

// Test parseSceneFolder
Deno.test('parseSceneFolder - Scene Parsing', async (t) => {
  const tempDir = await Deno.makeTempDir();

  try {
    await t.step('should parse a complete scene folder', async () => {
      const sceneDir = join(tempDir, 'test-scene');
      await ensureDir(sceneDir);

      // Create scene files
      const sceneYaml = `
header: Test Scene
key: test-key
camera:
  mode: orthographic
  target: [1, 2, 3]
  position: [4, 5, 6]
  up: [0, 1, 0]
  fov: 60
linger_duration_ms: 4000
transition_duration_ms: 1500
`;
      await Deno.writeTextFile(join(sceneDir, 'test-scene.yaml'), sceneYaml);

      const sceneMd = '# Test Scene\n\nThis is a test scene.';
      await Deno.writeTextFile(join(sceneDir, 'test-scene.md'), sceneMd);

      const sceneJs = 'console.log("Test scene");';
      await Deno.writeTextFile(join(sceneDir, 'test-scene.js'), sceneJs);

      const scene = await parseSceneFolder(sceneDir, tempDir, 0);

      assertExists(scene);
      assertEquals(scene.id, 'scene_1');
      assertEquals(scene.header, 'Test Scene');
      assertEquals(scene.key, 'test-key');
      assertEquals(scene.description.includes('Test Scene'), true);
      assertEquals(scene.javascript.includes('Test scene'), true);
      assertExists(scene.camera);
      assertEquals(scene.camera?.mode, 'orthographic');
      assertEquals(scene.camera?.target, [1, 2, 3]);
      assertEquals(scene.linger_duration_ms, 4000);
    });

    await t.step('should handle missing scene YAML', async () => {
      const invalidSceneDir = join(tempDir, 'invalid-scene');
      await ensureDir(invalidSceneDir);

      await assertRejects(
        async () => await parseSceneFolder(invalidSceneDir, tempDir, 0),
        Error,
        'not found in scene directory'
      );
    });

    await t.step('should use defaults for missing optional files', async () => {
      const minimalSceneDir = join(tempDir, 'minimal-scene');
      await ensureDir(minimalSceneDir);

      // Create only the YAML file
      const sceneYaml = `
header: Minimal Scene
`;
      await Deno.writeTextFile(join(minimalSceneDir, 'minimal-scene.yaml'), sceneYaml);

      const scene = await parseSceneFolder(minimalSceneDir, tempDir, 0);

      assertExists(scene);
      assertEquals(scene.header, 'Minimal Scene');
      assertEquals(scene.description, ''); // Empty when .md is missing
      assertEquals(scene.javascript, ''); // Empty when .js is missing
      assertEquals(scene.camera, undefined); // No camera in YAML
      assertEquals(scene.linger_duration_ms, 5000); // Default value
      assertEquals(scene.transition_duration_ms, 1000); // Default value
    });
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

// Test parseAssetsFolder
Deno.test('parseAssetsFolder - Asset Parsing', async (t) => {
  const tempDir = await Deno.makeTempDir();

  try {
    await t.step('should parse assets from folder', async () => {
      const rootDir = join(tempDir, 'test-project');
      const assetsDir = join(rootDir, 'assets');
      await ensureDir(assetsDir);

      // Create test assets
      await Deno.writeFile(join(assetsDir, 'molecule1.pdb'), new Uint8Array([1, 2, 3]));
      await Deno.writeFile(join(assetsDir, 'molecule2.cif'), new Uint8Array([4, 5, 6]));

      // Create a subdirectory with an asset
      await ensureDir(join(assetsDir, 'subfolder'));
      await Deno.writeFile(join(assetsDir, 'subfolder', 'nested.pdb'), new Uint8Array([7, 8, 9]));

      const assets = await parseAssetsFolder(rootDir);

      assertEquals(assets.length, 3);

      // Check first asset
      const asset1 = assets.find((a) => a.name === 'molecule1.pdb');
      assertExists(asset1);
      assertEquals(Array.from(asset1.content), [1, 2, 3]);

      // Check second asset
      const asset2 = assets.find((a) => a.name === 'molecule2.cif');
      assertExists(asset2);
      assertEquals(Array.from(asset2.content), [4, 5, 6]);

      // Check nested asset
      const asset3 = assets.find((a) => a.name === 'nested.pdb');
      assertExists(asset3);
      assertEquals(Array.from(asset3.content), [7, 8, 9]);
    });

    await t.step('should return empty array when assets directory does not exist', async () => {
      const rootDir = join(tempDir, 'no-assets-project');
      await ensureDir(rootDir);

      const assets = await parseAssetsFolder(rootDir);

      assertEquals(assets.length, 0);
    });

    await t.step('should handle empty assets directory', async () => {
      const rootDir = join(tempDir, 'empty-assets-project');
      const assetsDir = join(rootDir, 'assets');
      await ensureDir(assetsDir);

      const assets = await parseAssetsFolder(rootDir);

      assertEquals(assets.length, 0);
    });
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

// Test special characters and edge cases in folder/file names
Deno.test('parseStoryFolder - Special Characters and Edge Cases', async (t) => {
  const tempDir = await Deno.makeTempDir();

  try {
    await t.step('should handle scenes with special characters in names', async () => {
      const storyDir = join(tempDir, 'special-story');
      const sceneDir = join(storyDir, 'scenes', 'scene-with-dash');
      await ensureDir(sceneDir);

      // Create story.yaml with new format
      const storyYaml = `
title: Special Story
scenes:
  - folder: scene-with-dash
`;
      await Deno.writeTextFile(join(storyDir, 'story.yaml'), storyYaml);

      // Create scene with dashes in name
      const sceneYaml = `
header: Scene With Dash
key: scene-with-dash-key
`;
      await Deno.writeTextFile(join(sceneDir, 'scene-with-dash.yaml'), sceneYaml);
      await Deno.writeTextFile(join(sceneDir, 'scene-with-dash.md'), '# Scene with special chars');
      await Deno.writeTextFile(join(sceneDir, 'scene-with-dash.js'), '// JS content');

      const story = await parseStoryFolder(storyDir);

      assertExists(story);
      assertEquals(story.scenes.length, 1);
      assertEquals(story.scenes[0].header, 'Scene With Dash');
      assertEquals(story.scenes[0].key, 'scene-with-dash-key');
    });

    await t.step('should handle scenes with numbers in names', async () => {
      const storyDir = join(tempDir, 'numbered-story');
      const sceneDir = join(storyDir, 'scenes', '01-intro');
      await ensureDir(sceneDir);

      // Create story.yaml with new format
      const storyYaml = `
title: Numbered Story
scenes:
  - folder: 01-intro
`;
      await Deno.writeTextFile(join(storyDir, 'story.yaml'), storyYaml);

      // Create scene with numbers in name
      const sceneYaml = `
header: Introduction
key: intro
`;
      await Deno.writeTextFile(join(sceneDir, '01-intro.yaml'), sceneYaml);
      await Deno.writeTextFile(join(sceneDir, '01-intro.md'), '# Introduction');
      await Deno.writeTextFile(join(sceneDir, '01-intro.js'), '// Intro JS');

      const story = await parseStoryFolder(storyDir);

      assertExists(story);
      assertEquals(story.scenes.length, 1);
      assertEquals(story.scenes[0].header, 'Introduction');
      assertEquals(story.scenes[0].key, 'intro');
    });
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});
