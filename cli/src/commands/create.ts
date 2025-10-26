import { ensureDir } from '@std/fs';
import { join } from '@std/path';
import {
  getDefaultInlineTemplateVars,
  getDefaultTemplateVars,
  README_FOLDER_TEMPLATE,
  README_INLINE_TEMPLATE,
  replaceTemplateVars,
  SCENE_JS_TEMPLATE,
  SCENE_MD_TEMPLATE,
  SCENE_YAML_TEMPLATE,
  STORY_INLINE_TEMPLATE,
  STORY_JS_TEMPLATE,
  STORY_TEMPLATE,
} from '../templates/story.ts';

export async function createStory(storyName: string, options: { split?: boolean } = {}): Promise<void> {
  const isSplit = options.split ?? false;
  const formatType = isSplit ? 'folder structure' : 'single inline file';
  console.log(`Creating story as ${formatType} for: ${storyName}`);

  // Validate story name
  if (!isValidStoryName(storyName)) {
    throw new Error('Story name must contain only letters, numbers, hyphens, and underscores');
  }

  // Check if directory already exists
  try {
    const stat = await Deno.stat(storyName);
    if (stat.isDirectory) {
      throw new Error(`Directory '${storyName}' already exists`);
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
    // Directory doesn't exist, which is what we want
  }

  try {
    if (isSplit) {
      await createSplitStory(storyName);
    } else {
      await createInlineStory(storyName);
    }
  } catch (error) {
    // Clean up on error
    try {
      await Deno.remove(storyName, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
    throw new Error(`Failed to create story structure: ${error instanceof Error ? error.message : error}`);
  }
}

async function createInlineStory(storyName: string): Promise<void> {
  // Get template variables for inline format
  const templateVars = getDefaultInlineTemplateVars(storyName);

  try {
    // Create main story directory
    await ensureDir(storyName);
    console.log(`✓ Created directory: ${storyName}/`);

    // Create assets directory
    const assetsDir = join(storyName, 'assets');
    await ensureDir(assetsDir);
    console.log(`✓ Created directory: ${assetsDir}/`);

    // Create single story.yaml with all scenes inline
    const storyYaml = replaceTemplateVars(STORY_INLINE_TEMPLATE, templateVars);
    await Deno.writeTextFile(join(storyName, 'story.yaml'), storyYaml);
    console.log(`✓ Created file: ${storyName}/story.yaml`);

    // Create README.md for inline format
    const readme = replaceTemplateVars(README_INLINE_TEMPLATE, templateVars);
    await Deno.writeTextFile(join(storyName, 'README.md'), readme);
    console.log(`✓ Created file: ${storyName}/README.md`);

    console.log(`\n🎉 Successfully created inline story '${storyName}'`);
    console.log(`\nNext steps:`);
    console.log(`1. cd ${storyName}`);
    console.log(`2. Edit story.yaml to customize scenes and add your structures`);
    console.log(`3. Run 'mvs build .' to generate the JSON StoryContainer`);
    console.log(`4. Run 'mvs watch .' to preview your story locally`);
    console.log(`\nFile structure:`);
    console.log(`${storyName}/`);
    console.log(`├── story.yaml          (all scenes defined inline)`);
    console.log(`├── README.md`);
    console.log(`└── assets/`);
  } catch (error) {
    throw error;
  }
}

async function createSplitStory(storyName: string): Promise<void> {
  // Get template variables for folder format
  const templateVars = getDefaultTemplateVars(storyName);

  try {
    // Create main story directory
    await ensureDir(storyName);
    console.log(`✓ Created directory: ${storyName}/`);

    // Create subdirectories
    const scenesDir = join(storyName, 'scenes');
    const assetsDir = join(storyName, 'assets');

    await ensureDir(scenesDir);
    await ensureDir(assetsDir);
    console.log(`✓ Created directory: ${scenesDir}/`);
    console.log(`✓ Created directory: ${assetsDir}/`);

    // Create scene directories
    const scene1Dir = join(scenesDir, 'scene1');
    const scene2Dir = join(scenesDir, 'scene2');
    await ensureDir(scene1Dir);
    await ensureDir(scene2Dir);
    console.log(`✓ Created directory: ${scene1Dir}/`);
    console.log(`✓ Created directory: ${scene2Dir}/`);

    // Create main story.yaml with scene references
    const storyYaml = replaceTemplateVars(STORY_TEMPLATE, templateVars);
    await Deno.writeTextFile(join(storyName, 'story.yaml'), storyYaml);
    console.log(`✓ Created file: ${storyName}/story.yaml`);

    // Create story.js
    const storyJs = replaceTemplateVars(STORY_JS_TEMPLATE, templateVars);
    await Deno.writeTextFile(join(storyName, 'story.js'), storyJs);
    console.log(`✓ Created file: ${storyName}/story.js`);

    // Create README.md for folder format
    const readme = replaceTemplateVars(README_FOLDER_TEMPLATE, templateVars);
    await Deno.writeTextFile(join(storyName, 'README.md'), readme);
    console.log(`✓ Created file: ${storyName}/README.md`);

    // Create scene 1 files
    await createSceneFiles(scene1Dir, 'scene1', {
      ...templateVars,
      SCENE_NAME: templateVars.SCENE1_NAME,
      SCENE_DESCRIPTION: templateVars.SCENE1_DESCRIPTION,
      SCENE_KEY: templateVars.SCENE1_KEY,
      SCENE_FOCUS: templateVars.SCENE1_FOCUS,
      SCENE_CONTEXT: templateVars.SCENE1_CONTEXT,
      ANNOTATION_TEXT: 'Initial molecular structure overview',
      STRUCTURE_URL: 'https://www.ebi.ac.uk/pdbe/entry-files/1cbs.bcif',
      STRUCTURE_COLOR: 'green',
      LIGAND_LABEL: 'Retinoic Acid',
    });

    // Create scene 2 files
    await createSceneFiles(scene2Dir, 'scene2', {
      ...templateVars,
      SCENE_NAME: templateVars.SCENE2_NAME,
      SCENE_DESCRIPTION: templateVars.SCENE2_DESCRIPTION,
      SCENE_KEY: templateVars.SCENE2_KEY,
      SCENE_FOCUS: templateVars.SCENE2_FOCUS,
      SCENE_CONTEXT: templateVars.SCENE2_CONTEXT,
      ANNOTATION_TEXT: 'Detailed view of active site',
      STRUCTURE_URL: 'https://www.ebi.ac.uk/pdbe/entry-files/3pqr.bcif',
      STRUCTURE_COLOR: 'blue',
      LIGAND_LABEL: 'ATP',
    });

    console.log(`\n🎉 Successfully created folder-based story '${storyName}'`);
    console.log(`\nNext steps:`);
    console.log(`1. cd ${storyName}`);
    console.log(`2. Edit scene configurations in scenes/*/scene*.yaml, .md, and .js`);
    console.log(`3. Run 'mvs build .' to generate the JSON StoryContainer`);
    console.log(`4. Run 'mvs watch .' to preview your story locally`);
    console.log(`\nFile structure:`);
    console.log(`${storyName}/`);
    console.log(`├── story.yaml          (with scenes: [scene1, scene2])`);
    console.log(`├── story.js`);
    console.log(`├── README.md`);
    console.log(`├── scenes/`);
    console.log(`│   ├── scene1/`);
    console.log(`│   │   ├── scene1.yaml`);
    console.log(`│   │   ├── scene1.md`);
    console.log(`│   │   └── scene1.js`);
    console.log(`│   └── scene2/`);
    console.log(`│       ├── scene2.yaml`);
    console.log(`│       ├── scene2.md`);
    console.log(`│       └── scene2.js`);
    console.log(`└── assets/`);
  } catch (error) {
    throw error;
  }
}

async function createSceneFiles(
  sceneDir: string,
  sceneName: string,
  templateVars: Record<string, string>
): Promise<void> {
  // Create scene.yaml
  const sceneYaml = replaceTemplateVars(SCENE_YAML_TEMPLATE, templateVars);
  await Deno.writeTextFile(join(sceneDir, `${sceneName}.yaml`), sceneYaml);
  console.log(`✓ Created file: ${sceneDir}/${sceneName}.yaml`);

  // Create scene.md
  const sceneMd = replaceTemplateVars(SCENE_MD_TEMPLATE, templateVars);
  await Deno.writeTextFile(join(sceneDir, `${sceneName}.md`), sceneMd);
  console.log(`✓ Created file: ${sceneDir}/${sceneName}.md`);

  // Create scene.js
  const sceneJs = replaceTemplateVars(SCENE_JS_TEMPLATE, templateVars);
  await Deno.writeTextFile(join(sceneDir, `${sceneName}.js`), sceneJs);
  console.log(`✓ Created file: ${sceneDir}/${sceneName}.js`);
}

function isValidStoryName(name: string): boolean {
  // Allow letters, numbers, hyphens, and underscores
  // Must not start or end with hyphen or underscore
  const validPattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;
  return validPattern.test(name) && name.length >= 1 && name.length <= 100;
}
