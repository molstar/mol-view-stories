// Templates for story and scene configurations with new structure

export const STORY_TEMPLATE = `# MolViewPack Story Configuration
metadata:
  title: "{{STORY_NAME}}"
  description: "A molecular visualization story created with MVS CLI"
  author: "{{AUTHOR}}"
  version: "1.0.0"
  created: "{{CREATED_DATE}}"
  tags:
    - "molecular-visualization"
    - "protein"

# Global story settings
settings:
  autoPlay: false
  loopStory: false
  showControls: true
  backgroundColor: "#000000"

# Story-level assets that can be referenced by scenes
assets:
  commonStructures: []
  images: []
  other: []
`;

export const SCENE_YAML_TEMPLATE = `# Scene Configuration for {{SCENE_NAME}}
header: "{{SCENE_NAME}}"
key: "{{SCENE_KEY}}"

# Camera configuration
camera:
  mode: "perspective"
  position: [0, 0, 50]
  target: [0, 0, 0]
  up: [0, 1, 0]
  fov: 45

# Timing configuration (in milliseconds)
linger_duration_ms: 5000
transition_duration_ms: 1000

# Additional scene parameters
settings:
  autoRotate: false
  showAxes: false
  backgroundColor: null  # inherit from story

# Structure files for this scene are loaded via JavaScript
# See the corresponding .js file for structure loading configuration
`;

export const SCENE_MD_TEMPLATE = `# {{SCENE_NAME}}

{{SCENE_DESCRIPTION}}

## Key Features

- **Structure**: Primary molecular structure showing {{SCENE_FOCUS}}
- **Representation**: Detailed visualization highlighting important elements
- **Context**: {{SCENE_CONTEXT}}

## Educational Notes

This scene demonstrates key structural features that are important for understanding:

- Molecular architecture and organization
- Functional domains and active sites
- Structural relationships and interactions

## Additional Information

Add detailed annotations, explanations, and educational content here. This content will be used as the scene description and can include:

- Scientific background and context
- Structural analysis and insights
- References to literature and databases
- Interactive elements and callouts

## References

- Add relevant literature citations
- Include database identifiers (PDB, UniProt, etc.)
- Link to related molecular structures
- Reference educational resources
`;

export const SCENE_JS_TEMPLATE = `// JavaScript code for {{SCENE_NAME}}
// This code will be executed when the scene is loaded

// Scene-specific molecular visualization setup
console.log("Loading scene: {{SCENE_NAME}}");

// Create a builder for molecular visualization
// Define the structure with full type support
const structure = builder
  .download({url: '{{STRUCTURE_URL}}'})
  .parse({ format: 'bcif' })
  .modelStructure({});

// Add components and representations
structure
  .component({ selector: 'polymer' })
  .representation({ type: 'cartoon' })
  .color({ color: '{{STRUCTURE_COLOR}}' });

// Add ligand (if present)
structure
  .component({ selector: 'ligand' })
  .label({ text: '{{LIGAND_LABEL}}' })
  .focus({})
  .representation({ type: 'ball_and_stick' })
  .color({ color: '#cc3399' });

// Text annotations and labels
const annotations = [
  {
    text: "{{ANNOTATION_TEXT}}",
    position: [0, 0, 0],
    style: {
      fontSize: 16,
      color: "#ffffff",
      backgroundColor: "rgba(0, 0, 0, 0.7)"
    }
  }
];

// Camera animation and transitions
const cameraAnimations = {
  // Define camera movements and transitions
  initialView: {
    position: [0, 0, 50],
    target: [0, 0, 0],
    duration: 2000
  }
};

// Interactive elements and highlights
const highlights = [
  // Define regions of interest to highlight
  {
    selection: "active_site",
    color: "#ff6b6b",
    representation: "ball_and_stick"
  }
];

// Scene-specific functions
function initializeScene() {
  // Initialize scene-specific settings
  console.log("Scene initialized: {{SCENE_NAME}}");
}

function animateScene() {
  // Define scene animations and transitions
  console.log("Animating scene: {{SCENE_NAME}}");
}

// Export scene configuration
const sceneConfig = {
  annotations,
  cameraAnimations,
  highlights,
  initialize: initializeScene,
  animate: animateScene
};

// Scene initialization
initializeScene();
`;

