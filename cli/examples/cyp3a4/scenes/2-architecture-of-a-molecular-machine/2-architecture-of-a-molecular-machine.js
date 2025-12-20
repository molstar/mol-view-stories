const struct = _2v0m
.component({selector: 'protein'})
.representation({ type: 'cartoon' })
.color({ color: colors['2v0m']})
.opacity({ opacity: 1, ref: 'struct-opa'})

hem
.representation({ type: 'ball_and_stick', ref: 'hem'})
.color({ ...coloring, ref: 'hem-color'})

_2v0m
.component({ selector: { label_asym_id: 'E', label_atom_id: 'FE' } })
.representation({ type: 'spacefill' })
.color({ color: 'orange' });

catCore.representation({ type: "ball_and_stick" })
.color(coloring)

const repr = hem
.representation({ type: 'surface', surface_type: 'gaussian'})
.color(coloring)
.opacity({ opacity: 0.33 })

ligandBound
.label({ text: 'Ketokonazole' })
.representation({ type: 'ball_and_stick', ref: 'ligand'})
.color({ color: colors.ligand })


// Phe-cluster 
_2v0m
.component({ selector: phe })
.representation({ type: 'ball_and_stick' })
.color({color: colors.phe})
.opacity({ opacity: 0, ref: 'phe-opa'})


const sprimitives = _2v0m.primitives({
    label_background_color: 'grey',
    ref: 'labels',
    label_opacity: 0
})

phe.forEach((res) => {
  sprimitives
  .label({ 
    text: 'Phe' + String(res.auth_seq_id), 
    position: res,
    label_offset: 20,
    label_size: 2,
    label_color: colors.phe
    })
})

const anim = builder.animation({ 
  custom: {
    molstar_trackball: {
      name: 'rock',
      params: { speed: 0.05 } 
    }
  }
})

anim.interpolate({
  kind: 'scalar',
  target_ref: 'struct-opa',
  start_ms: 0,
  duration_ms: 3000,
  property: 'opacity',
  end: 0.15
})

anim.interpolate({
  kind: 'scalar',
  target_ref: 'phe-opa',
  start_ms: 10000,
  duration_ms: 3000,
  property: 'opacity',
  end: 1
})

anim.interpolate({
  kind: 'scalar',
  target_ref: 'labels',
  start_ms: 10000,
  duration_ms: 500,
  property: 'label_opacity',
  end: 1
})

const primitives = builder.primitives({
    label_attachment: 'middle-center',
    label_background_color: 'black'
});


