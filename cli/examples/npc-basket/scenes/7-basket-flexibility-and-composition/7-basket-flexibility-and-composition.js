const lprimitives = _9a8m.primitives({
  label_attachment: 'top-left',
});

volumes[0]
  .representation({
    type: 'isosurface',
    relative_isovalue: 3,
  })
  .opacity({ opacity: 0.4 });

createNup84ComplexRepr({ opacity: 0.4, labels: true });
createProteinsRepr(_9a8m, ['Nup1', 'Nup2', 'Nup60', 'Mlp'], { labels: true });

const nTermSelector = { label_asym_id: 'B', label_seq_id: 1 };
const primitives = _9a8m.primitives({
  label_attachment: 'top-right',
  label_show_tether: true,
  label_tether_length: 2,
});
primitives.label({
  position: nTermSelector,
  text: 'Mlps N-term',
  label_color: 'blue',
  label_size: 30,
});

const cTermSelector = { label_asym_id: 'B', label_seq_id: 1875 };
primitives.label({
  position: cTermSelector,
  text: 'Mlps C-term',
  label_color: 'red',
  label_size: 30,
});

function hslToHex(h, s = 100, l = 50) {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// const stops = 100

// for (let i = 0; i < stops; i++) {
//   const f = i / (stops - 1);
//   const hue = 240 - 240 * f; // 240° blue → 0° red
//   const color = hslToHex(hue);

//   const chainLength = 1875

//   const start = Math.floor(1 + f * (chainLength - 1));
//   const end = Math.floor(1 + ((i + 1) / stops) * (chainLength - 1));

//   _9a8m
//     .component({
//       selector: { label_asym_id: 'B', beg_label_seq_id: start, end_label_seq_id: end }
//     })
//     .representation({ type: 'surface', surface_type: 'gaussian'})
//     .color({ color });
// }
