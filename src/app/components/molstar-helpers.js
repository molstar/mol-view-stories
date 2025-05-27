/**
 * Molstar MVS Helper Utilities
 * Provides enhanced support and helper functions for working with Molstar MVSData builder
 */

// Common PDB URLs for quick access
export const PDB_URLS = {
  EBI_MMCIF: (pdbId) =>
    `https://www.ebi.ac.uk/pdbe/entry-files/download/${pdbId.toLowerCase()}_updated.cif`,
  EBI_BCIF: (pdbId) =>
    `https://www.ebi.ac.uk/pdbe/entry-files/${pdbId.toLowerCase()}.bcif`,
  RCSB_MMCIF: (pdbId) =>
    `https://files.rcsb.org/download/${pdbId.toUpperCase()}.cif`,
  RCSB_PDB: (pdbId) =>
    `https://files.rcsb.org/download/${pdbId.toUpperCase()}.pdb`,
};

// Common color presets
export const COLORS = {
  // Basic colors
  RED: "#ff0000",
  GREEN: "#00ff00",
  BLUE: "#0000ff",
  YELLOW: "#ffff00",
  CYAN: "#00ffff",
  MAGENTA: "#ff00ff",
  WHITE: "#ffffff",
  BLACK: "#000000",

  // Protein visualization colors
  CARBON: "#909090",
  NITROGEN: "#3050f8",
  OXYGEN: "#ff0d0d",
  SULFUR: "#ffff30",
  PHOSPHORUS: "#ff8000",

  // Custom scheme colors
  PROTEIN: "#4a90e2",
  NUCLEIC: "#f5a623",
  LIGAND: "#cc3399",
  WATER: "#7ed321",
  ION: "#9013fe",
};

/**
 * Helper function to create a basic protein visualization
 */
export function createProteinVisualization(pdbId, options = {}) {
  const {
    proteinColor = COLORS.PROTEIN,
    ligandColor = COLORS.LIGAND,
    showWater = false,
  } = options;

  return `
// Create a builder for molecular visualization
const builder = molstar.PluginExtensions.mvs.MVSData.createBuilder();

// Download and parse structure
const structure = builder
    .download({ url: '${PDB_URLS.EBI_BCIF(pdbId)}' })
    .parse({ format: 'bcif' })
    .modelStructure({});

// Add protein representation
structure
    .component({ selector: 'protein' })
    .representation({ type: 'cartoon' })
    .color({ color: '${proteinColor}' });

// Add ligand representation
structure
    .component({ selector: 'ligand' })
    .representation({ type: 'ball_and_stick' })
    .color({ color: '${ligandColor}' });

${
  showWater
    ? `
// Add water representation
structure
    .component({ selector: 'water' })
    .representation({ type: 'point' })
    .color({ color: '${COLORS.WATER}' });
`
    : ""
}

// Get the final state
const mvsData = builder.getState();
  `.trim();
}

/**
 * Helper function to create a nucleic acid visualization
 */
export function createNucleicAcidVisualization(pdbId, options = {}) {
  const { nucleicColor = COLORS.NUCLEIC, proteinColor = COLORS.PROTEIN } =
    options;

  return `
// Create a builder for nucleic acid visualization
const builder = molstar.PluginExtensions.mvs.MVSData.createBuilder();

// Download and parse structure
const structure = builder
    .download({ url: '${PDB_URLS.EBI_BCIF(pdbId)}' })
    .parse({ format: 'bcif' })
    .modelStructure({});

// Add nucleic acid representation
structure
    .component({ selector: 'nucleic' })
    .representation({ type: 'cartoon' })
    .color({ color: '${nucleicColor}' });

// Add protein representation if present
structure
    .component({ selector: 'protein' })
    .representation({ type: 'cartoon' })
    .color({ color: '${proteinColor}' });

// Get the final state
const mvsData = builder.getState();
  `.trim();
}

/**
 * Helper function to create a surface representation
 */
export function createSurfaceVisualization(pdbId, options = {}) {
  const { surfaceColor = COLORS.BLUE, transparency = 0.5 } = options;

  return `
// Create a builder for surface visualization
const builder = molstar.PluginExtensions.mvs.MVSData.createBuilder();

// Download and parse structure
const structure = builder
    .download({ url: '${PDB_URLS.EBI_BCIF(pdbId)}' })
    .parse({ format: 'bcif' })
    .modelStructure({});

// Add surface representation
structure
    .component({ selector: 'polymer' })
    .representation({
        type: 'surface',
        params: { alpha: ${transparency} }
    })
    .color({ color: '${surfaceColor}' });

// Get the final state
const mvsData = builder.getState();
  `.trim();
}

/**
 * Helper function to create a multi-component visualization with focus
 */
export function createFocusedVisualization(pdbId, focusSelector, options = {}) {
  const {
    focusColor = COLORS.LIGAND,
    contextColor = COLORS.PROTEIN,
    focusLabel = "Focus Region",
  } = options;

  return `
// Create a builder for focused visualization
const builder = molstar.PluginExtensions.mvs.MVSData.createBuilder();

// Download and parse structure
const structure = builder
    .download({ url: '${PDB_URLS.EBI_BCIF(pdbId)}' })
    .parse({ format: 'bcif' })
    .modelStructure({});

// Add context (background) representation
structure
    .component({ selector: 'polymer' })
    .representation({ type: 'cartoon' })
    .color({ color: '${contextColor}' });

// Add focused component with label and focus
structure
    .component({ selector: '${focusSelector}' })
    .label({ text: '${focusLabel}' })
    .focus({})
    .representation({ type: 'ball_and_stick' })
    .color({ color: '${focusColor}' });

// Get the final state
const mvsData = builder.getState();
  `.trim();
}

/**
 * Helper function to create a color-by-chain visualization
 */
export function createChainColorVisualization(
  pdbId,
  representationType = "cartoon",
) {
  return `
// Create a builder for chain-colored visualization
const builder = molstar.PluginExtensions.mvs.MVSData.createBuilder();

// Download and parse structure
const structure = builder
    .download({ url: '${PDB_URLS.EBI_BCIF(pdbId)}' })
    .parse({ format: 'bcif' })
    .modelStructure({});

// Add representation with chain coloring
structure
    .component({ selector: 'polymer' })
    .representation({ type: '${representationType}' })
    .color({ theme: 'chain-id' });

// Get the final state
const mvsData = builder.getState();
  `.trim();
}

/**
 * Common example snippets
 */
export const EXAMPLES = {
  BASIC_PROTEIN: createProteinVisualization("1cbs"),
  NUCLEIC_ACID: createNucleicAcidVisualization("1bna"),
  SURFACE: createSurfaceVisualization("1cbs"),
  FOCUSED_LIGAND: createFocusedVisualization("1cbs", "ligand", {
    focusLabel: "Retinoic Acid",
  }),
  CHAIN_COLORS: createChainColorVisualization("1cbs"),
};

/**
 * Type-safe builder factory function
 */
export function createMVSBuilder() {
  if (typeof window !== "undefined" && window.molstar) {
    return window.molstar.PluginExtensions.mvs.MVSData.createBuilder();
  }
  throw new Error(
    "Molstar is not available. Make sure it is loaded before calling this function.",
  );
}
