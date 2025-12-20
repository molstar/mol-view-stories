/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Ludovic Autin <autin@scripps.edu>
 */
// Start typing 'builder' to create a new scene
// Mol* library functions: Vec3, Mat3, Mat4, Quat, Euler, decodeColor, MolScriptBuilder, formatMolScript


builder.extendRootCustomState({
  molstar_on_load_markdown_commands: {
    'play-audio': 'mom300_part2.mp3',
  }
});

const ce = Vec3.negate(Vec3(), pdbCenters['7CGO'].center);

const { fullSel:fs, oddSel:o1, evenSel:o2 } = buildSelectors(chains7CGO, ['1','2', '3', '4','5', '6','7','8','9','10','11','12','13','14']);

const { fullSel:hook, oddSel:h1, evenSel:h2 } = buildSelectors(chains7CGO, ['7','8']);

const _7cgo = structure(builder, '7CGO');
_7cgo.component({...fs, ref:'hook'})
    .transform({ref:'7cgo1'})
  .representation({...prot_rep, ref:'hookrep'})
  .color(createChainColorTheme([8427006, 8303358]));

const { fullSel:fs2, oddSel:o3, evenSel:o4 }= buildSelectors(chains7CGO, ["15",'16']);

_7cgo.component({...fs2, ref:'lpring'})
  .transform({ translation: ce })
  .representation({...prot_rep, ref:'lpringrep'})
  .color(createChainColorTheme([10023293, 8450714]));

//CRing

const { fullSel:cring, oddSel:p1, evenSel:p2 } = buildSelectors(chains8UPL, ['1','2','3','4']);
const cr = Vec3.create(0, 0, -250);

const _8upl = builder
  .download({ url: '8upl_centered.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure()
  .component({})
  .transform({ ref: '8upl1', translation: cr })
  .representation({...prot_rep, ref:'cringrep'})
  .color(createChainColorTheme([8427006, 8303358]))
  .opacity({ref:'cringop', opacity:0.0});
  
// center 
// const crcenter = [-425.9787, -425.9856, -434.4256+100];
const _8uox = builder
  // .download({ url: pdbUrl('8uox') })
  .download({ url: '8UOX.bcif' })
  .parse({ format: 'bcif' })
  .assemblyStructure({ assembly_id: '1' })
  .component({})
  .transform({ ref: '8uox', translation: cr })
  .representation({...prot_rep, ref:'cringrep2'})
  .color(createChainColorTheme([8427006, 8303358]))
  .opacity({ref:'cringop2', opacity:1.0});

const _1f4v = builder
    .download({ url: '1F4V_C34a.bcif' })
    .parse({ format: 'bcif' })
    .assemblyStructure({ assembly_id: '1' })
    .component({ref:'chey'})
    .transform({ ref:'cheytr', translation: cr })
    .representation({...prot_rep, ref:'cheyrep'})
    .color(createChainColorTheme([15034341]))
    .opacity({ref:'cheyop', opacity:0.0});

const motAB = builder
  .download({ url: 'motab_c11m.bcif' })
  .parse({ format: 'bcif' });

for (let i = 0; i < 11; i++) {
  motAB
    .modelStructure({ model_index: i })
    .component({ ref: 'motab'+i.toString() })
    .transform({ ref: 'motabtr' + i.toString(), translation: [0, 0, 0] })
    .representation({...prot_rep, ref:'motabrep' + i.toString()})
    .opacity({
      ref: 'mobop'+i.toString(), opacity:0})
    .color(createChainColorTheme([16698727, 16757608, 16744577, 16737896, 16744577, 16737896, 16744577]));
}

const motAB2 = builder
  .download({ url: 'motabccw_c11m.bcif' })
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

builder.primitives({
  label_background_color: 'black',
  snapshot_key: 'explore',
}).label({
  ref:'next',
  position: [0, 0, 480],
  text: 'Click to go next ',
  label_size: 100.0,
  label_offset: 2.0
});

const anim = builder.animation({});
// timing
// 10000 start rotation CCW
// end rotation
// 48000 Cring
// 51000 stator
// 65000 chey bind pause rotation
// 69000 othe cring
// 72000 stator switch
// 78000 new rotation CW
// 80000 click for next
const start_rotate = 10000;
const duration_ms = 10000; // 1minute here
const rate = 18000/60000;
const freq = Math.round((rate*duration_ms)/1000);
const r1 = Mat3.fromEuler(Mat3.zero(), Euler.create(0, 0,  0.0), 'XYZ');
const r2 = Mat3.fromEuler(Mat3.zero(), Euler.create(0, 0,  Math.PI*2), 'XYZ');
//CW
//new rotation CW
const start_rotate2 = 44000;
const duration_ms2 = 15000;
const freq2 = Math.round((rate*duration_ms2)/1000);
const objs = ['7cgo1', '7cgo2', '8upl1', 'cheytr'];
const ob_centesr = [pdbCenters['7CGO'].center,pdbCenters['7CGO'].center,cr,cr];
const freqs = [freq2,freq2,-freq2,-freq2, freq2]

//CCW
const objs2 = ['7cgo1', '7cgo2', '8uox'];
const ob_centesr2 = [pdbCenters['7CGO'].center,pdbCenters['7CGO'].center,cr,cr];
const freqs2 = [-freq,-freq,freq]

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

// 10000 start rotation CCW
let i=0;
Object.entries(objs2).forEach(([key, value]) => {
  anim.interpolate({
    kind: 'transform_matrix',
    target_ref: value,
    property: 'matrix',
    pivot: ob_centesr2[key], // is that local ?
    rotation_end: r1,
    rotation_start: r2,
    duration_ms: duration_ms,
    start_ms: start_rotate,
    rotation_frequency: freqs2[key],
  }); 
  i++;
});

const chya = 46000;
const tr = 2000;

//here the axis is a little different 
const axis = Vec3.create(-0.178, 0.146, 0.973);
const r11 = Mat3.fromRotation(Mat3.zero(), 0, axis);
const r22 = Mat3.fromRotation(Mat3.zero(), Math.PI*2, axis);
Object.entries(motabcenters2).forEach(([key, vec]) => {
    anim.interpolate({
      kind: 'transform_matrix',
      target_ref: 'motabtr2' + key.toString(),
      property: 'matrix',
      pivot: vec,
      translation_start: [vec[0],vec[1],-vec[2]+30],
      rotation_end: r11,
      rotation_start: r22,
      duration_ms: duration_ms,
      start_ms: start_rotate,
      rotation_frequency: freq * 3
    });
  anim.interpolate(makeEmissivePulse('motabrep2' + i.toString(), 30000, 3000, 2));
  // disappear
  anim.interpolate({
    kind: 'scalar',
    target_ref: 'mobop2' + key.toString(),
    duration_ms: tr,
    start_ms: chya + 3 * tr,
    property: 'opacity',
    start: 1.0,
    end: 0.0,
  });
});
// Cring 
anim.interpolate(makeEmissivePulse('cringrep2', 27000, 3000, 2));
//


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
  start_ms: chya + 2*tr,
  property: 'opacity',
  start: 0.0,
  end: 1.0,
});