export const STORY_JS_TEMPLATE = `// Global JavaScript for {{STORY_NAME}}
// This code affects all scenes and runs before any scene-specific code

// Global variables and functions that can be used across all scenes
console.log("Initializing story: {{STORY_NAME}}");

// Common molecular visualization setup
// Add any global MolViewPack configuration here

// Example: Global color scheme
const globalColors = {
  protein: '#4CAF50',
  ligand: '#FF9800',
  water: '#2196F3',
  membrane: '#9C27B0'
};

// Example: Common utility functions
function showStructureInfo(structureName) {
  console.log("Loading structure:", structureName);
}

// Example: Global event handlers
function onSceneChange(sceneKey) {
  console.log("Transitioning to scene:", sceneKey);
}

// Your custom global JavaScript goes here
`;

export const README_TEMPLATE = `# {{STORY_NAME}}

A molecular visualization story created with MVS CLI.

## Description

{{STORY_DESCRIPTION}}

## Structure

- \`story.yaml\` - Main story configuration and metadata
- \`story.js\` - Global JavaScript code affecting all scenes
- \`scenes/\` - Individual scene configurations
  - \`scene1/\` - First scene
    - \`scene1.yaml\` - Scene parameters
    - \`scene1.md\` - Scene description and annotations
    - \`scene1.js\` - Scene JavaScript code
  - \`scene2/\` - Second scene
    - \`scene2.yaml\` - Scene parameters
    - \`scene2.md\` - Scene description and annotations
    - \`scene2.js\` - Scene JavaScript code
- \`assets/\` - Additional resources (images, documents, etc.)

## Usage

To build this story into a StoryContainer:

\`\`\`bash
mvs build . --output story-container.json
\`\`\`

## Scenes

### Scene 1: {{SCENE1_NAME}}
{{SCENE1_DESCRIPTION}}

### Scene 2: {{SCENE2_NAME}}
{{SCENE2_DESCRIPTION}}

## Editing Guide

### Scene Configuration
1. **Parameters**: Edit \`scenes/*/scene*.yaml\` for camera, timing, and settings
2. **Description**: Edit \`scenes/*/scene*.md\` for detailed annotations and educational content
3. **Behavior**: Edit \`scenes/*/scene*.js\` for molecular visualization code and interactions

### Structure Loading
- **Remote Structures**: Structures are loaded from URLs in the JavaScript files
- **URL Configuration**: Edit the \`STRUCTURE_URL\` in each scene's \`.js\` file
- **Supported Formats**: BCIF, PDB, MOL2, SDF, CIF (served via HTTP/HTTPS)

### Story Configuration
- **Metadata**: Edit \`story.yaml\` for title, author, and global settings
- **Styling**: Modify global appearance and behavior settings

## File Structure Details

### Scene Files
- **\`.yaml\`**: Camera positions, timing, structure references
- **\`.md\`**: Narrative content, educational annotations, references
- **\`.js\`**: Visualization code, interactions, animations

### Structure Organization
- Structures loaded directly from public databases (PDB, ChEMBL, etc.)
- No local file management required
- Fast loading via optimized BCIF format

For more information about MolViewPack stories, visit the documentation.
`;

// Template replacement function
export function replaceTemplateVars(
  template: string,
  vars: Record<string, string>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    const placeholder = `{{${key}}}`;
    result = result.replaceAll(placeholder, value);
  }
  return result;
}

// Default template variables
export function getDefaultTemplateVars(
  storyName: string,
): Record<string, string> {
  const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

  return {
    STORY_NAME: storyName,
    AUTHOR: Deno.env.get("USER") || Deno.env.get("USERNAME") || "Unknown",
    CREATED_DATE: now,
    STORY_DESCRIPTION: `A molecular visualization story exploring ${storyName}`,
    SCENE1_NAME: "Initial View",
    SCENE1_DESCRIPTION: "Initial overview of the molecular structure",
    SCENE1_KEY: "scene1",
    SCENE1_FOCUS: "overall molecular architecture",
    SCENE1_CONTEXT: "Provides foundational understanding of the structure",
    SCENE2_NAME: "Detailed View",
    SCENE2_DESCRIPTION: "Focused view highlighting specific structural features",
    SCENE2_KEY: "scene2",
    SCENE2_FOCUS: "active site and functional domains",
    SCENE2_CONTEXT: "Explores functional significance of key regions",
    ANNOTATION_TEXT: "Key structural elements highlighted",
    STRUCTURE_URL: "https://www.ebi.ac.uk/pdbe/entry-files/1cbs.bcif",
    STRUCTURE_COLOR: "green",
    LIGAND_LABEL: "Ligand",
  };
}
