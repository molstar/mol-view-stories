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
  .primitives({ opacity: 0, ref: 'prim_spheres' })
  .ellipsoid({
    center: { label_comp_id: 'HEC' },
    color: '#fcb094',
  })
  .ellipsoid({
    center: { label_comp_id: 'SWF' },
    color: '#b094fc',
  });

struct
  .primitives({ opacity: 0, label_opacity: 1, ref: 'prim_distance' })
  .distance({
    start: { label_comp_id: 'HEC' },
    end: { label_comp_id: 'SWF' },
    radius: 0.25,
    color: 'black',
    dash_length: 0.25,
    label_size: 3,
  });

struct.component({ selector: 'ligand' }).focus({ direction: [1, 0, 0] });
// builder.camera({ position: [-46.6, 82.6, 33.4], target: [-22.9, 82.6, 33.4] });

builder
  .animation()
  .interpolate({
    kind: 'scalar',
    target_ref: 'prim_spheres',
    property: 'opacity',
    start: 0,
    end: 0.5,
    start_ms: 800,
    duration_ms: 400,
  })
  .interpolate({
    kind: 'scalar',
    target_ref: 'prim_distance',
    property: 'opacity',
    start: 0,
    end: 1,
    start_ms: 1600,
    duration_ms: 400,
  })
  .interpolate({
    kind: 'scalar',
    target_ref: 'prim_distance',
    property: 'label_opacity',
    start: 0,
    end: 1,
    start_ms: 1600,
    duration_ms: 400,
  });