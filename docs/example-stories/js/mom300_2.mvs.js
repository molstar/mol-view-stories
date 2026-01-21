/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT.
 * See LICENSE file for more info.
 *
 * @author Ludovic Autin <autin@scripps.edu>
 *
 * Scene 2 (key: motor)
 * -------------------
 * This scene assembles the clockwise (CW) bacterial flagellar motor and
 * synchronizes structural highlights with an audio narration.
 *
 * The scene combines multiple curated BCIF assets:
 *   - Hook and basal body: 7CGO
 *   - Clockwise C-ring: centered asset derived from 8UPL
 *   - CheY regulator: centered asset derived from 1F4V
 *   - MotA/MotB stators: pre-packed BCIF containing 11 stator units
 *
 * Visual emphasis is achieved using emissive pulses that are timed to the
 * narration, guiding the viewer through the motor architecture.
 */

// ============================================================================
// 1. Camera setup and audio playback
// ============================================================================

builder.camera({
  // Fixed camera pose framing the complete motor assembly.
  position: [-315.66, 784.46, -18.39],
  target: [-0.59, -8.80, 73.39],
  up: [0.04, -0.10, -0.99],
});

// Automatically start the scene narration when the scene loads.
// The MolViewStories runtime maps this command to an audio player.
builder.extendRootCustomState({
  molstar_on_load_markdown_commands: {
    'play-audio': 'mom300_part1.mp3',
  }
});

// ============================================================================
// 2. Hook and basal body (PDB: 7CGO)
// ============================================================================

// Translation that recenters the 7CGO structure so its geometric center
// aligns with the global origin. This simplifies alignment with other assets.
const ce = Vec3.negate(Vec3(), pdbCenters['7CGO'].center);

// Select most entities composing the hook and basal body.
// The selector utility returns a combined selector as well as odd/even splits.
const { fullSel: fs } = buildSelectors(
  chains7CGO,
  ['1','2','3','4','5','6','7','8','9','10','11','12','13','14']
);

// Load the 7CGO structure and create the hook representation.
const _7cgo = structure(builder, '7CGO');

_7cgo
  .component({ ...fs, ref: 'hook' })
  .transform({ ref: '7cgo1' })
  .representation({ ...prot_rep, ref: 'hookrep' })
  .color(createChainColorTheme([8427006, 8303358]));

// ============================================================================
// 3. Structural callout labels
// ============================================================================
// Labels are implemented as primitives anchored in 3D space and connected
// to the structure using tethers.

builder.primitives({
  label_attachment: 'middle-left',
  label_show_tether: true,
  label_tether_length: 2,
  label_background_color: '#406C9A',
}).label({
  position: [20, 0, -130],
  text: 'flagellar hook',
  label_size: 70.0,
  label_offset: 2.0,
});

// LP-ring selector and representation.
const { fullSel: fs2 } = buildSelectors(chains7CGO, ['15','16']);

_7cgo
  .component({ ...fs2, ref: 'lpring' })
  .transform({ translation: ce })
  .representation({ ...prot_rep, ref: 'lpringrep' })
  .color(createChainColorTheme([10023293, 8450714]));

builder.primitives({
  label_attachment: 'middle-left',
  label_show_tether: true,
  label_tether_length: 2,
  label_background_color: '#93E3A4',
}).label({
  position: [20, 20, 0],
  text: 'LP-ring',
  label_size: 70.0,
  label_offset: 2.0,
});

// ============================================================================
// 4. Clockwise C-ring (centered asset derived from 8UPL)
// ============================================================================

// Position offset for the C-ring relative to the hook.
const cr = Vec3.create(0, 0, -250);

// Load a centered BCIF asset for the clockwise C-ring.
const _8upl = builder
  .download({ url: cring_cw_centered_a })
  .parse({ format: 'bcif' })
  .modelStructure()
  .component({ ref: 'cring' })
  .transform({ ref: '8upl1', translation: cr })
  .representation({ ...prot_rep, ref: 'cringrep' })
  .color(createChainColorTheme([8427006, 8303358]));

builder.primitives({
  label_attachment: 'top-left',
  label_show_tether: true,
  label_tether_length: 4,
  label_background_color: '#406C9A',
}).label({
  position: [20, 0, 300],
  text: 'C-ring',
  label_size: 70.0,
  label_offset: 2.0,
});

// ============================================================================
// 5. CheY regulatory protein (PDB: 1F4V)
// ============================================================================

const _1f4v = builder
  .download({ url: cheY_c34_a })
  .parse({ format: 'bcif' })
  .assemblyStructure({ assembly_id: '1' })
  .component({ ref: 'chey' })
  .transform({ ref: 'cheytr', translation: cr })
  .representation({ ...prot_rep, ref: 'cheyrep' })
  .color(createChainColorTheme([15034341]));

