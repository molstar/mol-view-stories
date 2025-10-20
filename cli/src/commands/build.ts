import { exists, walk } from '@std/fs';
import { basename, join, relative } from '@std/path';
import { parse as parseYaml } from '@std/yaml';
import {
  type CameraData,
  type SceneAsset,
  type SceneData,
  type Story,
  type StoryMetadata,
} from '@mol-view-stories/lib/types';
import { StoryManager } from '@mol-view-stories/lib/StoryManager';

export type BuildFormat = 'json' | 'mvsx' | 'mvstory' | 'html';

export async function buildStory(folderPath: string, outputFile?: string, format?: BuildFormat): Promise<void> {
  console.error(`Building story from: ${folderPath}`);

  // Validate folder exists
  if (!(await exists(folderPath))) {
    throw new Error(`Folder '${folderPath}' does not exist`);
  }

  const stat = await Deno.stat(folderPath);
  if (!stat.isDirectory) {
    throw new Error(`'${folderPath}' is not a directory`);
  }

  try {
    // Parse the story structure
    const story = await parseStoryFolder(folderPath);

    // Create StoryManager with the parsed story
    const manager = new StoryManager(story);

    // Generate output using StoryManager methods
    let output: string | Uint8Array;
    let actualFormat: string;

    switch (format || 'auto') {
      case 'json':
        output = manager.toJSON();
        actualFormat = 'JSON';
        break;

      case 'mvstory':
        output = await manager.toContainer();
        actualFormat = 'MVStory';
        break;

      case 'mvsx': {
        const mvsData = await manager.toMVS();
        if (mvsData instanceof Uint8Array) {
          output = mvsData;
          actualFormat = 'MVSX';
        } else {
          output = JSON.stringify(mvsData, null, 2);
          actualFormat = 'MVSJ';
        }
        break;
      }

      case 'html':
        output = await manager.toHTML();
        actualFormat = 'HTML';
        break;

      case 'auto':
      default: {
        const mvsData = await manager.toMVS();
        if (mvsData instanceof Uint8Array) {
          output = mvsData;
          actualFormat = 'MVSX';
        } else {
          output = JSON.stringify(mvsData, null, 2);
          actualFormat = 'MVSJ';
        }
        break;
      }
    }

    // Output to stdout or file
    if (outputFile) {
      if (output instanceof Uint8Array) {
        // Write binary file
        await Deno.writeFile(outputFile, output);
        console.error(`✓ ${actualFormat} file saved to: ${outputFile} (${output.length} bytes)`);
      } else {
        // Write text file
        await Deno.writeTextFile(outputFile, output);
        console.error(`✓ ${actualFormat} file saved to: ${outputFile}`);
      }
    } else {
      if (output instanceof Uint8Array) {
        // Cannot output binary to stdout, convert to base64
        const base64 = btoa(String.fromCharCode(...output));
        console.log(`${actualFormat}_BASE64:${base64}`);
      } else {
        // Output to stdout
        console.log(output);
      }
    }
  } catch (error) {
    throw new Error(`Failed to build story: ${error instanceof Error ? error.message : error}`);
  }
}

