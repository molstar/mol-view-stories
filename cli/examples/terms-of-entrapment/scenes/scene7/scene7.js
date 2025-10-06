// here we go back to chain A, but only show the beta barrel...is this need residue selection or secondary structure ? 
//14.0, 0.3, 124.7]
// [14.0, 0.3, 0.0]
builder.camera({
    position:[14,0,100],
    target:[14,0,0],
    up:[0,1,0]})

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
    ref: 'plane1',
    tooltip: "Top Plane",
    opacity: 1.0,
    instances: [m1]
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
    instances: [m2]
})
    .lines({
        vertices: gvertices,
        indices: gindices,
        width: 1.0,
        color: "#b9b0fa",
        custom: { molstar_line_params: { emissive: 1.0 } }
    });


builder.primitives({
    ref: 'next',
    tooltip: 'Click for next part',
    label_opacity: 0,
    label_background_color: 'grey',
    snapshot_key: 'barrelslice'
})
.label({
    ref:'next_label',
    position: [0, -30, 0.25],
    text: 'Click me to go next',
    label_color: 'white',
    label_size: 10
});

const _2c9v = getSOD(builder, false, false, Mat4.identity());

// component should be only beta barrel
// by resdiue range ? 
const _2cv9_b = _2c9v.component({ selector: { label_asym_id: 'A' } })
    .transform({
        ref: 'xformB2',
        matrix: Mat4.identity(),
    });


_2cv9_b
    .representation({ ref: 'crepB2', type: 'cartoon', custom: {
        molstar_reprepresentation_params: {

            emissive: 0.6
        }
        } })
    .color({
        custom: {
            molstar_color_theme_name: 'secondary-structure',
        }})
    .opacity({ ref: 'opacityB2', opacity:1})
        // .color({ ref: 'crepB2-color', color: 'yellow' });
// need surface close for each barrel in two groups
// straigth
//unregular

const s_colors = ['lightgreen', 'lightblue', 'indianred', 'lightyellow', 'lightyellow', 'indianred', 'lightblue', 'lightgreen'];
for (let i=0;i<8;i++){
    const b = _2c9v.component({selector:{label_asym_id: 'A', beg_auth_seq_id:strands[2*i],end_auth_seq_id:strands[2*i+1]}});
    b
    .representation({ref:'b'+i.toString(),type:'surface'})
    .opacity({ref:'oB'+i.toString(),opacity:0.0})
    .color({ color: s_colors[i]});
    b.representation({type:'cartoon'})
    .opacity({ref:'oR'+i.toString(),opacity:0.0})
}



const anim = builder.animation(
    {
        custom: {
        molstar_trackball: {
            name: 'spin',
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
    start: 1.0,
    end: 0.0,
});
for (let i=0;i<8;i++){
       anim.interpolate({
        kind: 'scalar',
        target_ref: 'oR'+i.toString(),
        start_ms: 1000,
        duration_ms: 3000,
        property: 'opacity',
        start: 0.0,
        end: 1.0,
    });
} 
// hide all ribbon to make appear only beta sheet
// make the ribbon glow in pulse 
for (let i=0;i<4;i++){
    anim.interpolate({
        kind: 'scalar',
        target_ref: 'oB'+i.toString(),
        start_ms: 6000,
        duration_ms: 10000,
        // frequency: 2,
        // alternate_direction: true,
        property: 'opacity',
        start: 0.0,
        end: 1.0,
    });
}


for (let i=4;i<8;i++){
    anim.interpolate({
        kind: 'scalar',
        target_ref: 'oB'+i.toString(),
        start_ms: 18000,
        duration_ms: 5000,
        property: 'opacity',
        // frequency: 2,
        // alternate_direction: true,
        start: 0.0,
        end: 1.0,
        easing: 'sin-in-out'
    });
}
anim.interpolate({
    kind: 'scalar',
    target_ref: 'next',
    duration_ms: 2000,
    start_ms: 25000,
    property: 'label_opacity',
    start: 0.0,
    end: 1.0,      
    easing: 'sin-in-out'
});
// next part will be using clipping plane along the Y axis to show only a slice.

builder.extendRootCustomState({
  molstar_on_load_markdown_commands: {
    'play-audio': 'part_06.mp3',
  }
});

