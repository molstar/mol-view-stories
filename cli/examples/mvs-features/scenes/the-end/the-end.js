const struct = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1cbs.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure({ });

struct
  .component({ selector: 'polymer' })
  .representation({ type: 'cartoon' })
  .color({ color: '#6e40aa', ref: 'polymer_color' });

struct
  .component({ selector: 'ligand' })
  .representation({ type: 'spacefill' })
  .color({ color: '#6e40aa', ref: 'ligand_color' });

struct.component().label({ text: 'THE END' });

struct
  .component({ selector: 'all' })
  .focus({
    direction: [0, 0, -1],
    ref: 'focus',
  });

builder
  .animation({ include_camera: true })
  .interpolate({ 
    target_ref: 'focus',
    property: 'direction',
    kind: 'vec3',
    start: [0, 0, -1],
    end: [-1, 0, 0],
    duration_ms: 80_000,
    alternate_direction: true,
    easing: 'sin-in-out',
    frequency: 20,
  })
  .interpolate({
    target_ref: 'polymer_color',
    property: 'color',
    kind: 'color',
    palette: {
      kind: 'continuous',
      colors: 'Rainbow'
    },
    duration_ms: 80_000,
    frequency: 5,
  })
  .interpolate({
    target_ref: 'ligand_color',
    property: 'color',
    kind: 'color',
    palette: {
      kind: 'continuous',
      colors: 'Rainbow'
    },
    start_ms: 6_000,
    duration_ms: 80_000,
    frequency: 5,
  });
  