export async function parseStoryFolder(folderPath: string): Promise<Story> {
  console.error('Parsing story folder structure...');

  // Read main story.yaml
  const storyYamlPath = join(folderPath, 'story.yaml');
  if (!(await exists(storyYamlPath))) {
    throw new Error('story.yaml not found in the root directory');
  }

  const storyYamlContent = await Deno.readTextFile(storyYamlPath);
  const storyData = parseYaml(storyYamlContent) as any;

  // Extract metadata - support both flat structure (new) and nested metadata (old)
  const title = storyData.title || storyData.metadata?.title || basename(folderPath);
  const author_note = storyData.author_note || storyData.metadata?.author_note;

  const metadata: StoryMetadata = {
    title: title,
    ...(author_note && { author_note }),
  };

  console.error(`✓ Loaded story metadata: ${metadata.title}`);

  // Extract global scene defaults
  const sceneDefaults = storyData.scene_defaults || {};
  if (Object.keys(sceneDefaults).length > 0) {
    console.error('✓ Using global scene defaults from story.yaml');
  }

  // Parse scenes
  const scenes: SceneData[] = [];

  // Check if scenes are defined inline in story.yaml
  if (storyData.scenes && Array.isArray(storyData.scenes)) {
    console.error('✓ Using inline scenes from story.yaml');

    for (let i = 0; i < storyData.scenes.length; i++) {
      const sceneSpec = storyData.scenes[i];

      if (sceneSpec.folder) {
        // Load from folder reference
        const sceneDir = join(folderPath, 'scenes', sceneSpec.folder);
        if (!(await exists(sceneDir))) {
          throw new Error(`Scene folder '${sceneSpec.folder}' referenced in story.yaml does not exist`);
        }
        const scene = await parseSceneFolder(sceneDir, folderPath, i);
        scenes.push(scene);
        console.error(`✓ Loaded scene from folder: ${scene.header}`);
      } else {
        // Parse inline scene definition
        const scene = await parseInlineScene(sceneSpec, i, folderPath);
        scenes.push(scene);
        console.error(`✓ Loaded inline scene: ${scene.header}`);
      }
    }
  } else {
    // Fallback to folder-based scene loading
    const scenesDir = join(folderPath, 'scenes');

    if (await exists(scenesDir)) {
      // Check for explicit scene_order
      if (storyData.scene_order && Array.isArray(storyData.scene_order)) {
        console.error('✓ Using explicit scene_order from story.yaml');

        for (let i = 0; i < storyData.scene_order.length; i++) {
          const sceneName = storyData.scene_order[i];
          const sceneDir = join(scenesDir, sceneName);

          if (!(await exists(sceneDir))) {
            throw new Error(`Scene '${sceneName}' listed in scene_order does not exist in scenes/`);
          }

          const scene = await parseSceneFolder(sceneDir, folderPath, i);
          scenes.push(scene);
          console.error(`✓ Loaded scene: ${scene.header}`);
        }
      } else {
        // Default: alphabetical sorting
        console.error('✓ Using alphabetical scene ordering');
        const sceneNames: string[] = [];

        // Get all scene directories
        for await (const entry of Deno.readDir(scenesDir)) {
          if (entry.isDirectory) {
            sceneNames.push(entry.name);
          }
        }

        // Sort scene names to ensure consistent ordering
        sceneNames.sort();

        let sceneIndex = 0;
        for (const sceneName of sceneNames) {
          const sceneDir = join(scenesDir, sceneName);
          const scene = await parseSceneFolder(sceneDir, folderPath, sceneIndex);
          scenes.push(scene);
          console.error(`✓ Loaded scene: ${scene.header}`);
          sceneIndex++;
        }
      }
    }
  }

  if (scenes.length === 0) {
    console.error('⚠ Warning: No scenes found in the story');
  }

  // Parse assets
  const assets = await parseAssetsFolder(folderPath);

  // Read global JavaScript - support global_js in YAML (new) or story.js file (old)
  let javascript = storyData.global_js || '';

  if (!javascript) {
    const storyJsPath = join(folderPath, 'story.js');
    if (await exists(storyJsPath)) {
      javascript = await Deno.readTextFile(storyJsPath);
      console.error(`✓ Loaded story.js with ${javascript.length} characters`);
    } else {
      console.error('⚠ Warning: No global JavaScript found (story.js or global_js in YAML)');
    }
  } else {
    console.error(`✓ Loaded global_js from story.yaml with ${javascript.length} characters`);
  }

  const story: Story = {
    metadata,
    javascript,
    scenes,
    assets,
  };

  console.error(`✓ Successfully parsed story with ${scenes.length} scenes`);
  return story;
}

