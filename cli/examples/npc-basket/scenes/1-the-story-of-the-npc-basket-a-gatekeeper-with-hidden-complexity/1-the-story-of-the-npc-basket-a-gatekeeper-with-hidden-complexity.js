const lprimitives = _9a8n.primitives({
  label_attachment: 'top-left',
  label_show_tether: true,
  label_tether_length: 2,
  label_background_color: 'black',
});

const anim = builder.animation({});
// const anim = builder.animation({
//   custom: {
//     molstar_trackball: {
//       name: 'spin',
//       params: { speed: 0.05 },
//     }
//   }
// });

for (const vol of volumes) {
  vol
    .representation({
      type: 'isosurface',
      relative_isovalue: 3,
    })
    .opacity({ opacity: 0.7 });
}

createNuclearRing(_9a8n);
createProteinsRepr(_9a8n, ['Nup1', 'Nup2', 'Nup60', 'Mlp'], { labels: false });

//not working with this ref
// anim.interpolate(makeEmissivePulse(proteinSelectors['9a8n']['Mlp'], 3000, 4000, 2));

const selector = { label_asym_id: 'AS' };
lprimitives.label({
  position: selector,
  text: 'Anchor Nups',
  label_color: '#779ecb',
  label_size: 100,
});

//TODO: need to change camera settings to see label at the beginning
builder
  .primitives({
    label_background_color: 'black',
  })
  .label({
    position: [0, 0, -800],
    text: 'Basket',
    label_size: 100.0,
    label_color: '#1b9e77',
  });
