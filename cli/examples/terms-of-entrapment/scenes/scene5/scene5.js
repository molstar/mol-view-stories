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
    label_background_color: 'grey',
    label_opacity: 1,
    snapshot_key: 'sequence'
})
    .label({
        ref: 'next_label',
        position: [0, -300, 0.25],
        text: 'Click me to go next',
        label_color: 'white',
        label_size: label_size * 5

    });

const _2c9v = getSOD(builder, false, true, Mat4.identity());

//need a second ribbon for _2c9v
const _2cv9_b = _2c9v.component({ selector: { label_asym_id: 'B' } })
    .transform({
        ref: 'xformB2',
        matrix: Mat4.identity(),
    });


_2cv9_b
    .representation({ ref: 'crepB2', type: 'cartoon', custom: {
        molstar_reprepresentation_params: {

            emissive: 1.0
        }
        } })
    .opacity({ ref: 'opacityB2', opacity:1})
        .color({ ref: 'crepB2-color', color: 'yellow' });

//backbone color default
const res_colors0 = {};
for (let i = 1; i <= 152; i++) {
    res_colors0[i] = 'white';   // or some computed color
}

//backbone color conservation
const seqidColors = {
  1: '#808000',
  2: '#798600',
  3: '#d32c00',
  4: '#36c900',
  5: '#0ef100',
  6: '#38c700',
  7: '#a75800',
  8: '#4fb000',
  9: '#47b800',
  10: '#bc4300',
  11: '#4eb100',
  12: '#a75800',
  13: '#ba4500',
  14: '#ec1300',
  15: '#6a9500',
  16: '#e21d00',
  17: '#04fb00',
  18: '#8d7200',
  19: '#cd3200',
  20: '#eb1400',
  21: '#41be00',
  22: '#d02f00',
  23: '#f20d00',
  24: '#ed1200',
  25: '#c43b00',
  26: '#ce3100',
  27: '#ed1200',
  28: '#798600',
  29: '#e51a00',
  30: '#7d8200',
  31: '#af5000',
  32: '#708f00',
  33: '#eb1400',
  34: '#956a00',
  35: '#bf4000',
  36: '#22dd00',
  37: '#1ee100',
  38: '#c63900',
  39: '#f10e00',
  40: '#41be00',
  41: '#f90600',
  42: '#2cd300',
  43: '#34cb00',
  44: '#649b00',
  45: '#09f600',
  46: '#808000',
  47: '#07f800',
  48: '#d42b00',
  49: '#b04f00',
  50: '#18e700',
  51: '#32cd00',
  52: '#db2400',
  53: '#a25d00',
  54: '#f00f00',
  55: '#738c00',
  56: '#669900',
  57: '#b94600',
  58: '#33cc00',
  59: '#699600',
  60: '#08f700',
  61: '#b84700',
  62: '#08f700',
  63: '#5ca300',
  64: '#0df200',
  65: '#09f600',
  66: '#e81700',
  67: '#f10e00',
  68: '#a45b00',
  69: '#e61900',
  70: '#03fc00',
  71: '#0ff000',
  72: '#c13e00',
  73: '#55aa00',
  74: '#f40b00',
  75: '#847b00',
  76: '#ba4500',
  77: '#c53a00',
  78: '#639c00',
  79: '#08f700',
  80: '#996600',
  81: '#01fe00',
  82: '#05fa00',
  83: '#42bd00',
  84: '#39c600',
  85: '#11ee00',
  86: '#ca3500',
  87: '#d62900',
  88: '#5ea100',
  89: '#897600',
  90: '#ed1200',
  91: '#d32c00',
  92: '#0ff000',
  93: '#ad5200',
  94: '#5ca300',
  95: '#f70800',
  96: '#ca3500',
  97: '#dc2300',
  98: '#ab5400',
  99: '#da2500',
  100: '#6b9400',
  101: '#df2000',
  102: '#da2500',
  103: '#976800',
  104: '#b54a00',
  105: '#42bd00',
  106: '#d52a00',
  107: '#27d800',
  108: '#e51a00',
  109: '#ea1500',
  110: '#699600',
  111: '#6b9400',
  112: '#897600',
  113: '#0bf400',
  114: '#3bc400',
  115: '#d62900',
  116: '#ed1200',
  117: '#3dc200',
  118: '#689700',
  119: '#1fe000',
  120: '#b14e00',
  121: '#cb3400',
  122: '#af5000',
  123: '#03fc00',
  124: '#06f900',
  125: '#5aa500',
  126: '#01fe00',
  127: '#b34c00',
  128: '#15ea00',
  129: '#5da200',
  130: '#b84700',
  131: '#897600',
  132: '#d02f00',
  133: '#2ed100',
  134: '#f90600',
  135: '#d52a00',
  136: '#6b9400',
  137: '#04fb00',
  138: '#3fc000',
  139: '#4cb300',
  140: '#01fe00',
  141: '#ee1100',
  142: '#15ea00',
  143: '#a35c00',
  144: '#2bd400',
  145: '#10ef00',
  146: '#2cd300',
  147: '#59a600',
  148: '#22dd00',
  149: '#58a700',
  150: '#8f7000',
  151: '#718e00',
  152: '#00ff00',
};

