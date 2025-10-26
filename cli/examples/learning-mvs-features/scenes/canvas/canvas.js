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

struct
  .component({ selector: { label_comp_id: 'SWF' } })
  .focus({ 
    direction: [0.71, 0, -0.71],
    up: [0, 1, 0],
    radius_factor: 1.2,
  });

builder.canvas({ background_color: 'skyblue'});
