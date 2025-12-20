const struct = _2v0m
.component({selector: 'protein'})
.representation({ type: 'cartoon' })
.color({ color: colors['2v0m']})
.opacity({ opacity: 0, ref: '2v0m-opa'})


const structNoLigand = _1tqn
.component({selector: 'protein'})
.representation({ type: 'cartoon' })
.color({ color: colors['2v0m'], ref: 'color'})
.opacity({ opacity: 1, ref: '1tqn-opa'})

hem
.representation({ type: 'ball_and_stick', ref: 'hem'})
.color({ color: colors.hem, ref: 'hem-color'})


const sprimitives = _2v0m.primitives({
    label_background_color: 'grey'
})


Object.entries(helices).forEach(([helix, seq]) => {
  struct
    .color({ selector: seq, color: colors.helix })
})

ligandNotBound
.transform({
            ref: 'xform',
            translation: [-17,-30,-48],
            rotation: [1, 0, 0, 0, 1, 0, 0, 0, 1],
            rotation_center: 'centroid',
            })
.representation({ type: 'ball_and_stick', ref: 'ligand', custom: {
            molstar_representation_params: { emissive: 0 }
          }})
.color({ ...coloring, ref: 'ligand-color'})
.opacity({ opacity: 0, ref: 'ligand-opacity'})

const anim = builder.animation(
    {
        custom: {
        molstar_trackball: {
            name: 'rock',
            params: { speed: 0.15 },
        }
    }}
);

const opa = 0.3
for (const [name, { data, color, label }] of Object.entries(channels)) {
  buildChannel(data, color, label, opa);
}

anim.interpolate({
  kind: 'scalar',
  target_ref: 'ligand-opacity',
  start_ms: 6000,
  duration_ms: 500,
  property: 'opacity',
  end: 1,
})

anim.interpolate(makeEmissivePulse('ligand', 7000, 3000, 8))


anim.interpolate({
    kind: 'vec3',
    target_ref: 'xform',
    duration_ms: 2000,
    start_ms: 6000,
    property: 'translation',
    end: [0, 0, 0],
    noise_magnitude: 1.5,
});

anim.interpolate({
    kind: 'rotation_matrix',
    target_ref: 'xform',
    duration_ms: 2000,
    start_ms: 6000,
    property: 'rotation',
    noise_magnitude: 0.2,
});

anim.interpolate({
  kind: 'scalar',
  target_ref: '1tqn-opa',
  start_ms: 5000,
  duration_ms: 2000,
  property: 'opacity',
  end: 0,
})

anim.interpolate({
  kind: 'scalar',
  target_ref: '2v0m-opa',
  start_ms: 5000,
  duration_ms: 2000,
  property: 'opacity',
  end: 1,
})

anim.interpolate({
  kind: 'scalar',
  target_ref: '1tqn-opa',
  start_ms: 9000,
  duration_ms: 2000,
  property: 'opacity',
  end: 1,
})

anim.interpolate({
  kind: 'color',
  target_ref: 'color',
  start_ms: 9000,
  duration_ms: 2000,
  property: 'color',
  end: colors['1tqn']
})
//{ color: colors['2v0m']}
