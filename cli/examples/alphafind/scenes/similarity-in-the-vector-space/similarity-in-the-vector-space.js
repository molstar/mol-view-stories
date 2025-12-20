// Latent Space + connections + animated "signal" along edges (pure primitives)

// Generate more points deterministically
const points = [];

// Protein IDs list
const proteinIds = [
  'A0A1D6JW22', 'A0A4D4LYU1', 'A0A7S2ARG5', 'A0A3D0EQI2', 'A0A1F4X4G9', 'A0A2S9KIM8',
  'H9DQK2', 'A0A8B9PW02', 'A0AAW8IHC1', 'C3MH26', 'A0A382RIZ7', 'A0A1Y3C540',
  'A0A832Z988', 'A0A2K2DFI2', 'A0A090FKV3', 'A0A5D3FDD4', 'A0A7K4KDB1', 'A0A724LZ95',
  'A0A225AN51', 'A0A538TFK9', 'W8DXC3', 'A0A7C1UEG1', 'R4WGK9', 'A0A1H8XXM0',
  'A0A7K4XHP3', 'A0A7G7CI59', 'A0A4V3GTC5', 'U6SL63', 'A0A1B8AXS8', 'A0A844KKW9',
  'A0A2I8EG49', 'A0A389MPR7', 'A0A0G0Q999', 'A0A3B6GX69', 'A0AB73HTI6', 'A0AAD5F1W3',
  'A0A552E620', 'A0A517LAD1', 'A0A2K0JK43', 'A0A1M5GHG0', 'A0A8I6TGK3', 'A0A7Y8BM17',
  'A0A370KKB5', 'A0A924NE03', 'A0A9Q1GA85', 'A0A816A2Y0', 'A0A3C1HYN7', 'A0A6A4VQT2',
  'A0A2Z4FHG7', 'A0A0F4RGB6', 'A0A5D2FD42', 'A0A2W4M5H1', 'A0AAV5Z5S9', 'A0A1G3LFS8',
  'A0A1H5NMX1', 'A0A3A5ZJP2', 'A0A6I3WGQ4', 'A0A7W9X1Y3', 'A0A316H223', 'A0A8X6IBS8',
  'D9XD74', 'A0A4Q5J769', 'T1F7X9', 'A0A1B4NWX3', 'A0A7V6WH59', 'A0A2K0WVQ6',
  'A0A7J0H3K3', 'A0A285NZK1', 'A0A0Q8CRC1', 'A0A9P4Y205', 'A0AAC9JCX6', 'A0A8U0TLI6',
  'A0A4R6SFR6', 'A0A8H5Y122', 'Q7Y149', 'A0A927V378', 'A0A3B6B8F7', 'A0A3A0B2H0',
  'A0A327IYC2', 'A0A841QJV1', 'A0A453DDF2', 'A0A3M0NT30', 'A0A6J2VLH7', 'A0A353P9F6',
  'A0A6M2AT58', 'A0A183MUZ6', 'A0A2E9ZI09', 'A0A7Y8GY12', 'A0A563EYG7', 'A0A0C3LGT3',
  'A0A7V4HFY1', 'A0A416ZDL8', 'A0A1I8AZW8', 'A0AAF0FJ91', 'A0A4Z2BHK4', 'A0A316EFS9',
  'A0A067H3U6', 'A0A7W7YWP2', 'A0A3B6CFE3', 'A0A454A6K2'
];

// Generate 100 points using a more random deterministic pattern
function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

let color = 'red';

for (let i = 0; i < 100; i++) {
  // Use i as seed for deterministic randomness
  const r1 = seededRandom(i);
  const r2 = seededRandom(i + 1000);
  const r3 = seededRandom(i + 2000);

  const pos = [
    (r1 - 0.5) * 40, // X: -20 to 20
    (r2 - 0.5) * 30, // Y: -15 to 15  
    (r3 - 0.5) * 40  // Z: -20 to 20
  ];

  if (i > 0){
    color = 'cyan';
  }
  points.push({
    id: proteinIds[i], // Use protein ID instead of coordinates
    pos: pos,
    color: color
  });
}

// Build primitives group
const space = builder.primitives({
  label_attachment: 'top-center',
  label_background_color: 'black',
  opacity: 1.0
});

// Axes
const axisLen = 30;
space.arrow({ start: [-axisLen, 0, 0], end: [axisLen, 0, 0], tube_radius: 0.1, color: 'red' });
space.arrow({ start: [0, -axisLen, 0], end: [0, axisLen, 0], tube_radius: 0.1, color: 'red' });
space.arrow({ start: [0, 0, -axisLen], end: [0, 0, axisLen], tube_radius: 0.1, color: 'red' });
space.label({ position: [axisLen + 2, 0, 0], text: 'X', label_color: 'white', label_size: 4.0 });
space.label({ position: [0, axisLen + 3, 0], text: 'Y', label_color: 'white', label_size: 4.0 });
space.label({ position: [0, 0, axisLen + 2], text: 'Z', label_color: 'white', label_size: 4.0 });

// Points + labels
points.forEach((p, i) => {
  space.ellipsoid({
    ref: `pt_${i}`,
    center: p.pos,
    radius: [0.8, 0.8, 0.8],
    color: p.color ?? 'white',
    tooltip: `${p.pos}`
  });
  space.label({
    position: [p.pos[0], p.pos[1] + 1.4, p.pos[2]],
    text: p.id,
    label_color: 'white',
    label_size: 1.0
  });
});

// Camera - zoom to first protein
const firstProteinPos = points[0].pos;
builder.camera({
  target: firstProteinPos,
  position: [firstProteinPos[0], firstProteinPos[1], firstProteinPos[2] + 15],
  up: [0, 1, 0]
});

const sourceProtein = 'A0A1D6JW22';
const targetProteins = ['A0A3B6B8F7', 'A0A453DDF2', 'A0A3B6CFE3', 'A0A3B6GX69', 'A0A8I6TGK3'];

// Find indices of source and target proteins
const sourceIndex = proteinIds.indexOf(sourceProtein);
const targetIndices = targetProteins.map(id => proteinIds.indexOf(id));

// Draw connections
targetIndices.forEach((targetIndex, i) => {
  if (sourceIndex !== -1 && targetIndex !== -1) {
    const sourcePos = points[sourceIndex].pos;
    const targetPos = points[targetIndex].pos;

    space.arrow({
      ref: `connection_${i}`,
      start: sourcePos,
      end: targetPos,
      tube_radius: 0.1,
      color: 'yellow',
      tooltip: `${sourceProtein} ↔ ${targetProteins[i]}`
    });
  }
});
