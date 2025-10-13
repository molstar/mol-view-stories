// Scene: TATA-Binding Protein (intro)
// Structure: 1VOK - TBP from Arabidopsis thaliana (apo form)

const structure = loadStructure(builder, '1vok');

// Show the protein with sequence-id coloring
const component = structure.component({ selector: { label_asym_id: 'A' } });
const representation = component.representation({ type: 'cartoon' });
representation.color({
  custom: {
    molstar_color_theme_name: 'sequence-id',
    molstar_color_theme_params: { carbonColor: { name: 'sequence-id', params: {} } },
  }
});

// Add label to the protein
structure.primitives().label({
  position: { label_asym_id: 'A', label_seq_id: 88, label_atom_id: 'OD2' },
  text: 'TATA-Binding Protein',
  label_size: 5,
  label_color: Colors['1vok']
});
