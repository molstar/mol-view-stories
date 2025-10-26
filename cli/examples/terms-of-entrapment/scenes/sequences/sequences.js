// here everything disappear except axes and ribbon. 
// we need two ribbon for chain A, so it will rotate arround the axis and superimpose with B.
// and the first ribbon is dotted.

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

//1-6
//

builder.primitives({
    ref: 'plane2',
    tooltip: "Bottom Plane",
    opacity: 1.0,
    instances: [m3]
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
    label_background_color: 'grey',
    label_opacity: 1,
    snapshot_key: 'barrel'
})
    .label({
        ref: 'next_label',
        position: [0, -300, 0.25],
        text: 'Click me to go next',
        label_color: 'white',
        label_size: label_size * 5

    });

const _sod = getSOD(builder, false, false, Mat4.identity());

//need a second ribbon for _2c9v
const _sod_b = _sod.component({ selector: { label_asym_id: 'B' } })
    .transform({
        ref: 'xformB2',
        matrix: Mat4.rotY180,
    });


_sod_b
    .representation({ ref: 'crepB2', type: 'cartoon', custom: {
        molstar_reprepresentation_params: {

            emissive: 0.6
        }
        } })
    .color({
        custom: {
            molstar_color_theme_name: 'secondary-structure',
        }})
    .opacity({ ref: 'opacityB2', opacity:0})

const _sod_a = _sod.component({ selector: { label_asym_id: 'A' } });
const sod_a_rep = _sod_a.representation({ type: 'backbone', custom:{molstar_representation_params:{emissive:0.5}} });
sod_a_rep.opacity({ ref: 'opbackbone', opacity: 1 });
    // .color({ color: 'white' });

//should be SS colors
const res_colors0 = {};
for (let i = 1; i <= 152; i++) {
    res_colors0[i] = '#b9b0fa';   // or some computed color
}

const res_colors = {};
for (let i = 1; i <= 152; i++) {
    res_colors[i] = 'red';   // or some computed color
}
// fill ranges
for (let i = 0; i < strands.length; i += 2) {
  const start = strands[i];
  const end   = strands[i+1];
  for (let j = start; j <= end; j++) {
      res_colors[j] = '#00ff7f';
  }
}

sod_a_rep.colorFromSource({
    ref: 'coloring',
    schema: 'residue',
    category_name: 'atom_site',
    field_name: 'label_seq_id',
    palette: {
        kind: 'categorical',
        missing_color: "#b9b0fa",
        colors: res_colors0,
    }
});


const ss = [1,6,25,32,38,46,88,95,99,106,130,136,166,176];
const s_colors0 = {};
for (let i = 1; i <= 176; i++) {
    s_colors0[i] = '#b9b0fa';   // or some computed color
}

const s_colors = {};
for (let i = 1; i <= 176; i++) {
    s_colors[i] = 'red';   // or some computed color
}
// fill ranges
for (let i = 0; i < ss.length; i += 2) {
  const start = ss[i];
  const end   = ss[i+1];
  for (let j = start; j <= end; j++) {
      s_colors[j] = '#00ff7f';
  }
}

const mseq = Mat4();
const mp = Mat4.fromTranslation(Mat4.identity(), Vec3.create(10, -35, 0));
Mat4.mul(mseq,mp,r30);


//make a line of the coords 
builder.primitives({
    ref: 'sequence',
    tooltip: 'Sequence',
    opacity: 1.0,
    instances: [mseq] // +Z
})
.lines(
    {
        ref:'thelines',
        vertices: sequence_coords,
        indices: seq_idx,
        width: 1.0,
        // color: "#b9b0fa",
        group_colors: s_colors0,
        custom: { molstar_line_params: { emissive: 0.6 } }
    }
);

// the moving line 
//make a line of the coords 
// builder.primitives({
//     ref: 'segment',
//     tooltip: 'segment',
//     opacity: 1.0,
//     instances: [mseq] // +Z
// })
// .tube(
//     {
//         start: sequence_slice1,
//         end: sequence_slice2,
//         radius : 0.5,
//         // width: 2.0,
//         color: "white",
//         custom: { molstar_line_params: { emissive: 1.5 } }
//     }
// );

