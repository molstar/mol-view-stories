// Scene: TBP Minor Groove [2/2]
// Structures: 1CDW (human) and 1VTL (A. thaliana) showing TATA box interaction

// Load human TBP-DNA complex (1CDW)
const structure_1cdw = loadStructure(builder, '1cdw');

// Show protein
selectAndStyle(structure_1cdw, {
  color: Colors['1cdw'],
  selector: 'protein'
});

// Show nucleic acids with transparency
selectAndStyle(structure_1cdw, {
  color: Colors['1cdw'],
  selector: 'nucleic',
  opacity: 0.5
});

// Label individual nucleotides in the TATA box
addLabel(structure_1cdw, { label_asym_id: 'A', label_seq_id: 5 }, 'T');
addLabel(structure_1cdw, { label_asym_id: 'A', label_seq_id: 6 }, 'A');
addLabel(structure_1cdw, { label_asym_id: 'A', label_seq_id: 7 }, 'T');
addLabel(structure_1cdw, { label_asym_id: 'A', label_seq_id: 8 }, 'A');
addLabel(structure_1cdw, { label_asym_id: 'A', label_seq_id: 9 }, 'A');
addLabel(structure_1cdw, { label_asym_id: 'A', label_seq_id: 10 }, 'A');

// Load A. thaliana TBP-DNA complex (1VTL)
const structure_1vtl = loadStructure(builder, '1vtl');

// Show protein chain E
selectAndStyle(structure_1vtl, {
  color: Colors['1vtl'],
  selector: { label_asym_id: 'E' }
});

// Show DNA chains with transparency
selectAndStyle(structure_1vtl, {
  color: Colors['1vtl'],
  selector: { label_asym_id: 'A' },
  opacity: 0.5
});

selectAndStyle(structure_1vtl, {
  color: Colors['1vtl'],
  selector: { label_asym_id: 'B' },
  opacity: 0.5
});
