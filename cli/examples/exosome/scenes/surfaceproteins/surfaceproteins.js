const anim = builder.animation({});

// should only represent the surface polymer selection
const box_clip = { type: 'box', center: [0.0, -450.0, 0.0], size: [500.0, 500.0, 500.0] };
// Use builder to create a new scene
// how can I loop over entity and add a representation for each surfac element
// the point in common is in the name of the entity, it starts with root.exosome.surface.proteins.

// Loop through each chain and create spacefill representation with named ref
Object.entries(surfaceChainIds).forEach(([chainId, proteinName]) => {
  structure
    .component({
      selector: { label_asym_id: chainId },
    })
    .representation({ ref: proteinName, type: default_representation, custom: granularity })
    .clip(box_clip)
    .color({ custom: { molstar_color_theme_name: 'chain-id' } });
});

// same for lipids
structure
  .component({
    selector: { label_comp_id: 'LIP' },
  })
  .representation({ ref: 'lipids', type: 'spacefill', custom: granularity })
  .clip(box_clip)
  .color({ color: 'grey' });

builder
  .primitives({
    label_attachment: 'top-left',
    label_show_tether: true,
    label_tether_length: 5,
    label_background_color: 'black',
    // snapshot_key: 'C'
    custom: {
      molstar_markdown_commands: {
        'apply-snapshot': 'C',
        'play-audio': 'Exosome_interior.mp3',
      },
    },
  })
  .label({
    position: [0, -300, 0],
    text: 'Explore the interior',
    label_size: 100.0,
    label_offset: 2.0,
  });

const lprimitives = structure.primitives({
  label_attachment: 'bottom-left',
  label_show_tether: false,
  label_tether_length: 2,
  label_background_color: 'black',
});

Object.entries(chainInstanceMap.surface).forEach(([chainId, { protein, instance, time }]) => {
  const selector = { label_asym_id: chainId, instance_id: instance };
  lprimitives.label({
    position: selector,
    text: protein,
    label_color: 'white',
    label_size: 50.5,
  });
  anim.interpolate({
    kind: 'scalar',
    target_ref: protein,
    start_ms: time,
    duration_ms: 6000,
    frequency: 6,
    alternate_direction: true,
    property: ['custom', 'molstar_representation_params', 'emissive'],
    end: 1.0,
  });
});