builder.primitives({
    ref: 'seq',
    tooltip: 'Sequence',
    opacity: 1.0,
    instances: [mseq] // +Z
})
.lines(
    {
        ref:'segseq',
        vertices: [5.57787466e+00,  0.00000000e+00, -1.18891569e+01,  1.22453876e+00,        0.00000000e+00, -1.21529960e+01],
        indices: [0,1],
        width: 2.0,
        color: "red",
        custom: { molstar_line_params: { emissive: 0.6 } }
    }
);

const anim = builder.animation(
    {
        custom: {
        molstar_trackball: {
            name: 'off',
            // params: { speed: -0.05 },
        }
    }}
);


// animate bottom plane rotation and the sequence

// animate the highlight along the sequence
// 177 points
// 152 residues
const stime = 100;
let prev_j = 0;
for (let i=1; i < 176; i++){
    const v = sequence_coords.slice(i * 3, (i + 2) * 3);
    // console.log(v)
    anim.interpolate({
        kind: 'vec3',
        target_ref: 'segseq',
        duration_ms: stime,
        start_ms: i * stime,
        property: 'vertices',
        end: v,
    }); 
    anim.interpolate({
        kind: 'color',
        target_ref: 'thelines',
        duration_ms: stime,
        start_ms: i * stime,
        property: ['group_colors', i],
        end: s_colors[i],
    });           
    //at the same time change color of segments 
    const j = remapInt(i, 1, 176, 1, 152);
    if (j !== prev_j){
        anim.interpolate({
            kind: 'color',
            target_ref: 'coloring',
            duration_ms: stime,
            start_ms: i * stime,
            property: ['palette', 'colors', j],
            end: res_colors[j],
        });
        // anim.interpolate({
        //     kind: 'color',
        //     target_ref: 'coloring',
        //     duration_ms: 150,
        //     start_ms: i*150,
        //     property: ['palette', 'colors', j-1],
        //     end: 'white',
        // }); 
    }
    prev_j = j;
}

const end = (stime * 176) + 2000;

const dms = 30;
prev_j = 0;
for (let i = 176 - 1; i >= 0; i--) {
    const v = sequence_coords.slice(i * 3, (i + 2) * 3);
    // console.log(v)
    const sms = end + (176 - 1 - i) * 40;
    anim.interpolate({
        kind: 'vec3',
        target_ref: 'segseq',
        duration_ms: dms,
        start_ms: sms,
        property: 'vertices',
        end: v,
    });
    anim.interpolate({
        kind: 'color',
        target_ref: 'thelines',
        duration_ms: dms,
        start_ms: sms,
        property: ['group_colors', i],
        end: s_colors0[i],
    });
    //at the same time change color of segments 
    const j = remapInt(i, 1, 176, 1, 152);
    // console.log(j, prev_j);
    if (j !== prev_j) {
        anim.interpolate({
            kind: 'color',
            target_ref: 'coloring',
            duration_ms: dms,
            start_ms: sms,
            property: ['palette', 'colors', j],
            end: res_colors0[j],
        });
    }
    prev_j = j;
}
const end2 = end + 8000;

// disappear lines
anim.interpolate({
    kind: 'scalar',
    target_ref: 'sequence',
    duration_ms: 2000,
    start_ms: end2,
    property: 'opacity',
    start: 1.0,
    end: 0.0,
});
anim.interpolate({
    kind: 'scalar',
    target_ref: 'seq',
    duration_ms: 2000,
    start_ms: end2,
    property: 'opacity',
    start: 1.0,
    end: 0.0,
});


anim.interpolate({
    kind: 'scalar',
    target_ref: 'opacityB2',
    duration_ms: 2000,
    start_ms: end2+2000,
    property: 'opacity',
    end: 1.0,
});
anim.interpolate({
    kind: 'scalar',
    target_ref: 'opbackbone',
    duration_ms: 2000,
    start_ms: end2 + 2000,
    property: 'opacity',
    end: 0.0,
});

anim.interpolate({
    kind: 'vec3',
    target_ref: 'next_label',
    duration_ms: snap_duration,
    start_ms: end2 + 2000,
    property: 'position',
    start: [0, -400, 0.25],
    end: [45, -50, 0.25],
});

// merge 6 and 7
builder.extendRootCustomState({
  molstar_on_load_markdown_commands: {
    'play-audio': 'part_05.mp3',
  }
});
