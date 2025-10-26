const lprimitives = _9a8m.primitives({
  label_attachment: 'top-left',
  label_show_tether: false,
  label_tether_length: 2,
});

volumes[0]
  .representation({
    type: 'isosurface',
    relative_isovalue: 3,
  })
  .opacity({ opacity: 0.7 });

createNup84ComplexRepr({ opacity: 0.5 });
createProteinsRepr(_9a8m, ['Nup1', 'Nup2', 'Nup60', 'Mlp'], { labels: true });

builder
  .primitives({
    label_background_color: 'black',
  })
  .label({
    position: [0, 900, 500],
    text: 'Central channel view',
    label_size: 150.0,
    label_offset: 20.0,
  });
