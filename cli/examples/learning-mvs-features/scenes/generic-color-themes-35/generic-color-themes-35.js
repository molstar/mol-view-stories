// Generic color themes: B-factor

const struct = builder
  .download({ url: './AF-Q5ZSL3-F1-model_v6.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure();
const repr = struct
  .component()
  .representation({ type: 'cartoon' });
  
repr.colorFromSource({ 
  schema: 'all_atomic', 
  category_name: 'atom_site', 
  field_name: 'B_iso_or_equiv', 
  palette: { 
    kind: 'discrete',
    mode: 'absolute',
    colors: [
      ['#0053d6', 90, 100],  // dark blue
      ['#65cbf3', 70, 90],   // light blue
      ['#ffdb13', 50, 70],   // yellow
      ['#ff7d45', 0, 50],    // orange
    ],
  },
});

struct.component({ selector: 'all' }).focus({ direction: 
[0.7, 0.7, 0.2], up: [0.7, -0.7, 0.4] });