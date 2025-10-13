// Scene: TBP Binding to TATA Box [1/5]
// Structure: 1CDW (human TBP-DNA complex) showing the overall binding mode

// Load human TBP-DNA complex (1CDW)
const structure_1cdw = loadStructure(builder, '1cdw');

// Show protein chain C and DNA chains A/B with standard coloring
setup1CDWScene(structure_1cdw, Colors['1cdw'], Colors['1cdw-2']);
