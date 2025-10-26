// builder.camera({
//     position: [0, 45, 0],
//     target: [0, 0, 0],
//     up: [0, 0, -1]
// })

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

// _sod.component({ selector: { label_asym_id: 'B' } })
//     .transform({})
//     .representation({ type: 'backbone', custom: emissive })
//     .opacity({ ref: 'opacityB2', opacity: 1})
//     .color({ ref: 'crepB2-color', color: 'yellow' });

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

// _sod.component({ selector: selectorB })
//     .representation({ type: 'surface', custom: {molstar_representation_params: {emissive: 0.0, sizeFactor:0.05, visuals: ['molecular-surface-wireframe']}} })
//     .color({ custom: { molstar_color_theme_name: 'element-symbol' } })
//     .opacity({ opacity: 0.75 })
//     .clip({ ref: 'clipIB', type: 'box', center: bcenter, size: bsize, invert: true });

_sod.component({selector: {label_asym_id: 'A'}})
    .representation({type:'line', custom: emissive})
    .color({custom: { molstar_color_theme_name: 'element-symbol'}})
    .opacity({opacity: 0.75})
    .clip({ ref: 'clipA', type: 'box', center: bcenter, size: bsize, invert: true });
// _sod.component({ selector: {label_asym_id: 'B'} })
//     .representation({ type: 'line', custom: emissive})
//     .color({ custom: { molstar_color_theme_name: 'element-symbol' } })
//     .opacity({ opacity: 0.75 })
//     .clip({ ref: 'clipB', type: 'box', center: bcenter, size: bsize, invert: true });


// //make a line of the coords 
//map colors  
const s_colors = {};
for (let i = 1; i <= vector_field[0].materials.length; i++) {
    s_colors[i] = vector_field[0].materials[i]; 
}

for (let i = 1; i < vector_field.length; i++) {
    builder.primitives({
        ref: 'vectorfieldA',
        tooltip: 'vector fieldA'+i,
        opacity: 1.0,
        instances: [align_vectorsB] // +Z
    })
    .lines(
        {
            ref:'vfa'+i,
            vertices: vector_field[i].vertices,
            indices: vector_field[i].faces,
            width: 1.0,
            // color: "#b9b0fa",
            // color: rcolors[i],
            group_colors: Object.fromEntries(
  vector_field[i].materials.map((m, i) => [i + 1, m])
),
            custom: { molstar_line_params: { emissive: 0.6 } }
        }
    );
}


let off = 10000;

const anim = builder.animation({});

anim.interpolate({
    kind: 'scalar',
    target_ref: 'atomZn_op',
    duration_ms: 200,
    start_ms: 0,
    property: 'opacity',
    start: 1,
    end: 0,
});

anim.interpolate({
    kind: 'scalar',
    target_ref: 'atomCu_op',
    duration_ms: 200,
    start_ms: 0,
    property: 'opacity',
    start: 1,
    end: 0,
});

builder.extendRootCustomState({
    molstar_on_load_markdown_commands: {
        'play-audio': 'part_11.mp3',
    }
});
// completely unorder, redo the lines from molstar
//1,2,3,5,7,8
//1,3,4,6,7
//2,4,6,8
//F,F3,F7
//F0,F4,FF
//F1,F5
//F2,F6
/*
const fanim = [[0,4,8],[1,5,9],[2,6],[3,7]];
for (let j = 0; j < 4; j++){
    const ff = fanim[j];
    builder.primitives({
        ref: 'vectorfieldA'+j,
        tooltip: 'vector fieldA '+j,
        opacity: 1.0,
        instances: [align_vectorsA] // +Z
    })
    .lines(
        {
            ref:'vfa'+j,
            vertices: vector_field[ff[0]].vertices,
            indices: vector_field[ff[0]].faces,
            width: 1.0,
            // color: "#b9b0fa",
            group_colors: s_colors,
            custom: { molstar_line_params: { emissive: 0.6 } }
        }
    );
}

const stime = 500;
// animate both colors and vertices ?
let fieldOffsetMs = 0
const repeats = 5
for (let i = 1; i < repeats * vector_field.length; i++) {
    const duration_ms = i % vector_field.length === 0 ? 0 : stime

    for (let j = 0; j < 4; j++){
        const ff = fanim[j];
        if (ff.length == 3){
            const startField = vector_field[ff[0]];
            const middField = vector_field[ff[1]];
            const endField = vector_field[ff[2]];
            anim.interpolate({
                kind: 'vec3',
                target_ref: 'vfa'+j,
                duration_ms: duration_ms/2,
                start_ms: fieldOffsetMs,
                property: 'vertices',
                // it should work to only set start when i % vector_field.length === 0 to save some space
                start: startField.vertices,
                end: middField.vertices,
            });  
            anim.interpolate({
                kind: 'vec3',
                target_ref: 'vfa'+j,
                duration_ms: duration_ms/2,
                start_ms: fieldOffsetMs+duration_ms/2,
                property: 'vertices',
                // it should work to only set start when i % vector_field.length === 0 to save some space
                start: middField.vertices,
                end: endField.vertices,
            });  
        } else {
            const startField = vector_field[ff[0]];
            const endField = vector_field[ff[1]];
            anim.interpolate({
                kind: 'vec3',
                target_ref: 'vfa'+j,
                duration_ms: duration_ms,
                start_ms: fieldOffsetMs,
                property: 'vertices',
                // it should work to only set start when i % vector_field.length === 0 to save some space
                start: startField.vertices,
                end: endField.vertices,
            });            
        }
    }
    fieldOffsetMs += duration_ms;
}
*/

