/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Ludovic Autin <autin@scripps.edu>
 */
// Start typing 'builder' to create a new scene
// Mol* library functions: Vec3, Mat3, Mat4, Quat, Euler, decodeColor, MolScriptBuilder, formatMolScript

// ============================================================================
// Scene: Explore (Intro)
// ============================================================================
// Goal:
//   Show the flagellar motor in both CCW and CW configurations side-by-side,
//   start everything rotating slowly, and provide a big "START" label that
//   navigates to the next scene ("motor").
//
// Assumptions:
//   - `pdbCenters`, `chains7CGO`, `chains8UPL`, `buildSelectors`, `structure`
//     and the asset URLs (cring_cw_centered_a, etc.) are defined in story-wide code.
//   - `prot_rep` and `createChainColorTheme` are also defined story-wide.
// ============================================================================
builder.camera({
  position: [879.07, 864.56, 89.55],
  target: [502.22, 55.84, 33.09],
  up: [0.03, 0.05, -1.00],
});

// ----------------------------------------------------------------------------
// Basal body + hook (7CGO)
// ----------------------------------------------------------------------------

// Translate 7CGO so that its center is at the origin (useful for consistent framing).
const ce = Vec3.negate(Vec3(), pdbCenters['7CGO'].center);

// Selector for the bulk of the 7CGO assembly.
// Entities 1..14 correspond to multiple structural components of the basal body + hook.
const { fullSel:fs, oddSel:o1, evenSel:o2 } = buildSelectors(chains7CGO, ['1','2', '3', '4','5', '6','7','8','9','10','11','12','13','14']);
// Selector for the hook-only components (FliE + FlgE).
// NOTE: currently not used in this snippet, but useful for later scene highlighting.
const { fullSel:hook, oddSel:h1, evenSel:h2 } = buildSelectors(chains7CGO, ['7','8']);

// Load 7CGO (hook complex) once.
const _7cgo = structure(builder, '7CGO');

// Left instance: CCW-side hook/basal-body.
_7cgo.component({...fs, ref:'hook'})
    .transform({ref:'7cgo1'})
  .representation({...prot_rep, ref:'hookrep'})
  .color(createChainColorTheme([8427006, 8303358]));

// Right instance: duplicate to compare (CW-side).
// We place it with a large +X translation, and later animate it with rotation.
_7cgo.component({...fs, ref:'hook2'})
    .transform({ref:'7cgo2', translation:[500,0,0]})
  .representation({...prot_rep, ref:'hookrep2'})
  .color(createChainColorTheme([8427006, 8303358]));


// ----------------------------------------------------------------------------
// LP ring (from the same 7CGO file)
// ----------------------------------------------------------------------------
// Entities 15 and 16 represent the L-ring and P-ring proteins.
const { fullSel:fs2, oddSel:o3, evenSel:o4 }= buildSelectors(chains7CGO, ["15",'16']);

// LP ring for left (CCW-side).
_7cgo.component({...fs2, ref:'lpring'})
  .transform({ translation: ce })
  .representation({...prot_rep, ref:'lpringrep'})
  .color(createChainColorTheme([10023293, 8450714]));

// LP ring for right (CW-side), shifted similarly to the hook duplicate.
_7cgo.component({...fs2, ref:'lpring2'})
  .transform({ translation: Vec3.add(Vec3.zero(),ce,Vec3.create(700,-300,0)) })
  .representation({...prot_rep, ref:'lpringrep2'})
  .color(createChainColorTheme([10023293, 8450714]));

// ----------------------------------------------------------------------------
// C-ring / switch complex (CW vs CCW assets)
// ----------------------------------------------------------------------------

// This selector is currently unused directly (you apply component({ref:'cring'}) later),
// but kept here for clarity / future filtering by entity.
const { fullSel:cring, oddSel:p1, evenSel:p2 } = buildSelectors(chains8UPL, ['1','2','3','4']);

// Place both C-rings slightly “below” the hook in Z to form the assembled motor view.
const cRingTranslation = Vec3.create(0, 0, -250);

// CW C-Ring (8UPL) — pre-centered BCIF asset.
const _8upl = builder
  .download({ url: cring_cw_centered_a })
  .parse({ format: 'bcif' })
  .modelStructure()
  .component({ref:'cring'})
  .transform({ ref: '8upl1', translation: cRingTranslation })
  .representation({...prot_rep, ref:'cringrep'})
  .color(createChainColorTheme([8427006, 8303358]));

// CCW C-Ring (8UOX) — pre-centered BCIF asset.
const _8uox = builder
  .download({ url: cring_ccw_centered_a })
  .parse({ format: 'bcif' })
  .assemblyStructure({ assembly_id: '1' })
  .component({ref:'ccw_cring'})
  .transform({ ref: '8uox', translation: cRingTranslation })
  .representation({...prot_rep, ref:'cringrep2'})
  .color(createChainColorTheme([8427006, 8303358]))
  .opacity({ref:'cringop2', opacity:1.0});

