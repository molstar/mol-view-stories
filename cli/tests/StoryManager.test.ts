import { assertEquals, assertExists, assertInstanceOf, assertThrows } from '@std/assert';
import { StoryManager } from '@mol-view-stories/lib/StoryManager';
import type { Story, SceneData, SceneAsset } from '@mol-view-stories/lib/types';

// Helper to create a test story
function createTestStory(): Story {
  return {
    metadata: {
      title: 'Test Story',
    },
    javascript: 'console.log("Global JS");',
    scenes: [
      {
        id: 'scene1',
        header: 'Scene 1',
        key: 'key1',
        description: 'First scene',
        javascript: 'console.log("Scene 1");',
        camera: {
          mode: 'perspective',
          target: [0, 0, 0],
          position: [10, 10, 10],
          up: [0, 1, 0],
          fov: 45,
        },
        linger_duration_ms: 3000,
        transition_duration_ms: 1000,
      },
      {
        id: 'scene2',
        header: 'Scene 2',
        key: 'key2',
        description: 'Second scene',
        javascript: 'console.log("Scene 2");',
        linger_duration_ms: 2000,
        transition_duration_ms: 500,
      },
    ],
    assets: [
      {
        name: 'test.pdb',
        content: new Uint8Array([1, 2, 3, 4, 5]),
      },
    ],
  };
}

// Test Core Operations
Deno.test('StoryManager - Core Operations', async (t) => {
  await t.step('should create manager with empty story', () => {
    const manager = new StoryManager();
    const story = manager.getStory();

    assertExists(story);
    assertEquals(story.metadata.title, 'New Story');
    assertEquals(story.scenes.length, 1);
    assertEquals(story.assets.length, 0);
    assertEquals(story.javascript, '');
  });

  await t.step('should create manager with provided story', () => {
    const testStory = createTestStory();
    const manager = new StoryManager(testStory);
    const story = manager.getStory();

    assertEquals(story, testStory);
  });

  await t.step('should set a new story', () => {
    const manager = new StoryManager();
    const testStory = createTestStory();

    manager.setStory(testStory);
    assertEquals(manager.getStory(), testStory);
  });

  await t.step('should clone the manager with deep copy', () => {
    const testStory = createTestStory();
    const manager = new StoryManager(testStory);
    const cloned = manager.clone();

    // Verify it's a different instance
    const clonedStory = cloned.getStory();
    assertEquals(clonedStory.metadata.title, testStory.metadata.title);
    assertEquals(clonedStory.scenes.length, testStory.scenes.length);

    // Modify the cloned story and verify original is unchanged
    cloned.updateMetadata({ title: 'Cloned Story' });
    assertEquals(manager.getStory().metadata.title, 'Test Story');
    assertEquals(cloned.getStory().metadata.title, 'Cloned Story');
  });
});

// Test Metadata Operations
Deno.test('StoryManager - Metadata Operations', async (t) => {
  await t.step('should update metadata', () => {
    const manager = new StoryManager(createTestStory());

    manager.updateMetadata({ title: 'Updated Title' });
    assertEquals(manager.getStory().metadata.title, 'Updated Title');

    // Test partial update with additional fields
    manager.updateMetadata({
      title: 'New Title',
      description: 'A description',
      author: 'Test Author',
    } as any);

    const metadata = manager.getStory().metadata;
    assertEquals(metadata.title, 'New Title');
    assertEquals((metadata as any).description, 'A description');
    assertEquals((metadata as any).author, 'Test Author');
  });

  await t.step('should set global JavaScript', () => {
    const manager = new StoryManager(createTestStory());

    const newJs = 'console.log("New global JS");';
    manager.setGlobalJavascript(newJs);
    assertEquals(manager.getStory().javascript, newJs);
  });
});

