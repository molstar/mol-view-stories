import { assertEquals, assertExists, assertInstanceOf } from '@std/assert';
import { join } from '@std/path';
import { StoryManager } from '@mol-view-stories/lib/StoryManager';
import { parseStoryFolder } from '../src/commands/build.ts';
import type { Story, SceneData, SceneAsset } from '@mol-view-stories/lib/types';

/**
 * Test equivalence between different story representations
 * Focus on round-trip scenarios that should be lossless
 */

// Test folder → mvstory → folder equivalence (core workflow)
Deno.test('Equivalence - Folder Round Trip', async (t) => {
  const examplesDir = join(Deno.cwd(), 'examples');

  await t.step('should preserve story structure through folder → mvstory → folder', async () => {
    const folderPath = join(examplesDir, 'exosome');

    // Step 1: Load folder into StoryManager
    const originalStory = await parseStoryFolder(folderPath);
    const manager1 = new StoryManager(originalStory);

    // Step 2: Convert to MVStory container
    const mvstoryData = await manager1.toMVStory();
    assertInstanceOf(mvstoryData, Uint8Array);
    assertEquals(mvstoryData.length > 1000, true); // Should be substantial

    // Step 3: Load MVStory back into StoryManager
    const manager2 = await StoryManager.fromMVStory(mvstoryData);
    const roundTripStory = manager2.getStory();

    // Step 4: Verify core story structure is preserved
    assertEquals(originalStory.metadata.title, roundTripStory.metadata.title);
    assertEquals(originalStory.scenes.length, roundTripStory.scenes.length);
    assertEquals(originalStory.assets.length, roundTripStory.assets.length);

    // Verify scene headers and keys are preserved
    for (let i = 0; i < originalStory.scenes.length; i++) {
      assertEquals(originalStory.scenes[i].header, roundTripStory.scenes[i].header);
      assertEquals(originalStory.scenes[i].key, roundTripStory.scenes[i].key);
    }

    // Verify asset names and sizes are preserved
    const sortedOriginal = [...originalStory.assets].sort((a, b) => a.name.localeCompare(b.name));
    const sortedRoundTrip = [...roundTripStory.assets].sort((a, b) => a.name.localeCompare(b.name));

    for (let i = 0; i < sortedOriginal.length; i++) {
      assertEquals(sortedOriginal[i].name, sortedRoundTrip[i].name);
      assertEquals(new Uint8Array(sortedOriginal[i].content).length, new Uint8Array(sortedRoundTrip[i].content).length);
    }
  });

  await t.step('should handle terms-of-entrapment folder round trip', async () => {
    const folderPath = join(examplesDir, 'terms-of-entrapment');

    const originalStory = await parseStoryFolder(folderPath);
    const manager1 = new StoryManager(originalStory);

    const mvstoryData = await manager1.toMVStory();
    const manager2 = await StoryManager.fromMVStory(mvstoryData);
    const roundTripStory = manager2.getStory();

    // Verify core structure
    assertEquals(originalStory.metadata.title, roundTripStory.metadata.title);
    assertEquals(originalStory.scenes.length, roundTripStory.scenes.length);
    assertEquals(originalStory.assets.length, roundTripStory.assets.length);
  });
});

// Test StoryManager operations preserve equivalence
Deno.test('Equivalence - StoryManager Operations', async (t) => {
  await t.step('should preserve story through StoryManager operations', async () => {
    // Start with a known good .mvstory file
    const mvstoryPath = join(Deno.cwd(), 'examples', 'test-mvstory', 'exosome.mvstory');
    const originalData = await Deno.readFile(mvstoryPath);

    // Load into StoryManager
    const manager1 = await StoryManager.fromMVStory(originalData);
    const story1 = manager1.getStory();

    // Clone the manager
    const manager2 = manager1.clone();
    const story2 = manager2.getStory();

    // Verify clone preserves structure
    assertEquals(story1.metadata.title, story2.metadata.title);
    assertEquals(story1.scenes.length, story2.scenes.length);
    assertEquals(story1.assets.length, story2.assets.length);

    // Convert cloned manager back to container
    const clonedData = await manager2.toMVStory();
    const manager3 = await StoryManager.fromMVStory(clonedData);
    const story3 = manager3.getStory();

    // Verify structure is still preserved
    assertEquals(story1.metadata.title, story3.metadata.title);
    assertEquals(story1.scenes.length, story3.scenes.length);
    assertEquals(story1.assets.length, story3.assets.length);
  });

  await t.step('should preserve modifications through container round trips', async () => {
    const mvstoryPath = join(Deno.cwd(), 'examples', 'test-mvstory', 'exosome.mvstory');
    const originalData = await Deno.readFile(mvstoryPath);

    // Load and modify
    const manager = await StoryManager.fromMVStory(originalData);
    const originalSceneCount = manager.getStory().scenes.length;

    manager.updateMetadata({ title: 'Modified Test Story' });
    const newSceneId = manager.addScene({
      header: 'Test Scene',
      key: 'test',
      description: 'Test description',
    });

    // Convert to container and back
    const modifiedData = await manager.toMVStory();
    const reloadedManager = await StoryManager.fromMVStory(modifiedData);
    const reloadedStory = reloadedManager.getStory();

    // Verify modifications persisted
    assertEquals(reloadedStory.metadata.title, 'Modified Test Story');
    assertEquals(reloadedStory.scenes.length, originalSceneCount + 1);

    const newScene = reloadedStory.scenes.find((s) => s.id === newSceneId);
    assertExists(newScene);
    assertEquals(newScene.header, 'Test Scene');
    assertEquals(newScene.key, 'test');
  });
});

