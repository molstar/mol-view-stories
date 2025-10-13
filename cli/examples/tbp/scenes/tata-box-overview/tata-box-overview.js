// Scene: TBP Binding to TATA Box [1/5]
// Structure: 1CDW (human TBP-DNA complex) showing the overall binding mode

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
