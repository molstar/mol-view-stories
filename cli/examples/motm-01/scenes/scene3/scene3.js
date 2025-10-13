/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 * @author Ludovic Autin <autin@scripps.edu>
 * @author Victoria Doshchenko <doshchenko.victoria@gmail.com>
 */

// Import shared helpers from story.js
import { structure, align, GColors2, GColors3, addNextButton, _Audio2 } from '../../story.js';

// Scene 3: Myoglobin and Whales
// Comparison of whale and pig myoglobin showing charged residues

// Whale myoglobin (1mbn)
const _1mbn = structure(builder, '1mbn').transform({ ref: 'whalex', translation: [-30, 0, 0] });

// Whale - spacefill representation with CPK colors
_1mbn
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
  });

// Heme group in whale myoglobin
_1mbn
  .component({ selector: { auth_seq_id: 155 } })
  .representation({ type: 'spacefill', custom: { molstar_representation_params: { ignoreLight: true } } })
  .color({ custom: GColors2 });

// Label for whale
_1mbn
  .primitives({
    ref: 'prims',
    label_opacity: 1,
    label_attachment: 'top-center',
    label_show_tether: true,
    label_tether_length: 1.0,
  })
  .label({
    text: 'whale',
    position: { label_asym_id: 'A', auth_seq_id: 8 },
    label_size: 10,
  });

// Star markers for charged residues
_1mbn
  .primitives({
    ref: 'startres',
    label_opacity: 0,
  })
  .label({
    text: '★',
    label_offset: 4,
    position: { label_asym_id: 'A', auth_seq_id: 12, atom_id: 96 },
    label_size: 5,
  })
  .label({
    text: '★',
    label_offset: 4,
    position: { label_asym_id: 'A', auth_seq_id: 140, auth_atom_id: 'NZ' },
    label_size: 5,
  })
  .label({
    text: '★',
    label_offset: 4,
    position: { label_asym_id: 'A', auth_seq_id: 87, auth_atom_id: 'NZ' },
    label_size: 5,
  });

// Charged residues surface representation
const seld = _1mbn.component({
  selector: [
    { label_asym_id: 'A', auth_seq_id: 12 },
    { label_asym_id: 'A', auth_seq_id: 140 },
    { label_asym_id: 'A', auth_seq_id: 87 },
  ],
});

seld
  .representation({
    ref: 'scharged',
    type: 'surface',
    surface_type: 'gaussian',
    custom: { molstar_representation_params: { emissive: 0.0, ignoreLight: true } },
  })
  .colorFromSource(GColors3);

// Pig myoglobin (1pmb) - transformed to align with whale
const _1pmb = structure(builder, '1pmb').transform({ ref: 'pig', matrix: align });

// Pig - spacefill representation
_1pmb
  .component({ selector: { label_asym_id: 'A' } })
  .representation({ type: 'spacefill', custom: { molstar_representation_params: { ignoreLight: true } } })
  .colorFromSource(GColors3);

// Heme group in pig myoglobin
_1pmb
  .component({ selector: { label_asym_id: 'C', auth_seq_id: 154 } })
  .representation({ type: 'spacefill', custom: { molstar_representation_params: { ignoreLight: true } } })
  .color({ custom: GColors2 });

// Label for pig
_1pmb
  .primitives({
    ref: 'labelpig',
    label_opacity: 1,
    label_attachment: 'top-center',
    label_show_tether: true,
    label_tether_length: 1.0,
  })
  .label({
    text: 'pig',
    position: { label_asym_id: 'A', auth_seq_id: 8 },
    label_size: 10,
  });

builder.extendRootCustomState({
  molstar_on_load_markdown_commands: {
    'play-audio': _Audio2,
  },
});

const anim = builder.animation({
  custom: {
    molstar_trackball: {
      name: 'spin',
      params: { speed: -0.05 },
    },
  },
});

// Move whale to the left to make room for pig
anim.interpolate({
  kind: 'vec3',
  target_ref: 'whalex',
  duration_ms: 10000,
  start_ms: 16000,
  property: 'translation',
  start: [-30, 0, 0],
  end: [-60, 0, 0],
});

// Show star markers for charged residues
anim.interpolate({
  kind: 'scalar',
  target_ref: 'startres',
  duration_ms: 1000,
  start_ms: 20000,
  property: 'label_opacity',
  start: 0.0,
  end: 1.0,
});

// Pig appears at 18s - slide in from the right
anim.interpolate({
  kind: 'transform_matrix',
  target_ref: 'pig',
  duration_ms: 5000,
  start_ms: 18000,
  property: 'matrix',
  translation_start: [-82.54880970106205, 37.49099778180445, -6.133850309914719],
  translation_end: [-52.54880970106205, 37.49099778180445, -6.133850309914719],
});

// Fade in pig label
anim.interpolate({
  kind: 'scalar',
  target_ref: 'labelpig',
  duration_ms: 2000,
  start_ms: 18000,
  property: 'label_opacity',
  start: 0.0,
  end: 1.0,
});

addNextButton(builder, 'oxygen', [-18.9, -4, 7.3]);

// Fade in next button
anim.interpolate({
  kind: 'scalar',
  target_ref: 'next',
  duration_ms: 2000,
  start_ms: 38000,
  property: 'label_opacity',
  start: 0.0,
  end: 1.0,
});

// Pulse the charged residues surface
anim.interpolate({
  kind: 'scalar',
  target_ref: 'scharged',
  start_ms: 20000,
  duration_ms: 6000,
  frequency: 6,
  alternate_direction: true,
  property: ['custom', 'molstar_representation_params', 'emissive'],
  start: 0.0,
  end: 1.0,
});
