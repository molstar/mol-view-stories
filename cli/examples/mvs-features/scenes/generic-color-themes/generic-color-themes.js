const struct = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/9rxg.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure({ });

struct.component().focus();

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
    field_name: 'label_comp_id',
    palette: { 
      kind: 'categorical', 
      colors: 'ResidueName',
      missing_color: 'yellow'
    },
  });
}