// Templates for story and scene configurations with new structure

// ============================================================================
// INLINE FORMAT TEMPLATES (Single File with Embedded Scenes)
// ============================================================================

export const STORY_INLINE_TEMPLATE = `title: '{{STORY_NAME}}'

metadata:
  description: "{{STORY_DESCRIPTION}}"
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

# Optional global JavaScript that runs before all scenes
global_js: |
  // Global variables and functions that can be used across all scenes
  console.log("Initializing story: {{STORY_NAME}}");

  // Common molecular visualization setup
  const globalColors = {
    protein: '#4CAF50',
    ligand: '#FF9800',
    water: '#2196F3',
    membrane: '#9C27B0'
  };

# Scene definitions - inline format
scenes:
  - id: scene1
    header: "{{SCENE1_NAME}}"
    key: "scene1"
    description: |
      # {{SCENE1_NAME}}

      {{SCENE1_DESCRIPTION}}

      ## Key Features
      - **Structure**: Primary molecular structure showing {{SCENE1_FOCUS}}
      - **Representation**: Detailed visualization highlighting important elements
      - **Context**: {{SCENE1_CONTEXT}}

    javascript: |
      const structure = builder
        .download({url: '{{SCENE1_STRUCTURE_URL}}'})
        .parse({ format: 'bcif' })
        .modelStructure({});

      // Add components and representations
      structure
        .component({ selector: 'polymer' })
        .representation({ type: 'cartoon' })
        .color({ color: '{{SCENE1_STRUCTURE_COLOR}}' });

      // Add ligand (if present)
      structure
        .component({ selector: 'ligand' })
        .label({ text: '{{SCENE1_LIGAND_LABEL}}' })
        .focus({})
        .representation({ type: 'ball_and_stick' })
        .color({ color: '#cc3399' });

    linger_duration_ms: 5000
    transition_duration_ms: 1000

  - id: scene2
    header: "{{SCENE2_NAME}}"
    key: "scene2"
    description: |
      # {{SCENE2_NAME}}

      {{SCENE2_DESCRIPTION}}

      ## Key Features
      - **Structure**: Focused view highlighting specific structural features
      - **Representation**: Detailed visualization of functional domains
      - **Context**: {{SCENE2_CONTEXT}}

    javascript: |
      const structure = builder
        .download({url: '{{SCENE2_STRUCTURE_URL}}'})
        .parse({ format: 'bcif' })
        .modelStructure({});

      // Add components and representations
      structure
        .component({ selector: 'polymer' })
        .representation({ type: 'cartoon' })
        .color({ color: '{{SCENE2_STRUCTURE_COLOR}}' });

      // Add ligand (if present)
      structure
        .component({ selector: 'ligand' })
        .label({ text: '{{SCENE2_LIGAND_LABEL}}' })
        .focus({})
        .representation({ type: 'ball_and_stick' })
        .color({ color: '#ff6b6b' });

    linger_duration_ms: 5000
    transition_duration_ms: 1000
`;

// ============================================================================
// FOLDER FORMAT TEMPLATES (Multiple Files with Separate Scenes)
// ============================================================================

// Folder format - story.yaml with metadata and scenes reference
export const STORY_TEMPLATE = `metadata:
  title: "{{STORY_NAME}}"
  description: "{{STORY_DESCRIPTION}}"
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

# Scene order - lists scenes to be loaded
scenes:
  - scene1
  - scene2

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

export const README_INLINE_TEMPLATE = `# {{STORY_NAME}}

{{STORY_DESCRIPTION}}

## Quick Start

Edit \`story.yaml\` to customize your scenes, then build and preview:

\`\`\`bash
mvs build .                          # Build to JSON
mvs watch .                          # Preview locally
\`\`\`

All scene data is defined inline in \`story.yaml\`.

## Scenes

- **{{SCENE1_NAME}}**: {{SCENE1_DESCRIPTION}}
- **{{SCENE2_NAME}}**: {{SCENE2_DESCRIPTION}}

## Resources

- [MVS CLI Documentation](https://github.com/zachcp/mvs-cli)
- [MolViewPack](https://molviewpack.org)
`;

