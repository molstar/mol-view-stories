CanvasParams.custom.molstar_postprocessing.fog_params.intensity = 0.0;
builder.canvas(CanvasParams);

const label_size = 2.0;
const snap_duration = 6000
const snap_duration2 = 6000

const gsize = 340;
const gsegments = 60;
const grids = generateGridLineVertices(gsize, gsegments, 0);
const gstep = gsize / gsegments;
const gvertices = grids.positions;
const gindices = grids.indices;

builder.primitives({
    ref: 'plane1',
    tooltip: "Top Plane",
    opacity: 1.0,
    instances: [Mat4.fromTranslation(Mat4.zero(), Vec3.create(0, 42.5, 0))]
})
.lines({
    vertices: gvertices,
    indices: gindices,
    width: 1.0,
    color: "#b9b0fa",
    custom: { molstar_line_params: { emissive: 1.0 } }
});

builder.primitives({
    ref: 'plane2',
    tooltip: "Bottom Plane",
    opacity: 1.0,
    instances: [Mat4.fromTranslation(Mat4.zero(), Vec3.create(0, -42.5, 0))]
})
.lines({
    vertices: gvertices,
    indices: gindices,
    width: 1.0,
    color: "#b9b0fa",
    custom: { molstar_line_params: { emissive: 1.0 } }
});

const _2c9v = getSOD(builder, false, true);
builder.primitives({
    ref: 'next',
    tooltip: 'Click for next part',
    label_background_color: 'grey',
    label_opacity: 1,
    snapshot_key: 'ions'
})
.label({
    ref:'next_label',
    position: [0, -400, 0.25],
    text: 'Click me to go next',
    label_color: 'white',
    label_size: label_size * 5
});

const anim = builder.animation(
    {
        custom: {
        molstar_trackball: {
            name: 'off',
            // params: { speed: -0.05 },
        }
    }}
);

anim.interpolate({
    kind: 'transform_matrix',
    target_ref: 'plane1',
    property: ['instances', 0],
    // translation_from: [0.0,0.0,-200.0],
    // translation_to: [0.0,0.0,-400.0],
    pivot: [0, 0, 0], // is that local ? 
    rotation_end: Mat3.fromEuler(Mat3.zero(), Euler.create(-Math.PI / 2, 0, 0), 'XYZ'),
    rotation_start: Mat3.identity(),
    start_ms:1000,
    duration_ms: snap_duration/3,
});

anim.interpolate({
    kind: 'transform_matrix',
    target_ref: 'plane2',
    property: ['instances', 0],
    // translation_from: [0.0,0.0,200.0],
    // translation_to: [0.0,0.0,400.0],
    pivot: [0, 0, 0], // is that local ? 
    rotation_end: Mat3.fromEuler(Mat3.zero(), Euler.create(+Math.PI / 2, 0, 0), 'XYZ'),
    rotation_start: Mat3.identity(),
    start_ms: 1000,
    duration_ms: snap_duration/3,
});
// sod arrived from far away in Z,
anim.interpolate({
    kind: 'transform_matrix',
    target_ref: 'xformA',
    property: 'matrix',
    // scale_start: [0.001, 0.001, 0.001],
    // scale_end : [1.0, 1.0, 1.0],    
    translation_start: [0.0,0.0,-200.0],
    translation_end: [0.0,0.0,0.0],
    pivot: [0, 0, 0], // is that local ?
    rotation_end: Mat3.fromEuler(Mat3.zero(), Euler.create(0, 0, 0), 'XYZ'),
    rotation_start: Mat3.fromEuler(Mat3.zero(), Euler.create(0, Math.PI, 0.0), 'XYZ'),
    // rotation_frequency: 3,
    // rotation_alternate_direction: false,
    duration_ms: snap_duration,
    start_ms: 0,
});
anim.interpolate({
    kind: 'transform_matrix',
    target_ref: 'xformB',
    property: 'matrix',
    // scale_start: [0.001,0.001,0.001],
    // scale_end : [1.0,1.0,1.0],
    translation_start: [0.0,0.0,-200.0],
    translation_end: [0.0,0.0,0.0],
    pivot: [0, 0, 0], // is that local ?
    rotation_end: Mat3.fromEuler(Mat3.zero(), Euler.create(0, 0, 0), 'XYZ'),
    rotation_start: Mat3.fromEuler(Mat3.zero(), Euler.create(0, Math.PI,  0.0), 'XYZ'),
    //rotation_frequency: 3,
    //rotation_alternate_direction: false,
    duration_ms: snap_duration,
    start_ms: 0,
});        

// anim.interpolate({
//     kind: 'color',
//     target_ref: 'crepA-color',
//     duration_ms: snap_duration,
//     start_ms: snap_duration / 2,
//     property: 'color',
//     end:'white'
// });
// anim.interpolate({
//     kind: 'color',
//     target_ref: 'crepB-color',
//     duration_ms: snap_duration,
//     start_ms: snap_duration / 2,
//     property: 'color',
//     end: 'white',
// });
// then surface opactity appears.
anim.interpolate({
    kind: 'scalar',
    target_ref: 'surf_opacityA',
    duration_ms: 2000,
    start_ms: 5000,
    property: 'opacity',
    end: 0.5,
});
anim.interpolate({
    kind: 'scalar',
    target_ref: 'surf_opacityB',
    duration_ms: 2000,
    start_ms: 5000,
    property: 'opacity',
    end: 0.5,
});
anim.interpolate({
    kind: 'vec3',
    target_ref: 'next_label',
    duration_ms: snap_duration,
    start_ms: snap_duration / 2,
    property: 'position',
    start: [0, -400, 0.25],
    end: [0, -40, 0.25],
});

builder.extendRootCustomState({
  molstar_on_load_markdown_commands: {
    'play-audio': 'part_02.mp3',
  }
});
