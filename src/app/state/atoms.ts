import { atom } from "jotai";
import { SceneData } from "./types";
import { init_js_code, init_js_code_02 } from "./initial-data";
import { executeJavaScriptCode } from "./code-execution";

// Core State Atoms
export const ScenesAtom = atom<SceneData[]>([
  {
    id: 1,
    header: "Awesome Thing 01",
    key: "scene_01",
    description:
      "# Retinoic Acid Visualization\n\nShowing a protein structure with retinoic acid ligand in green cartoon representation.",
    javascript: init_js_code,
  },
  {
    id: 2,
    header: "Awesome Thing 02",
    key: "scene_02",
    description:
      "# Alternative Visualization\n\nSame structure but with blue cartoon and orange ligand coloring.",
    javascript: init_js_code_02,
  },
]);

export const ActiveSceneIdAtom = atom(1);
export const CurrentMvsDataAtom = atom<unknown>(null);

// Helper functions
export const getActiveScene = (scenes: SceneData[], activeId: number): SceneData | undefined => {
  return scenes.find((scene) => scene.id === activeId) || scenes[0];
};

export const executeCode = async (code: string, setCurrentMvsData: (data: unknown) => void) => {
  try {
    const mvsData = await executeJavaScriptCode(code);
    setCurrentMvsData(mvsData);
    return mvsData;
  } catch (error) {
    console.error("Error executing JavaScript code:", error);
    setCurrentMvsData(null);
    throw error;
  }
};

export const exportState = async (
  scenes: SceneData[],
  activeSceneId: number,
  currentMvsData: unknown
): Promise<Record<string, unknown>> => {
  const activeScene = getActiveScene(scenes, activeSceneId);

  console.log(`🚀 Starting export process for ${scenes.length} scenes...`);

  const scenesWithExecutedData = await Promise.all(
    scenes.map(async (scene) => {
      try {
        console.log(
          `⚡ Executing JavaScript for scene ${scene.id}: "${scene.header}"`
        );
        const executedData = await executeJavaScriptCode(scene.javascript);
        console.log(
          `✅ Successfully executed scene ${scene.id}, data size:`,
          JSON.stringify(executedData).length,
          "characters"
        );
        return {
          id: scene.id,
          header: scene.header,
          key: scene.key,
          description: scene.description,
          executedData,
        };
      } catch (error) {
        console.error(
          `❌ Error executing JavaScript for scene ${scene.id}:`,
          error
        );
        return {
          id: scene.id,
          header: scene.header,
          key: scene.key,
          description: scene.description,
          executedData: null,
          executionError:
            error instanceof Error ? error.message : String(error),
        };
      }
    })
  );

  const exportData = {
    scenes: scenesWithExecutedData,
    activeSceneId,
    activeScene: activeScene ? {
      id: activeScene.id,
      header: activeScene.header,
      key: activeScene.key,
      description: activeScene.description,
      executedData: currentMvsData,
    } : null,
    exportTimestamp: new Date().toISOString(),
    version: "1.0.0",
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  console.log(
    "📋 StoriesCreator Complete Export (JavaScript executed and replaced with JSON data):"
  );
  console.log(jsonString);
  console.log(
    `📊 Export Summary: ${scenesWithExecutedData.length} scenes processed, ${scenesWithExecutedData.filter((s) => s.executedData).length} successful executions`
  );

  return exportData;
};