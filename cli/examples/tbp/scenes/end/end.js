// Scene: The End
// Structure: 7ENC - Pol II pre-initiation complex (same as previous scene)

// Load the pre-initiation complex structure (7ENC)
const structure_7enc = loadStructure(builder, '7enc');

// Show TBP in main color and label it
const { component: tbpComponent } = selectAndStyle(structure_7enc, {
  color: Colors['7enc'],
  selector: { label_asym_id: 'CB' },
});
tbpComponent.label({ text: 'TBP' });

// Show DNA strands in secondary color
selectAndStyle(structure_7enc, {
  color: Colors['7enc-2'],
  selector: { label_asym_id: 'GB' },
});

selectAndStyle(structure_7enc, {
  color: Colors['7enc-2'],
  selector: { label_asym_id: 'HB' },
});

// Show other components with transparency
selectAndStyle(structure_7enc, {
  color: Colors['7enc-3'],
  opacity: 0.5,
});

// Add labels for major components using primitives
const primitives = structure_7enc.primitives();

// Define labels for complex components
const componentLabels = [
  { position: { label_entity_id: '57' }, text: 'pol II', size: 20, color: Colors['7enc'] },
  { position: { label_entity_id: '53' }, text: 'DNA', size: 20, color: Colors['7enc-2'] },
  { position: { label_entity_id: '21' }, text: 'mediator', size: 20, color: Colors['7enc-3'] },
  { position: { label_entity_id: '42' }, text: 'TBP-associated factors (TAFs)', size: 20, color: Colors['7enc-4'] },
  { position: [100, 150, 0], text: 'PIC', size: 30, color: Colors['1vok'] },
];

// Add all labels
componentLabels.forEach((labelData) => {
  primitives.label({
    position: labelData.position,
    text: labelData.text,
    label_size: labelData.size,
    label_color: labelData.color,
  });
});
