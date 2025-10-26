const struct1 = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/2e2o.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure();

const struct2 = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/2e2n.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure()
  .transform({
    rotation: [
      0.291445, -0.479952, 0.827469,
      0.949818, 0.042465, -0.309906,
      0.113601, 0.876266, 0.468243,
    ],
    translation: [-17.28577537, 3.84218601, 5.61300478],
    ref: 'transform'
  });

const polymer1 = struct1
  .component({ selector: 'polymer' })
  .representation({ type: 'cartoon' })
  .color({ color: '#4fc64f' });
const ligand1 = struct1
  .component({ selector: 'branched' })
  .representation({ type: 'ball_and_stick' })
  .color({ color: '#4fc64f' });
const polymer2 = struct2
  .component({ selector: { label_asym_id: 'A' } })
  .representation({ type: 'cartoon' })
  .color({ color: '#dddddd' });

struct1.component({ selector: 'all' }).focus({ direction: [-0.22, -0.32, 0.92], up: [0, 0.90, 0.44] });

builder
  .animation()
  .interpolate({
    kind: 'rotation_matrix',
    target_ref: 'transform',
    property: 'rotation',
    start: [1,0,0, 0,1,0, 0,0,1],
    end: [
      0.291445, -0.479952, 0.827469,
      0.949818, 0.042465, -0.309906,
      0.113601, 0.876266, 0.468243,
    ],
    start_ms: 1000,
    duration_ms: 1500,
  })
  .interpolate({
    kind: 'vec3',
    target_ref: 'transform',
    property: 'translation',
    start: [0,0,75],
    end: [-17.28577537, 3.84218601, 5.61300478],
    start_ms: 1000,
    duration_ms: 1500,
  });