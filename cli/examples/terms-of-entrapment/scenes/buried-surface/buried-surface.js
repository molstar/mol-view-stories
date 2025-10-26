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

// pink and blue
_sod.component({selector: selectorA})
    .representation({type:'surface', custom: {molstar_representation_params: {emissive: 1.0, sizeFactor:0.05, visuals: ['molecular-surface-wireframe']}}})
    // .color({custom: { molstar_color_theme_name: 'element-symbol'}})
    .color({color:'#e64072'})
    .opacity({opacity: 0.75})
    .clip({ ref: 'clipIA', type: 'box', center: bcenter, size: bsize, invert: true });

_sod.component({ selector: selectorB })
    .representation({ type: 'surface', custom: {molstar_representation_params: {emissive: 1.0, sizeFactor:0.05, visuals: ['molecular-surface-wireframe']}} })
    // .color({custom: { molstar_color_theme_name: 'element-symbol'}})
    .color({color:'#62aec5'})
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

// residues selection to highlight
// ILE 149 - GLY 112
// GLY 112 - ILE 149
// VAL 146 - VAL 146
//try with primitives and clip
const rlabel = [{ id: 149, name: 'ILE149' },
{ id: 112, name: 'GLY112' },
{ id: 146, name: 'VAL146' }];

for (let i = 0; i < 3; i++) {
    _sod
        .primitives({ ref: rlabel[i].name, label_opacity: 0.0 })
        .label({
            position: { label_asym_id: 'A', auth_seq_id: rlabel[i].id },
            text: rlabel[i].name+'A',
            label_color: 'white',
            label_size: 2
        }
        )
        .label({
            position: { label_asym_id: 'B', auth_seq_id: rlabel[i].id },
            text: rlabel[i].name+'B',
            label_color: 'white',
            label_size: 2
        }
        );
}

// the smaller representation to show the moving slice
const tmpMatcat = Mat4.fromTranslation(Mat4.zero(), Vec3.create(20, 0, 18))
const mca = Mat4();
Mat4.mul(mca, tmpMatcat, Mat4.invert(Mat4(), Mat4.rotX90));

builder.primitives({
    ref: 'catrace',
    tooltip: 'CA atoms trace',
    opacity: 1.0,
    instances: [mca] // +Z
})
.lines(
    {
        ref:'catraceline',
        vertices: ca_coordsA,
        indices: ca_idx,
        width: 1.0,
        color: "#b9b0fa",
        // group_colors: s_colors0,
        custom: { molstar_line_params: { emissive: 1.0 } }
    }
)
.lines(
    {
        ref:'catraceline',
        vertices: ca_coordsB,
        indices: ca_idx,
        width: 1.0,
        color: "#f69336",
        // group_colors: s_colors0,
        custom: { molstar_line_params: { emissive: 1.0 } }
    }
)
const cuA = [16.246, 2.185, 4.687].map(v => v * 0.2);
const znA = [19.232, -3.270, 5.409].map(v => v * 0.2);
const cuB = [-16.260, 2.015, -4.698].map(v => v * 0.2);
const znB = [-18.991, -3.162, -5.446].map(v => v * 0.2);
// const H = [16.246, 2.185, 4.687,19.232, -3.270, 5.409,-16.260, 2.015, -4.698, -18.991, -3.162, -5.446].map(v => v * 0.2);
const r = 0.5;

builder.primitives({
    ref: 'hetats',
    tooltip: 'HETE',
    opacity: 1.0,
    instances: [mca] // +Z
})
.ellipsoid({
    center: cuA,
    major_axis: [0,1,0],
    minor_axis: [1,0,0],
    radius: [r,r,r],
    color: 'white',
})
.ellipsoid({
    center: znA,
    major_axis: [0,1,0],
    minor_axis: [1,0,0],
    radius: [r,r,r],
    color: 'white',
})
.ellipsoid({
    center: cuB,
    major_axis: [0,1,0],
    minor_axis: [1,0,0],
    radius: [r,r,r],
    color: 'white',
})
.ellipsoid({
    center: znB,
    major_axis: [0,1,0],
    minor_axis: [1,0,0],
    radius: [r,r,r],
    color: 'white',
})

const th = 0.5;
const ll = 15.0/2;
builder.primitives({
    ref: 'catracel',
    tooltip: 'CA atoms trace',
    opacity: 1.0,
    instances: [mca] // +Z
})
.lines(
     {
        ref:'clipline',
        vertices: [-ll, -th, 0.0, ll, -th, 0.0,
                   -ll, th, 0.0, ll, th, 0.0],
        indices: [0,1,2,3],
        width: 1.0,
        color: "white",
        // group_colors: s_colors0,
        custom: { molstar_line_params: { emissive: 1.0 } }
    }   
)
builder.primitives({
    ref: 'next',
    tooltip: 'Click for next part',
    label_opacity: 0,
    label_background_color: 'grey',    
    snapshot_key: 'openburied'
})
.label({
    ref:'next_label',
    position: [0,0 , 20],
    text: 'Click me to go next',
    label_color: 'white',
    label_size: 5
});


let off = 10000;

const anim = builder.animation({});
// show the ions
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

anim.interpolate({
    kind: 'scalar',
    target_ref: 'opbackbone',
    duration_ms: 3000,
    start_ms: off+1000,
    property: 'opacity',
    start: 1,
    end: 0,
});

