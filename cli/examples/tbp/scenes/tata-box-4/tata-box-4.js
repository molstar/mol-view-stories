// Scene: TBP Non-Polar Interactions [5/5]
// Structure: 1CDW showing hydrophobic and van der Waals interactions with surface

// Load human TBP-DNA complex (1CDW)
const structure_1cdw = loadStructure(builder, '1cdw');

// Show protein chain C and DNA chains A/B with standard coloring
setup1CDWScene(structure_1cdw, Colors['1cdw'], Colors['1cdw-2']);

// Create surface representations for DNA chains to show non-polar interactions
createSurface(structure_1cdw, { label_asym_id: 'A' }, Colors['1cdw-2']);
createSurface(structure_1cdw, { label_asym_id: 'B' }, Colors['1cdw-2']);
