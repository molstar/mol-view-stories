// Figure 8b renderer and panel geometry, shared by every scene. Coordinates are Angstroms.
// Placements are measured from the figure's own panel renders (PDF p. 14, ~4.43 px/A).

// beta-DG arms: spin puts VH/CH1 (heavy chain) on the membrane side, as drawn.
const leftArm = { center: [-49, 80, 8], angle: 66, spin: -90 };
const rightArm = { center: [50, 77, 8], angle: -48, spin: 90, bond: 'reach' };
// Spun 180 degrees so the pale Asn297 glycans face the viewer between the CH2 lobes.
const humanizedFc = { center: [0, -8, 8], angle: 0, spin: 180 };

const panels = [
  {
    title: '1+1 CrossMab', format: '1+1', receptors: [-79], hinge: [-13, 42, 8],
    betaFabs: [{ ...leftArm, crossover: true }],
    fc: { center: [19, 32, 15], angle: 73, tilt: -35 },
    lamaArms: [{ type: 'fab', center: [-19, -15, 2], angle: 183, spin: 90 }],
  },
  {
    title: '2+1', format: '2+1', receptors: [-79, 75], hinge: [0, 57, 8],
    betaFabs: [leftArm, rightArm], fc: humanizedFc,
    lamaArms: [{ type: 'fab', center: [62, -14, 20], angle: 185, spin: 90 }],
  },
  {
    title: '2+2 IgG-scFv', format: '2+2', receptors: [-79, 75], hinge: [0, 57, 8],
    betaFabs: [leftArm, rightArm], fc: humanizedFc,
    lamaArms: [
      { type: 'fv', center: [-66, -31, 8], angle: 172, bond: 'reach' },
      { type: 'fv', center: [66, -31, 8], angle: 188 },
    ],
  },
];

// Colors sampled from the figure. Antibody domains are colored by type, so the CrossMab
// crossover (heavy chain VH-CL, light chain VL-CH1) shows as swapped constant domains.
const palette = {
  vh: '#6a6a68', vl: '#949492', ch1: '#dddacd', cl: '#f1f0ec', fc: '#c9c4b3', glycan: '#e7e2d2',
  linker: '#d9d4c5', lama: '#3d81d4', betaDG: '#3c3c39', tm: '#8f8f8c', alpha: '#dad9d5',
  coatBound: '#b7d3f5', coat: '#cfe1f7', interior: '#f1ede2', membrane: '#eeece5', lipid: '#dedbd2',
  well: '#dcdfe2', text: '#303b46', contact: '#20252a', reach: '#9aa0a5',
};
// ~21 nm from the inner membrane surface to the well, as in the figure.
const membraneBottom = 120;
const wellTop = -96;
const coatTop = wellTop + 40; // LG4-5 proxy seen end-on, ~40 A tall
// size_factor is the only Gaussian-surface parameter MVS exposes; 1.5 smooths side chains into domain blobs.
const surfaceSize = 1.5;
// Figure-style rendering via Mol*-specific `custom` properties of the MVS loader (other viewers ignore them):
// flat-lit, coarser Gaussian surfaces, plus dark outlines and ambient occlusion on the canvas.
const molstarSurface = { ignoreLight: true, quality: 'custom', resolution: 1.2, radiusOffset: 1 };
const molstarCanvas = {
  molstar_postprocessing: {
    enable_outline: true, outline_params: { scale: 2, threshold: 0.2, color: 0x2a2a2a, includeTransparent: false },
    enable_ssao: true,
  },
};

// Kabat numbering in 1HZH: VH 1-113 / CH1 114-; VL 1-107 / CL 108-.
const domains = {
  vh: { auth_asym_id: 'H', end_auth_seq_id: 113 }, ch1: { auth_asym_id: 'H', beg_auth_seq_id: 114 },
  vl: { auth_asym_id: 'L', end_auth_seq_id: 107 }, cl: { auth_asym_id: 'L', beg_auth_seq_id: 108 },
};

