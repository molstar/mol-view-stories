const struct = _2v0m
.component({selector: 'protein'})
.representation({ type: 'cartoon' })
.color({ color: colors['2v0m']})

hem
.representation({ type: 'ball_and_stick', ref: 'hem', custom: {
            molstar_representation_params: { emissive: 0 }
          }})
.color({ color: colors.hem })

hem
.representation({ type: 'surface', surface_type: 'gaussian' })
.color({ color: colors.hem, ref: 'hem-color'}) // Hem surface
.opacity({ opacity: 0.33 })

const sprimitives = _2v0m.primitives({
    label_background_color: 'grey'
})

_2v0m
.component({ selector: phe })
.representation({ type: 'ball_and_stick' })
.color({color: colors.phe}) // Phe-cluster 

phe.forEach((res) => {
  sprimitives
  .label({ 
    text: 'Phe' + String(res.auth_seq_id), 
    position: res,
    label_offset: 20,
    label_size: 2,
    label_color: 'beige' // colors[helix]
    });
})

Object.entries(helices).forEach(([helix, seq]) => {
  struct
    .color({ selector: seq, color: colors.helix })
    sprimitives
  .label({ 
    text: helix, 
    position: { auth_seq_id: seq.end_auth_seq_id },
    label_offset: 10,
    label_size: 3,
    label_color: colors.helix
    });
})


ligandBound
.representation({ type: 'ball_and_stick', ref: 'ligand', custom: {
            molstar_representation_params: { emissive: 0 }
          }})
.color({ ...coloring})
.opacity({ opacity: 1, ref: 'ligb-opa'})

ligandNotBound
.representation({ type: 'ball_and_stick', ref: 'ligand', custom: {
            molstar_representation_params: { emissive: 0 }
          }})
.color({ ...coloring})
.opacity({ opacity: 1, ref: 'lign-opa'})

const anim = builder.animation(
    {
        custom: {
        molstar_trackball: {
            name: 'rock',
            params: { speed: 0.2 },
        }
    }}
);

const opa = 0.3
for (const [name, { data, color, label }] of Object.entries(channels)) {
  buildChannel(data, color, label, opa);
}



