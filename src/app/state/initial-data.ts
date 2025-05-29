export interface MolecularVisualizationConfig {
  proteinColor: string;
  ligandColor: string;
  ligandLabel?: string;
}

export const createInitialJavaScriptCode = (
  config: MolecularVisualizationConfig,
): string => {
  return `// Create a builder for molecular visualization
// Define the structure with full type support
const structure = builder
  .download({url: 'https://www.ebi.ac.uk/pdbe/entry-files/1cbs.bcif'})
  .parse({ format: 'bcif' })
  .modelStructure({});

// Add components and representations
structure
  .component({ selector: 'polymer' })
  .representation({ type: 'cartoon' })
  .color({ color: '${config.proteinColor}' });

// Add ligand
structure
  .component({ selector: 'ligand' })
  .label({ text: '${config.ligandLabel || "Retinoic Acid"}' })
  .focus({})
  .representation({ type: 'ball_and_stick' })
  .color({ color: '${config.ligandColor}' });
`;
};

// Pre-configured initial data
export const init_js_code = createInitialJavaScriptCode({
  proteinColor: "green",
  ligandColor: "#cc3399",
  ligandLabel: "Retinoic Acid",
});

export const init_js_code_02 = createInitialJavaScriptCode({
  proteinColor: "blue",
  ligandColor: "orange",
  ligandLabel: "Retinoic Acid",
});