anim.interpolate({
    kind: 'scalar',
    target_ref: 'opacityB2',
    duration_ms: 3000,
    start_ms: off+1000,
    property: 'opacity',
    start: 1,
    end: 0,
});

// off += 2000;
//animate the box size first ? 
let top = 0;
let bot = 0;
const clips = ['clipIA','clipIB','clipA','clipB'];
const durms = 7000;
// foreach add animation to interpolate along Y axis
// and sync with the alternate view showing the slice
for (let i = 0; i < 4; i++) {
    // the clip
    anim.interpolate({
        kind: 'scalar',
        ref: 'clip-transition',
        target_ref: clips[i],
        start_ms:off+5000,
        duration_ms: durms,
        property: ['center', 1],
        start: 0,
        end: -9,
    });
    // the clip line
    top = 0 * 0.2;
    bot = -9 * 0.2;
    anim.interpolate({
        kind: 'vec3',
        target_ref: 'clipline',
        duration_ms: durms,
        start_ms: off+5000,
        property: 'vertices',
        start: [-ll, -th + top, 0.0, ll, -th + top, 0.0,
            -ll, th + top, 0.0, ll, th + top, 0.0],
        end: [-ll, -th + bot, 0.0, ll, -th + bot, 0.0,
            -ll, th + bot, 0.0, ll, th + bot, 0.0],
    });
    // the clip
    anim.interpolate({
        kind: 'scalar',
        ref: 'clip-transition',
        target_ref: clips[i],
        start_ms: off + 5000+durms,
        duration_ms: durms,
        property: ['center', 1],
        start: -9,
        end: -4,
    });
    // the clip line
    top = -9 * 0.2;
    bot = -4 * 0.2;
    anim.interpolate({
        kind: 'vec3',
        target_ref: 'clipline',
        duration_ms: durms,
        start_ms: off + 5000+durms,
        property: 'vertices',
        start: [-ll, -th + top, 0.0, ll, -th + top, 0.0,
            -ll, th + top, 0.0, ll, th + top, 0.0],
        end: [-ll, -th + bot, 0.0, ll, -th + bot, 0.0,
            -ll, th + bot, 0.0, ll, th + bot, 0.0],
    });
    // the clip
    anim.interpolate({
        kind: 'scalar',
        ref: 'clip-transition',
        target_ref: clips[i],
        start_ms: off + 5000+durms*2+2000,
        duration_ms: durms,
        property: ['center', 1],
        start: -4,
        end: 2,
    });      
    // the clip line
    top = -4 * 0.2;
    bot = 2 * 0.2;
    anim.interpolate({
        kind: 'vec3',
        target_ref: 'clipline',
        duration_ms: durms,
        start_ms: off + 5000+durms*2+2000,
        property: 'vertices',
        start: [-ll, -th + top, 0.0, ll, -th + top, 0.0,
            -ll, th + top, 0.0, ll, th + top, 0.0],
        end: [-ll, -th + bot, 0.0, ll, -th + bot, 0.0,
            -ll, th + bot, 0.0, ll, th + bot, 0.0],
    });
    // the clip  
    anim.interpolate({
        kind: 'scalar',
        ref: 'clip-transition',
        target_ref: clips[i],
        start_ms: off + 5000+durms*3+3000,
        duration_ms: durms,
        property: ['center', 1],
        start: 2,
        end: 6,
    });
    // the clipe line
    top = 2 * 0.2;
    bot = 6 * 0.2;
    anim.interpolate({
        kind: 'vec3',
        target_ref: 'clipline',
        duration_ms: durms,
        start_ms: off + 5000+durms*3+3000,
        property: 'vertices',
        start: [-ll, -th + top, 0.0, ll, -th + top, 0.0,
            -ll, th + top, 0.0, ll, th + top, 0.0],
        end: [-ll, -th + bot, 0.0, ll, -th + bot, 0.0,
            -ll, th + bot, 0.0, ll, th + bot, 0.0],
    });
}   

anim.interpolate({
    kind: 'scalar',
    target_ref: rlabel[0].name,
    duration_ms: 6000,
    start_ms: off + 4000 + durms * 2,
    frequency: 2,
    alternate_direction: true,    
    property: 'label_opacity',    
    start: 0.0,
    end: 1.0});

anim.interpolate({
    kind: 'scalar',
    target_ref: rlabel[1].name,
    duration_ms: 6000,
    start_ms: off + 4000 + durms * 2,
    frequency:2,
    alternate_direction: true,
    property: 'label_opacity',
    start: 0.0,
    end: 1.0
});


anim.interpolate({
    kind: 'scalar',
    target_ref: rlabel[2].name,
    duration_ms: 6000,
    start_ms: off + 4000 + durms * 3,
    frequency: 2,
    alternate_direction: true,    
    property: 'label_opacity',
    start: 0.0,
    end: 1.0
});

anim.interpolate({
    kind: 'scalar',
    target_ref: 'next',
    duration_ms: 2000,
    start_ms: off + 10000 + durms * 3,
    property: 'label_opacity',
    // start: 0.0,
    end: 1.0,      
});

builder.extendRootCustomState({
    molstar_on_load_markdown_commands: {
        'play-audio': 'part_09.mp3',
    }
});