// ----------------------------------------------------------------------------
// CheY (switch regulator)
// ----------------------------------------------------------------------------
// CheY binding is associated with the CW/CCW switching mechanism.
// We keep it as its own ref so it can be animated independently.
const _1f4v = builder
    .download({ url: cheY_c34_a })
    .parse({ format: 'bcif' })
    .assemblyStructure({ assembly_id: '1' })
    .component({ref:'chey'})
    .transform({ ref:'cheytr', translation: cRingTranslation })
    .representation({...prot_rep, ref:'cheyrep'})
    .color(createChainColorTheme([15034341]));

// ----------------------------------------------------------------------------
// Stators: MotA/MotB rings (11 copies) — CW vs CCW assets
// ----------------------------------------------------------------------------

// These are centers/pivots for the stator ring (used later for rotation animation).
// `motabcr2` flips Z and adds a small offset; used as translation for motor start.
const motabcr=[166.8094, -52.0201, -120.2466];
const motabcr2 = [motabcr[0], motabcr[1], -motabcr[2]+30];

// CW-side MotA/MotB set with 11 models (one per stator unit).
const motAB = builder
  .download({ url: motab_c11_a })
  .parse({ format: 'bcif' });

for (let i = 0; i < 11; i++) {
  motAB
    .modelStructure({ model_index: i })
    .component({ ref: 'motab'+i.toString() })
    .transform({ ref: 'motabtr' + i.toString(), translation: [0, 0, 0] })
    .representation({...prot_rep, ref:'motabrep' + i.toString()})
    .opacity({
      ref: 'mobop'+i.toString(), opacity:1})
    .color(createChainColorTheme([16698727, 16757608, 16744577, 16737896, 16744577, 16737896, 16744577]));
}

// CCW-side MotA/MotB set with 11 models.
const motAB2 = builder
  .download({ url: motab_ccw_c11_a })
  .parse({ format: 'bcif' });

for (let i = 0; i < 11; i++) {
  motAB2
    .modelStructure({ model_index: i })
    .component({ ref: 'motab2'+i.toString() })
    .transform({ ref: 'motabtr2' + i.toString(), translation: [0, 0, 0] })
    .representation({...prot_rep, ref:'motabrep2' + i.toString()})
    .opacity({
      ref: 'mobop2'+i.toString(), opacity:1})
    .color(createChainColorTheme([16698727, 16757608, 16744577, 16737896, 16744577, 16737896, 16744577]));
}


// ----------------------------------------------------------------------------
// Big interactive “START” label → jumps to scene key `motor`
// ----------------------------------------------------------------------------
builder.primitives({
  label_background_color: 'black',
  snapshot_key: 'motor',
}).label({
  ref:'next',
  position: [350, 0, 480],
  text: 'START',
  label_size: 100.0,
  label_offset: 2.0
});

// ----------------------------------------------------------------------------
// Animation setup: global motor rotation
// ----------------------------------------------------------------------------
const anim = builder.animation({});
// timing
//0-71000 rotate everyhting slowly ?
//71000 the hook + label
//76000 the lpring + label
//85000 stator appear and glow + label
//95000 cring
//96000 machine turn rapidely
//110000 accelerate
//117000 decelerate
//126000 chey
//13000 next label
// rotate the hook

// "Real" speed can be ~18,000 RPM; here we scale for visualization.
const start_rotate = 0;
const duration_ms = 60000; // // 60 seconds animation loop
const freq = 18000/1000;   // keep your original mapping

// One full turn around Z (Euler).
const r1 = Mat3.fromEuler(Mat3.zero(), Euler.create(0, 0,  0.0), 'XYZ');
const r2 = Mat3.fromEuler(Mat3.zero(), Euler.create(0, 0,  Math.PI*2), 'XYZ');

// Objects that rotate for the left motor instance.
// NOTE: `7cgo1` is the basal-body/hook transform, `8upl1` CW C-ring, `cheytr` CheY.
const objs = ['7cgo1', '8upl1', 'cheytr'];
const hook2c = Vec3.add(Vec3.zero(), Vec3.create(333.6229, 335.3563, 303.2562), Vec3.create(500,0,0));
// Pivot points for each rotating object.
// ⚠️ Note: pivot coordinates are in the same space as the transform_matrix; ensure these
// are consistent with your applied translations.
const ob_centesr = [pdbCenters['7CGO'].center,cRingTranslation,cRingTranslation];
const freqs = [freq,-freq,-freq,-freq]


const offsetms = 96000;