export async function parseSceneFolder(sceneDir: string, rootPath: string, sceneIndex: number): Promise<SceneData> {
  const sceneName = basename(sceneDir);

  // Read scene YAML file
  const yamlPath = join(sceneDir, `${sceneName}.yaml`);
  if (!(await exists(yamlPath))) {
    throw new Error(`${sceneName}.yaml not found in scene directory: ${sceneName}`);
  }

  const yamlContent = await Deno.readTextFile(yamlPath);
  const sceneData = parseYaml(yamlContent) as any;

  // Read scene description from MD file
  const mdPath = join(sceneDir, `${sceneName}.md`);
  let description = '';
  if (await exists(mdPath)) {
    description = await Deno.readTextFile(mdPath);
  } else {
    console.error(`⚠ Warning: ${sceneName}.md not found, using empty description`);
  }

  // Read scene JavaScript from JS file
  const jsPath = join(sceneDir, `${sceneName}.js`);
  let javascript = '';
  if (await exists(jsPath)) {
    javascript = await Deno.readTextFile(jsPath);
  } else {
    console.error(`⚠ Warning: ${sceneName}.js not found, using empty JavaScript`);
  }

  // Extract camera configuration if present
  let camera: CameraData | undefined;
  if (sceneData.camera) {
    camera = {
      mode: sceneData.camera.mode || 'perspective',
      target: sceneData.camera.target || [0, 0, 0],
      position: sceneData.camera.position || [10, 10, 10],
      up: sceneData.camera.up || [0, 1, 0],
      fov: sceneData.camera.fov || 45,
    };
  }

  const scene: SceneData = {
    id: `scene_${sceneIndex + 1}`,
    header: sceneData.header || sceneName,
    key: sceneData.key || sceneName,
    description,
    javascript,
    camera,
    linger_duration_ms: sceneData.linger_duration_ms || 5000,
    transition_duration_ms: sceneData.transition_duration_ms || 1000,
  };

  return scene;
}

export async function parseAssetsFolder(rootPath: string): Promise<SceneAsset[]> {
  const assetsDir = join(rootPath, 'assets');

  if (!(await exists(assetsDir))) {
    console.error('⚠ Warning: assets/ directory not found');
    return [];
  }

  const assets: SceneAsset[] = [];

  // Walk through assets directory
  for await (const entry of walk(assetsDir, { includeDirs: false })) {
    const relativePath = relative(rootPath, entry.path);
    const filename = basename(entry.path);
    const rawContent = await Deno.readFile(entry.path);

    // Create content object with toBase64 method
    const content = Object.assign(rawContent, {
      toBase64() {
        return btoa(String.fromCharCode.apply(null, Array.from(rawContent)));
      },
    });

    assets.push({
      name: filename,
      content,
    });

    console.error(`✓ Loaded asset: ${relativePath}`);
  }

  return assets;
}

async function parseInlineScene(sceneSpec: any, index: number, folderPath: string): Promise<SceneData> {
  // Validate required fields
  if (!sceneSpec.id && !sceneSpec.header) {
    throw new Error(`Scene at index ${index} missing required 'id' or 'header' field`);
  }

  const id = sceneSpec.id || `scene_${index + 1}`;
  const header = sceneSpec.header || id;
  const key = sceneSpec.key || id;

  // Extract camera configuration if present
  let camera: CameraData | undefined;
  if (sceneSpec.camera) {
    camera = {
      mode: sceneSpec.camera.mode || 'perspective',
      target: sceneSpec.camera.target || [0, 0, 0],
      position: sceneSpec.camera.position || [10, 10, 10],
      up: sceneSpec.camera.up || [0, 1, 0],
      fov: sceneSpec.camera.fov || 45,
    };
  }

  // Load JavaScript - either inline or from builder file
  // Support both 'javascript' and 'js' as keys
  let javascript = sceneSpec.javascript || sceneSpec.js || '';

  if (sceneSpec.builder) {
    const builderPath = join(folderPath, sceneSpec.builder);
    if (await exists(builderPath)) {
      javascript = await Deno.readTextFile(builderPath);
      console.error(`  ✓ Loaded builder script: ${sceneSpec.builder}`);
    } else {
      throw new Error(`Builder file '${sceneSpec.builder}' not found for scene '${id}'`);
    }
  }

  return {
    id,
    header,
    key,
    description: sceneSpec.description || '',
    javascript,
    camera,
    linger_duration_ms: sceneSpec.linger_duration_ms || 5000,
    transition_duration_ms: sceneSpec.transition_duration_ms || 1000,
  };
}
