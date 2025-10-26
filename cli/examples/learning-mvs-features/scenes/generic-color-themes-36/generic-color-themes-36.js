// Generic color themes: B-factor

const struct = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1tqn.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure();
const polymer = struct
  .component({ selector: 'polymer' })
  .representation({ type: 'cartoon' });
const ligand = struct
  .component({ selector: 'ligand' })
  .representation({ type: 'ball_and_stick' });
  
for (const repr of [polymer, ligand]) {
  repr.colorFromSource({ 
    schema: 'all_atomic', 
    category_name: 'atom_site', 
    field_name: 'B_iso_or_equiv', 
    palette: { 
      kind: 'continuous',
      mode: 'normalized',
      value_domain: [0, 100],
      colors: 'Plasma',
    },
  });
}

struct.component({ selector: 'all' }).focus({ direction: [-1, 0, 0] });