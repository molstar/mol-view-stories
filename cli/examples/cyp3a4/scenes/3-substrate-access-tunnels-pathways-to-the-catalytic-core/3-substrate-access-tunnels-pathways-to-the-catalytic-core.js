
const struct = _2v0m
.component({selector: 'protein'})
.representation({ type: 'cartoon' })
.color({ color: colors['2v0m']})

hem
.representation({ type: 'ball_and_stick', ref: 'hem'})
.color({ color: colors.hem, ref: 'hem-color'})


_2v0m
.component({selector: 'protein'})
.representation({ type: 'surface', surface_type: 'gaussian', ref: 'surface' })
.color({color: colors['2v0m']})
.opacity({opacity: 0, ref: 'surface-opacity'})

const sprimitives = _2v0m.primitives({
    label_background_color: 'grey'
})

_2v0m
.component({ selector: phe })
.representation({ type: 'ball_and_stick' })
.color({ color: colors.phe }) // Phe-cluster 


Object.entries(helices).forEach(([helix, seq]) => {
  struct
    .color({ selector: seq, color: colors.helix })
    sprimitives
  .label({ 
    text: helix, 
    position: { auth_seq_id: seq.end_auth_seq_id },
    label_offset: 20,
    label_size: 3,
    label_color: colors[helix]
    });
})



const anim = builder.animation({
  custom: {
    molstar_trackball: {
      name: 'spin',
      params: { speed: 0.05 } 
    }
  }
});

anim.interpolate({
  kind: 'scalar',
  target_ref: 'surface-opacity',
  start_ms: 0,
  duration_ms: 3000,
  property: 'opacity',
  end: 0.9,
})

anim.interpolate({
  kind: 'scalar',
  target_ref: 'surface-opacity',
  start_ms: 10000,
  duration_ms: 3000,
  property: 'opacity',
  end: 0.3,
})

const opa = 1
for (const [name, { data, color, label }] of Object.entries(channels)) {
  buildChannel(data, color, label, opa);
}


