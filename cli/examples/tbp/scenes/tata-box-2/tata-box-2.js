// Scene: TBP Phenylalanine [3/5]
// Structure: 1CDW showing phenylalanine residues that cause DNA kinks

// Load human TBP-DNA complex (1CDW)
const structure_1cdw = loadStructure(builder, '1cdw');

// Show protein chain C and DNA chains A/B with standard coloring
setup1CDWScene(structure_1cdw, Colors['1cdw'], Colors['1cdw-2']);

// Show phenylalanine binding site residues
showBindingSite(
  structure_1cdw,
  [
    { selector: { label_asym_id: 'C', label_seq_id: 39 }, label: 'Phe193' },
    { selector: { label_asym_id: 'C', label_seq_id: 56 }, label: 'Phe210' },
    { selector: { label_asym_id: 'C', label_seq_id: 130 }, label: 'Phe284' },
    { selector: { label_asym_id: 'C', label_seq_id: 147 }, label: 'Phe301' },
  ],
  { color: Colors['1cdw'] }
);
