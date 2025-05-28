export const init_js_code = `
// Create a builder for molecular visualization
const builder = molstar.PluginExtensions.mvs.MVSData.createBuilder();

// Define the structure with full type support
const structure = builder
.download({url: 'https://www.ebi.ac.uk/pdbe/entry-files/1cbs.bcif'})
.parse({ format: 'bcif' })
.modelStructure({});

// Add components and representations
structure
.component({ selector: 'polymer' })
.representation({ type: 'cartoon' })
.color({ color: 'green' });

// Add ligand
structure
.component({ selector: 'ligand' })
.label({ text: 'Retinoic Acid' })
.focus({})
.representation({ type: 'ball_and_stick' })
.color({color: '#cc3399',
});

const mvsData = builder.getState();
`;

export const init_js_code_02 = `
// Create a builder for molecular visualization
const builder = molstar.PluginExtensions.mvs.MVSData.createBuilder();

// Define the structure with full type support
const structure = builder
.download({url: 'https://www.ebi.ac.uk/pdbe/entry-files/1cbs.bcif'})
.parse({ format: 'bcif' })
.modelStructure({});

// Add components and representations
structure
.component({ selector: 'polymer' })
.representation({ type: 'cartoon' })
.color({ color: 'blue' });

// Add ligand
structure
.component({ selector: 'ligand' })
.label({ text: 'Retinoic Acid' })
.focus({})
.representation({ type: 'ball_and_stick' })
.color({color: 'orange',
});

const mvsData = builder.getState();
`;