const struct = builder
  .download({ url: 'https://wwwdev.ebi.ac.uk/pdbe/entry-files/download/1og5.bcif' })
  .parse({ format: 'bcif' })
  .assemblyStructure({ assembly_id: '1' });
const polymer = struct
  .component({ ref: 'polymer', selector: 'polymer' })
  .representation({ type: 'cartoon' });
const ligandHEC = struct
  .component({ ref: 'hec', selector: { label_comp_id: 'HEC' } })
  .representation({ type: 'surface' })
  .color({ color: '#ffce2d' });
const ligandSWF = struct
  .component({ ref: 'swf', selector: { label_comp_id: 'SWF' } })
  .representation({ type: 'surface' })
  .color({ color: '#2d5eff' });

builder.camera({
  target: [-22.0, 78.9, 30.4],
  position: [-80, 110, 30.4],
  up: [0, 1, 0],
});

const snapshotC = builder.getSnapshot({
  key: 'snapshot_C',
  title: 'Snapshot C',
  description:
    'Molecules:\n\n' + 
    + '- [Cytochrome P450 2C9](!highlight-refs=polymer&focus-refs=polymer)\n'
    + '- [Heme C](!highlight-refs=hec&focus-refs=hec)\n'
    + '- [S-warfarin](!highlight-refs=swf&focus-refs=swf)\n',
  linger_duration_ms: 5000,
  transition_duration_ms: 1000,
});
