// Scene: TBP Arginine [2/5]
// Structure: 1CDW showing arginine residues interacting with DNA phosphates

// Load human TBP-DNA complex (1CDW)
const structure_1cdw = loadStructure(builder, '1cdw');

// Show protein chain C and DNA chains A/B with standard coloring
setup1CDWScene(structure_1cdw, Colors['1cdw'], Colors['1cdw-2']);

// Get primitives for drawing interactions
const primitives = structure_1cdw.primitives();

// Define arginine interactions
const arginineInteractions = [
  {
    label: 'Arg192',
    seqId: 38,
    bonds: [
      { from: 'NH2', to: { chain: 'B', seq: 7, atom: 'OP1' } },
      { from: 'NH2', to: { chain: 'B', seq: 6, atom: "O3'" } },
      { from: 'NH1', to: { chain: 'B', seq: 7, atom: 'OP1' } },
    ],
  },
  {
    label: 'Arg199',
    seqId: 45,
    bonds: [
      { from: 'NE', to: { chain: 'B', seq: 8, atom: 'OP1' } },
      { from: 'NH2', to: { chain: 'B', seq: 8, atom: 'OP1' } },
    ],
  },
  {
    label: 'Arg290',
    seqId: 136,
    bonds: [{ from: 'NH1', to: { chain: 'A', seq: 8, atom: 'OP1' } }],
  },
  {
    label: 'Arg204',
    seqId: 50,
    bonds: [
      { from: 'NH1', to: { chain: 'B', seq: 9, atom: 'OP1' } },
      { from: 'NH2', to: { chain: 'B', seq: 9, atom: 'OP1' } },
    ],
  },
];

// Draw all arginine labels and interactions
const residueSelectors = [];
arginineInteractions.forEach((arg) => {
  // Add label
  addLabel(structure_1cdw, { label_asym_id: 'C', label_seq_id: arg.seqId }, arg.label);

  // Draw H-bonds
  arg.bonds.forEach((bond) => {
    drawInteraction(
      primitives,
      { label_asym_id: 'C', label_seq_id: arg.seqId, label_atom_id: bond.from },
      { label_asym_id: bond.to.chain, label_seq_id: bond.to.seq, label_atom_id: bond.to.atom },
      'H-bond'
    );
  });

  // Collect residue selector
  residueSelectors.push({ label_asym_id: 'C', label_seq_id: arg.seqId });
});

// Show all interacting residues as ball-and-stick
showInteractingResidues(structure_1cdw, residueSelectors);
