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
  .color({ color: '#ffce2d', ref: 'hec_color' });
const ligandSWF = struct
  .component({ ref: 'swf', selector: { label_comp_id: 'SWF' } })
  .representation({ type: 'surface' })
  .color({ color: '#2d5eff' })
  .opacity({ opacity: 1, ref: 'swf_opacity' });

builder.camera({
  target: [-22.0, 78.9, 30.4],
  position: [-80, 110, 30.4],
  up: [0, 1, 0],
  ref: 'camera',
});

const commonAnimParams = {
    duration_ms: 20_000,
    easing: 'quad-in-out',
    alternate_direction: true,
    frequency: 20,
}

builder
  .animation({ include_camera: true })
  .interpolate({
    target_ref: 'hec_color',
    property: 'color',
    kind: 'color',
    start: '#ffce2d',
    end: '#008800',
    ...commonAnimParams,
  })
  .interpolate({
    target_ref: 'swf_opacity',
    property: 'opacity',
    kind: 'scalar',
    start: 1,
    end: 0,
    ...commonAnimParams,
  })
  .interpolate({
    target_ref: 'camera',
    property: 'position',
    kind: 'vec3',
    end: [-82.8, 104.1, 30.4],
    ...commonAnimParams,
  });

  