import { assertEquals, assertInstanceOf } from "@std/assert";
import { type SceneData, type Story, StoryContainer } from "./types.ts";
import type { MVSData } from "molstar/mvs-data";

export const ComprehensiveStory: Story = {
  metadata: { title: "Comprehensive Molecular Visualization Examples" },
  javascript: "// Common code for all molecular visualization scenes\n",
  scenes: [
    {
      id: "scene_basic_id",
      header: "Basic Visualization",
      key: "scene_basic",
      description:
        "# Basic Molecular Visualization\n\nLoad a molecule from URL (PDB ID 1cbs) and display default representation (cartoon) in blue color.",
      javascript: `// Basic: Load molecule and display cartoon in blue
const structure = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1cbs_updated.cif' })
  .parse({ format: 'mmcif' })
  .modelStructure({})
  .component({})
  .representation({})
  .color({ color: 'blue' });`,
    },
    {
      id: "scene_labels_id",
      header: "Labels and Focus",
      key: "scene_labels",
      description:
        "# Custom Labels\n\nA molecule (PDB ID 1lap) visualization with custom labels and focused residue highlighting.",
      javascript: `// Labels: Molecule with custom labels
const structure = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1lap_updated.cif' })
  .parse({ format: 'mmcif' })
  .modelStructure({});

// Reference a residue of interest
const residue = { label_asym_id: 'A', label_seq_id: 120 };

// Represent everything as cartoon & color the residue red
const whole = structure.component({});
whole
  .representation({})
  .color({
    color: 'red',
    selector: { label_asym_id: 'A', label_seq_id: 120 }
  });

// label the residues with custom text & focus it
structure
  .component({ selector: residue })
  .label({ text: 'ALA 120 A: My Label' })
  .focus({});`,
    },
    {
      id: "scene_components_id",
      header: "Component Selection",
      key: "scene_components",
      description:
        "# Component-Based Visualization\n\nAn aaRS (PDB ID 1c0a) visualization with different selections. Protein in orange, RNA in blue, ligand in green, and active site residues colored red.",
      javascript: `// Components: aaRS with different selections
const structure = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1c0a_updated.cif' })
  .parse({ format: 'mmcif' })
  .assemblyStructure({});

// represent protein & RNA as cartoon
structure.component({ selector: 'protein' })
  .representation({})
  .color({ color: '#e19039' });

structure.component({ selector: 'nucleic' })
  .representation({})
  .color({ color: '#4b7fcc' });

// represent ligand in active site as ball-and-stick
const ligand = structure.component({ selector: { label_asym_id: 'E' } });
ligand.representation({ type: 'ball_and_stick' }).color({ color: '#229954' });

// represent 2 crucial arginine residues as red ball-and-stick and label with custom text
const arg_b_217 = structure
  .component({ selector: { label_asym_id: 'B', label_seq_id: 217 } });
arg_b_217.representation({ type: 'ball_and_stick' }).color({ color: '#ff0000' });
arg_b_217.label({ text: 'aaRS Class II Signature' });

const arg_b_537 = structure
  .component({ selector: { label_asym_id: 'B', label_seq_id: 537 } });
arg_b_537.representation({ type: 'ball_and_stick' }).color({ color: '#ff0000' });
arg_b_537.label({ text: 'aaRS Class II Signature' });

// position camera to zoom in on ligand and signature residues
structure.component({ selector: [
  { label_asym_id: 'E' },
  { label_asym_id: 'B', label_seq_id: 217 },
  { label_asym_id: 'B', label_seq_id: 537 }
]}).focus({});`,
    },
    {
      id: "scene_superposition_id",
      header: "Structural Superposition",
      key: "scene_superposition",
      description:
        "# Structural Superposition\n\nTwo molecules superposed by applying a matrix transform. Red and blue structures overlaid for comparison.",
      javascript: `// Superposition: Two molecules with matrix transform
// Load first structure and color it red
builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/4hhb_updated.cif' })
  .parse({ format: 'mmcif' })
  .modelStructure({})
  .component({})
  .representation({})
  .color({ color: 'red' });

// Load second structure, apply matrix transform, and color it blue
builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1oj6_updated.cif' })
  .parse({ format: 'mmcif' })
  .modelStructure({})
  .transform({
    rotation: [
      -0.7202161, -0.33009904, -0.61018308,
      0.36257631, 0.57075962, -0.73673053,
      0.59146191, -0.75184312, -0.29138417
    ],
    translation: [-12.54, 46.79, 94.50]
  })
  .component({})
  .representation({})
  .color({ color: 'blue' });`,
    },
    {
      id: "scene_annotations_id",
      header: "Annotation-Based Coloring",
      key: "scene_annotations",
      description:
        "# Annotation-Based Visualization\n\nLoad a structure (PDB ID 1h9t) and apply coloring and labels based on data from an MVS annotation file.",
      javascript: `// Annotations: Structure with annotation-based coloring
const structure_url = 'https://files.wwpdb.org/download/1h9t.cif';
const annotation_url = 'https://molstar.org/mol-view-spec/examples/annotations/annotations-1h9t.cif';

// Load structure
const structure = builder
  .download({ url: structure_url })
  .parse({ format: 'mmcif' })
  .modelStructure({});

// Create components using MVS annotations
const protein = structure.componentFromUri({
  uri: annotation_url,
  format: 'cif',
  block_header: '1h9t_annotations',
  category_name: 'components',
  field_name: 'component',
  field_values: ['Protein'],
  schema: 'chain'
});

const dna = structure.componentFromUri({
  uri: annotation_url,
  format: 'cif',
  category_name: 'components',
  field_values: ['DNA'],
  schema: 'chain'
});

const ions = structure.componentFromUri({
  uri: annotation_url,
  format: 'cif',
  category_name: 'components',
  field_values: ['Gold', 'Chloride'],
  schema: 'chain'
});

// Create representations
const protein_repr = protein.representation({ type: 'cartoon' });
const dna_repr = dna.representation({ type: 'ball_and_stick' });
const ions_repr = ions.representation({ type: 'surface' });

// Apply coloring using MVS annotations
protein_repr.colorFromUri({
  uri: annotation_url,
  format: 'cif',
  block_header: '1h9t_annotations',
  category_name: 'annotations',
  field_name: 'color',
  schema: 'residue_range'
});

dna_repr.colorFromUri({
  uri: annotation_url,
  format: 'cif',
  category_name: 'annotations',
  schema: 'residue_range'
});

ions_repr.colorFromUri({
  uri: annotation_url,
  format: 'cif',
  category_name: 'annotations',
  schema: 'residue_range'
});

// Add labels using MVS annotations
structure.labelFromUri({
  uri: annotation_url,
  format: 'cif',
  block_header: '1h9t_annotations',
  category_name: 'annotations',
  field_name: 'label',
  schema: 'residue_range'
});

// Add tooltips using MVS annotations
structure.tooltipFromUri({
  uri: annotation_url,
  format: 'cif',
  block_header: '1h9t_annotations',
  category_name: 'annotations',
  field_name: 'label',
  schema: 'residue_range'
});`,
    },
    {
      id: "scene_primitives_id",
      header: "Geometric Primitives",
      key: "scene_primitives",
      description:
        "# Geometric Primitives\n\nDraw various geometrical primitives including ellipses, arrows, and ellipsoids with custom colors and opacity.",
      javascript: `// Primitives: Draw various geometrical primitives
builder.primitives({ opacity: 0.66 })
  .ellipse({
    color: 'red',
    center: [1, 1, 1],
    major_axis: [1.5, 0, 0],
    minor_axis: [0, 2, 0],
    theta_start: 0,
    theta_end: Math.PI / 2,
    tooltip: 'XY',
  })
  .ellipse({
    color: 'green',
    center: [1, 1, 1],
    major_axis_endpoint: [1.5 + 1, 0 + 1, 0 + 1],
    minor_axis_endpoint: [0 + 1, 0 + 1, 1 + 1],
    theta_start: 0,
    theta_end: Math.PI / 2,
    tooltip: 'XZ',
  })
  .ellipse({
    color: 'blue',
    center: [1, 1, 1],
    major_axis: [0, 10, 0],
    minor_axis: [0, 0, 1],
    radius_major: 2,
    radius_minor: 1,
    theta_start: 0,
    theta_end: Math.PI / 2,
    tooltip: 'YZ',
  })
  .arrow({
    start: [1, 1, 1],
    end: [1 + 1.5, 1 + 0, 1 + 0],
    tube_radius: 0.05,
    length: 1.5 + 0.2,
    show_end_cap: true,
    color: '#ffff00',
    tooltip: 'X',
  })
  .arrow({
    start: [1, 1, 1],
    direction: [0, 2 + 0.2, 0],
    tube_radius: 0.05,
    show_end_cap: true,
    color: '#ff00ff',
    tooltip: 'Y',
  })
  .arrow({
    end: [1, 1, 1],
    start: [1 + 0, 1 + 0, 1 + 1 + 0.2],
    show_start_cap: true,
    tube_radius: 0.05,
    color: '#00ffff',
    tooltip: 'Z',
  });

builder.primitives({ opacity: 0.33 }).ellipsoid({
  center: [1, 1, 1],
  major_axis: [1, 0, 0],
  minor_axis: [0, 1, 0],
  radius: [1.5, 2, 1],
  color: '#cccccc',
});`,
    },
    {
      id: "scene_volumes_id",
      header: "Volume Visualization",
      key: "scene_volumes",
      description:
        "# Volume and Electron Density\n\nLoad a structure and a volume from the Mol* Volume Server. Shows 2FO-FC and FO-FC electron density maps with different isovalues.",
      javascript: `// Volumes: Structure with electron density maps
const structure = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1tqn_updated.cif' })
  .parse({ format: 'mmcif' })
  .modelStructure({});

structure
  .component({ selector: 'polymer' })
  .representation({ type: 'cartoon' })
  .color({ color: 'white' });

const ligand = structure.component({ selector: 'ligand' });
ligand
  .representation({ type: 'ball_and_stick' })
  .color({ custom: { molstar_color_theme_name: 'element-symbol' } });

ligand.focus({
  up: [0.98, -0.19, 0],
  direction: [-28.47, -17.66, -16.32],
  radius: 14,
  radius_extent: 5
});

const volume_data = builder.download({
  url: 'https://www.ebi.ac.uk/pdbe/densities/x-ray/1tqn/box/-22.367,-33.367,-21.634/-7.106,-10.042,-0.937?detail=3'
}).parse({ format: 'bcif' });

volume_data.volume({ channel_id: '2FO-FC' }).representation({
  type: 'isosurface',
  relative_isovalue: 1.5,
  show_wireframe: true,
  show_faces: false,
}).color({ color: 'blue' }).opacity({ opacity: 0.3 });

const fo_fc = volume_data.volume({ channel_id: 'FO-FC' });
fo_fc.representation({
  type: 'isosurface',
  relative_isovalue: 3,
  show_wireframe: true
}).color({ color: 'green' }).opacity({ opacity: 0.3 });

fo_fc.representation({
  type: 'isosurface',
  relative_isovalue: -3,
  show_wireframe: true
}).color({ color: 'red' }).opacity({ opacity: 0.3 });

const snapshot = builder.getSnapshot({
  title: '1tqn',
  description: \`### 1tqn with ligand and electron density map
- 2FO-FC at 1.5σ, blue
- FO-FC (positive) at 3σ, green
- FO-FC (negative) at -3σ, red\`,
});

return {
  snapshots: [snapshot],
  metadata: { description: '1tqn + Volume Server' }
};`,
    },
  ],
  assets: [],
};

