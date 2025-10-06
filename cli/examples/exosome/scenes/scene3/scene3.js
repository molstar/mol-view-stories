const anim = builder.animation({});

const aplane = (ref) => ({
  ref: ref,
  type: 'plane',
  normal: [1, 0, 0],
  point: [0.0, 0.0, 0.0]
});

// Loop through each chain and create spacefill representation with named ref
Object.entries(surfaceChainIds).forEach(([chainId, proteinName]) => {
  structure
    .component({
      selector: { label_asym_id: chainId }
    })
    .representation({ ref: proteinName, type: default_representation,custom: granularity })
    .clip(aplane('aplane_'+chainId))
    .color({ custom: { molstar_color_theme_name: "chain-id" } });
  anim.interpolate(makeEmissivePulse(proteinName,11000, 4000, 4));
});

// Loop through each chain and create spacefill representation with named ref
Object.entries(interiorChainIds).forEach(([chainId, proteinName]) => {
  structure
    .component({
      selector: { label_asym_id: chainId }
    })
    .representation({ ref: proteinName, type: default_representation ,custom: granularity})
    .clip(aplane('aplane_'+chainId))
    .color({ custom: { molstar_color_theme_name: "chain-id" } });
  anim.interpolate(makeEmissivePulse(proteinName, 20000, 4000, 4));
});


Object.entries(fiberChainIds).forEach(([chainId, proteinName]) => {
  structure
    .component({
      selector: { label_asym_id: chainId }
    })
    .representation({ ref: proteinName, type: default_representation,custom: granularity })
    .clip(aplane('aplane_'+chainId))
    .color({ custom: { molstar_color_theme_name: "chain-id" } });
  anim.interpolate(makeEmissivePulse(proteinName, 23000, 4000, 4));
});

//same for lipids
structure
  .component({
    selector: { label_comp_id: 'LIP' }
  })
  .representation({ref:'lipids', type: 'spacefill', custom: granularity })
  .clip(aplane('aplane'))
  .color({ color: 'grey' });  
anim.interpolate(makeEmissivePulse('lipids', 8000, 4000,2));

const primitives = builder.primitives({
    label_attachment: 'bottom-left',
    label_show_tether: true,
    label_tether_length: 2,
    label_background_color: 'black',
    //snapshot_key: 'B',
    custom: {
        molstar_markdown_commands: {
            'apply-snapshot': 'B',
            'play-audio': 'Exosome_surface.mp3',
        }
    }
})
.label({
    position: [0,350,-350],
    text: 'Explore the envelope',
    label_size: 100.0,
    label_offset: 2.0    
})

builder.primitives({
  label_attachment: 'top-left',
  label_show_tether: true,
  label_tether_length: 5,
  label_background_color: 'black',
  // snapshot_key: 'C'
  custom: {
    molstar_markdown_commands: {
      'apply-snapshot': 'C',
      'play-audio': 'Exosome_interior.mp3',
    }
  }
}).label({
  position: [0, -250, 0],
  text: 'Explore the interior',
  label_size: 100.0,
  label_offset: 2.0
});

// make a distance showing the radius of the vesicles
structure.primitives({ ref: 'dist',
  label_opacity: 0.0,
  opacity: 0.0})
.distance({
    start: {
      label_comp_id: 'LIP',
      instance_id: 'ASM-1570',
      label_asym_id: 'R10026_48',
    },
    end: {
      instance_id: 'ASM-1497',
      label_comp_id: 'LIP',
      label_asym_id: 'R9236_48',
      // atom_index: 5374
    },
    radius: 10,
    dash_length: 10,
    label_size: 100
  })

const makeClipTransition = (ref) => ({
  kind: 'scalar',
  ref: 'clip-transition',
  target_ref: ref,
  start_ms: 0,
  duration_ms: 5000,
  property: ['point', 0],
  start: 700,
  end: 0,
  easing: 'sin-in',
});

Object.entries(surfaceChainIds).forEach(([chainId, proteinName]) => {
  anim.interpolate(makeClipTransition('aplane_' + chainId));
});
Object.entries(interiorChainIds).forEach(([chainId, proteinName]) => {
  anim.interpolate(makeClipTransition('aplane_' + chainId));
});
Object.entries(fiberChainIds).forEach(([chainId, proteinName]) => {
  anim.interpolate(makeClipTransition('aplane_' + chainId));
});
//
anim.interpolate(makeClipTransition('aplane'));

anim.interpolate({
  kind: 'scalar',
  target_ref: 'dist',
  duration_ms: 2000,
  start_ms: 14000,
  property: 'label_opacity',
  start: 0.0,
  end: 1.0,
});

anim.interpolate({
  kind: 'scalar',
  target_ref: 'dist',
  duration_ms: 2000,
  start_ms: 14000,
  property: 'opacity',
  start: 0.0,
  end: 1.0,
});
  