/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT.
 * See LICENSE file for more info.
 *
 * @author Ludovic Autin <autin@scripps.edu>
 *
 * Scene 3 (key: switch)
 * ---------------------
 * This scene demonstrates the directional switching mechanism of the
 * flagellar motor by transitioning between:
 *   - CCW state (C-ring + stators positioned outside the ring)
 *   - CW state (CheY-bound C-ring + stators repositioned inside the ring)
 *
 * The animation proceeds in three phases:
 *   1) Start in the CCW configuration and rotate briefly.
 *   2) Introduce CheY and cross-fade CCW C-ring to CW C-ring while the CCW stators fade out.
 *   3) Cross-fade to the CW stator set, then rotate in the opposite direction.
 *
 * Visibility is managed through explicit opacity references (cringop/cringop2/cheyop, mobop/mobop2).
 * Motor motion is implemented via repeated transform_matrix interpolations with rotation_frequency.
 */

// ============================================================================
// 1. Camera setup and audio playback
// ============================================================================

builder.camera({
  // Camera pose chosen to clearly frame both C-ring and stator positions during switching.
  position: [-292.78, 809.01, 29.23],
  target: [43.86, 24.50, 43.12],
  up: [-0.03, -0.03, -1.00],
});

// Play the narration track associated with the switching explanation.
builder.extendRootCustomState({
  molstar_on_load_markdown_commands: {
    'play-audio': 'mom300_part2.mp3',
  }
});

// ============================================================================
// 2. Shared structural context (hook + LP ring) for spatial reference
// ============================================================================

const ce = Vec3.negate(Vec3(), pdbCenters['7CGO'].center);

const { fullSel: fs } = buildSelectors(
  chains7CGO,
  ['1','2','3','4','5','6','7','8','9','10','11','12','13','14']
);

const _7cgo = structure(builder, '7CGO');

_7cgo
  .component({ ...fs, ref: 'hook' })
  .transform({ ref: '7cgo1' })
  .representation({ ...prot_rep, ref: 'hookrep' })
  .color(createChainColorTheme([8427006, 8303358]));

const { fullSel: fs2 } = buildSelectors(chains7CGO, ['15','16']);

_7cgo
  .component({ ...fs2, ref: 'lpring' })
  .transform({ translation: ce })
  .representation({ ...prot_rep, ref: 'lpringrep' })
  .color(createChainColorTheme([10023293, 8450714]));

// ============================================================================
// 3. C-ring assets: CW and CCW configurations
// ============================================================================

// Shared translation aligning C-ring assets relative to the hook context.
const cr = Vec3.create(0, 0, -250);

// CW C-ring (derived from 8UPL), initially hidden.
// Visibility is controlled via the opacity reference 'cringop'.
const _8upl = builder
  .download({ url: cring_cw_centered_a })
  .parse({ format: 'bcif' })
  .modelStructure()
  .component({})
  .transform({ ref: '8upl1', translation: cr })
  .representation({ ...prot_rep, ref: 'cringrep' })
  .color(createChainColorTheme([8427006, 8303358]))
  .opacity({ ref: 'cringop', opacity: 0.0 });

// CCW C-ring (derived from 8UOX), visible at scene start.
// Visibility is controlled via the opacity reference 'cringop2'.
const _8uox = builder
  .download({ url: cring_ccw_centered_a })
  .parse({ format: 'bcif' })
  .assemblyStructure({ assembly_id: '1' })
  .component({})
  .transform({ ref: '8uox', translation: cr })
  .representation({ ...prot_rep, ref: 'cringrep2' })
  .color(createChainColorTheme([8427006, 8303358]))
  .opacity({ ref: 'cringop2', opacity: 1.0 });

// ============================================================================
// 4. CheY: introduced at the switching moment
// ============================================================================

// CheY is initially hidden and then fades in as the CW state is engaged.
// Visibility is controlled via the opacity reference 'cheyop'.
const _1f4v = builder
  .download({ url: cheY_c34_a })
  .parse({ format: 'bcif' })
  .assemblyStructure({ assembly_id: '1' })
  .component({ ref: 'chey' })
  .transform({ ref: 'cheytr', translation: cr })
  .representation({ ...prot_rep, ref: 'cheyrep' })
  .color(createChainColorTheme([15034341]))
  .opacity({ ref: 'cheyop', opacity: 0.0 });

// ============================================================================
// 5. Stator sets: CW and CCW ring placements
// ============================================================================

// CW stator ring: instantiated but initially hidden (mobop* = 0).
const motAB = builder
  .download({ url: motab_c11_a })
  .parse({ format: 'bcif' });