// Test specific format conversions that should be lossless
Deno.test('Equivalence - Format Conversions', async (t) => {
  await t.step('should handle container format stability', async () => {
    // Create a simple test story
    const testStory: Story = {
      metadata: { title: 'Container Test' },
      javascript: 'console.log("test");',
      scenes: [
        {
          id: 'scene1',
          header: 'Scene 1',
          key: 'key1',
          description: 'Description',
          javascript: 'console.log("scene1");',
        },
        {
          id: 'scene2',
          header: 'Scene 2',
          key: 'key2',
          description: 'Description 2',
          javascript: 'console.log("scene2");',
        },
      ],
      assets: [
        {
          name: 'test.txt',
          content: new Uint8Array([1, 2, 3, 4, 5]),
        },
      ],
    };

    const manager1 = new StoryManager(testStory);

    // Multiple container round trips should be stable
    let currentManager = manager1;
    for (let i = 0; i < 3; i++) {
      const containerData = await currentManager.toMVStory();
      currentManager = await StoryManager.fromMVStory(containerData);

      const story = currentManager.getStory();
      assertEquals(story.metadata.title, 'Container Test');
      assertEquals(story.scenes.length, 2);
      assertEquals(story.assets.length, 1);
      assertEquals(story.scenes[0].header, 'Scene 1');
      assertEquals(story.assets[0].name, 'test.txt');
    }
  });

  await t.step('should handle export format generation', async () => {
    const mvstoryPath = join(Deno.cwd(), 'examples', 'test-mvstory', 'exosome.mvstory');
    const originalData = await Deno.readFile(mvstoryPath);
    const manager = await StoryManager.fromMVStory(originalData);

    // Test JSON export works
    const jsonExport = manager.toJSON();
    assertExists(jsonExport);
    const parsed = JSON.parse(jsonExport);
    assertEquals(parsed.metadata.title, 'Exosome CPK');
    assertEquals(parsed.scenes.length > 0, true);

    // Test HTML export works
    const htmlExport = await manager.toHTML();
    assertExists(htmlExport);
    assertEquals(htmlExport.includes('<!DOCTYPE html>'), true);
    assertEquals(htmlExport.includes('Exosome CPK'), true);

    // Test MVS export works
    const mvsExport = await manager.toMVS();
    assertExists(mvsExport);
  });
});

// Test that essential data is preserved across workflows
Deno.test('Equivalence - Essential Data Preservation', async (t) => {
  await t.step('should preserve essential story elements', async () => {
    // Test with both example stories
    const stories = ['exosome', 'terms-of-entrapment'];

    for (const storyName of stories) {
      const folderPath = join(Deno.cwd(), 'examples', storyName);
      const mvstoryPath = join(Deno.cwd(), 'examples', 'test-mvstory', `${storyName}.mvstory`);

      // Load from folder
      const folderStory = await parseStoryFolder(folderPath);
      const folderManager = new StoryManager(folderStory);

      // Load from mvstory
      const mvstoryData = await Deno.readFile(mvstoryPath);
      const mvstoryManager = await StoryManager.fromMVStory(mvstoryData);
      const mvstoryStory = mvstoryManager.getStory();

      // Essential elements should match
      assertEquals(folderStory.metadata.title, mvstoryStory.metadata.title, `${storyName}: Title mismatch`);
      assertEquals(folderStory.scenes.length, mvstoryStory.scenes.length, `${storyName}: Scene count mismatch`);
      assertEquals(folderStory.assets.length, mvstoryStory.assets.length, `${storyName}: Asset count mismatch`);

      // Scene headers should match (as a set, not necessarily in order)
      const folderSceneHeaders = folderStory.scenes.map((s) => s.header).sort();
      const mvstorySceneHeaders = mvstoryStory.scenes.map((s) => s.header).sort();
      assertEquals(folderSceneHeaders, mvstorySceneHeaders, `${storyName}: Scene headers mismatch`);

      // Asset names should match
      const folderAssetNames = folderStory.assets.map((a) => a.name).sort();
      const mvstoryAssetNames = mvstoryStory.assets.map((a) => a.name).sort();
      assertEquals(folderAssetNames, mvstoryAssetNames, `${storyName}: Asset names mismatch`);
    }
  });

  await t.step('should handle asset data integrity', async () => {
    // Test with a story that has assets
    const folderPath = join(Deno.cwd(), 'examples', 'exosome');
    const originalStory = await parseStoryFolder(folderPath);

    // Find an asset to test
    const testAsset = originalStory.assets.find((a) => a.name.includes('mp3'));
    assertExists(testAsset, 'Should have an MP3 asset for testing');

    const originalSize = new Uint8Array(testAsset.content).length;
    assertEquals(originalSize > 1000, true, 'Test asset should be substantial');

    // Round trip through container
    const manager1 = new StoryManager(originalStory);
    const containerData = await manager1.toMVStory();
    const manager2 = await StoryManager.fromMVStory(containerData);
    const roundTripStory = manager2.getStory();

    // Find the same asset
    const roundTripAsset = roundTripStory.assets.find((a) => a.name === testAsset.name);
    assertExists(roundTripAsset);

    const roundTripSize = new Uint8Array(roundTripAsset.content).length;
    assertEquals(originalSize, roundTripSize, 'Asset size should be preserved');

    // Sample content check (first and last few bytes)
    const originalBytes = new Uint8Array(testAsset.content);
    const roundTripBytes = new Uint8Array(roundTripAsset.content);

    assertEquals(originalBytes[0], roundTripBytes[0], 'First byte should match');
    assertEquals(
      originalBytes[originalBytes.length - 1],
      roundTripBytes[roundTripBytes.length - 1],
      'Last byte should match'
    );
  });
});

