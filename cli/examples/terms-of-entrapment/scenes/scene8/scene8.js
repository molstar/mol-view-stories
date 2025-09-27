// here we go back to chain A, but only show the beta barrel...is this need residue selection or secondary structure ? 
//14.0, 0.3, 124.7]
// [14.0, 0.3, 0.0]
builder.camera({
    position:[10,40,-4],
    target:[14,0,-4],
    up:[0,0,-1]})

const box_clip = { ref: 'clip', type: 'box', center: [15.0, 0.0, 0.0], size: [100.0, 50.0, 100.0], invert:true };
const th = 1.5;
const bsize = [100.0, th*2.0, 100.0];

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

// const m1 = Mat4.fromPlane(Mat4.identity(), Vec3.create(0,0,0),Vec3(0,0,0.0)); 
// const m2 = Mat4.fromPlane(Mat4.identity(), Vec3.create(0, 0, 0), Vec3(0, 0, 0.0));

const tmpMat = Mat4.fromTranslation(Mat4.zero(), Vec3.create(0, 42.5, 0))
const m1 = Mat4();
Mat4.mul(m1, tmpMat, Mat4.rotX90);

const tmpMat2 = Mat4.fromTranslation(Mat4.zero(), Vec3.create(0, -42.5, 0));

const m2 = Mat4();
Mat4.mul(m2, tmpMat2, Mat4.rotX90);

const r30 = Mat4.fromEuler(Mat4.zero(), Euler.create(30 * Math.PI / 180, 0, 0), 'XYZ');
const m3 = Mat4();
Mat4.mul(m3, m2, r30);

builder.primitives({
    ref: 'next',
    tooltip: 'Click for next part',
    label_background_color: 'grey',
    label_opacity: 0,
    snapshot_key: 'dimer'
})
    .label({
        ref: 'next_label',
        position: [0, 0, 10.0],
        text: 'Click me to go next',
        label_color: 'white',
        label_size: label_size * 2
    });

const _sod = getSOD(builder, false, false, Mat4.identity());

// component should be only beta barrel
// by resdiue range ? 
const _sod_b = _sod.component({ selector: { label_asym_id: 'A' } })
    .transform({
        ref: 'xformB2',
        matrix: Mat4.identity(),
    });


const s_colors = ['lightgreen', 'lightblue', 'indianred', 'lightyellow', 'lightyellow', 'indianred', 'lightblue', 'lightgreen'];
for (let i=0;i<8;i++){
    const b = _sod.component({selector:{label_asym_id: 'A', beg_auth_seq_id:strands[2*i],end_auth_seq_id:strands[2*i+1]}});
    b
    .representation({
            ref: 'b' + i.toString(), type: 'surface', surface_type: 'gaussian',
            custom: {
            molstar_reprepresentation_params:{
                    quality: 'high',
                    sizeFactor: 0.1,
                    visuals: ['gaussian-surface-wireframe'],
                    emissive: 0.5
            }
        }})
    .opacity({ref:'oB'+i.toString(),opacity:1.0})
    .color({ color: s_colors [i]})
    .clip({ ref: 'b2clip' + i.toString(), type: 'box', center: [15.0, 0.0, 0.0], size: bsize, invert: true });
    b.representation({ ref: 'crepB2', type: 'ball_and_stick'})
    .color({
         custom: {
             molstar_color_theme_name: 'element-symbol',
     }})    
    .clip({ ref: 'bs2clip' + i.toString(), type: 'box', center: [15.0, 0.0, 0.0], size: bsize, invert: true });
}

//try with primitives and clip
const rlabel = [{ id: 18, name: 'ILE18' },
{ id: 43, name: 'PHE43' },
{ id: 33, name: 'ILE33' },
{ id: 117, name: 'VAL117' }];

for (let i = 0; i < 4; i++) {
    _sod
        .primitives({ ref: rlabel[i].name, label_opacity: 0.0 })
        .label({
            position: { label_asym_id: 'A', auth_seq_id: rlabel[i].id },
            text: rlabel[i].name,
            label_color: 'white',
            label_size: 2
        }
        );
}


//the trace 
//the matrix should scale down and orient along the Z by rotation on X axis 90
const tmpMatcat = Mat4.fromTranslation(Mat4.zero(), Vec3.create(30, 0, 12))
// const r90 = Mat4.fromRotation(Mat4.zero(), Math.PI / 2 , Vec3.create(1.0,0.0,0.0))
const mca = Mat4();
// Mat4.mul(mca, Mat4(), tmpMatcas);
// Mat4.mul(mca, Mat4.identity(), tmpMatcat);
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
);
const slice_width = 7.5;
builder.primitives({
    ref: 'catrace',
    tooltip: 'CA atoms trace',
    opacity: 1.0,
    instances: [mca] // +Z
})
.lines(
     {
        ref:'clipline',
        vertices: [0.0, -th/2, 0.0, slice_width, -th/2, 0.0,
                   0.0, th/2, 0.0, slice_width, th/2, 0.0],
        indices: [0,1,2,3],
        width: 1.0,
        color: "white",
        // group_colors: s_colors0,
        custom: { molstar_line_params: { emissive: 1.0 } }
    }   
)
// add the two lines representing the slice of 
const anim = builder.animation(
    {
        custom: {
        molstar_trackball: {
            name: 'off',
            params: { speed: -0.05 },
        }
    }}
);