Deno.test("ComprehensiveStory container yields MVSData", async () => {
  const container = new StoryContainer(ComprehensiveStory);
  const result = await container.generate();

  // Since ComprehensiveStory has no assets, it should return MVSData directly (not Uint8Array)
  assertInstanceOf(result, Object);

  // Verify it's an MVSData-like object
  const mvsData = result as any;
  assertEquals(typeof mvsData, "object");
  assertEquals(mvsData.kind, "multiple");
});

Deno.test("StoryContainer generates HTML template", async () => {
  const container = new StoryContainer(ComprehensiveStory);
  const html = await container.generateStoriesHtml();

  // Verify HTML structure
  assertEquals(typeof html, "string");

  // Check for essential HTML elements
  assertEquals(html.includes("<!DOCTYPE html>"), true);
  assertEquals(html.includes('<html lang="en">'), true);
  assertEquals(
    html.includes(
      "<title>Comprehensive Molecular Visualization Examples</title>",
    ),
    true,
  );
  assertEquals(
    html.includes("<mvs-stories-viewer></mvs-stories-viewer>"),
    true,
  );
  assertEquals(html.includes("mvsStories.loadFromData"), true);

  // Check that the molstar version is included
  assertEquals(html.includes("molstar@5.0.0-dev.2"), true);

  // Check that the format is correct (should be mvsj since no assets)
  assertEquals(html.includes("format: 'mvsj'"), true);
});

