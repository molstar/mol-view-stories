// Create a builder for molecular visualization
// Define the structure with full type support
const structure = builder
  .download({ url: "https://www.ebi.ac.uk/pdbe/entry-files/1cbs.bcif" })
  .parse({ format: "bcif" })
  .modelStructure({});

// Add components and representations
structure
  .component({ selector: "polymer" })
  .representation({ type: "cartoon" })
  .color({ color: "green" });

// Add ligand
structure
  .component({ selector: "ligand" })
  .label({ text: "Retinoic Acid" })
  .focus({})
  .representation({ type: "ball_and_stick" })
  .color({ color: "#cc3399" });
