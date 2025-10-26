const struct = builder
  .download({ url: 'https://wwwdev.ebi.ac.uk/pdbe/entry-files/download/1og5.bcif' })
  .parse({ format: 'bcif' })
  .assemblyStructure({ assembly_id: '1' });
const polymer = struct
  .component({ selector: 'polymer' })
  .representation({ type: 'cartoon' });
const ligandHEC = struct
  .component({ selector: { label_comp_id: 'HEC' } })
  .representation({ type: 'surface' })
  .color({ color: '#ffce2d' });
const ligandSWF = struct
  .component({ selector: { label_comp_id: 'SWF' } })
  .representation({ type: 'surface' })
  .color({ color: '#2d5eff' });


builder.camera({
  target: [-22.0, 78.9, 30.4],
  position: [-80, 110, 30.4],
  up: [0, 1, 0],
});

const snapshotB = builder.getSnapshot({
  key: 'snapshot_B',
  title: 'Snapshot B',
  description:
    'This is **Snapshot B**.\n\n'
    + '[Go to Snapshot A](#snapshot_A).',
  linger_duration_ms: 5000,
  transition_duration_ms: 1000,
});
