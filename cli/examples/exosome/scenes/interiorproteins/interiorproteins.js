const anim = builder.animation({});

// should only represent the surface polymer selection
const box_clip = { type: 'box', center: [0.0, -450.0, 0.0], size: [500.0, 500.0, 500.0] };
//use a plane maybe ? 
// Use builder to create a new scene
// how can I loop over entity and add a representation for each surfac element
// the point in common is in the name of the entity, it starts with root.exosome.surface.proteins. 

// Loop through each chain and create spacefill representation with named ref
Object.entries(interiorChainIds).forEach(([chainId, proteinName]) => {
  structure
    .component({
      selector: { label_asym_id: chainId }
    })
    .representation({ ref: proteinName, type: default_representation, custom: granularity })
    .clip(box_clip)
    .color({ custom: { molstar_color_theme_name: "chain-id" } });
});

Object.entries(fiberChainIds).forEach(([chainId, proteinName]) => {
  structure
    .component({
      selector: { label_asym_id: chainId }
    })
    .representation({ ref: proteinName, type: default_representation,custom: granularity })
    .clip(box_clip)
    .color({ custom: { molstar_color_theme_name: "chain-id" } });
  anim.interpolate(makeEmissivePulse(proteinName, 14000, 4000, 4));
});

const primitives = builder.primitives({
  label_attachment: 'bottom-left',
  label_show_tether: false,
  label_tether_length: 2,
  label_background_color: 'black',
  custom: {
    molstar_markdown_commands: {
      'apply-snapshot': 'AB',
      'play-audio': 'Exosome_intro.mp3',
    }
  }
}).label({
  position: [0, -350, -350],
  text: 'Back To Start',
  label_size: 100.0,
  label_offset: 2.0
})

const lprimitives = structure.primitives({
  label_attachment: 'middle-left',
  label_show_tether: true,
  label_tether_length: 5,
  label_background_color: 'black'
});
Object.entries(chainInstanceMap.interior).forEach(([chainId, { protein, instance, time }]) => {
  const selector = { label_asym_id: chainId, instance_id: instance };
  lprimitives.label({
    position: selector,
    text: protein,
    label_color: 'white',
    label_size: 50.5
  });
  if (time !== -1) {
    anim.interpolate(makeEmissivePulse(protein, time, 4000, 4));
  }
});


