/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 * @author Ludovic Autin <autin@scripps.edu>
 * @author Victoria Doshchenko <doshchenko.victoria@gmail.com>
 */

// Scene 1: Introduction
// This is the opening scene with a spinning myoglobin structure and a "Start story" button

const _1mbn = build1mbn(builder, '1MBN');

const anim = builder.animation({
  custom: {
    molstar_trackball: {
      name: 'spin',
      params: { speed: -0.05 },
    },
  },
});

const prims = _1mbn.struct.primitives({
  ref: 'start-story',
  label_opacity: 0,
  label_background_color: 'grey',
  snapshot_key: 'intro',
});

prims.label({
  text: 'Start story',
  position: [13.5, -4, 7.7],
  label_size: 8,
});

anim.interpolate({
  kind: 'scalar',
  target_ref: 'start-story',
  duration_ms: 1000,
  start_ms: 1,
  property: 'label_opacity',
  start: 0.0,
  end: 1.0,
});