// Test Scene Operations
Deno.test('StoryManager - Scene Operations', async (t) => {
  await t.step('should add a new scene with defaults', () => {
    const manager = new StoryManager(createTestStory());
    const initialSceneCount = manager.getStory().scenes.length;

    const newId = manager.addScene();
    assertExists(newId);

    const scenes = manager.getStory().scenes;
    assertEquals(scenes.length, initialSceneCount + 1);

    const newScene = scenes[scenes.length - 1];
    assertEquals(newScene.id, newId);
    assertEquals(newScene.header, 'New Scene');
    assertEquals(newScene.key, '');
    assertEquals(newScene.description, '');
    assertEquals(newScene.javascript, '');
    assertEquals(newScene.camera, null);
  });

  await t.step('should add a new scene with custom data', () => {
    const manager = new StoryManager(createTestStory());

    const customScene: Partial<SceneData> = {
      header: 'Custom Scene',
      key: 'custom-key',
      description: 'Custom description',
      javascript: 'console.log("custom");',
      camera: {
        mode: 'orthographic',
        target: [1, 2, 3],
        position: [4, 5, 6],
        up: [0, 1, 0],
        fov: 60,
      },
      linger_duration_ms: 5000,
      transition_duration_ms: 2000,
    };

    const newId = manager.addScene(customScene);
    const newScene = manager.getScene(newId);

    assertExists(newScene);
    assertEquals(newScene.header, 'Custom Scene');
    assertEquals(newScene.key, 'custom-key');
    assertEquals(newScene.description, 'Custom description');
    assertEquals(newScene.javascript, 'console.log("custom");');
    assertEquals(newScene.camera?.mode, 'orthographic');
    assertEquals(newScene.linger_duration_ms, 5000);
    assertEquals(newScene.transition_duration_ms, 2000);
  });

  await t.step('should update an existing scene', () => {
    const manager = new StoryManager(createTestStory());

    const success = manager.updateScene('scene1', {
      header: 'Updated Scene 1',
      description: 'Updated description',
    });

    assertEquals(success, true);

    const scene = manager.getScene('scene1');
    assertExists(scene);
    assertEquals(scene.header, 'Updated Scene 1');
    assertEquals(scene.description, 'Updated description');
    // Other fields should remain unchanged
    assertEquals(scene.key, 'key1');
    assertEquals(scene.javascript, 'console.log("Scene 1");');
  });

  await t.step('should return false when updating non-existent scene', () => {
    const manager = new StoryManager(createTestStory());

    const success = manager.updateScene('non-existent', {
      header: 'Should not work',
    });

    assertEquals(success, false);
  });

  await t.step('should remove a scene', () => {
    const manager = new StoryManager(createTestStory());
    const initialCount = manager.getStory().scenes.length;

    const success = manager.removeScene('scene2');
    assertEquals(success, true);
    assertEquals(manager.getStory().scenes.length, initialCount - 1);
    assertEquals(manager.getScene('scene2'), undefined);
  });

  await t.step('should not remove the last scene', () => {
    const manager = new StoryManager();
    const story = manager.getStory();
    const lastSceneId = story.scenes[0].id;

    assertThrows(() => manager.removeScene(lastSceneId), Error, 'Cannot remove the last scene');
  });

  await t.step('should return false when removing non-existent scene', () => {
    const manager = new StoryManager(createTestStory());

    const success = manager.removeScene('non-existent');
    assertEquals(success, false);
  });

  await t.step('should reorder scenes', () => {
    const manager = new StoryManager(createTestStory());

    // Move scene2 to position 0
    const success = manager.reorderScene('scene2', 0);
    assertEquals(success, true);

    const scenes = manager.getStory().scenes;
    assertEquals(scenes[0].id, 'scene2');
    assertEquals(scenes[1].id, 'scene1');
  });

  await t.step('should return false when reordering with invalid index', () => {
    const manager = new StoryManager(createTestStory());

    // Try to move to invalid index
    let success = manager.reorderScene('scene1', -1);
    assertEquals(success, false);

    success = manager.reorderScene('scene1', 10);
    assertEquals(success, false);

    success = manager.reorderScene('non-existent', 0);
    assertEquals(success, false);
  });

  await t.step('should get a scene by id', () => {
    const manager = new StoryManager(createTestStory());

    const scene = manager.getScene('scene1');
    assertExists(scene);
    assertEquals(scene.id, 'scene1');
    assertEquals(scene.header, 'Scene 1');

    const nonExistent = manager.getScene('non-existent');
    assertEquals(nonExistent, undefined);
  });
});

// Test Asset Operations
Deno.test('StoryManager - Asset Operations', async (t) => {
  await t.step('should add a new asset', () => {
    const manager = new StoryManager(createTestStory());

    const newAsset: SceneAsset = {
      name: 'new-file.pdb',
      content: new Uint8Array([6, 7, 8, 9, 10]),
    };

    manager.addAsset(newAsset);

    const assets = manager.getStory().assets;
    assertEquals(assets.length, 2);

    const added = manager.getAsset('new-file.pdb');
    assertExists(added);
    assertEquals(added.name, 'new-file.pdb');
    assertEquals(Array.from(added.content), [6, 7, 8, 9, 10]);
  });

  await t.step('should replace existing asset with same name', () => {
    const manager = new StoryManager(createTestStory());

    const replacementAsset: SceneAsset = {
      name: 'test.pdb',
      content: new Uint8Array([10, 20, 30]),
    };

    manager.addAsset(replacementAsset);

    const assets = manager.getStory().assets;
    assertEquals(assets.length, 1);

    const replaced = manager.getAsset('test.pdb');
    assertExists(replaced);
    assertEquals(Array.from(replaced.content), [10, 20, 30]);
  });

  await t.step('should remove an asset', () => {
    const manager = new StoryManager(createTestStory());

    const success = manager.removeAsset('test.pdb');
    assertEquals(success, true);
    assertEquals(manager.getStory().assets.length, 0);
    assertEquals(manager.getAsset('test.pdb'), undefined);
  });

  await t.step('should return false when removing non-existent asset', () => {
    const manager = new StoryManager(createTestStory());

    const success = manager.removeAsset('non-existent.pdb');
    assertEquals(success, false);
  });

  await t.step('should get an asset by name', () => {
    const manager = new StoryManager(createTestStory());

    const asset = manager.getAsset('test.pdb');
    assertExists(asset);
    assertEquals(asset.name, 'test.pdb');
    assertEquals(Array.from(asset.content), [1, 2, 3, 4, 5]);

    const nonExistent = manager.getAsset('non-existent.pdb');
    assertEquals(nonExistent, undefined);
  });
});

