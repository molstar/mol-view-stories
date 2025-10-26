// Loop through each chain and create spacefill representation with named ref
Object.entries(surfaceChainIds).forEach(([chainId, proteinName]) => {
  structure
    .component({
      selector: { label_asym_id: chainId },
    })
    .representation({ ref: proteinName, type: default_representation, custom: granularity })
    .color({ custom: { molstar_color_theme_name: 'chain-id' } });
});

// Loop through each chain and create spacefill representation with named ref
Object.entries(interiorChainIds).forEach(([chainId, proteinName]) => {
  structure
    .component({
      selector: { label_asym_id: chainId },
    })
    .representation({ ref: proteinName, type: default_representation, custom: granularity })
    .color({ custom: { molstar_color_theme_name: 'chain-id' } });
});

Object.entries(fiberChainIds).forEach(([chainId, proteinName]) => {
  structure
    .component({
      selector: { label_asym_id: chainId },
    })
    .representation({ ref: proteinName, type: default_representation, custom: granularity })
    .color({ custom: { molstar_color_theme_name: 'chain-id' } });
});

//same for lipids
structure
  .component({
    selector: { label_comp_id: 'LIP' },
  })
  .representation({ ref: 'lipids', type: 'spacefill', custom: granularity })
  .color({ color: 'grey' });

const primitives = builder.primitives({
  label_attachment: 'bottom-left',
  label_show_tether: false,
  label_tether_length: 2,
  label_background_color: 'black',
  // snapshot_key: 'A',
  custom: {
    molstar_markdown_commands: {
      'apply-snapshot': 'AB',
      'play-audio': 'Exosome_intro.mp3',
    },
  },
});

primitives.label({
  position: [0, 700, 0],
  text: 'Start Tour',
  label_size: 150.0,
  label_offset: 2.0, // Offset to avoid overlap with the residue
});

const anim = builder.animation({
  custom: {
    molstar_trackball: {
      name: 'spin',
      params: { speed: 0.05 },
    },
  },
});
