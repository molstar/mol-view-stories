/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 * @author Ludovic Autin <autin@scripps.edu>
 * @author Victoria Doshchenko <doshchenko.victoria@gmail.com>
 */

// Scene 2: Molecule of the Month: Myoglobin
// Main introduction to myoglobin with animations highlighting the heme group and structure

// No outline here
builder.canvas({ custom: { molstar_postprocessing: { enable_outline: false } } });

const _1mbn = build1mbn(builder, '1MBN');

// Play audio when this scene loads
_1mbn.struct.primitives({
  custom: {
    molstar_on_load_markdown_commands: {
      'play-audio': _Audio1,
    },
  },
});

// Whale myoglobin - spacefill representation with CPK colors
_1mbn.struct
  .component({ selector: { label_asym_id: 'A' } })
  .representation({ type: 'spacefill', custom: { molstar_representation_params: { ignoreLight: true } } })
  .colorFromSource({
    schema: 'all_atomic',
    category_name: 'atom_site',
    field_name: 'type_symbol',
    palette: {
      kind: 'categorical',
      colors: {
        C: '#FFFFFF',
        N: '#CCE6FF',
        O: '#FFCCCC',
        S: '#FFE680',
      },
    },
  })
  .opacity({ ref: 'cpkopa1', opacity: 0.0 });

// Heme group
_1mbn.struct
  .component({ selector: { auth_seq_id: 155 } })
  .representation({ type: 'spacefill', custom: { molstar_representation_params: { ignoreLight: true } } })
  .color({ custom: GColors2 })
  .opacity({ ref: 'cpkopa2', opacity: 0.0 });

addNextButton(builder, 'whale', [13.5, -4, 7.7]);

const anim = builder.animation({
  custom: {
    molstar_trackball: {
      name: 'spin',
      params: { speed: -0.05 },
    },
  },
});

// Fade in the line representation
anim.interpolate({
  kind: 'scalar',
  target_ref: 'lineopa',
  duration_ms: 2000,
  start_ms: 0,
  property: 'opacity',
  start: 0.0,
  end: 1.0,
});

// Pulse the ligand (heme group) to draw attention
anim.interpolate({
  kind: 'scalar',
  target_ref: 'ligand',
  start_ms: 22000,
  duration_ms: 10000,
  frequency: 6,
  alternate_direction: true,
  property: ['custom', 'molstar_representation_params', 'emissive'],
  end: 1.0,
});

// Fade in the spacefill representation of the protein
anim.interpolate({
  kind: 'scalar',
  target_ref: 'cpkopa1',
  duration_ms: 5000,
  start_ms: 40000,
  property: 'opacity',
  start: 0.0,
  end: 1.0,
});

// Fade in the spacefill representation of the heme
anim.interpolate({
  kind: 'scalar',
  target_ref: 'cpkopa2',
  duration_ms: 5000,
  start_ms: 40000,
  property: 'opacity',
  start: 0.0,
  end: 1.0,
});

// Fade in the "Next" button
anim.interpolate({
  kind: 'scalar',
  target_ref: 'next',
  duration_ms: 2000,
  start_ms: 43000,
  property: 'label_opacity',
  start: 0.0,
  end: 1.0,
});
