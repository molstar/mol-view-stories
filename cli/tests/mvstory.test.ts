import { assertEquals, assertExists, assertInstanceOf } from '@std/assert';
import { join } from '@std/path';
import { StoryManager } from '@mol-view-stories/lib/StoryManager';

// Test loading and working with .mvstory files
Deno.test('MVStory Files - Loading and Conversion', async (t) => {
  const examplesDir = join(Deno.cwd(), 'examples', 'test-mvstory');

  await t.step('should load exosome.mvstory file', async () => {
    const mvstoryPath = join(examplesDir, 'exosome.mvstory');
    const fileContent = await Deno.readFile(mvstoryPath);

    assertExists(fileContent);
    assertInstanceOf(fileContent, Uint8Array);
    assertEquals(fileContent.length > 0, true);

    // Load into StoryManager
    const manager = await StoryManager.fromMVStory(fileContent);
    assertExists(manager);

    const story = manager.getStory();
    assertExists(story);
    assertExists(story.metadata);
    assertExists(story.metadata.title);

    // Verify story has scenes
    assertEquals(story.scenes.length > 0, true);

    // Verify we can export it back
    const reExported = await manager.toMVStory();
    assertInstanceOf(reExported, Uint8Array);
    assertEquals(reExported.length > 0, true);
  });

  await t.step('should load terms-of-entrapment.mvstory file', async () => {
    const mvstoryPath = join(examplesDir, 'terms-of-entrapment.mvstory');
    const fileContent = await Deno.readFile(mvstoryPath);

    assertExists(fileContent);
    assertInstanceOf(fileContent, Uint8Array);
    assertEquals(fileContent.length > 0, true);

    // Load into StoryManager
    const manager = await StoryManager.fromMVStory(fileContent);
    assertExists(manager);

    const story = manager.getStory();
    assertExists(story);
    assertExists(story.metadata);
    assertExists(story.metadata.title);

    // Verify story has scenes
    assertEquals(story.scenes.length > 0, true);
  });

  await t.step('should convert mvstory to JSON format', async () => {
    const mvstoryPath = join(examplesDir, 'exosome.mvstory');
    const fileContent = await Deno.readFile(mvstoryPath);

    const manager = await StoryManager.fromMVStory(fileContent);

    // Convert to JSON
    const json = manager.toJSON();
    assertExists(json);

    const parsed = JSON.parse(json);
    assertExists(parsed);
    assertExists(parsed.metadata);
    assertExists(parsed.scenes);
    assertExists(parsed.assets);

    // Verify JSON can be loaded back
    const reloadedManager = StoryManager.fromJSON(json);
    const reloadedStory = reloadedManager.getStory();

    assertEquals(reloadedStory.metadata.title, parsed.metadata.title);
    assertEquals(reloadedStory.scenes.length, parsed.scenes.length);
  });

  await t.step('should convert mvstory to HTML format', async () => {
    const mvstoryPath = join(examplesDir, 'exosome.mvstory');
    const fileContent = await Deno.readFile(mvstoryPath);

    const manager = await StoryManager.fromMVStory(fileContent);

    // Convert to HTML
    const html = await manager.toHTML();
    assertExists(html);

    // Verify HTML contains expected elements
    assertEquals(html.includes('<!DOCTYPE html>'), true);
    assertEquals(html.includes('<html'), true);
    assertEquals(html.includes('<script'), true);
    assertEquals(html.includes('mol-view-stories'), true);
  });

  await t.step('should convert mvstory to MVS format', async () => {
    const mvstoryPath = join(examplesDir, 'exosome.mvstory');
    const fileContent = await Deno.readFile(mvstoryPath);

    const manager = await StoryManager.fromMVStory(fileContent);

    // Convert to MVS format
    const mvsData = await manager.toMVS();
    assertExists(mvsData);

    // MVS data can be either an object or Uint8Array depending on content
    assertEquals(typeof mvsData === 'object' || (mvsData as any) instanceof Uint8Array, true);
  });

  await t.step('should handle round-trip conversion', async () => {
    const mvstoryPath = join(examplesDir, 'terms-of-entrapment.mvstory');
    const originalContent = await Deno.readFile(mvstoryPath);

    // Load original
    const manager1 = await StoryManager.fromMVStory(originalContent);
    const story1 = manager1.getStory();

    // Convert to JSON and back
    const json = manager1.toJSON();
    const manager2 = StoryManager.fromJSON(json);

    // Convert back to container
    const newContainer = await manager2.toMVStory();

    // Load the new container
    const manager3 = await StoryManager.fromMVStory(newContainer);
    const story3 = manager3.getStory();

    // Verify the stories match
    assertEquals(story3.metadata.title, story1.metadata.title);
    assertEquals(story3.scenes.length, story1.scenes.length);
    assertEquals(story3.assets.length, story1.assets.length);

    // Verify scene details match
    for (let i = 0; i < story1.scenes.length; i++) {
      assertEquals(story3.scenes[i].header, story1.scenes[i].header);
      assertEquals(story3.scenes[i].key, story1.scenes[i].key);
    }
  });
});

