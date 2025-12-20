/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Ludovic Autin <autin@scripps.edu>
 */
// Start typing 'builder' to create a new scene
// Mol* library functions: Vec3, Mat3, Mat4, Quat, Euler, decodeColor, MolScriptBuilder, formatMolScript


builder.extendRootCustomState({
  molstar_on_load_markdown_commands: {
    'play-audio': 'mom300_part1.mp3',
  }
});

// builder.camera({
//   position: [-125.34, 906.01, -72.98],
//   target: [1.76, -10.91, 80.72],
//   up: [0.0, -0.2, -1.0],
//   ref:'camera'
// });

const ce = Vec3.negate(Vec3(), pdbCenters['7CGO'].center);

const { fullSel:fs, oddSel:o1, evenSel:o2 } = buildSelectors(chains7CGO, ['1','2', '3', '4','5', '6','7','8','9','10','11','12','13','14']);

const { fullSel:hook, oddSel:h1, evenSel:h2 } = buildSelectors(chains7CGO, ['7','8']);

const _7cgo = structure(builder, '7CGO');
_7cgo.component({...fs, ref:'hook'})
    .transform({ref:'7cgo1'})
  .representation({...prot_rep, ref:'hookrep'})
  .color(createChainColorTheme([8427006, 8303358]));

builder.primitives({
  label_attachment: 'middle-left',
  label_show_tether: true,
  label_tether_length: 2,
  label_background_color: '#406C9A',
})
  .label({
    position: [20,0,-130],
    text: 'flagellar hook',
    label_size: 70.0,
    label_offset: 2.0
  })

builder.primitives({
  label_attachment: 'middle-left',
  label_show_tether: true,
  label_tether_length: 2,
  label_background_color: '#93E3A4',
})
  .label({
    position: [20,20,0],
    text: 'LP-ring',
    label_size: 70.0,
    label_offset: 2.0
  })


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
  .component({ref:'cring'})
  .transform({ ref: '8upl1', translation: cr })
  .representation({...prot_rep, ref:'cringrep'})
  .color(createChainColorTheme([8427006, 8303358]));

builder.primitives({
  label_attachment: 'top-left',
  label_show_tether: true,
  label_tether_length: 4,
  label_background_color: '#406C9A',
})
  .label({
    position: [20, 0, 300],
    text: 'C-ring',
    label_size: 70.0,
    label_offset: 2.0
  })

builder.primitives({
  label_attachment: 'middle-left',
  label_show_tether: true,
  label_tether_length: 4,
  label_background_color: '#AD50A0',
})
  .label({
    position: [20, 0, 250],
    text: 'CheY',
    label_size: 70.0,
    label_offset: 2.0
  })

const _1f4v = builder
    .download({ url: '1F4V_C34a.bcif' })
    .parse({ format: 'bcif' })
    .assemblyStructure({ assembly_id: '1' })
    .component({ref:'chey'})
    .transform({ ref:'cheytr', translation: cr })
    .representation({...prot_rep, ref:'cheyrep'})
    .color(createChainColorTheme([15034341]));


const motabcr=[166.8094, -52.0201, -120.2466];
const motabcr2 = [motabcr[0], motabcr[1], -motabcr[2]+30];

const motAB = builder
  .download({ url: 'motab_c11m.bcif' })
  .parse({ format: 'bcif' });
// const _motab0 = motAB
//     .modelStructure({model_index:0})
//     .component({ref:'motab0'})
//     .transform({ ref:'motab0tr', translation: [0,0,0] })
//     .representation({...prot_rep, ref:'matab0rep'})
//    .color(createChainColorTheme([16698727, 16757608, 16744577, 16737896, 16744577, 16737896, 16744577]));

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

builder.primitives({
  label_attachment: 'middle-left',
  label_show_tether: true,
  label_tether_length: 4,
  label_background_color: '#ff8081',
})
  .label({
    position: [20, 30, 120],
    text: 'stator',
    label_size: 70.0,
    label_offset: 2.0
  })

