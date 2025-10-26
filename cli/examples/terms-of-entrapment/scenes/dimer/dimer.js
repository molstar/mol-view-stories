// here we go back to chain A, but only show the beta barrel...is this need residue selection or secondary structure ? 
//14.0, 0.3, 124.7]
// [14.0, 0.3, 0.0]
builder.camera({
    position:[14,0,100],
    target:[14,0,0],
    up:[0,1,0]})

const box_clip = { ref: 'clip', type: 'box', center: [15.0, 0.0, 0.0], size: [100.0, 50.0, 100.0], invert:true };
const th = 1.5;
const bsize = [100.0, th*2.0, 100.0];
const s = 8;
const e = 20;
const top = s * 0.4;
const bot = e * 0.4;

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
    opacity: 0.0,
    instances: [m1]
})
    .lines({
        vertices: gvertices,
        indices: gindices,
        width: 1.0,
        color: "#b9b0fa",
        custom: { molstar_line_params: { emissive: 1.0 } }
    });

//1-6
//

builder.primitives({
    ref: 'plane2',
    tooltip: "Bottom Plane",
    opacity: 0.0,
    instances: [m2]
})
    .lines({
        vertices: gvertices,
        indices: gindices,
        width: 1.0,
        color: "#b9b0fa",
        custom: { molstar_line_params: { emissive: 1.0 } }
    });


const _sod = getSOD(builder, false, false, Mat4.identity());

const _sod_a = _sod.component({ selector: { label_asym_id: 'A' } });
_sod_a.transform({
        ref: 'soda',
        matrix: Mat4.identity(),
    });
const sod_a_rep = _sod_a.representation({ type: 'backbone' });
sod_a_rep.opacity({ ref: 'opbackbone', opacity: 0 });
sod_a_rep.color({ ref: 'crepB2-color', color: '#00ff7f' });

const _sod_b = _sod.component({ selector: { label_asym_id: 'B' } })
    .transform({
        ref: 'sodb',
        matrix: Mat4.identity(),
    });
_sod_b
    .representation({ ref: 'crepB2', type: 'backbone', custom: {
        molstar_reprepresentation_params: {

            emissive: 1.0
        }
        } })
    .opacity({ ref: 'opacityB2', opacity:1})
        .color({ ref: 'crepB2-color', color: 'yellow' });


const selectorA = buriedaa.map(num => ({
  label_asym_id: 'A',
  auth_seq_id: num
}));
const selectorB = buriedaa.map(num => ({
    label_asym_id: 'B',
    auth_seq_id: num
}));
_sod.component({selector: selectorA})
    .representation({type:'surface', custom: {molstar_representation_params: {emissive: 0.6, visuals: ['wireframe']}}})
    .color({color: 'red'})
    .opacity({ref:'interA', opacity: 0.0 })

_sod.component({ selector: selectorB })
    .representation({ type: 'surface', custom: {molstar_representation_params: {emissive: 0.6, visuals: ['wireframe']}} })
    .color({ color: 'blue' })
    .opacity({ref:'interB',  opacity: 0.0 })


builder.primitives({
    ref: 'next',
    tooltip: 'Click for next part',
    label_opacity: 0,
    label_background_color: 'grey',    
    snapshot_key: 'buried'
})
.label({
    ref:'next_label',
    position: [0, -30, 0],
    text: 'Click me to go next',
    label_color: 'white',
    label_size: 10
});


const tube = _sod.primitives({
    ref:'tube',
    opacity:1.00,
    custom:{
      molstar_mesh_params: {
        emissive: 1.00
      }
  }}).tube({
        start:[0,25,0],
        end:[0,-25,0],
        radius: 0.25,
        color: 'red'
    });


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
    target_ref: 'next',
    duration_ms: 2000,
    start_ms: 6000,
    property: 'label_opacity',
    // start: 0.0,
    end: 1.0,      
});

// then hide and show the plane and chain a segments
anim.interpolate({
    kind: 'scalar',
    target_ref: "opbackbone",
    duration_ms: 2000,
    start_ms: 0,
    property: 'opacity',
    start: 0.0,
    end: 1.0,
});
//and make the griid appears
anim.interpolate({
    kind: 'scalar',
    target_ref: "plane1",
    duration_ms: 2000,
    start_ms: 0,
    property: 'opacity',
    start: 0.0,
    end: 1.0,
});
anim.interpolate({
    kind: 'scalar',
    target_ref: "plane2",
    duration_ms: 2000,
    start_ms: 0,
    property: 'opacity',
    start: 0.0,
    end: 1.0,
});
anim.interpolate({
    kind: 'scalar',
    target_ref: "tube",
    duration_ms: 3000,
    start_ms: 0,
    property: 'opacity',
    start: 0.0,
    end: 1.0,
});
// reappear B
anim.interpolate({
    kind: 'scalar',
    target_ref: "opacityB2",
    duration_ms: 2000,
    start_ms: 3000,
    property: 'opacity',
    start: 0.0,
    end: 1.0,
});
// rotate back chain B
anim.interpolate({
    kind: 'transform_matrix',
    target_ref: 'sodb',
    property: 'matrix',
    pivot: [0, 0, 0], // is that local ?
    rotation_start: Mat3.fromEuler(Mat3.zero(), Euler.create(0, Math.PI, 0), 'XYZ'),
    rotation_end: Mat3.fromEuler(Mat3.zero(), Euler.create(0, 0,  0.0), 'XYZ'),
    duration_ms: 3000,
    start_ms: 5000,
});    

// show the surface/ as wire ? or transparent ? 
anim.interpolate({
    kind: 'scalar',
    target_ref: 'surf_opacityA',
    duration_ms: 2000,
    start_ms: 8000,
    property: 'opacity',
    end: 0.5,
});
anim.interpolate({
    kind: 'scalar',
    target_ref: 'surf_opacityB',
    duration_ms: 2000,
    start_ms: 8000,
    property: 'opacity',
    end: 0.5,
});
// then disappear
anim.interpolate({
    kind: 'scalar',
    target_ref: 'surf_opacityA',
    duration_ms: 2000,
    start_ms: 10000,
    property: 'opacity',
    start: 0.5, 
    end: 0.0,
});
anim.interpolate({
    kind: 'scalar',
    target_ref: 'surf_opacityB',
    duration_ms: 2000,
    start_ms: 10000,
    property: 'opacity',
    start: 0.5,
    end: 0.0,
});

// show the ions
anim.interpolate({
    kind: 'scalar',
    target_ref: 'atomZn_op',
    duration_ms: 2000,
    start_ms: 11000,
    property: 'opacity',
    end: 1,
});

anim.interpolate({
    kind: 'scalar',
    target_ref: 'atomCu_op',
    duration_ms: 2000,
    start_ms: 11000,
    property: 'opacity',
    end: 1,
});

// show the buried surface
anim.interpolate({
    kind: 'scalar',
    target_ref: 'interB',
    duration_ms: 2000,
    start_ms: 11000,
    property: 'opacity',
    start: 0.0,
    end: 0.5,
});
// then disappear
anim.interpolate({
    kind: 'scalar',
    target_ref: 'interA',
    duration_ms: 2000,
    start_ms: 11000,
    property: 'opacity',
    start: 0.0, 
    end: 0.5,
});
builder.extendRootCustomState({
  molstar_on_load_markdown_commands: {
    'play-audio': 'part_08.mp3',
  }
});