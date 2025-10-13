// Scene: TBP H-Bonds in Minor Groove [4/5]
// Structure: 1CDW showing hydrogen bond interactions in the minor groove

// Load human TBP-DNA complex (1CDW)
const structure_1cdw = loadStructure(builder, '1cdw');

// Show protein chain C and DNA chains A/B with standard coloring
setup1CDWScene(structure_1cdw, Colors['1cdw'], Colors['1cdw-2']);

// Get primitives for drawing interactions
const primitives = structure_1cdw.primitives();

// Define hydrogen bond interactions in the minor groove
const hBondInteractions = [
  {
    label: 'Asn163',
    seqId: 9,
    bonds: [
      { from: 'ND2', to: { chain: 'B', seq: 8, atom: 'O2' } },
      { from: 'ND2', to: { chain: 'B', seq: 9, atom: 'O2' } },
    ],
  },
  {
    label: 'Thr309',
    seqId: 155,
    bonds: [{ from: 'OG1', to: { chain: 'A', seq: 8, atom: 'N3' } }],
  },
];

// Draw labels and H-bonds for Asn163 and Thr309
const residueSelectors = [];
hBondInteractions.forEach((interaction) => {
  addLabel(structure_1cdw, { label_asym_id: 'C', label_seq_id: interaction.seqId }, interaction.label);

  interaction.bonds.forEach((bond) => {
    drawInteraction(
      primitives,
      { label_asym_id: 'C', label_seq_id: interaction.seqId, label_atom_id: bond.from },
      { label_asym_id: bond.to.chain, label_seq_id: bond.to.seq, label_atom_id: bond.to.atom },
      'H-bond'
    );
  });

  residueSelectors.push({ label_asym_id: 'C', label_seq_id: interaction.seqId });
});

// Show Asn253 binding site (shown in gray)
showBindingSite(structure_1cdw, [{ selector: { label_asym_id: 'C', label_seq_id: 99 }, label: 'Asn253' }], {
  color: 'gray',
  label_color: Colors['1cdw'],
});

// Show Asn163 and Thr309 as ball-and-stick
showInteractingResidues(structure_1cdw, residueSelectors);