// Test Export Operations
Deno.test('StoryManager - Export Operations', async (t) => {
  await t.step('should export to JSON', () => {
    const manager = new StoryManager(createTestStory());

    const json = manager.toJSON();
    assertExists(json);

    // Parse the JSON to verify it's valid
    const parsed = JSON.parse(json);
    assertEquals(parsed.metadata.title, 'Test Story');
    assertEquals(parsed.scenes.length, 2);
    assertEquals(parsed.assets.length, 1);
  });

  await t.step('should export to container format', async () => {
    const manager = new StoryManager(createTestStory());

    const container = await manager.toMVStory();
    assertInstanceOf(container, Uint8Array);

    // Container should be compressed, so it should have some length
    assertEquals(container.length > 0, true);
  });

  await t.step('should export to MVS format', async () => {
    const manager = new StoryManager(createTestStory());

    const mvsData = await manager.toMVS();
    assertExists(mvsData);

    // MVS data can be either an object or Uint8Array
    // The actual format depends on the story content
    assertEquals(typeof mvsData === 'object' || (mvsData as any) instanceof Uint8Array, true);
  });

  await t.step('should export to HTML', async () => {
    const manager = new StoryManager(createTestStory());

    const html = await manager.toHTML({ title: 'Test HTML Export' });
    assertExists(html);

    // Verify it's valid HTML with expected content
    assertEquals(html.includes('<!DOCTYPE html>'), true);
    assertEquals(html.includes('Test HTML Export'), true);
    assertEquals(html.includes('<script'), true);
  });
});

// Test Import Operations
Deno.test('StoryManager - Import Operations', async (t) => {
  await t.step('should import from JSON', () => {
    const originalManager = new StoryManager(createTestStory());
    const json = originalManager.toJSON();

    const importedManager = StoryManager.fromJSON(json);
    const importedStory = importedManager.getStory();

    assertEquals(importedStory.metadata.title, 'Test Story');
    assertEquals(importedStory.scenes.length, 2);
    assertEquals(importedStory.assets.length, 1);
  });

  await t.step('should throw on invalid JSON', () => {
    assertThrows(() => StoryManager.fromJSON('invalid json'), SyntaxError);
  });

  await t.step('should import from container', async () => {
    const originalManager = new StoryManager(createTestStory());
    const container = await originalManager.toMVStory();

    const importedManager = await StoryManager.fromMVStory(container);
    const importedStory = importedManager.getStory();

    assertEquals(importedStory.metadata.title, 'Test Story');
    assertEquals(importedStory.scenes.length, 2);
    assertEquals(importedStory.assets.length, 1);
  });
});

// Test Static Helpers
Deno.test('StoryManager - Static Helpers', async (t) => {
  await t.step('should create empty story', () => {
    const emptyStory = StoryManager.createEmptyStory();

    assertExists(emptyStory);
    assertEquals(emptyStory.metadata.title, 'New Story');
    assertEquals(emptyStory.javascript, '');
    assertEquals(emptyStory.scenes.length, 1);
    assertEquals(emptyStory.scenes[0].header, 'New Scene');
    assertEquals(emptyStory.scenes[0].key, '');
    assertEquals(emptyStory.scenes[0].description, '');
    assertEquals(emptyStory.scenes[0].javascript, '');
    assertEquals(emptyStory.assets.length, 0);

    // Verify the scene has a valid UUID
    assertExists(emptyStory.scenes[0].id);
    assertEquals(emptyStory.scenes[0].id.length > 0, true);
  });
});

// Test Edge Cases and Error Handling
Deno.test('StoryManager - Edge Cases', async (t) => {
  await t.step('should handle empty scenes array gracefully', () => {
    const storyWithNoScenes: Story = {
      metadata: { title: 'No Scenes' },
      javascript: '',
      scenes: [],
      assets: [],
    };

    const manager = new StoryManager(storyWithNoScenes);
    const story = manager.getStory();
    assertEquals(story.scenes.length, 0);

    // Should be able to add a scene
    const newId = manager.addScene();
    assertExists(newId);
    assertEquals(manager.getStory().scenes.length, 1);
  });

  await t.step('should handle large assets', () => {
    const manager = new StoryManager();

    // Create a 1MB asset
    const largeContent = new Uint8Array(1024 * 1024);
    largeContent.fill(42);

    const largeAsset: SceneAsset = {
      name: 'large-file.pdb',
      content: largeContent,
    };

    manager.addAsset(largeAsset);

    const retrieved = manager.getAsset('large-file.pdb');
    assertExists(retrieved);
    assertEquals(retrieved.content.length, 1024 * 1024);
  });
});