builder.primitives({
  label_attachment: 'middle-left',
  label_show_tether: true,
  label_tether_length: 4,
  label_background_color: '#AD50A0',
}).label({
  position: [20, 0, 250],
  text: 'CheY',
  label_size: 70.0,
  label_offset: 2.0,
});

// ============================================================================
// 6. MotA/MotB stator ring (11 torque-generating units)
// ============================================================================

// Load a BCIF containing 11 stator units as separate models.
const motAB = builder
  .download({ url: motab_c11_a })
  .parse({ format: 'bcif' });

// Instantiate each stator unit with unique references for animation
// and highlighting.
for (let i = 0; i < 11; i++) {
  motAB
    .modelStructure({ model_index: i })
    .component({ ref: 'motab' + i })
    .transform({ ref: 'motabtr' + i, translation: [0, 0, 0] })
    .representation({ ...prot_rep, ref: 'motabrep' + i })
    .opacity({ ref: 'mobop' + i, opacity: 1 })
    .color(createChainColorTheme([
      16698727, 16757608, 16744577, 16737896,
      16744577, 16737896, 16744577
    ]));
}

builder.primitives({
  label_attachment: 'middle-left',
  label_show_tether: true,
  label_tether_length: 4,
  label_background_color: '#ff8081',
}).label({
  position: [20, 30, 120],
  text: 'stator',
  label_size: 70.0,
  label_offset: 2.0,
});

// ============================================================================
// 7. Schematic membrane layers
// ============================================================================

builder.primitives({ label_background_color: '#dedede' }).label({
  position: [0, 0, -20],
  text: '  outer membrane                                             ',
  label_size: 80.0,
  label_offset: 2.0,
});

builder.primitives({ label_background_color: '#defbe7' }).label({
  position: [0, 0, 80],
  text: '  peptidoglycan                                                       ',
  label_size: 80.0,
  label_offset: 2.0,
});

builder.primitives({ label_background_color: '#dedede' }).label({
  position: [0, 0, 160],
  text: '  inner membrane                                                         ',
  label_size: 80.0,
  label_offset: 2.0,
});

// ============================================================================
// 8. Navigation label
// ============================================================================

builder.primitives({
  label_background_color: 'black',
  snapshot_key: 'switch',
}).label({
  ref: 'next',
  position: [0, 0, 480],
  text: 'Click to go next',
  label_size: 100.0,
  label_offset: 2.0,
});

// ============================================================================
// 9. Animation and narration synchronization
// ============================================================================

const anim = builder.animation({ include_camera: false });

// Rotation parameters.
// The real motor rotates at ~18,000 rpm; here the speed is scaled for visibility.
const start_rotate = 96000;
const duration_ms = 30000;
const freq = (duration_ms / 60000) * (18000 / 1000);

const r1 = Mat3.fromEuler(Mat3.zero(), Euler.create(0, 0, 0), 'XYZ');
const r2 = Mat3.fromEuler(Mat3.zero(), Euler.create(0, 0, Math.PI * 2), 'XYZ');

// Core rotating components.
const objs = ['7cgo1', '8upl1', 'cheytr'];
const pivots = [pdbCenters['7CGO'].center, cr, cr];
const freqs = [freq, -freq, -freq];

// Apply rotation animation to core components.
objs.forEach((ref, i) => {
  anim.interpolate({
    kind: 'transform_matrix',
    target_ref: ref,
    property: 'matrix',
    pivot: pivots[i],
    rotation_start: r2,
    rotation_end: r1,
    start_ms: start_rotate,
    duration_ms,
    rotation_frequency: freqs[i],
  });
});

// Stator rotation centers.
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

// Rotate stators and apply emissive pulses for narration emphasis.
Object.entries(motabcenters).forEach(([i, center]) => {
  anim.interpolate({
    kind: 'transform_matrix',
    target_ref: 'motabtr' + i,
    property: 'matrix',
    pivot: center,
    translation_start: [center[0], center[1], -center[2] + 30],
    rotation_start: r2,
    rotation_end: r1,
    start_ms: start_rotate,
    duration_ms,
    rotation_frequency: freq * 3,
  });

  anim.interpolate(makeEmissivePulse('motabrep' + i, 85000, 3000, 4));
});

// Timed highlights of major components.
anim.interpolate(makeEmissivePulse('hookrep',   71000, 3000, 4));
anim.interpolate(makeEmissivePulse('lpringrep', 76000, 3000, 4));
anim.interpolate(makeEmissivePulse('cringrep',  93000, 3000, 4));
anim.interpolate(makeEmissivePulse('cheyrep',  105000, 3000, 4));

// Slide-in animation for the navigation label.
anim.interpolate({
  kind: 'vec3',
  target_ref: 'next',
  property: 'position',
  start_ms: 110000,
  duration_ms: 200,
  start: [0, 0, 680],
  end: [0, 0, 480],
});
