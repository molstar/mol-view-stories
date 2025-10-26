const struct = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/2e2o.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure();

const polymer = struct
  .component({ selector: 'polymer' })
  .representation({ type: 'cartoon' })
  .color({ color: '#4fc64f' });
const ligand = struct
  .component({ selector: 'branched' })
  .representation({ type: 'ball_and_stick' })
  .color({ color: '#4fc64f' });

builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/volume-server/x-ray/2e2o/box/0.936,-1.706,46.571/15.133,11.193,61.825' })
  .parse({ format: 'bcif' })
  .volume({ channel_id: '2Fo-Fc' })
  .representation({
    type: 'isosurface',
    relative_isovalue: 1.5,
  })
  .color({ color: '#3362b2' })
  .opacity({ opacity: 0, ref: 'volume_opacity' });

struct.component({ selector: 'branched' }).focus({ direction: [-0.22, -0.32, 0.92], up: [0, 0.90, 0.44] });

builder
  .animation()
  .interpolate({
    kind: 'scalar',
    target_ref: 'volume_opacity',
    property: 'opacity',
    start: 0,
    end: 0.4,
    start_ms: 800,
    duration_ms: 200,
  });