// One structure per styled template per snapshot; repeated molecules are instances.
const templateGroups = new Map();

// Column-major rotation: in-plane angle (z), then forward tilt (x), then spin about the long axis (y).
function rotation(angle = 0, tilt = 0, spin = 0) {
  const [a, t, s] = [angle, tilt, spin].map(d => d * Math.PI / 180);
  const rz = [[Math.cos(a), -Math.sin(a), 0], [Math.sin(a), Math.cos(a), 0], [0, 0, 1]];
  const rx = [[1, 0, 0], [0, Math.cos(t), -Math.sin(t)], [0, Math.sin(t), Math.cos(t)]];
  const ry = [[Math.cos(s), 0, Math.sin(s)], [0, 1, 0], [-Math.sin(s), 0, Math.cos(s)]];
  const mul = (p, q) => p.map(row => [0, 1, 2].map(j => row.reduce((sum, v, k) => sum + v * q[k][j], 0)));
  const m = mul(mul(rz, rx), ry);
  return [0, 1, 2].flatMap(j => [m[0][j], m[1][j], m[2][j]]);
}

// Point `y` Angstroms along a placed template's long axis (+y: Fab/Fv paratope end, Fc hinge end).
function endpoint(part, y) {
  const r = rotation(part.angle, part.tilt);
  return [0, 1, 2].map(i => part.center[i] + r[3 + i] * y);
}
const paratope = (arm) => endpoint(arm, arm.type === 'fv' ? 20 : 34);

