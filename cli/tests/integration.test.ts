import { assertEquals, assertExists, assertInstanceOf } from '@std/assert';
import { join } from '@std/path';
import { ensureDir, exists } from '@std/fs';
import { buildStory, parseStoryFolder } from '../src/commands/build.ts';
import { StoryManager } from '@mol-view-stories/lib/StoryManager';
import { createStory } from '../src/commands/create.ts';
import type { Story } from '@mol-view-stories/lib/types';

// Test the full pipeline: create -> build -> parse -> export
Deno.test('Integration - Full Story Pipeline', async (t) => {
  const tempDir = await Deno.makeTempDir();

  try {
    await t.step('should create, build, and export a story', async () => {
      // Step 1: Create a story using the CLI create command
      const storyName = 'integration-test-story';
      const storyPath = join(tempDir, storyName);

      // Temporarily change working directory to temp dir
      const originalCwd = Deno.cwd();
      Deno.chdir(tempDir);

      try {
        await createStory(storyName);

        // Verify the story was created
        const stat = await Deno.stat(storyPath);
        assertEquals(stat.isDirectory, true);

        // Step 2: Parse the created story
        const parsedStory = await parseStoryFolder(storyPath);
        assertExists(parsedStory);
        assertEquals(parsedStory.metadata.title, storyName);
        assertEquals(parsedStory.scenes.length, 2); // Default create makes 2 scenes

        // Step 3: Create a StoryManager with the parsed story
        const manager = new StoryManager(parsedStory);

        // Step 4: Test various export formats

        // Test JSON export
        const jsonExport = manager.toJSON();
        const parsedJson = JSON.parse(jsonExport);
        assertEquals(parsedJson.metadata.title, storyName);

        // Test container export
        const containerExport = await manager.toContainer();
        assertExists(containerExport);
        assertEquals(containerExport instanceof Uint8Array, true);

        // Step 5: Test round-trip through container format
        const reimportedManager = await StoryManager.fromContainer(containerExport);
        const reimportedStory = reimportedManager.getStory();
        assertEquals(reimportedStory.metadata.title, storyName);
        assertEquals(reimportedStory.scenes.length, 2);

        // Step 6: Test HTML export
        const htmlExport = await manager.toHTML();
        assertExists(htmlExport);
        assertEquals(htmlExport.includes('<!DOCTYPE html>'), true);
        assertEquals(htmlExport.includes(storyName), true);

      } finally {
        // Restore original working directory
        Deno.chdir(originalCwd);
      }
    });

    await t.step('should handle build command with output file', async () => {
      const storyName = 'build-test-story';
      const storyPath = join(tempDir, storyName);

      // Create a minimal story structure
      await ensureDir(join(storyPath, 'scenes', 'scene1'));

      // Create story.yaml
      const storyYaml = `
metadata:
  title: Build Test Story
`;
      await Deno.writeTextFile(join(storyPath, 'story.yaml'), storyYaml);

      // Create a scene
      const sceneYaml = `
header: Test Scene
key: test
`;
      await Deno.writeTextFile(
        join(storyPath, 'scenes', 'scene1', 'scene1.yaml'),
        sceneYaml
      );

      // Test building to JSON file
      const jsonOutput = join(tempDir, 'output.json');
      await buildStory(storyPath, jsonOutput, 'json');

      // Verify the file was created
      const jsonExists = await exists(jsonOutput);
      assertEquals(jsonExists, true);

      // Read and verify the content
      const jsonContent = await Deno.readTextFile(jsonOutput);
      const parsedOutput = JSON.parse(jsonContent);
      assertEquals(parsedOutput.metadata.title, 'Build Test Story');

      // Test building to container format
      const containerOutput = join(tempDir, 'output.mvstory');
      await buildStory(storyPath, containerOutput, 'mvstory');

      const containerExists = await exists(containerOutput);
      assertEquals(containerExists, true);

      // Verify it's a binary file
      const containerContent = await Deno.readFile(containerOutput);
      assertInstanceOf(containerContent, Uint8Array);
      assertEquals(containerContent.length > 0, true);

      // Test building to HTML format
      const htmlOutput = join(tempDir, 'output.html');
      await buildStory(storyPath, htmlOutput, 'html');

      const htmlExists = await exists(htmlOutput);
      assertEquals(htmlExists, true);

      const htmlContent = await Deno.readTextFile(htmlOutput);
      assertEquals(htmlContent.includes('<!DOCTYPE html>'), true);
      assertEquals(htmlContent.includes('Build Test Story'), true);
    });
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

// Test StoryManager modifications and persistence
Deno.test('Integration - Story Modification and Persistence', async (t) => {
  const tempDir = await Deno.makeTempDir();

  try {
    await t.step('should create, modify, and persist story changes', async () => {
      // Create a basic story
      const originalStory: Story = {
        metadata: { title: 'Original Story' },
        javascript: '',
        scenes: [
          {
            id: 'scene1',
            header: 'Original Scene',
            key: 'original',
            description: 'Original description',
            javascript: '',
          },
        ],
        assets: [],
      };

      // Create manager and modify the story
      const manager = new StoryManager(originalStory);

      // Add a new scene
      const newSceneId = manager.addScene({
        header: 'Added Scene',
        key: 'added',
        description: 'This scene was added',
      });
      assertExists(newSceneId);

      // Update metadata
      manager.updateMetadata({ title: 'Modified Story' });

      // Add an asset
      manager.addAsset({
        name: 'test.pdb',
        content: new Uint8Array([1, 2, 3]),
      });

      // Export to JSON
      const jsonExport = manager.toJSON();
      const exportedStory = JSON.parse(jsonExport);

      // Verify modifications were persisted
      assertEquals(exportedStory.metadata.title, 'Modified Story');
      assertEquals(exportedStory.scenes.length, 2);
      assertEquals(exportedStory.scenes[1].header, 'Added Scene');
      assertEquals(exportedStory.assets.length, 1);
      assertEquals(exportedStory.assets[0].name, 'test.pdb');

      // Export to container and reimport
      const container = await manager.toContainer();
      const reimportedManager = await StoryManager.fromContainer(container);
      const reimportedStory = reimportedManager.getStory();

      // Verify all modifications persisted through container format
      assertEquals(reimportedStory.metadata.title, 'Modified Story');
      assertEquals(reimportedStory.scenes.length, 2);
      assertEquals(reimportedStory.scenes[1].header, 'Added Scene');
      assertEquals(reimportedStory.assets.length, 1);
    });
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

// Test error handling and edge cases
Deno.test('Integration - Error Handling', async (t) => {
  const tempDir = await Deno.makeTempDir();

  try {
    await t.step('should handle invalid story structures gracefully', async () => {
      const invalidStoryPath = join(tempDir, 'invalid-story');
      await ensureDir(invalidStoryPath);

      // Create an invalid story.yaml with bad YAML syntax
      const invalidYaml = `
metadata:
  title: Invalid Story
  bad_indent
    this_will_fail: true
`;
      await Deno.writeTextFile(join(invalidStoryPath, 'story.yaml'), invalidYaml);

      // Parsing should fail with a meaningful error
      let errorOccurred = false;
      try {
        await parseStoryFolder(invalidStoryPath);
      } catch (error) {
        errorOccurred = true;
        assertExists(error);
      }
      assertEquals(errorOccurred, true);
    });

    await t.step('should handle empty story gracefully', async () => {
      const emptyStory: Story = {
        metadata: { title: 'Empty' },
        javascript: '',
        scenes: [],
        assets: [],
      };

      const manager = new StoryManager(emptyStory);

      // Should be able to export even with no scenes
      const json = manager.toJSON();
      assertExists(json);

      const parsed = JSON.parse(json);
      assertEquals(parsed.metadata.title, 'Empty');
      assertEquals(parsed.scenes.length, 0);

      // Should be able to add scenes to empty story
      const sceneId = manager.addScene({ header: 'First Scene' });
      assertExists(sceneId);
      assertEquals(manager.getStory().scenes.length, 1);
    });

    await t.step('should handle missing scene files gracefully', async () => {
      const storyPath = join(tempDir, 'incomplete-story');
      const sceneDir = join(storyPath, 'scenes', 'incomplete-scene');
      await ensureDir(sceneDir);

      // Create story.yaml
      await Deno.writeTextFile(
        join(storyPath, 'story.yaml'),
        'metadata:\n  title: Incomplete Story\n'
      );

      // Create scene with only YAML (missing .md and .js files)
      await Deno.writeTextFile(
        join(sceneDir, 'incomplete-scene.yaml'),
        'header: Incomplete Scene\n'
      );

      // Should parse successfully with empty values for missing files
      const story = await parseStoryFolder(storyPath);
      assertExists(story);
      assertEquals(story.scenes.length, 1);
      assertEquals(story.scenes[0].header, 'Incomplete Scene');
      assertEquals(story.scenes[0].description, ''); // Empty due to missing .md
      assertEquals(story.scenes[0].javascript, ''); // Empty due to missing .js
    });
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

// Test performance with larger stories
Deno.test('Integration - Performance with Larger Stories', async (t) => {
  const tempDir = await Deno.makeTempDir();

  try {
    await t.step('should handle stories with many scenes efficiently', async () => {
      const story: Story = {
        metadata: { title: 'Large Story' },
        javascript: '',
        scenes: [],
        assets: [],
      };

      // Create 50 scenes
      const manager = new StoryManager(story);
      for (let i = 0; i < 50; i++) {
        manager.addScene({
          header: `Scene ${i + 1}`,
          key: `scene-${i + 1}`,
          description: `Description for scene ${i + 1}`.repeat(100), // Large description
          javascript: `console.log("Scene ${i + 1}");`,
        });
      }

      // Add multiple assets
      for (let i = 0; i < 10; i++) {
        const content = new Uint8Array(1024); // 1KB each
        content.fill(i);
        manager.addAsset({
          name: `asset${i}.pdb`,
          content,
        });
      }

      // Test that export operations complete in reasonable time
      const startJson = Date.now();
      const jsonExport = manager.toJSON();
      const jsonTime = Date.now() - startJson;

      assertExists(jsonExport);
      // JSON export should be fast (< 100ms even for large stories)
      assertEquals(jsonTime < 100, true);

      // Test container export
      const startContainer = Date.now();
      const containerExport = await manager.toContainer();
      const containerTime = Date.now() - startContainer;

      assertExists(containerExport);
      // Container export should complete reasonably quickly (< 500ms)
      assertEquals(containerTime < 500, true);

      // Verify the story integrity
      const reimported = await StoryManager.fromContainer(containerExport);
      assertEquals(reimported.getStory().scenes.length, 50);
      assertEquals(reimported.getStory().assets.length, 10);
    });
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});
