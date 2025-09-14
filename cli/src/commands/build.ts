import {
  parseYaml,
  exists,
  walk,
  basename,
  dirname,
  extname,
  join,
  relative,
  type CameraData,
  type SceneAsset,
  type SceneData,
  type Story,
  type StoryMetadata,
  StoryManager,
} from '../deps.ts';

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

  // Extract metadata
  const metadata: StoryMetadata = {
    title: storyData.metadata?.title || basename(folderPath),
  };

  console.error(`✓ Loaded story metadata: ${metadata.title}`);

  // Parse scenes
  const scenesDir = join(folderPath, 'scenes');
  const scenes: SceneData[] = [];

  if (await exists(scenesDir)) {
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

  if (scenes.length === 0) {
    console.error('⚠ Warning: No scenes found in the story');
  }

  // Parse assets
  const assets = await parseAssetsFolder(folderPath);

  // Read optional story.js file for global JavaScript
  const storyJsPath = join(folderPath, 'story.js');
  let storyJavaScript = '';
  if (await exists(storyJsPath)) {
    storyJavaScript = await Deno.readTextFile(storyJsPath);
    console.error(`✓ Loaded story.js with ${storyJavaScript.length} characters`);
  } else {
    console.error('⚠ Warning: story.js not found, using empty story JavaScript');
  }

  // Use only the user-provided JavaScript for story.javascript
  const javascript = storyJavaScript;

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

    // Create content class that extends Uint8Array with toBase64 method
    class ContentWithBase64 extends Uint8Array {
      toBase64() {
        return btoa(String.fromCharCode.apply(null, Array.from(this)));
      }
    }

    const content = new ContentWithBase64(rawContent);

    assets.push({
      name: filename,
      content,
    });

    console.error(`✓ Loaded asset: ${relativePath}`);
  }

  return assets;
}
