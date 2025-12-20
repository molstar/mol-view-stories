// Camera
builder.camera({ target: [0, 0, 0], position: [0, 10, 80], up: [0, 1, 0] });

const structure1 = builder
  .download({ url: 'https://alphafold.ebi.ac.uk/files/AF-A0A1D6JW22-F1-model_v6.pdb' })
  .parse({ format: 'pdb' })
  .modelStructure({})
  .component({})
  .representation({ ref: 'protein1' })
  .color({ color: 'red' });

const structure2 = builder
  .download({ url: 'https://alphafold.ebi.ac.uk/files/AF-A0A3B6B8F7-F1-model_v6.pdb' })
  .parse({ format: 'pdb' })
  .modelStructure({})
  .transform({
    ref: 'static_transform',
    rotation: [0.9129071085, 0.0977838803, 0.3962813698, -0.2105983557, 0.944509675, 0.2520908693, -0.3496411644, -0.3135917514, 0.8828427207],// Identity matrix
    translation: [-0.3847060244, 1.1315986491, -0.4088473903]
  })
  .component({})
  .representation({ ref: 'protein2' })
  .color({ color: 'blue' })
  .opacity({ opacity: 0.5 });

// Load third structure with transform, color it lightblue
const structure3 = builder
  .download({ url: 'https://alphafold.ebi.ac.uk/files/AF-A0A453DDF2-F1-model_v6.pdb' })
  .parse({ format: 'pdb' })
  .modelStructure({})
  .transform({
    ref: 'static_transform',
    rotation: [0.937860635, 0.122115708, 0.3248156142, -0.2022603888, 0.9529622353, 0.225729292, -0.2819719214, -0.2773999496, 0.9184449377],
    translation: [0.1070593757, 1.1521269743, -0.3680700188]
  })
  .component({})
  .representation({ ref: 'protein3' })
  .color({ color: 'lightblue' })
  .opacity({ opacity: 0.5 });

// Load fourth structure with transform, color it navy
const structure4 = builder
  .download({ url: 'https://alphafold.ebi.ac.uk/files/AF-A0A3B6CFE3-F1-model_v6.pdb' })
  .parse({ format: 'pdb' })
  .modelStructure({})
  .transform({
    ref: 'static_transform',
    rotation: [0.9423542871, 0.1230482932, 0.3111711991, -0.2127531504, 0.9380920107, 0.2733486354, -0.2582721328, -0.3237939114, 0.91019394],
    translation: [0.0558960904, 1.0533858279, -0.3309797501]
  })
  .component({})
  .representation({ ref: 'protein4' })
  .color({ color: 'grey' })
  .opacity({ opacity: 0.5 });

// Load fourth structure with transform, color it navy
const structure5 = builder
  .download({ url: 'https://alphafold.ebi.ac.uk/files/AF-A0A3B6GX69-F1-model_v6.pdb' })
  .parse({ format: 'pdb' })
  .modelStructure({})
  .transform({
    ref: 'static_transform',
    rotation: [0.9477450292, -0.0337118586, 0.3172426047, -0.1226418446, 0.8794893799, 0.4598449831, -0.2945137308, -0.4747230152, 0.8293972035],
    translation: [0.0178349272, 0.9226539264, -0.4543240765]
  })
  .component({})
  .representation({ ref: 'protein5' })
  .color({ color: 'grey' })
  .opacity({ opacity: 0.5 });

// Add labels at the top with respective colors
builder.primitives({
  label_attachment: 'top-center',
  label_background_color: 'white',
  opacity: 0.9
}).label({
  position: [0, 23.5, 0],
  text: 'A0A1D6JW22',
  label_color: 'red',
  label_size: 3.5
});

builder.primitives({
  label_attachment: 'top-center',
  label_background_color: 'white',
  opacity: 0.9
}).label({
  position: [0, 26.5, 0],
  text: 'A0A3B6B8F7',
  label_color: 'blue',
  label_size: 3.5
});


builder.primitives({
  label_attachment: 'top-center',
  label_background_color: 'white',
  opacity: 0.9
}).label({
  position: [0, 30, 0],
  text: 'A0A453DDF2',
  label_color: 'lightblue',
  label_size: 3.5
});

builder.primitives({
  label_attachment: 'top-center',
  label_background_color: 'white',
  opacity: 0.9
}).label({
  position: [0, 33.5, 0],
  text: 'A0A3B6CFE3',
  label_color: 'grey',
  label_size: 3.5
});

builder.primitives({
  label_attachment: 'top-center',
  label_background_color: 'white',
  opacity: 0.9
}).label({
  position: [0, 37, 0],
  text: 'A0A3B6GX69',
  label_color: 'lightgreen',
  label_size: 3.5
});