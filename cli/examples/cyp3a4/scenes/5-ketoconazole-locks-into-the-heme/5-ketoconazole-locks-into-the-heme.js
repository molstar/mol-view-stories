const struct = _2v0m
.component({selector: 'protein'})
.representation({ type: 'cartoon' })
.color({ color: colors['2v0m']})


hem
.representation({ type: 'ball_and_stick', ref: 'hem', custom: {
            molstar_representation_params: { emissive: 0 }
          }})
.color(coloring)

hem
.representation({ type: 'surface', surface_type: 'gaussian' })
.color({ ...coloring, ref: 'hem-color'}) // Hem surface
.opacity({ opacity: 0.33 })


const sprimitives = _2v0m.primitives({
    label_background_color: 'grey'
})

_2v0m
.component({ selector: phe })
.representation({ type: 'ball_and_stick' })
.color({color: colors.phe}) // Phe-cluster 

_2v0m
.component({ selector: { label_asym_id: 'E', label_atom_id: 'FE' } })
.representation({ type: 'spacefill' })
.color({ color: 'orange' });


Object.entries(helices).forEach(([helix, seq]) => {
  struct
    .color({ selector: seq, color: colors.helix })
})


ligandBound
.representation({ type: 'ball_and_stick', ref: 'ligbound', custom: {
            molstar_representation_params: { emissive: 0 }
          }})
.color({ ...coloring})
.opacity({ opacity: 0, ref: 'ligand-b-opa'})

ligandNotBound
.representation({ type: 'ball_and_stick', ref: 'lignon', custom: {
            molstar_representation_params: { emissive: 0 }
          }})
.color({ ...coloring})
.opacity({ opacity: 0, ref: 'ligand-n-opa'})

const anim = builder.animation(
    {
        custom: {
        molstar_trackball: {
            name: 'spin',
            params: { speed: 0.05 },
        }
    }}
);

const channelToShow = channels.channel2f

buildChannel(channelToShow.data, channelToShow.color, channelToShow.label, 0.15)


anim.interpolate({
  kind: 'scalar',
  target_ref: 'ligand-b-opa',
  start_ms: 0,
  duration_ms: 2500,
  property: 'opacity',
  end: 1,
})
anim.interpolate({
  kind: 'scalar',
  target_ref: 'ligand-n-opa',
  start_ms: 4500,
  duration_ms: 2500,
  property: 'opacity',
  end: 1,
})

anim.interpolate(makeEmissivePulse('ligbound', 2500, 3000, 8))
anim.interpolate(makeEmissivePulse('lignon', 6000, 3000, 8))
