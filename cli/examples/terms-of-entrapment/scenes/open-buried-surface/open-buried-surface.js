builder.camera({
    position: [0, 45, 0],
    target: [0, 0, 0],
    up: [0, 0, -1]
})

CanvasParams.custom.molstar_postprocessing.fog_params.intensity = 0.0;
builder.canvas(CanvasParams);

const gsize = 340;
const gsegments = 60;
const grids = generateGridLineVertices(gsize, gsegments, 0);
const gstep = gsize / gsegments;
const gvertices = grids.positions;
const gindices = grids.indices;

// getwoPlanes(builder, gvertices, gindices, 1.0);

const _sod = getSOD(builder, false, false, Mat4.identity());
const selectorA = { label_asym_id: 'A' };
const selectorB = { label_asym_id: 'B' };

const chA = _sod.component({ selector: { label_asym_id: 'A' } })
    .transform({ref:'chA', matrix:Mat4.identity()});

chA.representation({ type: 'backbone', custom: emissive})
    .opacity({ ref: 'opbackbone', opacity: 1 })
    .color({ ref: 'crepA2-color', color: '#00ff7f' })

const chB = _sod.component({ selector: { label_asym_id: 'B' } });
chB.transform({ref:'chB', matrix:Mat4.identity()})
    .representation({ type: 'backbone', custom: emissive })
    .opacity({ ref: 'opacityB2', opacity: 1})
    .color({ ref: 'crepB2-color', color: 'yellow' });

const bsize = [20,2.5,60];
const bcenter = [0,0,0];
const buriedA = buriedaa.map(num => ({
  label_asym_id: 'A',
  auth_seq_id: num
}));
const buriedB = buriedaa.map(num => ({
    label_asym_id: 'B',
    auth_seq_id: num
}));

_sod.component({ selector: buriedA })
.transform({ref:'buriedA', matrix:Mat4.identity()})
.representation({type:'surface', custom: {molstar_representation_params: {emissive: 0.0, sizeFactor:0.05, visuals: ['molecular-surface-wireframe']}}})
    .color({custom: { molstar_color_theme_name: 'element-symbol'}})
    .opacity({opacity: 0.75})
    // .clip({ ref: 'clipIA', type: 'box', center: bcenter, size: bsize, invert: true });

_sod.component({ selector: buriedB })
.transform({ref:'buriedB', matrix:Mat4.identity()})
.representation({ type: 'surface', custom: {molstar_representation_params: {emissive: 0.0, sizeFactor:0.05, visuals: ['molecular-surface-wireframe']}} })
    .color({ custom: { molstar_color_theme_name: 'element-symbol' } })
    .opacity({ opacity: 0.75 })
    // .clip({ ref: 'clipIB', type: 'box', center: bcenter, size: bsize, invert: true });


builder.primitives({
    ref: 'next',
    tooltip: 'Click for next part',
    label_opacity: 0,
    label_background_color: 'grey',    
    snapshot_key: 'asite'
})
.label({
    ref:'next_label',
    position: [0, 0, 30],
    text: 'Click me to go next',
    label_color: 'white',
    label_size: 10
});

let off = 5000;

// there is a Rock animation on the X axis
const anim = builder.animation({});

anim.interpolate({
    kind: 'scalar',
    target_ref: 'atomZn_op',
    duration_ms: 2000,
    start_ms: off,
    property: 'opacity',
    start: 1,
    end: 0,
});

anim.interpolate({
    kind: 'scalar',
    target_ref: 'atomCu_op',
    duration_ms: 2000,
    start_ms: off,
    property: 'opacity',
    start: 1,
    end: 0,
});

// animation first rotate chain B ( yellow ) on its axis
// and change color to atom color, N blue. O red and C green
anim.interpolate({
    kind: 'transform_matrix',
    target_ref: 'chB',
    property: 'matrix',
    pivot: [-14.006,  0.348,  1.185], // is that local ?
    // pivot: [0,0,0],
    translation_start:[-14.006,  0.348,  1.185],
    translation_end:[-24.006,  0.348,  1.185],
    rotation_start: Mat3.identity(),
    rotation_end: Mat3.fromEuler(Mat3.zero(), Euler.create(0.0, 0.0,  Math.PI/2), 'XYZ'),
    duration_ms: 3000,
    start_ms: 5000,
});   
anim.interpolate({
    kind: 'transform_matrix',
    target_ref: 'buriedB',
    property: 'matrix',
    pivot: [-14.006,  0.348,  1.185], // is that local ?
    // pivot: [0,0,0],
    translation_start:[-14.006,  0.348,  1.185],
    translation_end:[-24.006,  0.348,  1.185],
    rotation_start: Mat3.identity(),
    rotation_end: Mat3.fromEuler(Mat3.zero(), Euler.create(0.0, 0.0,  Math.PI/2), 'XYZ'),
    duration_ms: 3000,
    start_ms: 5000,
});   

// wait 36sec, should rock along X axis
// and hchange colors 

// then close
anim.interpolate({
    kind: 'transform_matrix',
    target_ref: 'chB',
    property: 'matrix',
    pivot: [-14.006,  0.348,  1.185], // is that local ?
    // pivot: [0,0,0],
    translation_start:[-24.006,  0.348,  1.185],
    translation_end:[-14.006,  0.348,  1.185],
    rotation_start: Mat3.fromEuler(Mat3.zero(), Euler.create(0.0, 0.0,  Math.PI/2), 'XYZ'),
    rotation_end: Mat3.identity(),
    duration_ms: 3000,
    start_ms: 43000,
});   
anim.interpolate({
    kind: 'transform_matrix',
    target_ref: 'buriedB',
    property: 'matrix',
    pivot: [-14.006,  0.348,  1.185], // is that local ?
    // pivot: [0,0,0],
    translation_start:[-24.006,  0.348,  1.185],
    translation_end:[-14.006,  0.348,  1.185],
    rotation_start: Mat3.fromEuler(Mat3.zero(), Euler.create(0.0, 0.0,  Math.PI/2), 'XYZ'),
    rotation_end: Mat3.identity(),
    duration_ms: 3000,
    start_ms: 43000,
});   

// rotate to top view
const refs = ['chA', 'buriedA', 'chB', 'buriedB'];
refs.forEach(r=>{
anim.interpolate({
    kind: 'transform_matrix',
    target_ref: r,
    property: 'matrix',
    pivot: [0,0,0],
    translation_start:[0,0,0],
    translation_end:[0,0,0],
    rotation_end: Mat3.fromEuler(Mat3.zero(), Euler.create(Math.PI/2, 0.0, 0.0), 'XYZ'),
    rotation_start: Mat3.identity(),
    duration_ms: 3000,
    start_ms: 50000,
});   
});

// TODO : change color

anim.interpolate({
    kind: 'scalar',
    target_ref: 'next',
    duration_ms: 2000,
    start_ms:53000,
    property: 'label_opacity',
    // start: 0.0,
    end: 1.0,      
});

builder.extendRootCustomState({
    molstar_on_load_markdown_commands: {
        'play-audio': 'part_10.mp3',
    }
});
