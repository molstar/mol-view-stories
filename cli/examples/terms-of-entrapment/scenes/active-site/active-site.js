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

_sod.component({ selector: { label_asym_id: 'A' } })
    .transform({})
    .representation({ type: 'backbone', custom: emissive})
    .opacity({ ref: 'opbackbone', opacity: 1 })
    .color({ ref: 'crepA2-color', color: '#00ff7f' })

_sod.component({ selector: { label_asym_id: 'B' } })
    .transform({})
    .representation({ type: 'backbone', custom: emissive })
    .opacity({ ref: 'opacityB2', opacity: 1})
    .color({ ref: 'crepB2-color', color: 'yellow' });

// const selectorA = buriedaa.map(num => ({
//   label_asym_id: 'A',
//   auth_seq_id: num
// }));
// const selectorB = buriedaa.map(num => ({
//     label_asym_id: 'B',
//     auth_seq_id: num
// }));

const selectorA = { label_asym_id: 'A' };
const selectorB = { label_asym_id: 'B' };

const bsize = [20,2.5,60];
const bcenter = [0,0,0];

_sod.component({selector: selectorA})
    .representation({type:'surface', custom: {molstar_representation_params: {emissive: 0.0, sizeFactor:0.05, visuals: ['molecular-surface-wireframe']}}})
    .color({custom: { molstar_color_theme_name: 'element-symbol'}})
    .opacity({opacity: 0.75})
    .clip({ ref: 'clipIA', type: 'box', center: bcenter, size: bsize, invert: true });

_sod.component({ selector: selectorB })
    .representation({ type: 'surface', custom: {molstar_representation_params: {emissive: 0.0, sizeFactor:0.05, visuals: ['molecular-surface-wireframe']}} })
    .color({ custom: { molstar_color_theme_name: 'element-symbol' } })
    .opacity({ opacity: 0.75 })
    .clip({ ref: 'clipIB', type: 'box', center: bcenter, size: bsize, invert: true });

_sod.component({selector: {label_asym_id: 'A'}})
    .representation({type:'line', custom: emissive})
    .color({custom: { molstar_color_theme_name: 'element-symbol'}})
    .opacity({opacity: 0.75})
    .clip({ ref: 'clipA', type: 'box', center: bcenter, size: bsize, invert: true });
_sod.component({ selector: {label_asym_id: 'B'} })
    .representation({ type: 'line', custom: emissive})
    .color({ custom: { molstar_color_theme_name: 'element-symbol' } })
    .opacity({ opacity: 0.75 })
    .clip({ ref: 'clipB', type: 'box', center: bcenter, size: bsize, invert: true });

// circle start big and scale down to the CU position

const cuA = [16.246, 2.185, 4.687];
const cuB = [-16.260, 2.015, -4.698];

const znA = [19.232, -3.270, 5.409];
const znB = [-18.991, -3.162, -5.446];

const c3 = makeCircle(2.5, 50, Vec3.create(16.246, 2.185, 4.687), 1);

const c4 = makeCircle(2.5, 50, Vec3.create(-16.260, 2.015, -4.698), 1);

const c1 = makeCircle(2.5*3, 50, Vec3.create(16.246, 2.185, 9.687), 1);

const c2 = makeCircle(2.5*3, 50, Vec3.create(-16.260, 2.015, -9.698), 1);

builder.primitives({
    ref: 'circles',
    tooltip: "circles",
    opacity: 1.0
})
.lines(
    {
        ref:'circle1',
        vertices: c1.positions,
        indices: c1.indices,
        width: 1.0,
        color: "#ff0000",
        custom: { molstar_line_params: { emissive: 1.0 } }
    }
)
.lines(
    {
        ref:'circle2',
        vertices: c2.positions,
        indices: c2.indices,
        width: 1.0,
        color: "#ff0000",
        custom: { molstar_line_params: { emissive: 1.0 } }
    }
)

// now the label distance
_sod.primitives({ ref: 'dist', label_opacity: 0.0 })
                .distance({
                    start: { label_asym_id: 'E', auth_seq_id: 152, atom_id: 2191 },
                    end: { label_asym_id: 'G', auth_seq_id: 152, atom_id: 2193 },
                    radius: 0.2,
                    color:'orange',
                    label_color:'orange',
                    dash_length: 0.1,
                    label_size: 5,
                })

builder.primitives({
    ref: 'next',
    tooltip: 'Click for next part',
    label_opacity: 0,
    label_background_color: 'grey',    
    snapshot_key: 'electrosurf'
})
.label({
    ref:'next_label',
    position: [0, 0, 30],
    text: 'Click me to go next',
    label_color: 'white',
    label_size: 10
});

let off = 0;
const anim = builder.animation({});

anim.interpolate({
    kind: 'scalar',
    target_ref: 'atomZn_op',
    duration_ms: 100,
    start_ms: off,
    property: 'opacity',
    start: 0,
    end: 1,
});

anim.interpolate({
    kind: 'scalar',
    target_ref: 'atomCu_op',
    duration_ms: 100,
    start_ms: off,
    property: 'opacity',
    start: 0,
    end: 1,
});

anim.interpolate({
    kind: 'vec3',
    target_ref: 'circle1',
    duration_ms: 5000, // 1 second
    start_ms: 2000,
    property: 'vertices',
    end: c3.positions,
});
    anim.interpolate({
    kind: 'vec3',
    target_ref: 'circle2',
    duration_ms: 5000, // 1 second
    start_ms: 2000,
    property: 'vertices',
    end: c4.positions,
});

anim.interpolate({
    kind: 'scalar',
    target_ref: 'dist',
    duration_ms: 2000,
    start_ms: 7000,
    property: 'opacity',
    start: 0,
    end: 1,
});

anim.interpolate({
    kind: 'scalar',
    target_ref: 'dist',
    duration_ms: 2000,
    start_ms: 12000,
    property: 'opacity',
    start: 1,
    end: 0,
});

anim.interpolate({
    kind: 'scalar',
    target_ref: 'dist',
    duration_ms: 2000,
    start_ms: 7000,
    property: 'label_opacity',
    start: 0,
    end: 1,
});

anim.interpolate({
    kind: 'scalar',
    target_ref: 'dist',
    duration_ms: 2000,
    start_ms: 12000,
    property: 'label_opacity',
    start: 1,
    end: 0,
});

anim.interpolate({
    kind: 'scalar',
    target_ref: 'next',
    duration_ms: 2000,
    start_ms:14000,
    property: 'label_opacity',
    // start: 0.0,
    end: 1.0,      
});

builder.extendRootCustomState({
    molstar_on_load_markdown_commands: {
        'play-audio': 'part_11.mp3',
    }
});