const _sod_a = _2c9v.component({ selector: { label_asym_id: 'A' } });
_sod_a
    .representation({type:'backbone'})
    .opacity({ ref: 'opbackbone', opacity: 0 })
    // .color({ color:'white'});
    .colorFromSource({
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
_sod_a
    .representation({type:'surface', surface_type:'gaussian',custom:gauss_wf})
    .opacity({ ref: 'surfcha', opacity: 0 })
    .colorFromSource({
        ref: 'surfcoloring',
        schema: 'residue',
        category_name: 'atom_site',
        field_name: 'label_seq_id',
        palette: {
            kind: 'categorical',
            missing_color: "#b9b0fa",
            colors: seqidColors,
        }
});
const selector = { label_asym_id: 'F', label_atom_id: 'ZN' };

const atoms_labels = _2c9v.primitives({
    ref: 'atomshg',
    label_opacity: 1,
    label_attachment: 'middle-left',
    label_show_tether: true,
    label_tether_length: .25,
    // label_background_color: 'black',
})
    .label({
        ref: 'ZNF',
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
    });

_2c9v.primitives({
    ref: 'atomsfe',
    label_opacity: 1,
    label_attachment: 'middle-left',
    label_show_tether: true,
    label_tether_length: .25,
    // label_background_color: 'black',
})    
    .label({
        ref: 'ZNH',
        position: { label_asym_id: 'F', label_atom_id: 'ZN' },
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
    opacity:1.00,
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
);

const tube = _2c9v.primitives({
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

const box_label = _2c9v.primitives({
    ref: 'boxlabel',
    label_opacity: 1.00,})
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

//comparison bovine/human sequence
//red variable region
//green conserved region
const anim = builder.animation(
    {
        custom: {
        molstar_trackball: {
            name: 'spin',
            params: { speed: -0.05 },
        }
    }}
);

// then Bounding BOX + sym axis
anim.interpolate({
    kind: 'scalar',
    target_ref: 'boxaxe',
    duration_ms: 2000,
    start_ms: 0,
    property: 'opacity',
    end: 0,
});
anim.interpolate({
    kind: 'scalar',
    target_ref: 'boxlabel',
    duration_ms: 2000,
    start_ms: 0,
    property: 'label_opacity',
    end: 0,
});

anim.interpolate({
    kind: 'transform_matrix',
    target_ref: 'xformB',
    property: 'matrix',
    pivot: [0, 0, 0], // is that local ?
    rotation_end: Mat3.fromEuler(Mat3.zero(), Euler.create(0, Math.PI, 0), 'XYZ'),
    rotation_start: Mat3.fromEuler(Mat3.zero(), Euler.create(0, 0,  0.0), 'XYZ'),
    duration_ms: 3000,
    start_ms: 2000,
});    

anim.interpolate({
    kind: 'scalar',
    target_ref: 'opacityB2',
    duration_ms: 2000,
    start_ms: 6000,
    property: 'opacity',
    end: 0.0,
});


anim.interpolate({
    kind: 'scalar',
    target_ref: 'atomZn_op',
    duration_ms: 2000,
    start_ms: 6000,
    property: 'opacity',
    start: 1,
    end: 0,
});

anim.interpolate({
    kind: 'scalar',
    target_ref: 'atomCu_op',
    duration_ms: 2000,
    start_ms: 6000,
    property: 'opacity',
    end: 1,
    start: 1,
});

anim.interpolate({
    kind: 'scalar',
    target_ref: 'atomshg',
    duration_ms: 2000,
    start_ms: 6000,
    property: 'label_opacity',
    end: 0,
});

anim.interpolate({
    kind: 'scalar',
    target_ref: 'tube',
    duration_ms: 2000,
    start_ms: 6000,
    property: 'opacity',
    end: 0,
});

anim.interpolate({
    kind: 'scalar',
    target_ref: 'opacityA',
    duration_ms: 2000,
    start_ms: 8000,
    property: 'opacity',
    end: 0.0,
});
anim.interpolate({
    kind: 'scalar',
    target_ref: 'opacityB',
    duration_ms: 2000,
    start_ms: 8000,
    property: 'opacity',
    end: 0.0,
});
anim.interpolate({
    kind: 'scalar',
    target_ref: 'opbackbone',
    duration_ms: 2000,
    start_ms: 8000,
    property: 'opacity',
    end: 1.0,
});

anim.interpolate({
    kind: 'color',
    target_ref: 'coloring',
    duration_ms: 2000,
    start_ms: 25000,
    property: ['palette', 'colors'],
    end: seqidColors,
});

//surfcha
anim.interpolate({
    kind: 'scalar',
    target_ref: 'surfcha',
    duration_ms: 6000,
    start_ms: 25000,
    property: 'opacity',
    frequency: 2,
    alternate_direction:true,
    start: 0.0,
    end: 1.0,
    easing:'sin-in-out'
});

anim.interpolate({
    kind: 'vec3',
    target_ref: 'next_label',
    duration_ms: snap_duration,
    start_ms: 30000,
    property: 'position',
    start: [0, -400, 0.25],
    end: [0, -40, 0.25],
});
// extend audio couple of seconds
builder.extendRootCustomState({
  molstar_on_load_markdown_commands: {
    'play-audio': 'part_04.mp3',
  }
});

// next step, which will zoom to only one chain