for (let i = 0; i < 11; i++) {
  motAB
    .modelStructure({ model_index: i })
    .component({ ref: 'motab' + i })
    .transform({ ref: 'motabtr' + i, translation: [0, 0, 0] })
    .representation({ ...prot_rep, ref: 'motabrep' + i })
    .opacity({ ref: 'mobop' + i, opacity: 0 })
    .color(createChainColorTheme([
      16698727, 16757608, 16744577, 16737896,
      16744577, 16737896, 16744577
    ]));
}

// CCW stator ring: visible at scene start (mobop2* = 1).
// This set corresponds to the alternate stator placement in the CCW configuration.
const motAB2 = builder
  .download({ url: motab_ccw_c11_a })
  .parse({ format: 'bcif' });

for (let i = 0; i < 11; i++) {
  motAB2
    .modelStructure({ model_index: i })
    .component({ ref: 'motab2' + i })
    .transform({ ref: 'motabtr2' + i, translation: [0, 0, 0] })
    .representation({ ...prot_rep, ref: 'motabrep2' + i })
    .opacity({ ref: 'mobop2' + i, opacity: 1 })
    .color(createChainColorTheme([
      16698727, 16757608, 16744577, 16737896,
      16744577, 16737896, 16744577
    ]));
}

// ============================================================================
// 6. Navigation label (scene link)
// ============================================================================

builder.primitives({
  label_background_color: 'black',
  snapshot_key: 'explore',
}).label({
  ref: 'next',
  position: [0, 0, 480],
  text: 'Click to go next ',
  label_size: 100.0,
  label_offset: 2.0,
});

// ============================================================================
// 7. Animation timeline and kinematic parameters
// ============================================================================

const anim = builder.animation({});

// Timeline notes (ms):
//  - 10000: begin rotation in the CCW configuration
//  - 27000: emphasize CCW C-ring (emissive pulse)
//  - 46000: CheY binding event; cross-fade CCW -> CW C-ring; begin stator swap
//  - 78000: begin CW rotation
//  - 55000: slide-in navigation label (timed for user readiness)

// Rotation settings.
// rpm scaling is converted into a frame-friendly rotation_frequency.
const start_rotate = 10000;
const duration_ms = 10000;

const rate = 18000 / 60000;              // revolutions per ms at 18,000 rpm
const freq = Math.round((rate * duration_ms) / 1000);

const r1 = Mat3.fromEuler(Mat3.zero(), Euler.create(0, 0, 0.0), 'XYZ');
const r2 = Mat3.fromEuler(Mat3.zero(), Euler.create(0, 0, Math.PI * 2), 'XYZ');

// CW rotation phase (after switching).
const duration_ms2 = 15000;
const freq2 = Math.round((rate * duration_ms2) / 1000);

// ============================================================================
// 8. Rotation targets and pivot definitions
// ============================================================================

// CW targets: hook, C-ring, and CheY rotate together after the switch.
// Rotation directions are assigned to match the CW narrative.
const objs = ['7cgo1', '7cgo2', '8upl1', 'cheytr'];
const ob_centers = [pdbCenters['7CGO'].center, pdbCenters['7CGO'].center, cr, cr];
const freqs = [freq2, freq2, -freq2, -freq2];

// CCW targets: hook plus the CCW C-ring.
const objs2 = ['7cgo1', '7cgo2', '8uox'];
const ob_centers2 = [pdbCenters['7CGO'].center, pdbCenters['7CGO'].center, cr];
const freqs2 = [-freq, -freq, freq];

// Stator pivot coordinates for the CW and CCW placements.
// These pivots define the rotation center used in transform_matrix interpolation.
const motabcenters = {
  0: Vec3.create(166.81, -52.01, -120.15),
  1: Vec3.create(168.45, 46.43, -120.15),
  2: Vec3.create(116.61, 130.13, -120.15),
  3: Vec3.create(27.75, 172.51, -120.15),
  4: Vec3.create(-69.93, 160.13, -120.15),
  5: Vec3.create(-145.40, 96.90, -120.15),
  6: Vec3.create(-174.70, 2.91, -120.15),
  7: Vec3.create(-148.54, -92.00, -120.15),
  8: Vec3.create(-75.22, -157.71, -120.15),
  9: Vec3.create(21.98, -173.34, -120.15),
  10: Vec3.create(112.21, -133.94, -120.15),
};

const motabcenters2 = {
  0: Vec3.create(189.86, -195.82, -110.19),
  1: Vec3.create(265.59, -62.08, -110.19),
  2: Vec3.create(256.99, 91.36, -110.19),
  3: Vec3.create(166.80, 215.80, -110.19),
  4: Vec3.create(23.65, 271.72, -110.19),
  5: Vec3.create(-127.00, 241.38, -110.19),
  6: Vec3.create(-237.34, 134.39, -110.19),
  7: Vec3.create(-272.32, -15.26, -110.19),
  8: Vec3.create(-220.84, -160.06, -110.19),
  9: Vec3.create(-99.25, -254.05, -110.19),
  10: Vec3.create(53.86, -267.38, -110.19),
};

