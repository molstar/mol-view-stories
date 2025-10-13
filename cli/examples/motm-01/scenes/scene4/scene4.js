/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 * @author Ludovic Autin <autin@scripps.edu>
 * @author Victoria Doshchenko <doshchenko.victoria@gmail.com>
 */

// Scene 4: Oxygen Bound
// Shows oxygen binding to myoglobin and protein breathing motions

// Set audio to play on load
builder.canvas({
  custom: {
    molstar_on_load_markdown_commands: {
      'play-audio': _Audio3,
    },
  },
});

// Myoglobin with bound oxygen (1mbo) - transformed to align with NMR structure
const _1mbo = structure(builder, '1mbo').transform({ matrix: alignMboMatrix });

// NMR structure showing multiple conformations (1myf)
const _1myf = builder
  .download({ url: pdbUrl('1myf') })
  .parse({ format: 'bcif' })
  .modelStructure({ ref: '1myf' });

const red1 = '#d3a4a6';
const red2 = '#d75354';
const blue1 = '#02d1d1';

// Protein spacefill representation
_1myf
  .component({ selector: { label_asym_id: 'A' } })
  .transform({ translation: [0, 0, 0] })
  .representation({ type: 'spacefill' })
  .color({ color: red1 })
  .opacity({ ref: 'spo', opacity: 1.0 });

// Heme group
_1mbo
  .component({ selector: { label_asym_id: 'C', auth_seq_id: 155 } })
  .representation({ type: 'spacefill' })
  .color({
    custom: {
      molstar_color_theme_name: 'element-symbol',
      molstar_color_theme_params: {
        carbonColor: {
          name: 'uniform',
          params: { value: red2 },
        },
      },
    },
  });

// Protein backbone
_1myf
  .component({ selector: { label_asym_id: 'A' } })
  .representation({ type: 'backbone' })
  .color({ color: red1 });

// Oxygen molecule - static
_1mbo
  .component({ selector: { label_asym_id: 'D', auth_seq_id: 555 } })
  .representation({
    ref: 'oxy',
    type: 'spacefill',
    custom: {
      molstar_representation_params: {
        emissive: 0.0,
      },
    },
  })
  .color({ color: blue1 });

// Oxygen molecule - animated (moving in/out)
_1mbo
  .component({ selector: { label_asym_id: 'D', auth_seq_id: 555 } })
  .transform({ ref: 'oxyy', translation: [0, 0, 0] })
  .representation({ type: 'spacefill' })
  .color({ color: blue1 })
  .opacity({ ref: 'oxop', opacity: 0.0 });

const anim = builder.animation({
  custom: {
    molstar_trackball: {
      name: 'spin',
      params: { speed: -0.05 },
    },
  },
});

// Fade out spacefill to reveal backbone
anim.interpolate({
  kind: 'scalar',
  target_ref: 'spo',
  duration_ms: 5000,
  start_ms: 0,
  property: 'opacity',
  start: 1.0,
  end: 0.05,
});

// Animate through NMR ensemble models to show protein breathing
anim.interpolate({
  kind: 'scalar',
  target_ref: '1myf',
  start_ms: 11000,
  duration_ms: 10000,
  frequency: 4,
  alternate_direction: true,
  property: 'model_index',
  discrete: true,
  start: 0,
  end: 11,
});

// Pulse the oxygen to draw attention
anim.interpolate({
  kind: 'scalar',
  target_ref: 'oxy',
  start_ms: 3000,
  duration_ms: 10000,
  frequency: 7,
  alternate_direction: true,
  property: ['custom', 'molstar_representation_params', 'emissive'],
  end: 1.0,
});

// Animate oxygen moving in and out
anim.interpolate({
  kind: 'vec3',
  target_ref: 'oxyy',
  duration_ms: 5000,
  start_ms: 16000,
  property: 'translation',
  frequency: 4,
  alternate_direction: false,
  start: [5, -5, -20],
  end: [0, 0, 0],
  noise_magnitude: 1,
});

// Fade in the animated oxygen
anim.interpolate({
  kind: 'scalar',
  target_ref: 'oxop',
  duration_ms: 1000,
  start_ms: 15000,
  property: 'opacity',
  start: 0.0,
  end: 1.0,
});

addNextButton(builder, 'end', [0, -25, 0.0]);

// Fade in next button
anim.interpolate({
  kind: 'scalar',
  target_ref: 'next',
  duration_ms: 2000,
  start_ms: 18000,
  property: 'label_opacity',
  start: 0.0,
  end: 1.0,
});
