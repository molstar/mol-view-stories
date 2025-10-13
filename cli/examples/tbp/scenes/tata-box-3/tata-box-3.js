// Scene: TBP H-Bonds in Minor Groove [4/5]
// Structure: 1CDW showing hydrogen bond interactions in the minor groove

// Load human TBP-DNA complex (1CDW)
const structure_1cdw = loadStructure(builder, '1cdw');

// Show protein chain C in main color
selectAndStyle(structure_1cdw, {
  color: Colors['1cdw'],
  selector: { label_asym_id: 'C' }
});

// Show DNA chains in a secondary color
selectAndStyle(structure_1cdw, {
  color: Colors['1cdw-2'],
  selector: { label_asym_id: 'A' }
});

selectAndStyle(structure_1cdw, {
  color: Colors['1cdw-2'],
  selector: { label_asym_id: 'B' }
});

// Get primitives for drawing interactions
const primitives = structure_1cdw.primitives();

// Asn163 interactions and label
addLabel(structure_1cdw, { label_asym_id: 'C', label_seq_id: 9 }, 'Asn163');
drawInteraction(
  primitives,
  { label_asym_id: 'C', label_seq_id: 9, label_atom_id: 'ND2' },
  { label_asym_id: 'B', label_seq_id: 8, label_atom_id: 'O2' },
  'H-bond'
);
drawInteraction(
  primitives,
  { label_asym_id: 'B', label_seq_id: 9, label_atom_id: 'O2' },
  { label_asym_id: 'C', label_seq_id: 9, label_atom_id: 'ND2' },
  'H-bond'
);

// Thr309 interactions and label
addLabel(structure_1cdw, { label_asym_id: 'C', label_seq_id: 155 }, 'Thr309');
drawInteraction(
  primitives,
  { label_asym_id: 'C', label_seq_id: 155, label_atom_id: 'OG1' },
  { label_asym_id: 'A', label_seq_id: 8, label_atom_id: 'N3' },
  'H-bond'
);

// Show Asn253 binding site (shown in gray)
showBindingSite(structure_1cdw, [
  { selector: { label_asym_id: 'C', label_seq_id: 99 }, label: 'Asn253' }
], { color: 'gray', label_color: Colors['1cdw'] });

// Show other interacting residues as ball-and-stick
const interactingResidues = [
  { label_asym_id: 'C', label_seq_id: 9 },
  { label_asym_id: 'C', label_seq_id: 155 }
];

const component = structure_1cdw.component({ selector: interactingResidues });
const representation = component.representation({ type: 'ball_and_stick' });
representation.color({
  custom: {
    molstar_color_theme_name: 'element-symbol',
    molstar_color_theme_params: { carbonColor: { name: 'element-symbol', params: {} } }
  }
});
