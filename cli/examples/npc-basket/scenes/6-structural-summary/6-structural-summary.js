const lprimitives = _9a8m.primitives({
  label_attachment: 'top-left',
});

volumes[0]
  .representation({
    type: 'isosurface',
    relative_isovalue: 3,
  })
  .opacity({ opacity: 0.5 });

createNup84ComplexRepr({ opacity: 0.4, labels: true });
createProteinsRepr(_9a8m, ['Nup1', 'Nup2', 'Nup60'], { labels: true });

builder.primitives({}).label({
  position: [14, 347, -80],
  text: 'Nuclear membrane',
  label_size: 40.0,
  label_color: 'grey',
});
