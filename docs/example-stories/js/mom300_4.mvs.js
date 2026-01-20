/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Ludovic Autin <autin@scripps.edu>
 */

// Scene 4: MotAB stator close-up
// This scene focuses on the MotAB stator unit and highlights:
//  - MotA (rotor-like ring; 5 subunits)
//  - MotB (stator-like core; 2 subunits)
//  - The conserved aspartate on MotB (D22 here) implicated in proton handling

// ----------------------------------------------------------------------------
// 1) Camera + audio
// ----------------------------------------------------------------------------

// Set a stable camera framing for this scene (independent of previous scenes).
builder.camera({
  position: [-383.98, -97.79, -15.27],
  target: [-258.88, -78.01, -15.55],
  up: [-0.00, -0.01, -1.00],
});

// Register a markdown command to auto-play the narration audio on scene load.
builder.extendRootCustomState({
  molstar_on_load_markdown_commands: {
    'play-audio': 'mom300_part3.mp3',
  },
});

// ----------------------------------------------------------------------------
// 2) Load the stator structure asset (MotAB)
// ----------------------------------------------------------------------------

// Load a pre-prepared bcif asset containing the MotAB assembly for this story.
// (motab_a is expected to be defined in your story-wide/common code.)
const struct = builder
  .download({ url: motab_a })
  .parse({ format: 'bcif' })
  .modelStructure();

// ----------------------------------------------------------------------------
// 3) Build components: D22 (Asp), MotA, MotB
// ----------------------------------------------------------------------------

// (A) Key functional residues: the conserved Asp on MotB (D22 in this structure).
// We create a dedicated component/ref so we can pulse it later with emissive.
struct
  .component({
    ref: 'asp',
    selector: [
      { label_asym_id: 'F', label_seq_id: 22 },
      { label_asym_id: 'G', label_seq_id: 22 },
    ],
  })
  .representation({
    ref: 'D22',
    type: 'spacefill',
    custom: {
      molstar_representation_params: {
        emissive: 0.0,     // start non-glowing; will be animated
        sizeFactor: 2.0,   // enlarge to make the residue visually salient
      },
    },
  })
  .color({ color: 'white' });

// (B) MotA: five subunits that form the rotating ring.
// We add a transform ref ('motatr') to rotate MotA as a single unit during animation.
struct
  .component({
    ref: 'mota',
    selector: [
      { label_asym_id: 'A' },
      { label_asym_id: 'B' },
      { label_asym_id: 'C' },
      { label_asym_id: 'D' },
      { label_asym_id: 'E' },
    ],
  })
  .transform({ ref: 'motatr' })
  .representation({
    ref: 'motA',
    type: 'backbone',
    custom: {
      molstar_representation_params: {
        emissive: 0.0,
        sizeFactor: 0.5, // thinner backbone for context
      },
    },
  })
  .color(createChainColorTheme([16737896, 16744577]));

// (C) MotB: two subunits forming the stationary core.
// Represented thicker to emphasize the “axle” that MotA rotates around.
struct
  .component({
    ref: 'motb',
    selector: [{ label_asym_id: 'F' }, { label_asym_id: 'G' }],
  })
  .representation({
    ref: 'motB',
    type: 'backbone',
    custom: {
      molstar_representation_params: {
        emissive: 0.0,
        sizeFactor: 2.0,
      },
    },
  })
  .color(createChainColorTheme([16698727, 16757608]));

// ----------------------------------------------------------------------------
// 4) On-structure labels (tethered callouts)
// ----------------------------------------------------------------------------

// MotB callout: anchored to a residue position so it stays attached to the structure.
struct
  .primitives({
    label_attachment: 'middle-left',
    label_show_tether: true,
    label_tether_length: 2,
    label_background_color: '#FECD67',
  })
  .label({
    position: { label_asym_id: 'G', label_seq_id: 55 },
    text: 'MotB',
    label_size: 10.0,
    label_offset: 2.0,
  });

// MotA callout
struct
  .primitives({
    label_attachment: 'middle-left',
    label_show_tether: true,
    label_tether_length: 2,
    label_background_color: '#FF6668',
  })
  .label({
    position: { label_asym_id: 'B', label_seq_id: 72 },
    text: 'MotA',
    label_size: 10.0,
    label_offset: 2.0,
  });

// Aspartate callout: points at MotB D22
struct
  .primitives({
    label_attachment: 'middle-left',
    label_show_tether: true,
    label_tether_length: 3,
    label_background_color: 'grey',
  })
  .label({
    position: { label_asym_id: 'F', label_seq_id: 22 },
    text: 'aspartate',
    label_size: 10.0,
    label_offset: 2.0,
  });

// ----------------------------------------------------------------------------
// 5) Navigation label (go back to the intro scene)
// ----------------------------------------------------------------------------

// This label is clickable and triggers the scene keyed "start" (your intro slide).
builder.primitives({
  label_background_color: 'black',
  snapshot_key: 'start',
}).label({
  ref: 'next',
  position: [-258.9, -138.0, 0],
  text: 'Go back to Start',
  label_size: 10.0,
  label_offset: 2.0,
});

// ----------------------------------------------------------------------------
// 6) Animation timeline
// ----------------------------------------------------------------------------

const anim = builder.animation({});

// Rotate the MotA ring around a pivot near the MotB core.
// Notes:
//  - target_ref is 'motatr' (the transform ref defined on MotA).
//  - pivot is in the same coordinate space as the structure.
//  - rotation_frequency controls how many cycles occur over duration_ms.
//  - The comment "rotate motB around motB" would be incorrect here; this rotates MotA.
const axis = Vec3.create(0, 0, 1);
const r11 = Mat3.fromRotation(Mat3.zero(), 0, axis);
const r22 = Mat3.fromRotation(Mat3.zero(), Math.PI, axis);

anim.interpolate({
  kind: 'transform_matrix',
  target_ref: 'motatr',
  property: 'matrix',
  pivot: [-258.40, -77.74, -5.04],
  translation_start: [-258.40, -77.74, -5.04],
  rotation_end: r11,
  rotation_start: r22,
  duration_ms: 60000,
  start_ms: 14000,
  rotation_frequency: 10,
});

// Emissive pulses synced to narration:
//  - MotA first (introduce the ring)
//  - MotB next (introduce the core)
//  - D22 last (highlight functional residue)
anim.interpolate(makeEmissivePulse('motA', 10000, 6000, 6));
anim.interpolate(makeEmissivePulse('motB', 16000, 6000, 6));
anim.interpolate(makeEmissivePulse('D22', 22000, 6000, 6));

// Reveal/move the navigation label near the end so it does not distract early on.
anim.interpolate({
  kind: 'vec3',
  target_ref: 'next',
  duration_ms: 200,
  start_ms: 60000,
  property: 'position',
  start: [-258.9, -538.0, 0],
  end: [-258.9, -138.0, 0],
});
