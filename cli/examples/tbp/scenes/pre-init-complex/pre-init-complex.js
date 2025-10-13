// Scene: TBP and Transcription Pre-Initiation Complex
// Structure: 7ENC - Pol II pre-initiation complex with TBP, mediator, and TAFs

// Load the pre-initiation complex structure (7ENC)
const structure_7enc = loadStructure(builder, '7enc');

// Show TBP in main color and label it
const { component: tbpComponent } = selectAndStyle(structure_7enc, {
  color: Colors['7enc'],
  selector: { label_asym_id: 'CB' }
});
tbpComponent.label({ text: 'TBP' });

// Show DNA strands in secondary color
selectAndStyle(structure_7enc, {
  color: Colors['7enc-2'],
  selector: { label_asym_id: 'GB' }
});

selectAndStyle(structure_7enc, {
  color: Colors['7enc-2'],
  selector: { label_asym_id: 'HB' }
});

// Show other components with transparency
selectAndStyle(structure_7enc, {
  color: Colors['7enc-3'],
  opacity: 0.5
});

// Add labels for major components using primitives
const primitives = structure_7enc.primitives();

primitives.label({
  position: { label_entity_id: '57' },
  text: 'pol II',
  label_size: 20,
  label_color: Colors['7enc']
});

primitives.label({
  position: { label_entity_id: '53' },
  text: 'DNA',
  label_size: 20,
  label_color: Colors['7enc-2']
});

primitives.label({
  position: { label_entity_id: '21' },
  text: 'mediator',
  label_size: 20,
  label_color: Colors['7enc-3']
});

primitives.label({
  position: { label_entity_id: '42' },
  text: 'TBP-associated factors (TAFs)',
  label_size: 20,
  label_color: Colors['7enc-4']
});

primitives.label({
  position: [100, 150, 0],
  text: 'PIC',
  label_size: 30,
  label_color: Colors['1vok']
});