// outer membrane #dedede
// peptidoglycan. #defbe7
// inner membrane  #dedede
builder.primitives({
  label_background_color: '#dedede'
}).label({
  position: [0, 0, -20],
  text: '  outer membrane                                             ',
  label_size: 80.0,
  label_offset: 2.0
});

builder.primitives({
  label_background_color: '#defbe7'
}).label({
  position: [0, 0, 80],
  text: '  peptidoglycan                                                       ',
  label_size: 80.0,
  label_offset: 2.0
});

builder.primitives({
  label_background_color: '#dedede'
}).label({
  position: [0, 0, 160],
  text: '  inner membrane                                                         ',
  label_size: 80.0,
  label_offset: 2.0
});

builder.primitives({
  label_background_color: 'black',
  snapshot_key: 'switch',
}).label({
  ref:'next',
  position: [0, 0, 480],
  text: 'Click to go next ',
  label_size: 100.0,
  label_offset: 2.0
});

const anim = builder.animation({
  include_camera:false
});
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
// in reality 18,000 revolutions per minute
const start_rotate = 96000;
const duration_ms = 30000; // 1minute here
const freq = (duration_ms/60000) * (18000/1000);
const r1 = Mat3.fromEuler(Mat3.zero(), Euler.create(0, 0,  0.0), 'XYZ');
const r2 = Mat3.fromEuler(Mat3.zero(), Euler.create(0, 0,  Math.PI*2), 'XYZ');
const objs = ['7cgo1', '7cgo2', '8upl1', 'cheytr'];
const ob_centesr = [pdbCenters['7CGO'].center,pdbCenters['7CGO'].center,cr,cr];
const freqs = [freq,freq,-freq,-freq]

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


// target stays fixed:
const TARGET = [1.76, -10.91, 80.72];

// eight camera positions around TARGET (same radius, rotated about 'up'):
const CAM_RING = [
  [-125.340,  906.010,  -72.980], // i=0 (your initial)
  [ 569.002,  729.306,  -23.381],
  [ 931.090,  118.841,   86.252],
  [ 748.818, -567.784,  191.699],
  [ 128.958, -928.352,  231.189],
  [-565.384, -751.648,  181.590],
  [-927.472, -141.183,   71.956],
  [-745.200,  545.442,  -33.490],
  [-125.340,  906.010,  -72.980], 
];
// move arround the camera 
// let t = 0;
// const N = CAM_RING.length;
// const durationMs = 6000;
// const F = 1;
// for (let j = 0; j < F; j++){
//   for (let i = 0; i < N; i++){
//     const a = CAM_RING[i];
//     const b = CAM_RING[(i + 1) % N];
//     anim.interpolate({
//       target_ref: 'camera',
//       property: 'position',
//       kind: 'vec3',
//       start_ms: t,
//       duration_ms: durationMs,
//       start: a,
//       end: b,
//     });
//     t += durationMs;
//   }
// }

const offsetms = 96000;

//start the motor
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
      start_ms: offsetms,
      rotation_frequency: freq * 3
    });
    //makeEmissivePulse
    anim.interpolate(makeEmissivePulse('motabrep' + key.toString(),85000, 3000, 4));
});

//illuminate the different part as they go
//ref, start, durantion, freq
anim.interpolate(makeEmissivePulse('hookrep',71000, 3000, 4));
anim.interpolate(makeEmissivePulse('lpringrep',76000, 3000, 4));
anim.interpolate(makeEmissivePulse('cheyrep',105000, 3000, 4));
anim.interpolate(makeEmissivePulse('cringrep',93000, 3000, 4));

anim.interpolate({
  kind: 'vec3',
  target_ref: 'next',
  duration_ms: 200,
  start_ms: 110000,
  property: 'position',
  start: [0, 0, 680],
  end: [0, 0, 480],
});