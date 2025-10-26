// surface decrease opactity and then disappear 55-59 (4s)
// Cupper and Zn appears as spacefill with labeles 55-56 (1s)
// bounding box appears with symmetry axis 57-60 (3s)
// boudning size label on X,Y,Z 
// bounding box disappear at 1:13 (after 13s two turns)
// go to next part where we align chain A->B by rotation arround the sym axis, but leave a dot-line ghots of chain A.
 
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

const tmpMat2 = Mat4.fromTranslation(Mat4.zero(), Vec3.create(0, -42.5, 0))
const m2 = Mat4();
Mat4.mul(m2, tmpMat2, Mat4.rotX90);

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
    label_opacity: 1,
    label_background_color: 'grey',
    snapshot_key: 'symmetry'
})
    .label({
        ref: 'next_label',
        position: [0, -300, 0.25],
        text: 'Click me to go next',
        label_color: 'white',
        label_size: label_size * 5

    });

const _2c9v = getSOD(builder, true, true, Mat4.identity());
const selector = { label_asym_id: 'F', label_atom_id: 'ZN' };

const atoms_labels = _2c9v.primitives({
    ref: 'atoms',
    label_opacity: 0,
    label_attachment: 'middle-left',
    label_show_tether: true,
    label_tether_length: .25,
    // label_background_color: 'black',
})
    .label({
        ref: 'ZNF',
        position: { label_asym_id: 'F', label_atom_id: 'ZN' },
        text: 'ZN',
        label_color: 'white',
        label_size: 5

    })
    .label({
        ref: 'ZNH',
        position: { label_asym_id: 'H', label_atom_id: 'ZN' },
        text: 'ZN',
        label_color: 'white',
        label_size: 5

    })
    .label({
        ref: 'CUG',
        position: { label_asym_id: 'G', label_atom_id: 'CU' },
        text: 'ZN',
        label_color: 'white',
        label_size: 5
    })
    .label({
        ref: 'CUO',
        position: { label_asym_id: 'E', label_atom_id: 'CU' },
        text: 'CU',
        label_color: 'white',
        label_size: 5
    });

//33,36,67A
const box = _2c9v.primitives({
    ref:'boxaxe',
    opacity:0.00,
    custom:{
      molstar_mesh_params: {
        emissive: 1.00
      }
  }}).box({
  center:[0,0,0], //{label_sym_id:'A'},
  extent:[67/2, 36/2, 33/2],
  show_faces:false,
  face_color:"blue",
  show_edges:true,
  edge_color:"red",
  edge_radius:0.45,
//   tooltip:"Residue 508, boxed",
  }
)
    .tube({
        start:[0,25,0],
        end:[0,-25,0],
        radius: 0.25,
        color: 'blue'
    })
const box_label = _2c9v.primitives({
    ref: 'boxlabel',
    label_opacity: 0.00,})
    .label({
        position: [-67 / 2,0.0, 33/2 + 1],
        text:'36A',
        label_color: 'white',
        label_size: 5
    })
    .label({
        position: [-67 / 2, -36.0/2.0, 0.0],
        text: '33A',
        label_color: 'white',
        label_size: 5
    })
    .label({
        position: [0.0, 36.0 / 2.0, 33 / 2 + 1],
        text: '67A',
        label_color: 'white',
        label_size: 5
    })
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
    kind: 'vec3',
    target_ref: 'next_label',
    duration_ms: snap_duration,
    start_ms: snap_duration / 2,
    property: 'position',
    start: [0, -400, 0.25],
    end: [0, -40, 0.25],
});

anim.interpolate({
    kind: 'scalar',
    target_ref: 'surf_opacityA',
    duration_ms: 2000,
    start_ms: 1000,
    property: 'opacity',
    end: 0.0,
});

anim.interpolate({
    kind: 'scalar',
    target_ref: 'surf_opacityB',
    duration_ms: 2000,
    start_ms: 1000,
    property: 'opacity',
    end: 0.0,
});

anim.interpolate({
    kind: 'scalar',
    target_ref: 'atomZn_op',
    duration_ms: 2000,
    start_ms: 3000,
    property: 'opacity',
    end: 1,
});

anim.interpolate({
    kind: 'scalar',
    target_ref: 'atomCu_op',
    duration_ms: 2000,
    start_ms: 3000,
    property: 'opacity',
    end: 1,
});

anim.interpolate({
    kind: 'scalar',
    target_ref: 'atoms',
    duration_ms: 2000,
    start_ms: 3000,
    property: 'label_opacity',
    end: 1,
});
// then Bounding BOX + sym axis
anim.interpolate({
    kind: 'scalar',
    target_ref: 'boxaxe',
    duration_ms: 2000,
    start_ms: 4000,
    property: 'opacity',
    end: 1,
});
anim.interpolate({
    kind: 'scalar',
    target_ref: 'boxlabel',
    duration_ms: 2000,
    start_ms: 4000,
    property: 'label_opacity',
    end: 1,
});

builder.extendRootCustomState({
  molstar_on_load_markdown_commands: {
    'play-audio': 'part_03.mp3',
  }
});
