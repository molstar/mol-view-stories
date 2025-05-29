import { generateStoriesHtml } from '@/lib/stories-html';
import { download } from 'molstar/lib/mol-util/download';
import { UUID } from 'molstar/lib/mol-util/uuid';
import { getMVSData } from '../../lib/story-builder';
import { getDefaultStore } from 'jotai';
import { ActiveSceneIdAtom, CurrentViewAtom, ActiveSceneAtom, StoryAtom, SceneAssetsAtom } from './atoms';
import { SceneData, SceneUpdate, Story, StoryMetadata, SceneAsset } from './types';

export function addScene(options?: { duplicate?: boolean }) {
  const store = getDefaultStore();
  const story = store.get(StoryAtom);
  const current = store.get(ActiveSceneAtom);

  const newScene: SceneData =
    options?.duplicate && current
      ? {
          ...current,
          id: UUID.createv4(),
          key: '',
        }
      : {
          id: UUID.createv4(),
          header: 'New Scene',
          key: '',
          description: '',
          javascript: '',
        };

  store.set(StoryAtom, { ...story, scenes: [...story.scenes, newScene] });
  store.set(CurrentViewAtom, { type: 'scene', id: newScene.id });
}

export async function downloadStory(story: Story, how: 'state' | 'html') {
  // TODO:
  // - download as HTML with embedded state
  try {
    const data = await getMVSData(story.metadata, story.scenes);
    let blob: Blob;
    let filename: string;
    if (how === 'html') {
      const htmlContent = generateStoriesHtml(data);
      blob = new Blob([htmlContent], { type: 'text/html' });
      filename = `story-${Date.now()}.html`;
    } else if (how === 'state') {
      blob =
        data instanceof Uint8Array
          ? new Blob([data], { type: 'application/octet-stream' })
          : new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      filename = `story-${Date.now()}.${data instanceof Uint8Array ? 'mvsx' : 'mvsj'}`;
    } else {
      console.warn("Invalid download type specified. Use 'state' or 'html'.");
      return;
    }
    download(blob, filename);
  } catch (error) {
    console.error('Error generating MVS data:', error);
    return;
  }
}

