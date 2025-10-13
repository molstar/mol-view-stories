// Global JavaScript for TBP Story
// Helper functions and constants used across all scenes

console.log('Initializing story: The Structural Story of TATA-Binding Protein');

// Color scheme for different structures
const Colors = {
  '1vok': '#4577B2',
  '1cdw': '#BC536D',
  '1cdw-2': '#c5a3af',
  '1vtl': '#B9E3A0',
  '7enc': '#0072B2',
  '7enc-2': '#D55E00',
  '7enc-3': '#009E73',
  '7enc-4': '#56B4E9',
};

// Superposition transformation matrices (obtained using https://www.rcsb.org/alignment)
const Superpositions = {
  '1cdw': [
    -0.4665815186, 0.6063873444, -0.6438913535, 0, -0.581544075, -0.7588303199, -0.2932286385, 0, -0.6664144171,
    0.2376361381, 0.7066971703, 0, 135.0863694935, 105.5007997009, 153.6890178993, 1,
  ],
  '1vtl': [
    -0.4769460004, 0.7214347188, -0.5020502557, 0, -0.297882932, 0.4047204695, 0.8645617968, 0, 0.8269149119,
    0.5619014932, 0.0218732801, 0, 65.6043682658, -3.7328402905, -16.8650755387, 1,
  ],
  '7enc': [
    0.8975055044, -0.4316347566, -0.0904174009, 0, 0.247274877, 0.3227849997, 0.9136000105, 0, -0.3651561375,
    -0.8423189899, 0.3964337454, 0, -189.7572972798, 304.0841220076, -411.5005782853, 1,
  ],
};

// Helper function to generate wwPDB links
function wwPDBLink(id) {
  return `https://doi.org/10.2210/pdb${id.toLowerCase()}/pdb`;
}

// Helper function to generate PDB download URLs
function pdbUrl(id) {
  return `https://www.ebi.ac.uk/pdbe/entry-files/download/${id.toLowerCase()}.bcif`;
}

// Helper function to apply transformation matrix to a structure
function applyTransform(structure, transformationId) {
  if (Superpositions[transformationId]) {
    const matrix = Superpositions[transformationId];
    // Extract rotation (3x3) from 4x4 matrix
    const rotation = [
      [matrix[0], matrix[1], matrix[2]],
      [matrix[4], matrix[5], matrix[6]],
      [matrix[8], matrix[9], matrix[10]],
    ];
    // Extract translation from 4x4 matrix
    const translation = [matrix[12], matrix[13], matrix[14]];

    return structure.transform({ rotation, translation });
  }
  return structure;
}

// Helper function to create and load a structure
function loadStructure(builder, id) {
  let structure = builder
    .download({ url: pdbUrl(id) })
    .parse({ format: 'bcif' })
    .modelStructure();

  // Apply transformation if available
  if (Superpositions[id]) {
    structure = applyTransform(structure, id);
  }

  return structure;
}

// Helper function to select and style structure components
function selectAndStyle(structure, options) {
  const { color, opacity = 1.0, selector = 'polymer', representationType = 'cartoon' } = options;

  const component = structure.component({ selector });
  const representation = component.representation({ type: representationType });
  representation.color({ color });

  if (opacity !== 1.0) {
    representation.opacity({ opacity });
  }

  return { component, representation };
}

// Helper function to add labels to structures
function addLabel(structure, selector, text) {
  structure.component({ selector }).label({ text });
}

// Helper function to decode color for mol* custom color themes
function decodeColor(color) {
  // Remove '#' if present
  const hex = color.replace('#', '');
  // Convert hex to RGB (0-1 range)
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  return [r, g, b];
}

// Helper function to create surface representations
function createSurface(structure, selector, carbonColor) {
  const component = structure.component({ selector });

  const colorThemeParams = carbonColor
    ? { carbonColor: { name: 'uniform', params: { value: decodeColor(carbonColor) } } }
    : { carbonColor: { name: 'element-symbol', params: {} } };

  const representation = component.representation({ type: 'surface' });
  representation.color({
    custom: {
      molstar_color_theme_name: 'element-symbol',
      molstar_color_theme_params: colorThemeParams,
    },
  });
  representation.opacity({ opacity: 0.33 });

  return component;
}

// Helper function to draw interaction lines (hydrogen bonds, etc.)
function drawInteraction(primitives, start, end, label, color = '#4289B5') {
  primitives.tube({
    start,
    end,
    color,
    tooltip: label,
    radius: 0.1,
    dash_length: 0.1,
  });
}

// Helper function to show binding site residues
function showBindingSite(structure, residues, options = {}) {
  const color = options.color || '#5B53A4';
  const labelSize = options.label_size || 1.5;
  const labelColor = options.label_color || color;

  const selectors = residues.map((r) => r.selector);

  const component = structure.component({ selector: selectors });
  const representation = component.representation({ type: 'ball_and_stick' });
  representation.color({
    custom: {
      molstar_color_theme_name: 'element-symbol',
      molstar_color_theme_params: {
        carbonColor: { name: 'uniform', params: { value: decodeColor(color) } },
      },
    },
  });

  const primitives = structure.primitives();
  residues.forEach((residue) => {
    primitives.label({
      position: residue.selector,
      text: residue.label,
      label_color: labelColor,
      label_size: labelSize,
    });
  });
}

// Common event handlers
function onSceneChange(sceneKey) {
  console.log('Transitioning to scene:', sceneKey);
}

// Scene transition with fade effect
function transitionToScene(sceneKey, duration = 1500) {
  console.log(`Transitioning to ${sceneKey} over ${duration}ms`);
}

console.log('TBP Story global functions loaded successfully');