//new rotation
i = 0;
Object.entries(objs).forEach(([key, value]) => {
  anim.interpolate({
    kind: 'transform_matrix',
    target_ref: value,
    property: 'matrix',
    pivot: ob_centesr[key], // is that local ?
    rotation_end: r1,
    rotation_start: r2,
    duration_ms: duration_ms2,
    start_ms: chya + 4 * tr,
    rotation_frequency: freqs[key],
  });
  i++;
});

Object.entries(motabcenters).forEach(([key, vec]) => {
    // appear
    anim.interpolate({
      kind: 'scalar',
      target_ref: 'mobop' + key.toString(),
      duration_ms: 1,
      start_ms: chya + 3 * tr,
      property: 'opacity',
      start: 0.0,
      end: 1.0,
    });
    // rotate
    anim.interpolate({
      kind: 'transform_matrix',
      target_ref: 'motabtr' + key.toString(),
      property: 'matrix',
      pivot: vec,
      translation_start: [vec[0],vec[1],-vec[2]+30],
      rotation_end: r1,
      rotation_start: r2,
      duration_ms: duration_ms2,
      start_ms: chya + 4 * tr,
      rotation_frequency: freq2 * 3
    });
});

//illuminate the different part as they go
// //ref, start, durantion, freq
// anim.interpolate(makeEmissivePulse('hookrep',71000, 6000, 6));
// anim.interpolate(makeEmissivePulse('lpringrep',76000, 6000, 6));
// anim.interpolate(makeEmissivePulse('cheyrep',126000, 6000, 6));
// anim.interpolate(makeEmissivePulse('cringrep',95000, 6000, 6));

anim.interpolate({
  kind: 'vec3',
  target_ref: 'next',
  duration_ms: 200,
  start_ms: 55000,
  property: 'position',
  start: [0, 0, 680],
  end: [0, 0, 480],
});