const lprimitives = _9a8n.primitives({
  label_attachment: 'top-left',
  label_show_tether: false,
  label_tether_length: 2,
  label_background_color: 'black',
});

for (let i = 2; i < volumes.length - 1; i++) {
  const vol = volumes[i];
  vol
    .representation({
      type: 'isosurface',
      relative_isovalue: 3,
    })
    .opacity({ opacity: 0.5 });
}

createNuclearRing(_9a8n, { opacity: 0.5 });
createProteinsRepr(_9a8n, ['Nup1', 'Nup2', 'Nup60', 'Mlp'], { labels: true });