// ============================================================================
// 9. Phase A: CCW rotation (initial state)
// ============================================================================

Object.entries(objs2).forEach(([idx, ref]) => {
  anim.interpolate({
    kind: 'transform_matrix',
    target_ref: ref,
    property: 'matrix',
    pivot: ob_centers2[idx],
    rotation_start: r2,
    rotation_end: r1,
    duration_ms,
    start_ms: start_rotate,
    rotation_frequency: freqs2[idx],
  });
});

// ============================================================================
// 10. Switching event: CheY binding and state transition
// ============================================================================

// Transition timing configuration.
const chya = 46000;  // time at which CheY is introduced
const tr = 2000;     // cross-fade step duration

// CCW stator set rotation uses a slightly tilted axis relative to the CW set.
// This corrects for the coordinate frame differences in the CCW-packed asset.
const axis = Vec3.create(-0.178, 0.146, 0.973);
const r11 = Mat3.fromRotation(Mat3.zero(), 0, axis);
const r22 = Mat3.fromRotation(Mat3.zero(), Math.PI * 2, axis);

// Rotate CCW stators during the CCW phase and fade them out during the switch.
Object.entries(motabcenters2).forEach(([key, vec]) => {
  anim.interpolate({
    kind: 'transform_matrix',
    target_ref: 'motabtr2' + key,
    property: 'matrix',
    pivot: vec,
    translation_start: [vec[0], vec[1], -vec[2] + 30],
    rotation_start: r22,
    rotation_end: r11,
    duration_ms,
    start_ms: start_rotate,
    rotation_frequency: freq * 3,
  });

  // Optional emphasis for the CCW stator ring; timed for narration.
  // Note: this uses 'i' in the original code; the correct key here is 'key'.
  anim.interpolate(makeEmissivePulse('motabrep2' + key, 30000, 3000, 2));

  // Fade out CCW stators after the switch begins.
  anim.interpolate({
    kind: 'scalar',
    target_ref: 'mobop2' + key,
    duration_ms: tr,
    start_ms: chya + 3 * tr,
    property: 'opacity',
    start: 1.0,
    end: 0.0,
  });
});

// Emphasize the CCW C-ring prior to switching.
anim.interpolate(makeEmissivePulse('cringrep2', 27000, 3000, 2));

// Fade in CheY, then cross-fade CCW -> CW C-ring.
anim.interpolate({
  kind: 'scalar',
  target_ref: 'cheyop',
  duration_ms: tr,
  start_ms: chya,
  property: 'opacity',
  start: 0.0,
  end: 1.0,
});

anim.interpolate({
  kind: 'scalar',
  target_ref: 'cringop2',
  duration_ms: tr,
  start_ms: chya + tr,
  property: 'opacity',
  start: 1.0,
  end: 0.0,
});

anim.interpolate({
  kind: 'scalar',
  target_ref: 'cringop',
  duration_ms: tr,
  start_ms: chya + 2 * tr,
  property: 'opacity',
  start: 0.0,
  end: 1.0,
});

// ============================================================================
// 11. Phase B: CW rotation (post-switch state)
// ============================================================================

Object.entries(objs).forEach(([idx, ref]) => {
  anim.interpolate({
    kind: 'transform_matrix',
    target_ref: ref,
    property: 'matrix',
    pivot: ob_centers[idx],
    rotation_start: r2,
    rotation_end: r1,
    duration_ms: duration_ms2,
    start_ms: chya + 4 * tr,
    rotation_frequency: freqs[idx],
  });
});

// Make CW stators appear and rotate them in the new placement.
Object.entries(motabcenters).forEach(([key, vec]) => {
  // Immediate visibility toggle for the CW stators at the switch boundary.
  anim.interpolate({
    kind: 'scalar',
    target_ref: 'mobop' + key,
    duration_ms: 1,
    start_ms: chya + 3 * tr,
    property: 'opacity',
    start: 0.0,
    end: 1.0,
  });

  anim.interpolate({
    kind: 'transform_matrix',
    target_ref: 'motabtr' + key,
    property: 'matrix',
    pivot: vec,
    translation_start: [vec[0], vec[1], -vec[2] + 30],
    rotation_start: r2,
    rotation_end: r1,
    duration_ms: duration_ms2,
    start_ms: chya + 4 * tr,
    rotation_frequency: freq2 * 3,
  });
});

// ============================================================================
// 12. Navigation label timing
// ============================================================================

// Slide the navigation label into view when the switching sequence completes.
anim.interpolate({
  kind: 'vec3',
  target_ref: 'next',
  duration_ms: 200,
  start_ms: 55000,
  property: 'position',
  start: [0, 0, 680],
  end: [0, 0, 480],
});