export const exportState = async (
  story: Story,
  activeSceneId: string | undefined,
  currentMvsData: unknown
): Promise<Record<string, unknown>> => {
  const store = getDefaultStore();
  const activeScene = store.get(ActiveSceneAtom);

  console.log(`🚀 Starting export process for ${story.scenes.length} scenes...`);

  const scenesWithExecutedData = await Promise.all(
    story.scenes.map(async (scene) => {
      try {
        console.log(`⚡ Executing JavaScript for scene ${scene.id}: "${scene.header}"`);
        const executedData = getMVSData(story.metadata, [scene]);
        console.log(
          `✅ Successfully executed scene ${scene.id}, data size:`,
          JSON.stringify(executedData).length,
          'characters'
        );
        return {
          id: scene.id,
          header: scene.header,
          key: scene.key,
          description: scene.description,
          executedData,
        };
      } catch (error) {
        console.error(`❌ Error executing JavaScript for scene ${scene.id}:`, error);
        return {
          id: scene.id,
          header: scene.header,
          key: scene.key,
          description: scene.description,
          executedData: null,
          executionError: error instanceof Error ? error.message : String(error),
        };
      }
    })
  );

  const exportData = {
    scenes: scenesWithExecutedData,
    activeSceneId,
    activeScene: activeScene
      ? {
          id: activeScene.id,
          header: activeScene.header,
          key: activeScene.key,
          description: activeScene.description,
          executedData: currentMvsData,
        }
      : null,
    exportTimestamp: new Date().toISOString(),
    version: '1.0.0',
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  console.log('📋 StoriesCreator Complete Export (JavaScript executed and replaced with JSON data):');
  console.log(jsonString);
  console.log(
    `📊 Export Summary: ${scenesWithExecutedData.length} scenes processed, ${scenesWithExecutedData.filter((s) => s.executedData).length} successful executions`
  );

  return exportData;
};

export function modifyCurrentScene(update: SceneUpdate) {
  const store = getDefaultStore();
  const story = store.get(StoryAtom);
  const sceneId = store.get(ActiveSceneIdAtom);
  const sceneIdx = story.scenes.findIndex((s) => s.id === sceneId);
  if (sceneIdx < 0) return;

  const scenes = [...story.scenes];
  scenes[sceneIdx] = {
    ...scenes[sceneIdx],
    ...update,
  };
  store.set(StoryAtom, { ...story, scenes });
}

export function modifySceneMetadata(update: Partial<StoryMetadata>) {
  const store = getDefaultStore();
  const story = store.get(StoryAtom);
  store.set(StoryAtom, { ...story, metadata: { ...story.metadata, ...update } });
}

export function removeCurrentScene() {
  const store = getDefaultStore();
  const story = store.get(StoryAtom);
  if (story.scenes.length <= 1) {
    console.warn('Cannot remove the last scene.');
    return;
  }
  const sceneId = store.get(ActiveSceneIdAtom);
  const scenes = story.scenes.filter((s) => s.id !== sceneId);
  store.set(StoryAtom, { ...story, scenes });
  store.set(CurrentViewAtom, { type: 'scene', id: scenes[0].id });
}

export async function uploadSceneAsset(file: File): Promise<void> {
  console.log('🔥 uploadSceneAsset: Function called with file:', {
    name: file.name,
    size: file.size,
    type: file.type
  });

  const store = getDefaultStore();
  const currentAssets = store.get(SceneAssetsAtom);
  console.log('📊 uploadSceneAsset: Current assets before upload:', {
    count: currentAssets.length,
    names: currentAssets.map((a) => a.name),
    totalSize: currentAssets.reduce((sum, a) => sum + a.content.length, 0)
  });

  try {
    console.log('🔄 uploadSceneAsset: Converting file to ArrayBuffer...');
    const arrayBuffer = await file.arrayBuffer();
    console.log('✅ uploadSceneAsset: ArrayBuffer created, size:', arrayBuffer.byteLength);
    
    const content = new Uint8Array(arrayBuffer);
    console.log('✅ uploadSceneAsset: Uint8Array created, length:', content.length);

    const newAsset: SceneAsset = {
      name: file.name,
      content: content,
    };
    console.log('📦 uploadSceneAsset: New asset object created:', {
      name: newAsset.name,
      contentLength: newAsset.content.length,
      contentType: newAsset.content.constructor.name
    });

    // Check if asset with same name already exists and replace it
    const existingIndex = currentAssets.findIndex((asset) => asset.name === file.name);
    console.log('🔍 uploadSceneAsset: Checking for existing asset with name:', file.name, 'found at index:', existingIndex);

    if (existingIndex >= 0) {
      console.log('🔄 uploadSceneAsset: Replacing existing asset at index:', existingIndex);
      const updatedAssets = [...currentAssets];
      updatedAssets[existingIndex] = newAsset;
      
      console.log('🔄 uploadSceneAsset: Setting SceneAssetsAtom with updated assets...');
      store.set(SceneAssetsAtom, updatedAssets);
      console.log(`✅ uploadSceneAsset: Replaced existing asset: ${file.name}`);
      console.log('📊 uploadSceneAsset: Updated assets after replace:', {
        count: updatedAssets.length,
        names: updatedAssets.map((a) => a.name),
        sizes: updatedAssets.map((a) => ({ name: a.name, size: a.content.length }))
      });
    } else {
      console.log('➕ uploadSceneAsset: Adding new asset to collection');
      const newAssets = [...currentAssets, newAsset];
      
      console.log('🔄 uploadSceneAsset: Setting SceneAssetsAtom with new assets...');
      store.set(SceneAssetsAtom, newAssets);
      console.log(`✅ uploadSceneAsset: Added new asset: ${file.name}`);
      console.log('📊 uploadSceneAsset: Updated assets after add:', {
        count: newAssets.length,
        names: newAssets.map((a) => a.name),
        sizes: newAssets.map((a) => ({ name: a.name, size: a.content.length }))
      });
    }

    // Verify the atom was updated
    console.log('🔍 uploadSceneAsset: Verifying atom state was updated...');
    const verifyAssets = store.get(SceneAssetsAtom);
    console.log('✅ uploadSceneAsset: Verification - assets in store:', {
      count: verifyAssets.length,
      names: verifyAssets.map((a) => a.name),
      targetAssetPresent: verifyAssets.some(a => a.name === file.name),
      sizes: verifyAssets.map((a) => ({ name: a.name, size: a.content.length }))
    });
    
    if (verifyAssets.some(a => a.name === file.name)) {
      console.log('🎉 uploadSceneAsset: SUCCESS - Asset confirmed in store!');
    } else {
      console.error('❌ uploadSceneAsset: FAILURE - Asset NOT found in store after update!');
    }
  } catch (error) {
    console.error('❌ uploadSceneAsset: Error uploading file:', error);
    console.error('❌ uploadSceneAsset: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
}