anim.interpolate({
    kind: 'scalar',
    target_ref: 'opacityB2',
    start_ms: 0,
    duration_ms: 3000,
    // frequency: 10,
    // alternate_direction: true,
    // property: ['custom', 'molstar_reprepresentation_params','emissive'],
    property:['opacity'],
    start: 0.0,
    end: 1.0,
});


let dtime = 10000;

for (let i = 0; i < 8; i++) {
    anim.interpolate({
        kind: 'scalar',
        ref: 'clip-transition',
        target_ref: 'b2clip' + i.toString(),
        start_ms:0,
        duration_ms: dtime,
        property: ['center', 1],
        start: 20,
        end: -19,
        // frequency: 2,
        // alternate_direction: true,
        // easing: 'sin-in',
    });
    anim.interpolate({
        kind: 'scalar',
        ref: 'clip-transition',
        target_ref: 'bs2clip' + i.toString(),
        start_ms:0,
        duration_ms: dtime,
        property: ['center', 1],
        start: 20,
        end: -19,
        // frequency: 2,
        // alternate_direction: true,
        // easing: 'sin-in',
    });    
}   


let top = 20 * 0.2;
let bot = -19 * 0.2;

anim.interpolate({
    kind: 'vec3',
    target_ref: 'clipline',
    duration_ms: dtime,
    start_ms: 0,
    property: 'vertices',
    start: [0.0, -th/2 + top, 0.0, slice_width, -th/2 + top, 0.0,
        0.0, th/2 + top, 0.0, slice_width, th/2 + top, 0.0],
    end: [0.0, -th/2 + bot, 0.0, slice_width, -th/2 + bot, 0.0,
        0.0, th/2 + bot, 0.0, slice_width, th/2 + bot, 0.0],
});


/* next go back up */
let st_time = dtime + 3000;

for (let i = 0; i < 8; i++) {
    anim.interpolate({
        kind: 'scalar',
        ref: 'clip-transition',
        target_ref: 'b2clip' + i.toString(),
        start_ms: st_time,
        duration_ms: 5000,
        property: ['center', 1],
        start: -19,
        end: 3,
        // frequency: 2,
        // alternate_direction: true,
        // easing: 'sin-in',
    });
    anim.interpolate({
        kind: 'scalar',
        ref: 'clip-transition',
        target_ref: 'bs2clip' + i.toString(),
        start_ms: st_time,
        duration_ms: 5000,
        property: ['center', 1],
        start: -19,
        end: 3,
        // easing: 'sin-in',
    });
}

top = -19 * 0.2;
bot = 3 * 0.2;

anim.interpolate({
    kind: 'vec3',
    target_ref: 'clipline',
    duration_ms: 5000,
    start_ms: st_time,
    property: 'vertices',
    start: [0.0, -th/2 + top, 0.0, slice_width, -th/2 + top, 0.0,
        0.0, th/2 + top, 0.0, slice_width, th/2 + top, 0.0],
    end: [0.0, -th/2 + bot, 0.0, slice_width, -th/2 + bot, 0.0,
        0.0, th/2 + bot, 0.0, slice_width, th/2 + bot, 0.0],
});


for (let i = 0; i < 2; i++) {
    anim.interpolate({
        kind: 'scalar',
        target_ref: rlabel[i].name,
        duration_ms: 2000,
        start_ms: st_time+5000,
        property: 'label_opacity',
        start: 0.0,
        end: 1.0,
    });
    anim.interpolate({
        kind: 'scalar',
        target_ref: rlabel[i].name,
        duration_ms: 2000,
        start_ms: st_time + 10000,
        property: 'label_opacity',
        start: 1.0,
        end: 0.0,
    });    
}

st_time += 12000;

// bext go up
const s = 3;
const e = 8;

for (let i = 0; i < 8; i++) {
    anim.interpolate({
        kind: 'scalar',
        ref: 'clip-transition',
        target_ref: 'b2clip' + i.toString(),
        start_ms: st_time,
        duration_ms: 2000,
        property: ['center', 1],
        start: s,
        end: e,
        // frequency: 2,
        // alternate_direction: true,
        // easing: 'sin-in',
    });
    anim.interpolate({
        kind: 'scalar',
        ref: 'clip-transition',
        target_ref: 'bs2clip' + i.toString(),
        start_ms: st_time,
        duration_ms: 2000,
        property: ['center', 1],
        start: s,
        end: e,
        // easing: 'sin-in',
    });
}

top = s * 0.2;
bot = e * 0.2;

anim.interpolate({
    kind: 'vec3',
    target_ref: 'clipline',
    duration_ms: 2000,
    start_ms: st_time,
    property: 'vertices',
    start: [0.0, -th/2 + top, 0.0, slice_width, -th/2 + top, 0.0,
        0.0, th/2 + top, 0.0, slice_width, th/2 + top, 0.0],
    end: [0.0, -th/2 + bot, 0.0, slice_width, -th/2 + bot, 0.0,
        0.0, th/2 + bot, 0.0, slice_width, th/2 + bot, 0.0],
});


for (let i = 2; i < 4; i++) {
    anim.interpolate({
        kind: 'scalar',
        target_ref: rlabel[i].name,
        duration_ms: 2000,
        start_ms: st_time + 1000,
        property: 'label_opacity',
        start: 0.0,
        end: 1.0,
    });
}

anim.interpolate({
    kind: 'scalar',
    target_ref: 'next',
    duration_ms: 2000,
    start_ms: st_time+3000,
    property: 'label_opacity',
    // start: 0.0,
    end: 1.0,
});

builder.extendRootCustomState({
  molstar_on_load_markdown_commands: {
    'play-audio': 'part_07.mp3',
  }
});