//start the motor
// Rotate all left-side motor objects.
i=0;
Object.entries(objs).forEach(([key, value]) => {
  anim.interpolate({
    kind: 'transform_matrix',
    target_ref: value,
    property: 'matrix',
    pivot: ob_centesr[key], // is that local ?
    rotation_end: r1,
    rotation_start: r2,
    duration_ms: duration_ms,
    start_ms: start_rotate,
    rotation_frequency: freqs[key],
  }); 
  i++;
});

// ----------------------------------------------------------------------------
// Rotate the 11 stators (left side)
// ----------------------------------------------------------------------------
const motabcenters = {
  0: Vec3.create(166.81, -52.01, -120.15),  // #2.1
  1: Vec3.create(168.45, 46.43, -120.15),   // #2.2
  2: Vec3.create(116.61, 130.13, -120.15),  // #2.3
  3: Vec3.create(27.75, 172.51, -120.15),   // #2.4
  4: Vec3.create(-69.93, 160.13, -120.15),  // #2.5
  5: Vec3.create(-145.40, 96.90, -120.15),  // #2.6
  6: Vec3.create(-174.70, 2.91, -120.15),   // #2.7
  7: Vec3.create(-148.54, -92.00, -120.15), // #2.8
  8: Vec3.create(-75.22, -157.71, -120.15), // #2.9
  9: Vec3.create(21.98, -173.34, -120.15),  // #2.10
  10: Vec3.create(112.21, -133.94, -120.15) // #2.11
};

Object.entries(motabcenters).forEach(([key, vec]) => {
    anim.interpolate({
      kind: 'transform_matrix',
      target_ref: 'motabtr' + key.toString(),
      property: 'matrix',
      pivot: vec,
      translation_start: [vec[0],vec[1],-vec[2]+30],
      rotation_end: r1,
      rotation_start: r2,
      duration_ms: duration_ms,
      start_ms: start_rotate,
      rotation_frequency: freq * 3
    });
});


// ----------------------------------------------------------------------------
// CW-side duplicated motor (right)
// ----------------------------------------------------------------------------
// These are the right-side objects: the duplicated hook (`7cgo2`) and CCW C-ring (`8uox`).

const objs2 = ['7cgo2', '8uox'];
// Pivot points for right-side objects.
const ob_centesr2 = [pdbCenters['7CGO'].center, cRingTranslation, cRingTranslation];
// Opposite rotation direction for comparison.
const freqs2 = [-freq,freq,freq]
// Translation offsets to place the right motor instance.
const start_tr = [
  // Vec3.add(Vec3.zero(), Vec3.create(333.6229, 335.3563, 303.2562), Vec3.create(500,-250,0)),
  Vec3.create(700,-300,0),
  Vec3.create(700,-300,0),
  Vec3.create(0,0,0)];

i=0;
Object.entries(objs2).forEach(([key, value]) => {
  anim.interpolate({
    kind: 'transform_matrix',
    target_ref: value,
    property: 'matrix',
    pivot: ob_centesr2[key], // is that local ?
    translation_start: start_tr[key],
    rotation_end: r1,
    rotation_start: r2,
    duration_ms: duration_ms,
    start_ms: start_rotate,
    rotation_frequency: freqs2[key],
  }); 
  i++;
});

// ----------------------------------------------------------------------------
// Rotate the 11 stators (right side / CCW asset)
// ----------------------------------------------------------------------------

const motabcenters2 = {
 0: Vec3.create(189.86, -195.82, -110.19),  // #5.1
 1: Vec3.create(265.59, -62.08, -110.19),   // #5.2
 2: Vec3.create(256.99, 91.36, -110.19),    // #5.3
 3: Vec3.create(166.80, 215.80, -110.19),   // #5.4
 4: Vec3.create(23.65, 271.72, -110.19),    // #5.5
 5: Vec3.create(-127.00, 241.38, -110.19),  // #5.6
 6: Vec3.create(-237.34, 134.39, -110.19),  // #5.7
 7: Vec3.create(-272.32, -15.26, -110.19),  // #5.8
 8: Vec3.create(-220.84, -160.06, -110.19), // #5.9
 9: Vec3.create(-99.25, -254.05, -110.19),  // #5.10
 10: Vec3.create(53.86, -267.38, -110.19)   // #5.11
};

// This CCW dataset has a slightly different rotation axis.
const axis = Vec3.create(-0.178, 0.146, 0.973);
const r11 = Mat3.fromRotation(Mat3.zero(), 0, axis);
const r22 = Mat3.fromRotation(Mat3.zero(), Math.PI*2, axis);
Object.entries(motabcenters2).forEach(([key, vec]) => {
   anim.interpolate({
     kind: 'transform_matrix',
     target_ref: 'motabtr2' + key.toString(),
     property: 'matrix',
     pivot: vec,
     translation_start: [700+vec[0],vec[1]-300,-vec[2]+30],
     rotation_end: r11,
     rotation_start: r22,
     duration_ms: duration_ms,
     start_ms: start_rotate,
     rotation_frequency: freq * 3
   });
});
