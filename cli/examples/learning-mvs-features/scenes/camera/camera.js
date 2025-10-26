const struct = builder
  .download({ url: 'https://wwwdev.ebi.ac.uk/pdbe/entry-files/download/1og5.bcif' })
  .parse({ format: 'bcif' })
  .assemblyStructure({ assembly_id: '1' });
const polymer = struct
  .component({ selector: 'polymer' })
  .representation({ type: 'cartoon' });
const ligandHEC = struct
  .component({ selector: { label_comp_id: 'HEC' } })
  .representation({ type: 'ball_and_stick' })
  .color({ color: '#ff652d' });
const ligandSWF = struct
  .component({ selector: { label_comp_id: 'SWF' } })
  .representation({ type: 'ball_and_stick' })
  .color({ color: '#652dff' });


builder.camera({
  target: [-22.0, 78.9, 30.4],
  position: [-90, 78.9, 30.4],
  up: [0, 0.71, -0.71],
});