Deno.test("StoryContainer generates HTML with custom options", async () => {
  const container = new StoryContainer(ComprehensiveStory);
  const html = await container.generateStoriesHtml({
    title: "Custom Test Title",
    molstarVersion: "4.2.0",
  });

  // Verify custom title is used
  assertEquals(html.includes("<title>Custom Test Title</title>"), true);

  // Verify custom molstar version is used
  assertEquals(html.includes("molstar@4.2.0"), true);
});

Deno.test(
  "StoryContainer round-trip serialization with export/import",
  async () => {
    const container = new StoryContainer(ComprehensiveStory);

    // Export the container to binary data
    const exported = await container.exportStory("test-roundtrip");
    assertEquals(exported.data instanceof Uint8Array, true);
    assertEquals(exported.data.length > 0, true);

    // Import the binary data back to a StoryContainer
    const restoredContainer = await StoryContainer.importStory(exported.data);
    assertInstanceOf(restoredContainer, StoryContainer);

    // Verify the restored container has the same story data
    assertEquals(restoredContainer.version, 1);
    assertEquals(
      restoredContainer.story.metadata.title,
      ComprehensiveStory.metadata.title,
    );
    assertEquals(
      restoredContainer.story.scenes.length,
      ComprehensiveStory.scenes.length,
    );
    assertEquals(
      restoredContainer.story.scenes[0].id,
      ComprehensiveStory.scenes[0].id,
    );
    assertEquals(
      restoredContainer.story.scenes[0].header,
      ComprehensiveStory.scenes[0].header,
    );

    // Verify the restored container can generate the same MVSData
    const originalResult = await container.generate();
    const restoredResult = await restoredContainer.generate();

    assertInstanceOf(originalResult, Object);
    assertInstanceOf(restoredResult, Object);

    const originalMvsData = originalResult as any;
    const restoredMvsData = restoredResult as any;

    assertEquals(originalMvsData.kind, restoredMvsData.kind);
    assertEquals(
      originalMvsData.snapshots?.length,
      restoredMvsData.snapshots?.length,
    );
  },
);