export const README_FOLDER_TEMPLATE = `# {{STORY_NAME}}

{{STORY_DESCRIPTION}}

## Quick Start

Edit scenes in their folders, then build and preview:

\`\`\`bash
mvs build .                          # Build to JSON
mvs watch .                          # Preview locally
\`\`\`

Scene data is spread across separate files in the \`scenes/\` folder.

## Scenes

- **{{SCENE1_NAME}}**: {{SCENE1_DESCRIPTION}}
- **{{SCENE2_NAME}}**: {{SCENE2_DESCRIPTION}}

## Resources

- [MVS CLI Documentation](https://github.com/zachcp/mvs-cli)
- [MolViewPack](https://molviewpack.org)
`;

export const README_TEMPLATE = README_INLINE_TEMPLATE;

// Template replacement function
export function replaceTemplateVars(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    const placeholder = `{{${key}}}`;
    result = result.replaceAll(placeholder, value);
  }
  return result;
}

// Default template variables for inline format
export function getDefaultInlineTemplateVars(storyName: string): Record<string, string> {
  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  return {
    STORY_NAME: storyName,
    AUTHOR: Deno.env.get('USER') || Deno.env.get('USERNAME') || 'Unknown',
    CREATED_DATE: now,
    STORY_DESCRIPTION: `A molecular visualization story exploring ${storyName}`,
    SCENE1_NAME: 'Initial View',
    SCENE1_DESCRIPTION: 'Initial overview of the molecular structure',
    SCENE1_FOCUS: 'overall molecular architecture',
    SCENE1_CONTEXT: 'Provides foundational understanding of the structure',
    SCENE1_STRUCTURE_URL: 'https://www.ebi.ac.uk/pdbe/entry-files/1cbs.bcif',
    SCENE1_STRUCTURE_COLOR: 'green',
    SCENE1_LIGAND_LABEL: 'Retinoic Acid',
    SCENE2_NAME: 'Detailed View',
    SCENE2_DESCRIPTION: 'Focused view highlighting specific structural features',
    SCENE2_FOCUS: 'active site and functional domains',
    SCENE2_CONTEXT: 'Explores functional significance of key regions',
    SCENE2_STRUCTURE_URL: 'https://www.ebi.ac.uk/pdbe/entry-files/3pqr.bcif',
    SCENE2_STRUCTURE_COLOR: 'blue',
    SCENE2_LIGAND_LABEL: 'ATP',
  };
}

// Default template variables for folder format
export function getDefaultTemplateVars(storyName: string): Record<string, string> {
  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  return {
    STORY_NAME: storyName,
    AUTHOR: Deno.env.get('USER') || Deno.env.get('USERNAME') || 'Unknown',
    CREATED_DATE: now,
    STORY_DESCRIPTION: `A molecular visualization story exploring ${storyName}`,
    SCENE1_NAME: 'Initial View',
    SCENE1_DESCRIPTION: 'Initial overview of the molecular structure',
    SCENE1_KEY: 'scene1',
    SCENE1_FOCUS: 'overall molecular architecture',
    SCENE1_CONTEXT: 'Provides foundational understanding of the structure',
    SCENE2_NAME: 'Detailed View',
    SCENE2_DESCRIPTION: 'Focused view highlighting specific structural features',
    SCENE2_KEY: 'scene2',
    SCENE2_FOCUS: 'active site and functional domains',
    SCENE2_CONTEXT: 'Explores functional significance of key regions',
    ANNOTATION_TEXT: 'Key structural elements highlighted',
    STRUCTURE_URL: 'https://www.ebi.ac.uk/pdbe/entry-files/1cbs.bcif',
    STRUCTURE_COLOR: 'green',
    LIGAND_LABEL: 'Ligand',
  };
}
