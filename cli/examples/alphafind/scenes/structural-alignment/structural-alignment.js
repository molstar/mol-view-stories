const structure1 = builder
  .download({ url: 'https://alphafold.ebi.ac.uk/files/AF-A0A1D6JW22-F1-model_v6.pdb' })
  .parse({ format: 'pdb' })
  .modelStructure({})
  .component({})
  .representation({ ref: 'protein1' })
  .color({ color: 'red' });

// Load second structure with initial identity transform, color it blue
const structure2 = builder
  .download({ url: 'https://alphafold.ebi.ac.uk/files/AF-A0A3B6B8F7-F1-model_v6.pdb' })
  .parse({ format: 'pdb' })
  .modelStructure({})
  .transform({
    ref: 'animated_transform',
    rotation: [1, 0, 0, 0, 1, 0, 0, 0, 1], // Identity matrix initially
    translation: [0, 0, 0]
  })
  .component({})
  .representation({ ref: 'protein2' })
  .color({ color: 'blue' });

// Create animation
const anim = builder.animation({});

// Define transformation steps (including identity matrix as step 0)
const transformationSteps = [
  {
    rotation: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    translation: [0, 0, 0]
  },
  // Step 1
  {
    rotation: [0.99129072, 0.00977839, 0.03962814, -0.02105984, 0.99445097, 0.02520909, -0.03496412, -0.03135918, 0.98828427],
    translation: [-0.03847060, 0.11315986, -0.04088474]
  },
  // Step 2
  {
    rotation: [0.98258144, 0.01955678, 0.07925628, -0.04211968, 0.98890194, 0.05041818, -0.06992824, -0.06271836, 0.97656854],
    translation: [-0.07694120, 0.22631972, -0.08176948]
  },
  // Step 3
  {
    rotation: [0.97387216, 0.02933517, 0.11888442, -0.06317952, 0.98335291, 0.07562727, -0.10489236, -0.09407754, 0.96485281],
    translation: [-0.11541180, 0.33947958, -0.12265422]
  },
  // Step 4
  {
    rotation: [0.96516288, 0.03911356, 0.15851256, -0.08423936, 0.97780388, 0.10083636, -0.13985648, -0.12543672, 0.95313708],
    translation: [-0.15388240, 0.45263944, -0.16353896]
  },
  // Step 5
  {
    rotation: [0.95645360, 0.04889195, 0.19814070, -0.10529920, 0.97225485, 0.12604545, -0.17482060, -0.15679590, 0.94142135],
    translation: [-0.19235300, 0.56579930, -0.20442370]
  },
  // Step 6
  {
    rotation: [0.94774432, 0.05867034, 0.23776884, -0.12635904, 0.96670582, 0.15125454, -0.20978472, -0.18815508, 0.92970562],
    translation: [-0.23082360, 0.67895916, -0.24530844]
  },
  // Step 7
  {
    rotation: [0.93903504, 0.06844873, 0.27739698, -0.14741888, 0.96115679, 0.17646363, -0.24474884, -0.21951426, 0.91798989],
    translation: [-0.26929420, 0.79211902, -0.28619318]
  },
  // Step 8
  {
    rotation: [0.93032576, 0.07822712, 0.31702512, -0.16847872, 0.95560776, 0.20167272, -0.27971296, -0.25087344, 0.90627416],
    translation: [-0.30776480, 0.90527888, -0.32707792]
  },
  // Step 9
  {
    rotation: [0.92161648, 0.08800551, 0.35665326, -0.18953856, 0.95005873, 0.22688181, -0.31467708, -0.28223262, 0.89455843],
    translation: [-0.34623540, 1.01843874, -0.36796266]
  },
  // Step 10: Final transformation for A0A3B6B8F7
  {
    rotation: [0.9129071085, 0.0977838803, 0.3962813698, -0.2105983557, 0.944509675, 0.2520908693, -0.3496411644, -0.3135917514, 0.8828427207],
    translation: [-0.3847060244, 1.1315986491, -0.4088473903]
  }
];

// Animation timing: 500ms per step, starting after 1000ms
const stepDuration = 500;
const startDelay = 1000;

// Create sequential scalar animations for each transformation step
for (let stepIndex = 1; stepIndex < transformationSteps.length; stepIndex++) {
  const currentStep = transformationSteps[stepIndex];
  const previousStep = transformationSteps[stepIndex - 1];
  const startTime = startDelay + (stepIndex - 1) * stepDuration;

  // Animate each rotation matrix element for this step
  for (let matrixIndex = 0; matrixIndex < 9; matrixIndex++) {
    anim.interpolate({
      kind: 'scalar',
      target_ref: 'animated_transform',
      property: ['rotation', matrixIndex],
      start_ms: startTime,
      duration_ms: stepDuration,
      start: previousStep.rotation[matrixIndex],
      end: currentStep.rotation[matrixIndex],
      easing: 'linear'
    });
  }

  // Animate each translation element for this step
  for (let translationIndex = 0; translationIndex < 3; translationIndex++) {
    anim.interpolate({
      kind: 'scalar',
      target_ref: 'animated_transform',
      property: ['translation', translationIndex],
      start_ms: startTime,
      duration_ms: stepDuration,
      start: previousStep.translation[translationIndex],
      end: currentStep.translation[translationIndex],
      easing: 'linear'
    });
  }
}

// Optional: Add a pulsing effect to highlight the transformation
anim.interpolate({
  kind: 'scalar',
  target_ref: 'protein2',
  start_ms: 0,
  duration_ms: 6500, // Total animation time: 1000ms delay + 10 steps * 500ms = 6000ms + buffer
  frequency: 6,
  alternate_direction: true,
  property: ['custom', 'molstar_representation_params', 'emissive'],
  start: 0.0,
  end: 0.3
});

// Add a label to explain what's happening
/*builder.primitives({
  label_background_color: 'black',
  label_attachment: 'top-center'
}).label({
  position: [0, 50, 0],
  text: 'Structural Alignment with TM-Align',
  label_color: 'white',
  label_size: 5
});*/