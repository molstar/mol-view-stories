// Scene: TBP Non-Polar Interactions [5/5]
// Structure: 1CDW showing hydrophobic and van der Waals interactions with surface

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

// Create surface representations for DNA chains to show interactions
createSurface(structure_1cdw, { label_asym_id: 'A' }, Colors['1cdw-2']);
createSurface(structure_1cdw, { label_asym_id: 'B' }, Colors['1cdw-2']);