// Test edge cases that might break equivalence
Deno.test('Equivalence - Edge Cases', async (t) => {
  await t.step('should handle empty and minimal stories', async () => {
    const minimalStory: Story = {
      metadata: { title: 'Minimal' },
      javascript: '',
      scenes: [
        {
          id: 'scene1',
          header: 'Only Scene',
          key: '',
          description: '',
          javascript: '',
        },
      ],
      assets: [],
    };

    const manager1 = new StoryManager(minimalStory);
    const containerData = await manager1.toMVStory();
    const manager2 = await StoryManager.fromMVStory(containerData);
    const roundTripStory = manager2.getStory();

    assertEquals(minimalStory.metadata.title, roundTripStory.metadata.title);
    assertEquals(minimalStory.scenes.length, roundTripStory.scenes.length);
    assertEquals(minimalStory.assets.length, roundTripStory.assets.length);
  });

  await t.step('should handle stories with many scenes', async () => {
    const manySceneStory: Story = {
      metadata: { title: 'Many Scenes' },
      javascript: '',
      scenes: [],
      assets: [],
    };

    // Add 20 scenes
    for (let i = 1; i <= 20; i++) {
      manySceneStory.scenes.push({
        id: `scene${i}`,
        header: `Scene ${i}`,
        key: `key${i}`,
        description: `Description ${i}`,
        javascript: `console.log('Scene ${i}');`,
      });
    }

    const manager1 = new StoryManager(manySceneStory);
    const containerData = await manager1.toMVStory();
    const manager2 = await StoryManager.fromMVStory(containerData);
    const roundTripStory = manager2.getStory();

    assertEquals(manySceneStory.scenes.length, roundTripStory.scenes.length);
    assertEquals(roundTripStory.scenes[19].header, 'Scene 20');
  });

  await t.step('should handle binary asset variations', async () => {
    const binaryStory: Story = {
      metadata: { title: 'Binary Test' },
      javascript: '',
      scenes: [
        {
          id: 'scene1',
          header: 'Test Scene',
          key: 'test',
          description: '',
          javascript: '',
        },
      ],
      assets: [
        {
          name: 'zeros.bin',
          content: new Uint8Array(100).fill(0),
        },
        {
          name: 'pattern.bin',
          content: new Uint8Array(50).map((_, i) => i % 256),
        },
        {
          name: 'random.bin',
          content: crypto.getRandomValues(new Uint8Array(75)),
        },
      ],
    };

    const manager1 = new StoryManager(binaryStory);
    const containerData = await manager1.toMVStory();
    const manager2 = await StoryManager.fromMVStory(containerData);
    const roundTripStory = manager2.getStory();

    assertEquals(binaryStory.assets.length, roundTripStory.assets.length);

    // Check each asset preserved correctly
    for (const originalAsset of binaryStory.assets) {
      const roundTripAsset = roundTripStory.assets.find((a) => a.name === originalAsset.name);
      assertExists(roundTripAsset);

      const originalBytes = new Uint8Array(originalAsset.content);
      const roundTripBytes = new Uint8Array(roundTripAsset.content);

      assertEquals(originalBytes.length, roundTripBytes.length);
      assertEquals(originalBytes[0], roundTripBytes[0]);
      assertEquals(originalBytes[originalBytes.length - 1], roundTripBytes[roundTripBytes.length - 1]);
    }
  });
});
