// Scene: TBP Arginine [2/5]
// Structure: 1CDW showing arginine residues interacting with DNA phosphates

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

// Arg192 interactions and label
addLabel(structure_1cdw, { label_asym_id: 'C', label_seq_id: 38 }, 'Arg192');
drawInteraction(
  primitives,
  { label_asym_id: 'C', label_seq_id: 38, label_atom_id: 'NH2' },
  { label_asym_id: 'B', label_seq_id: 7, label_atom_id: 'OP1' },
  'H-bond'
);
drawInteraction(
  primitives,
  { label_asym_id: 'C', label_seq_id: 38, label_atom_id: 'NH2' },
  { label_asym_id: 'B', label_seq_id: 6, label_atom_id: "O3'" },
  'H-bond'
);
drawInteraction(
  primitives,
  { label_asym_id: 'C', label_seq_id: 38, label_atom_id: 'NH1' },
  { label_asym_id: 'B', label_seq_id: 7, label_atom_id: 'OP1' },
  'H-bond'
);

// Arg199 interactions and label
addLabel(structure_1cdw, { label_asym_id: 'C', label_seq_id: 45 }, 'Arg199');
drawInteraction(
  primitives,
  { label_asym_id: 'C', label_seq_id: 45, label_atom_id: 'NE' },
  { label_asym_id: 'B', label_seq_id: 8, label_atom_id: 'OP1' },
  'H-bond'
);
drawInteraction(
  primitives,
  { label_asym_id: 'C', label_seq_id: 45, label_atom_id: 'NH2' },
  { label_asym_id: 'B', label_seq_id: 8, label_atom_id: 'OP1' },
  'H-bond'
);

// Arg290 interactions and label
addLabel(structure_1cdw, { label_asym_id: 'C', label_seq_id: 136 }, 'Arg290');
drawInteraction(
  primitives,
  { label_asym_id: 'C', label_seq_id: 136, label_atom_id: 'NH1' },
  { label_asym_id: 'A', label_seq_id: 8, label_atom_id: 'OP1' },
  'H-bond'
);

// Arg204 interactions and label
addLabel(structure_1cdw, { label_asym_id: 'C', label_seq_id: 50 }, 'Arg204');
drawInteraction(
  primitives,
  { label_asym_id: 'B', label_seq_id: 9, label_atom_id: 'OP1' },
  { label_asym_id: 'C', label_seq_id: 50, label_atom_id: 'NH1' },
  'H-bond'
);
drawInteraction(
  primitives,
  { label_asym_id: 'B', label_seq_id: 9, label_atom_id: 'OP1' },
  { label_asym_id: 'C', label_seq_id: 50, label_atom_id: 'NH2' },
  'H-bond'
);

// Show interacting residues as ball-and-stick
const interactingResidues = [
  { label_asym_id: 'C', label_seq_id: 38 },
  { label_asym_id: 'C', label_seq_id: 45 },
  { label_asym_id: 'C', label_seq_id: 136 },
  { label_asym_id: 'C', label_seq_id: 50 }
];

const component = structure_1cdw.component({ selector: interactingResidues });
const representation = component.representation({ type: 'ball_and_stick' });
representation.color({
  custom: {
    molstar_color_theme_name: 'element-symbol',
    molstar_color_theme_params: { carbonColor: { name: 'element-symbol', params: {} } }
  }
});
