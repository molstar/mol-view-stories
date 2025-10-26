// Start typing 'builder' to create a new scene
// Mol* library functions: Vec3, Mat3, Mat4, Quat, Euler
// use the same timing ?
builder.canvas(CanvasParams);

const gsize = 30;
const gsegments = 30;
const grids = generateGridLineVertices(gsize, gsegments, 0);
const gstep = gsize / gsegments;
const gvertices = grids.positions;
const gindices = grids.indices;

const label_size = 2.0;


//labels need to be align with grid line.
const ring = makeRingLines();
// first: 4 lines for a square
builder.primitives({
    ref: 'squares',
    tooltip: 'Squares',
    opacity: 1.0,
    instances: diamondInstanceMats() // +Z
})
.lines(
    {
        vertices: square_verts,
        indices: [0, 1, 1, 2, 2, 3, 3, 0],
        width: 1.0,
        color: "#b9b0fa",
        custom: { molstar_line_params: { emissive: 1.0 } }
    }
);
builder.primitives({
    ref: 'circles',
    tooltip: "circles",
    opacity: 1.0,
    instances: diamondInstanceMats([2.20,2.15,2.10,2.05,2.00,1.95], 0.0) // +Z
})
.lines(
    {
        vertices: ring.positions,
        indices: ring.indices,
        width: 1.0,
        color: "#ff0000",
        custom: { molstar_line_params: { emissive: 1.0 } }
    }
);

builder.primitives({
    ref: 'digits',
    tooltip: 'Digits',
    opacity: 1.0,
    instances: [Mat4.fromTranslation(Mat4.identity(), Vec3.create(-0.5,-0.5,0))],
})
.lines(
    {
        ref: 'the_number',
        vertices: digits[5],
        indices: linePairsIndices,
        width: 1.0,
        color: '#00ff00',
        custom: { molstar_line_params: { emissive: 1.0 } }
    }
);

const title = builder.primitives({
    ref: 'title',
    label_opacity: 0,
    instances:[Mat4.identity()]
});
title.label({
    position: [0, gstep, 0.25],
    text: 'Terms of',
    label_color: 'white',
    label_size: label_size
});
title.label({
    ref:'entrapment',
    position: [0, -1, 0.25],
    text: 'Entrapment',
    label_color: 'white',
    label_size: label_size
});


builder.primitives({
    ref: 'plane1',
    tooltip: "Top Plane",
    opacity: 1.0,
    instances: [Mat4.fromTranslation(Mat4.zero(), Vec3.create(0, 200, 0))]
})
.lines({
    vertices: gvertices,
    indices: gindices,
    width: 1.0,
    color: "#b9b0fa",
    custom: { molstar_line_params: { emissive: 0.0 } }
});

builder.primitives({
    ref: 'plane2',
    tooltip: "Bottom Plane",
    opacity: 1.0,
    instances: [Mat4.fromTranslation(Mat4.zero(), Vec3.create(0, -200, 0))]
})
.lines({
    vertices: gvertices,
    indices: gindices,
    width: 1.0,
    color: "#b9b0fa",
    custom: { molstar_line_params: { emissive: 0.0 } }
});

builder.primitives({
    ref: 'title2',
    label_opacity: 0,
})
.label({
    position: [0, 2.25, 0.25],
    text: 'The structure',
    label_color: 'white',
    label_size: label_size
})
.label({
    position: [0, 1.0, 0.25],
    text: 'and Function of',
    label_color: 'white',
    label_size: label_size
})
.label({
    position: [0, -1.0, 0.25],
    text: 'Cu,Zn Superoxide',
    label_color: 'white',
    label_size: label_size
})
.label({
    ref:'entrapment',
    position: [0, -2.25, 0.25],
    text: 'Dismutase',
    label_color: 'white',
    label_size: label_size
});

const authors = builder.primitives({
        ref: 'authors',
        label_opacity: 0,
});
authors.label({
    position: [0, 3.25, 0.25],
    text: '1985 original film by',
    label_color: 'white',
    label_size: label_size
});
authors.label({
    position: [0, 2.0, 0.25],
    text: 'Arthur J Olson',
    label_color: 'white',
    label_size: label_size
});
authors.label({
    position: [0, 0.75, 0.25],
    text: 'Elizabeth D Getzoff',
    label_color: 'white',
    label_size: label_size
});
authors.label({
    position: [0, -0.50, 0.25],
    text: 'John A Tainer',
    label_color: 'white',
    label_size: label_size
});


const location = builder.primitives({
    ref: 'location',
    label_opacity: 0,
});

location.label({
    position:  [0, 1, 0.25],
    text: 'Scripps Research',
    label_color: 'white',
    label_size: label_size
});