function drawPanel(panel, stage, offset = 0) {
  const pos = (p) => [p[0] + offset, p[1], p[2]];
  const envOpacity = stage === 'antibody' ? 0.16 : 1;
  const annotation = builder.primitives({ label_color: palette.text });
  const label = (text, p, size = 12) => annotation.label({ position: pos(p), text, label_size: size, label_offset: 3 });
  function tube(points, tooltip, radius = 2.4, color = palette.linker) {
    const prim = builder.primitives({});
    for (let i = 1; i < points.length; i++) {
      prim.tube({ start: pos(points[i - 1]), end: pos(points[i]), radius, color, tooltip });
    }
  }
  // `colors`: [selector, color, opacity factor?].
  function template(name, center, colors, opacity, tooltip, angle, tilt, spin) {
    const key = JSON.stringify([name, colors, opacity, tooltip]);
    let structure = templateGroups.get(key);
    if (!structure) {
      structure = builder.download({ url: `./${name}.pdb` }).parse({ format: 'pdb' }).modelStructure({});
      for (const [selector, color, factor = 1] of colors) {
        const component = structure.component({ selector });
        component.tooltip({ text: tooltip });
        component.representation({ type: 'surface', surface_type: 'gaussian', size_factor: surfaceSize,
          custom: { molstar_representation_params: molstarSurface } })
          .color({ color }).opacity({ opacity: opacity * factor });
      }
      templateGroups.set(key, structure);
    }
    structure.instance({ rotation: rotation(angle, tilt, spin), translation: pos(center) });
  }

  builder.primitives({ opacity: envOpacity * 0.9 })
    .box({ center: pos([0, membraneBottom + 60, -60]), extent: [330, 40, 2], face_color: palette.interior, tooltip: 'Cell interior (schematic)' })
    .box({ center: pos([0, membraneBottom + 20, -60]), extent: [330, 40, 2], face_color: palette.membrane, tooltip: 'Cell membrane, schematic 4 nm bilayer' })
    .box({ center: pos([0, wellTop - 9, -60]), extent: [330, 18, 2], face_color: palette.well, tooltip: 'Well bottom (schematic)' });
  const lipids = builder.primitives({ opacity: envOpacity * 0.65 });
  for (let x = -160; x <= 160; x += 10) {
    for (const y of [membraneBottom, membraneBottom + 40]) {
      lipids.ellipsoid({ center: pos([x, y, 3]), radius: [4.5, 3.8, 4.5], color: palette.lipid,
        tooltip: 'Schematic lipid headgroup; no lipid chemistry implied' });
    }
  }

  const receptors = panel.receptors.map(x => [x, false]);
  if (panel.receptors.length === 1) receptors.push([80, true]);
  receptors.push([-140, true]);
  for (const [x, bystander] of receptors) {
    // Receptors right of center are spun so alpha-DG faces outward, as drawn.
    template('dg', [x, membraneBottom + 20, bystander ? -20 : 0],
      [[{ auth_asym_id: 'A' }, palette.alpha],
       [{ auth_asym_id: 'B', end_auth_seq_id: 749 }, palette.betaDG],
       [{ auth_asym_id: 'B', beg_auth_seq_id: 750, end_auth_seq_id: 774 }, palette.tm, 0.75]],
      envOpacity * (bystander ? 0.45 : 1),
      'Rabbit alpha/beta-DG from 9C3C (beta-DG TM 750-774 in grey; cytoplasmic tail hidden); released alpha NTD omitted; illustrative placement',
      0, 0, x > 0 ? 180 : 0);
  }
  // A bound coat copy sits under each LAMA4 arm and replaces any bystander it would overlap.
  const coatTargets = panel.lamaArms.map(arm => paratope(arm)[0]);
  const coatXs = [-140, -72, 0, 72, 140]
    .filter(x => coatTargets.every(t => Math.abs(x - t) >= 50)) // end-on copies are ~48 A wide
    .concat(coatTargets);
  for (const x of coatXs) {
    const bound = coatTargets.includes(x);
    template('lg45-proxy', [x, wellTop + 20, bound ? 5 : -25],
      [['polymer', bound ? palette.coatBound : palette.coat]], envOpacity * (bound ? 0.9 : 0.5),
      'LAMA4 coat SHAPE PROXY: mouse LAMA2 LG4-5, PDB 5IK8 B. Not LAMA4 coordinates; adsorption pose unknown.', 0, 90);
  }

  if (stage !== 'context') {
    const { fc, hinge } = panel;
    template('fc', fc.center,
      [[[{ auth_asym_id: 'H', beg_auth_seq_id: 246 }, { auth_asym_id: 'K', beg_auth_seq_id: 246 }], palette.fc],
       [[{ auth_asym_id: 'A' }, { auth_asym_id: 'B' }], palette.glycan]], 1,
      'Generic human IgG1 Fc (CH2-CH3, from residue 246) with Asn297 glycans (pale) from 1HZH; hinge drawn as tubes',
      fc.angle, fc.tilt, fc.spin);
    const fcTop = endpoint(fc, 30); // residues 230-245 are drawn as hinge tubes
    for (const fab of panel.betaFabs) {
      const [heavyC, lightC] = fab.crossover ? [palette.cl, palette.ch1] : [palette.ch1, palette.cl];
      template('fab', fab.center,
        [[domains.vh, palette.vh], [domains.vl, palette.vl], [domains.ch1, heavyC], [domains.cl, lightC]], 1,
        fab.crossover
          ? 'Beta-DG CrossMab arm: CH1/CL colors swapped to show the crossover on a generic 1HZH Fab; AS30 sequence not modeled'
          : 'Beta-DG Fab: generic 1HZH scaffold; AS30 sequence not modeled',
        fab.angle, 0, fab.spin);
      const end = endpoint(fab, -34);
      if (panel.format === '1+1') {
        tube([end, hinge], 'Schematic hinge connection');
      } else {
        // Two hinge strands pinch together above the Fc, as drawn.
        const side = Math.sign(end[0]);
        tube([end, [side * 8, hinge[1] + 1, 8], [side * 4, hinge[1] - 4, 8], [side * 2, hinge[1] - 13, 8],
          [side * 4, hinge[1] - 20, 8], [side * 7, fcTop[1], 8]], 'Schematic hinge connection');
      }
    }
    if (panel.format === '1+1') tube([hinge, fcTop], 'Schematic hinge to Fc', 3);
    for (const arm of panel.lamaArms) {
      template(arm.type, arm.center,
        arm.type === 'fv'
          ? [['polymer', palette.lama]]
          : [[[domains.vh, domains.vl], palette.lama], [domains.ch1, palette.ch1], [domains.cl, palette.cl]],
        1, `LAMA4 ${arm.type === 'fv' ? 'scFv represented by generic Fv' : 'Fab'} (variable domains blue); generic 1HZH scaffold, not tool sequence`,
        arm.angle, 0, arm.spin);
      if (panel.format === '1+1') {
        tube([hinge, endpoint(arm, -34)], 'Second Fab shares hinge with beta-DG Fab');
      } else {
        // Fc C-terminus -> dip in front of the coat -> inner lower side of the LAMA4 arm.
        const side = Math.sign(arm.center[0]);
        tube([[side * 10, endpoint(fc, -34)[1], 8], [side * 22, coatTop - 6, 50],
          [arm.center[0] - side * 26, coatTop - 6, 50], [arm.center[0] - side * 16, paratope(arm)[1] + 12, 12]],
          'Illustrative C-terminal Fc-to-LAMA4 linker; no peptide conformation inferred', 2);
      }
    }
  }

  if (stage === 'contacts') {
    // Black: bond illustrated in the figure. Grey (`bond: 'reach'`): second bond within reach, not shown to form.
    const marks = builder.primitives({});
    for (const arm of [...panel.betaFabs, ...panel.lamaArms]) {
      const [x, y] = paratope(arm);
      const reach = arm.bond === 'reach';
      marks.ellipsoid({ center: pos([x, y, 70]), radius: 5.8, color: 'white',
        tooltip: reach ? 'Second bond within reach; not shown to form' : 'Illustrated contact; not an atom-level bond' });
      marks.ellipsoid({ center: pos([x, y, 75]), radius: 3.8, color: reach ? palette.reach : palette.contact });
      if (reach) label('within reach', [x + Math.sign(x) * 26, y - 12, 80]);
    }
  }

  label(panel.title, [0, 218, 30], 18);
  label('cell', [-144, membraneBottom + 61, 30]);
  label('well bottom', [-115, wellTop - 9, 60]);
  label('LAMA4 coat (homolog proxy)', [0, wellTop - 32, 60]);
  if (stage === 'context') {
    label('alpha-DG', [-118, 12, 45]);
    label('beta-DG', [-96, 100, 45]);
  } else {
    const plural = (n, noun) => `${n} ${noun}${n > 1 ? 's' : ''}`;
    label(plural(panel.betaFabs.length, 'beta-DG arm'), [0, 184, 35]);
    label(plural(panel.lamaArms.length, 'LAMA4 arm'), [0, wellTop - 50, 60]);
    if (stage === 'antibody') {
      label('Fc', [panel.fc.center[0] + 48, panel.fc.center[1], 65]);
      if (panel.format === '1+1') label('shared hinge', [panel.hinge[0] - 40, panel.hinge[1] - 18, 65]);
      else label('Fc-terminal linker', [40, coatTop - 16, 65]);
    }
  }
  tube([[60, 246, 10], [160, 246, 10]], '10 nm scale bar', 1, palette.text);
  label('10 nm', [110, 262, 20]);
}

function panelScene(index, stage) {
  builder.canvas({ background_color: '#ffffff', custom: molstarCanvas });
  drawPanel(panels[index], stage);
  builder.camera({ target: [0, 58, 0], position: [0, 58, 540], up: [0, 1, 0] });
}

function comparisonScene(stage) {
  builder.canvas({ background_color: '#ffffff', custom: molstarCanvas });
  panels.forEach((panel, i) => drawPanel(panel, stage, (i - 1) * 360));
  builder.camera({ target: [0, 58, 0], position: [0, 58, 1300], up: [0, 1, 0] });
}