Deno.test("StoryContainer exportStory method", async () => {
  const container = new StoryContainer(ComprehensiveStory);

  // Export the story with a custom filename
  const exported = await container.exportStory("test-story");

  // Verify the exported data structure
  assertEquals(typeof exported, "object");
  assertEquals(typeof exported.filename, "string");
  assertEquals(exported.filename, "test-story.mvstory");
  assertEquals(exported.data instanceof Uint8Array, true);
  assertEquals(exported.data.length > 0, true);

  // Test that the exported data can be imported back to the original story
  const restoredContainer = await StoryContainer.importStory(exported.data);
  assertInstanceOf(restoredContainer, StoryContainer);
  assertEquals(
    restoredContainer.story.metadata.title,
    ComprehensiveStory.metadata.title,
  );
});

Deno.test(
  "StoryContainer exportStory handles filename extensions",
  async () => {
    const container = new StoryContainer(ComprehensiveStory);

    // Test filename without extension
    const exported1 = await container.exportStory("my-story");
    assertEquals(exported1.filename, "my-story.mvstory");

    // Test filename with extension already present
    const exported2 = await container.exportStory("my-story.mvstory");
    assertEquals(exported2.filename, "my-story.mvstory");

    // Test that both exports produce the same data
    assertEquals(exported1.data.length, exported2.data.length);
  },
);

Deno.test("StoryContainer importStory method", async () => {
  const container = new StoryContainer(ComprehensiveStory);

  // Export the story
  const exported = await container.exportStory("test-import");

  // Import the story back using the static method
  const importedContainer = await StoryContainer.importStory(exported.data);

  // Verify the imported container
  assertInstanceOf(importedContainer, StoryContainer);
  assertEquals(importedContainer.version, 1);
  assertEquals(
    importedContainer.story.metadata.title,
    ComprehensiveStory.metadata.title,
  );
  assertEquals(
    importedContainer.story.scenes.length,
    ComprehensiveStory.scenes.length,
  );

  // Verify that both containers generate equivalent MVSData
  const originalResult = await container.generate();
  const importedResult = await importedContainer.generate();

  const originalMvsData = originalResult as any;
  const importedMvsData = importedResult as any;

  assertEquals(originalMvsData.kind, importedMvsData.kind);
  assertEquals(
    originalMvsData.snapshots?.length,
    importedMvsData.snapshots?.length,
  );
});
