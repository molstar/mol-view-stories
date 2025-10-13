// Scene: TBP Minor Groove [2/2]
// Structures: 1CDW (human) and 1VTL (A. thaliana) showing TATA box interaction

// Load human TBP-DNA complex (1CDW)
const structure_1cdw = loadStructure(builder, '1cdw');

// Show protein
selectAndStyle(structure_1cdw, {
  color: Colors['1cdw'],
  selector: 'protein',
});

// Show nucleic acids with transparency
selectAndStyle(structure_1cdw, {
  color: Colors['1cdw'],
  selector: 'nucleic',
  opacity: 0.5,
});

// Label individual nucleotides in the TATA box
const tataPositions = [5, 6, 7, 8, 9, 10];
const tataLabels = ['T', 'A', 'T', 'A', 'A', 'A'];
tataPositions.forEach((pos, idx) => {
  addLabel(structure_1cdw, { label_asym_id: 'A', label_seq_id: pos }, tataLabels[idx]);
});

// Load A. thaliana TBP-DNA complex (1VTL)
const structure_1vtl = loadStructure(builder, '1vtl');

// Show protein chain E
selectAndStyle(structure_1vtl, {
  color: Colors['1vtl'],
  selector: { label_asym_id: 'E' },
});

// Show DNA chains with transparency
showDNAChains(structure_1vtl, ['A', 'B'], Colors['1vtl'], 0.5);
