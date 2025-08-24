// Create a builder for molecular visualization using local PDB file
// Define the structure with the local asset by name
const structure = builder
  .download({ url: "1fab.pdb" })
  .parse({ format: "pdb" })
  .modelStructure({});

// Add components and representations
structure
  .component({ selector: "polymer" })
  .representation({ type: "cartoon" })
  .color({ color: "blue" });

// Add ligand if present
structure
  .component({ selector: "ligand" })
  .label({ text: "Local Structure" })
  .focus({})
  .representation({ type: "ball_and_stick" })
  .color({ color: "orange" });