location.label({
    position:  [0, -1, 0.25],
    text: 'La Jolla, California',
    label_color: 'white',
    label_size: label_size
});

// make it glow and pulse
builder.primitives({
    ref: 'next',
    tooltip: 'Click for next part',
    label_opacity: 0,
    label_background_color: 'grey',
    snapshot_key: 'sod'
})
.label({
    ref:'next_label',
    position: [0, 0, 0.25],
    text: 'Click me to go next',
    label_color: 'white',
    label_size: label_size
});

// const anim = builder.animation();
const anim = builder.animation({});
const transition_time = 500; //0.5s

let current_time = 0;
for (let i = 4; i >= 1; i--) {
  anim.interpolate({
    kind: 'vec3',
    target_ref: 'the_number',
    duration_ms: 250, // 1 second
    start_ms: 1000 + (4 - i) * transition_time * 2,
    property: 'vertices',
    end: digits[i],
    // noise_magnitude: 1
  });
  
}

current_time = 1000 + (4) * transition_time * 2;

//disappear
anim.interpolate({
    kind: 'scalar',
    target_ref: 'digits',
    duration_ms: transition_time,
    start_ms: current_time,
    property: 'opacity',
    end: 0.0,
    // noise_magnitude: 1
});
anim.interpolate({
    kind: 'scalar',
    target_ref: 'circles',
    duration_ms: transition_time,
    start_ms: current_time,
    property: 'opacity',
    end: 0.0,
    // noise_magnitude: 1
});
anim.interpolate({
    kind: 'scalar',
    target_ref: 'squares',
    duration_ms: transition_time,
    start_ms: current_time,
    property: 'opacity',
    end: 0.0,
    // noise_magnitude: 1
});
current_time = 6000;

//appear title
anim.interpolate({
    kind: 'scalar',
    target_ref: 'title',
    duration_ms: transition_time,
    start_ms: current_time,
    property: 'label_opacity',
    end: 1.0,
    // noise_magnitude: 1
});

//appear plane by translation along Y 
anim.interpolate({
    kind: 'transform_matrix',
    target_ref: 'plane1',
    property: ['instances', 0],
    translation_start: [0,50,0],
    translation_end: [0,gsize/2,0],
    duration_ms: 3000,
    start_ms: current_time + 1000,
});
anim.interpolate({
    kind: 'transform_matrix',
    target_ref: 'plane2',
    property: ['instances', 0],
    translation_start: [0,-50,0],
    translation_end: [0,-gsize/2,0],
    duration_ms: 3000,
    start_ms: current_time + 1000,
});
// change color of entr to red
anim.interpolate({
    kind: 'color',
    target_ref: 'entrapment',
    duration_ms: 3000,
    start_ms: current_time + 4000,
    property: 'label_color',
    end: 'red',
    // noise_magnitude: 1
});

//disappear title
anim.interpolate({
    kind: 'transform_matrix',
    target_ref: 'title',
    property: ['instances', 0],
    translation_start: [0,0,0],
    translation_end: [0,-10000,0],
    duration_ms: 1000,
    start_ms: current_time + 7000,
});

current_time = current_time + 8000;
anim.interpolate({
    kind: 'scalar',
    target_ref: 'title2',
    duration_ms: 6000,
    start_ms: current_time,
    property: 'label_opacity',
    start: 0.0,
    end: 1.0,
    frequency: 2,
    alternate_direction: true,
    // easing:'exp-in-out'       
});

current_time = current_time + 6000;
anim.interpolate({
    kind: 'scalar',
    target_ref: 'authors',
    duration_ms: 6000,
    start_ms: current_time,
    property: 'label_opacity',
    start: 0.0,
    end: 1.0,
    frequency: 2,
    alternate_direction: true,
    // easing:'exp-in-out'       
});

current_time = current_time + 6000;
anim.interpolate({
    kind: 'scalar',
    target_ref: 'location',
    duration_ms: 4000,
    start_ms: current_time,
    property: 'label_opacity',
    start: 0.0,
    end: 1.0,
    frequency: 2,
    alternate_direction: true,
    // easing:'exp-in-out'       
});
current_time = current_time + 4000;

anim.interpolate({
    kind: 'scalar',
    target_ref: 'next',
    duration_ms: 2000,
    start_ms: current_time,
    property: 'label_opacity',
    start: 0.0,
    end: 1.0,      
});
anim.interpolate({
    kind: 'color',
    target_ref: 'next_label',
    duration_ms: 4000,
    start_ms: current_time+2000,
    property: 'label_color',
    start: 'white',
    end: 'red',
    frequency: 5,
    alternate_direction: true,
});

builder.extendRootCustomState({
  molstar_on_load_markdown_commands: {
    'play-audio': 'part_01.mp3',
  }
});
