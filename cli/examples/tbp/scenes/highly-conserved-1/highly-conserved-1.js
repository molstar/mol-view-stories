// Scene: TBP Highly Conserved in Eukaryotes [1/2]
// Structures: 1CDW (human) and 1VTL (A. thaliana) TBP bound to DNA

// Load human TBP-DNA complex (1CDW)
const structure_1cdw = loadStructure(builder, '1cdw');

// Show protein in one color
selectAndStyle(structure_1cdw, {
  color: Colors['1cdw'],
  selector: 'protein',
});

// Show nucleic acids with transparency and label
const { component: dnaComponent } = selectAndStyle(structure_1cdw, {
  color: Colors['1cdw'],
  selector: 'nucleic',
  opacity: 0.5,
});
dnaComponent.label({ text: 'DNA' });

// Add label to human TBP using a range to adjust font size
addLabel(structure_1cdw, { label_asym_id: 'C', beg_label_seq_id: 160, end_label_seq_id: 177 }, 'TBP (H. sapiens)');

// Load A. thaliana TBP-DNA complex (1VTL)
const structure_1vtl = loadStructure(builder, '1vtl');

// Show protein chain E
selectAndStyle(structure_1vtl, {
  color: Colors['1vtl'],
  selector: { label_asym_id: 'E' },
});

// Show DNA chains with transparency
showDNAChains(structure_1vtl, ['A', 'B'], Colors['1vtl'], 0.5);

// Add label to A. thaliana TBP
addLabel(structure_1vtl, { label_asym_id: 'E', beg_label_seq_id: 75, end_label_seq_id: 92 }, 'TBP (A. thaliana)');
