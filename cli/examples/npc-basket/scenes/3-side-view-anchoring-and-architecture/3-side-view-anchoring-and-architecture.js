const lprimitives = _9a8n.primitives({
  label_attachment: 'top-left',
  label_show_tether: false,
  label_tether_length: 2,
  label_background_color: 'black',
});

const anim = builder.animation({});

// const anim = builder.animation({
//   custom: {
//     molstar_trackball: {
//       name: 'rock',
//       params: { speed: 0.15 },
//     }
//   }
// });

for (const vol of volumes) {
  vol
    .representation({
      type: 'isosurface',
      relative_isovalue: 3,
    })
    .opacity({ opacity: 0.5 });
}

createNuclearRing(_9a8n);
createProteinsRepr(_9a8n, ['Nup1', 'Nup2', 'Nup60', 'Mlp'], { labels: false });

// anim.interpolate(makeEmissivePulse('A', 1000, 4000, 2));

builder.primitives({}).label({
  position: [0, 0, -900],
  text: 'Mlp Basket',
  label_size: 100.0,
  label_color: '#1b9e77',
});

builder.primitives({}).label({
  position: [-700, 0, -450],
  text: 'Basket',
  label_size: 120.0,
  label_color: '#1b9e77',
});

builder.primitives({}).label({
  position: [-700, 600, 200],
  text: 'Nuclear envelope',
  label_size: 100.0,
  label_color: 'grey',
});

builder
  .primitives({
    label_background_color: 'black',
  })
  .label({
    position: [0, 0, 600],
    text: 'Side view',
    label_size: 150.0,
  });

builder.primitives({}).label({
  position: [850, 0, -250],
  text: 'Nuclear ring',
  label_size: 100.0,
  label_color: '#fdd797',
});
