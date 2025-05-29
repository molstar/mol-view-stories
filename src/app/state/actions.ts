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
  const store = getDefaultStore();
  const currentAssets = store.get(SceneAssetsAtom);
  console.log(
    'Current assets before upload:',
    currentAssets.map((a) => a.name)
  );

  try {
    const arrayBuffer = await file.arrayBuffer();
    const content = new Uint8Array(arrayBuffer);

    const newAsset: SceneAsset = {
      name: file.name,
      content: content,
    };

    // Check if asset with same name already exists and replace it
    const existingIndex = currentAssets.findIndex((asset) => asset.name === file.name);

    if (existingIndex >= 0) {
      const updatedAssets = [...currentAssets];
      updatedAssets[existingIndex] = newAsset;
      store.set(SceneAssetsAtom, updatedAssets);
      console.log(`Replaced existing asset: ${file.name}`);
      console.log(
        'Updated assets after replace:',
        updatedAssets.map((a) => a.name)
      );
    } else {
      const newAssets = [...currentAssets, newAsset];
      store.set(SceneAssetsAtom, newAssets);
      console.log(`Added new asset: ${file.name}`);
      console.log(
        'Updated assets after add:',
        newAssets.map((a) => a.name)
      );
    }

    // Verify the atom was updated
    const verifyAssets = store.get(SceneAssetsAtom);
    console.log(
      'Verification - assets in store:',
      verifyAssets.map((a) => a.name)
    );
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}