// Test error handling for invalid mvstory files
Deno.test('MVStory Files - Error Handling', async (t) => {
  await t.step('should handle invalid mvstory data', async () => {
    const invalidData = new Uint8Array([1, 2, 3, 4, 5]); // Not a valid mvstory

    let errorOccurred = false;
    try {
      await StoryManager.fromMVStory(invalidData);
    } catch (error) {
      errorOccurred = true;
      assertExists(error);
    }

    assertEquals(errorOccurred, true);
  });

  await t.step('should handle empty mvstory data', async () => {
    const emptyData = new Uint8Array(0);

    let errorOccurred = false;
    try {
      await StoryManager.fromMVStory(emptyData);
    } catch (error) {
      errorOccurred = true;
      assertExists(error);
    }

    assertEquals(errorOccurred, true);
  });
});

// Test working with story content from mvstory files
Deno.test('MVStory Files - Content Manipulation', async (t) => {
  const examplesDir = join(Deno.cwd(), 'examples', 'test-mvstory');

  await t.step('should allow modifying loaded mvstory content', async () => {
    const mvstoryPath = join(examplesDir, 'exosome.mvstory');
    const fileContent = await Deno.readFile(mvstoryPath);

    const manager = await StoryManager.fromMVStory(fileContent);
    const originalStory = manager.getStory();
    const originalTitle = originalStory.metadata.title;
    const originalSceneCount = originalStory.scenes.length;

    // Modify the story
    manager.updateMetadata({ title: 'Modified Title' });
    manager.addScene({
      header: 'New Added Scene',
      key: 'new-scene',
      description: 'This scene was added programmatically',
    });

    const modifiedStory = manager.getStory();

    // Verify modifications
    assertEquals(modifiedStory.metadata.title, 'Modified Title');
    assertEquals(modifiedStory.metadata.title !== originalTitle, true);
    assertEquals(modifiedStory.scenes.length, originalSceneCount + 1);

    const lastScene = modifiedStory.scenes[modifiedStory.scenes.length - 1];
    assertEquals(lastScene.header, 'New Added Scene');

    // Export modified story
    const modifiedContainer = await manager.toMVStory();
    assertInstanceOf(modifiedContainer, Uint8Array);

    // Verify modified story can be reloaded
    const reloadedManager = await StoryManager.fromMVStory(modifiedContainer);
    const reloadedStory = reloadedManager.getStory();

    assertEquals(reloadedStory.metadata.title, 'Modified Title');
    assertEquals(reloadedStory.scenes.length, originalSceneCount + 1);
  });

  await t.step('should extract scene information from mvstory', async () => {
    const mvstoryPath = join(examplesDir, 'terms-of-entrapment.mvstory');
    const fileContent = await Deno.readFile(mvstoryPath);

    const manager = await StoryManager.fromMVStory(fileContent);
    const story = manager.getStory();

    // Check each scene
    for (const scene of story.scenes) {
      assertExists(scene.id);
      assertExists(scene.header);

      // Scenes should have either key or description or both
      assertEquals(scene.key !== undefined || scene.description !== undefined, true);

      // If scene has camera, verify its structure
      if (scene.camera) {
        assertExists(scene.camera.position);
        assertExists(scene.camera.target);
        assertEquals(Array.isArray(scene.camera.position), true);
        assertEquals(Array.isArray(scene.camera.target), true);
      }
    }
  });

  await t.step('should handle assets in mvstory files', async () => {
    const mvstoryPath = join(examplesDir, 'exosome.mvstory');
    const fileContent = await Deno.readFile(mvstoryPath);

    const manager = await StoryManager.fromMVStory(fileContent);
    const story = manager.getStory();

    // Check assets if they exist
    if (story.assets && story.assets.length > 0) {
      for (const asset of story.assets) {
        assertExists(asset.name);
        assertExists(asset.content);
        assertInstanceOf(asset.content, Uint8Array);
        assertEquals(asset.content.length > 0, true);
      }

      // Test adding a new asset
      const newAsset = {
        name: 'test-asset.pdb',
        content: new Uint8Array([1, 2, 3, 4, 5]),
      };

      manager.addAsset(newAsset);

      const updatedStory = manager.getStory();
      const addedAsset = updatedStory.assets.find((a) => a.name === 'test-asset.pdb');
      assertExists(addedAsset);
      assertEquals(Array.from(addedAsset.content), [1, 2, 3, 4, 5]);
    }
  });
});
