// Canonical renderer. Run generate.py after editing. Coordinates are Angstroms.
const palette = {
  beta: '#545958', alpha: '#c7c7bd', antibody: '#c1bba6', lama: '#438ac6',
  coat: '#c0d9ee', membrane: '#d9d8cc', text: '#303b46', contact: '#20252a', reach: '#9aa0a5',
};
// Vertical layout, matched to Figure 8b's ~21 nm from the inner membrane surface to the well.
const membraneBottom = 120;
const wellTop = -96;
const coatTop = wellTop + 48; // LG4-5 proxy lies on its side: 48 A tall

// One template/representation per style per snapshot; repeated molecules are instances.
const templateGroups = new Map();

// Column-major rotation: in-plane angle (z), then forward tilt (x), then spin about the template's long axis (y).
function rotation(angle = 0, tilt = 0, spin = 0) {
  const [a, t, s] = [angle, tilt, spin].map(d => d * Math.PI / 180);
  const rz = [[Math.cos(a), -Math.sin(a), 0], [Math.sin(a), Math.cos(a), 0], [0, 0, 1]];
  const rx = [[1, 0, 0], [0, Math.cos(t), -Math.sin(t)], [0, Math.sin(t), Math.cos(t)]];
  const ry = [[Math.cos(s), 0, Math.sin(s)], [0, 1, 0], [-Math.sin(s), 0, Math.cos(s)]];
  const mul = (p, q) => p.map(row => [0, 1, 2].map(j => row.reduce((sum, v, k) => sum + v * q[k][j], 0)));
  const m = mul(mul(rz, rx), ry);
  return [0, 1, 2].flatMap(j => [m[0][j], m[1][j], m[2][j]]);
}

function drawPanel(panel, stage, offset = 0, labels = true) {
  const pos = (p) => [p[0] + offset, p[1], p[2]];
  const envOpacity = stage === 'antibody' ? 0.16 : 1;
  const annotation = builder.primitives({ label_color: palette.text });
  function label(text, p, size = 10) {
    if (labels) annotation.label({ position: pos(p), text, label_size: Math.max(size, 12), label_offset: 3 });
  }
  function tube(points, color = palette.antibody, radius = 2.2, tooltip = 'Illustrative flexible linker') {
    const prim = builder.primitives({});
    for (let i = 1; i < points.length; i++) {
      prim.tube({ start: pos(points[i - 1]), end: pos(points[i]), radius, color, tooltip });
    }
  }
  // Point `y` Angstroms along a placed template's long axis (+y: Fab/Fv paratope end, Fc hinge end).
  function endpoint(part, y) {
    const r = rotation(part.angle, part.tilt);
    return [0, 1, 2].map(i => part.center[i] + r[3 + i] * y);
  }
  function template(name, center, colors, opacity = 1, tooltip = '', angle = 0, tilt = 0, spin = 0) {
    const key = JSON.stringify([name, colors, opacity, tooltip]);
    let structure = templateGroups.get(key);
    if (!structure) {
      structure = builder.download({ url: `./${name}.pdb` })
        .parse({ format: 'pdb' }).modelStructure({});
      for (const [selector, color] of colors) {
        const component = structure.component({ selector });
        component.tooltip({ text: tooltip });
        component.representation({ type: 'surface', surface_type: 'gaussian' })
          .color({ color }).opacity({ opacity });
      }
      templateGroups.set(key, structure);
    }
    structure.instance({ rotation: rotation(angle, tilt, spin), translation: pos(center) });
  }

  builder.primitives({ opacity: envOpacity * 0.45 })
    .box({ center: pos([0, membraneBottom + 60, -45]), extent: [330, 40, 60], face_color: '#ecebe4', tooltip: 'Cell interior (schematic)' })
    .box({ center: pos([0, membraneBottom + 20, -30]), extent: [330, 40, 70], face_color: palette.membrane, tooltip: 'Cell membrane, schematic 4 nm bilayer' })
    .box({ center: pos([0, wellTop - 9, -25]), extent: [330, 18, 80], face_color: '#dce1e5', tooltip: 'Well bottom (schematic)' });
  const lipids = builder.primitives({ opacity: envOpacity * 0.65 });
  for (let x = -160; x <= 160; x += 10) {
    for (const y of [membraneBottom, membraneBottom + 40]) {
      lipids.ellipsoid({ center: pos([x, y, 3]), radius: [4.5, 3.8, 4.5], color: palette.membrane,
        tooltip: 'Schematic lipid headgroup; no lipid chemistry implied' });
    }
  }
  const receptors = panel.receptors.map(x => [x, false]);
  if (panel.receptors.length === 1) receptors.push([95, true]);
  receptors.push([-140, true]);
  for (const [x, bystander] of receptors) {
    // Receptors right of center are spun 180 degrees so alpha-DG sits on the outside, as in the figure.
    template('dg', [x, membraneBottom + 20, bystander ? -20 : 0],
      [[{ auth_asym_id: 'A' }, palette.alpha], [{ auth_asym_id: 'B' }, palette.beta]],
      envOpacity * (bystander ? 0.18 : 1),
      'Rabbit alpha/beta-DG from 9C3C; released alpha NTD omitted; illustrative placement',
      0, 0, x > 0 ? 180 : 0);
  }
  // Bystander coat copies are dropped where a bound copy takes their place.
  const coatXs = [-140, -72, 0, 72, 140]
    .filter(x => panel.coatTargets.every(t => Math.abs(x - t) >= 60))
    .concat(panel.coatTargets);
  for (const x of coatXs) {
    const bound = panel.coatTargets.includes(x);
    template('lg45-proxy', [x, wellTop + 22, bound ? 5 : -25],
      [['polymer', palette.coat]], envOpacity * (bound ? 0.85 : 0.22),
      'LAMA4 coat SHAPE PROXY: mouse LAMA2 LG4-5, PDB 5IK8 B. Not LAMA4 coordinates; adsorption pose unknown.', 90);
  }

  if (stage !== 'context') {
    const { fc, hinge } = panel;
    template('fc', fc.center, [['all', palette.antibody]], 1,
      'Generic human IgG1 Fc with Asn297 glycans from 1HZH, not the engineered construct sequence',
      fc.angle, fc.tilt ?? 0, fc.spin ?? 0);
    for (const fab of panel.betaFabs) {
      template('fab', fab.center,
        [[[{ auth_asym_id: 'H', end_auth_seq_id: 110 }, { auth_asym_id: 'L', end_auth_seq_id: 110 }], palette.beta],
         [[{ auth_asym_id: 'H', beg_auth_seq_id: 111 }, { auth_asym_id: 'L', beg_auth_seq_id: 111 }], palette.antibody]],
        1, 'Beta-DG Fab: generic 1HZH scaffold; AS30 sequence and crossover not modeled', fab.angle);
      const end = endpoint(fab, -34);
      tube([hinge, [end[0] * 0.5, Math.max(hinge[1], end[1]) + 4, 8], end], palette.antibody, 2.4, 'Schematic hinge connection');
    }
    tube([hinge, endpoint(fc, 40)], palette.antibody, 3, 'Schematic hinge to Fc');
    for (const arm of panel.lamaArms) {
      template(arm.type, arm.center, [['polymer', palette.lama]], 1,
        `LAMA4 ${arm.type === 'fv' ? 'scFv represented by generic Fv' : 'Fab'}; generic 1HZH scaffold, not tool sequence`, arm.angle);
      if (panel.format === '1+1') {
        tube([hinge, endpoint(arm, -34)], palette.antibody, 2.4, 'Second Fab shares hinge with beta-DG Fab');
      } else {
        // Fc C-terminus -> dip in front of the coat -> inner lower side of the LAMA4 arm.
        const side = arm.center[0] < 0 ? -1 : 1;
        const tip = endpoint(arm, arm.type === 'fv' ? 20 : 34);
        tube([[side * 10, endpoint(fc, -34)[1], 8], [side * 22, coatTop - 6, 26],
          [arm.center[0] - side * 26, coatTop - 6, 26], [arm.center[0] - side * 16, tip[1] + 12, 12]],
          palette.antibody, 2, 'Illustrative C-terminal Fc-to-LAMA4 linker; no peptide conformation inferred');
      }
    }
  }
  if (stage === 'contacts') {
    // Markers sit at each arm's paratope end; `bond: "reach"` marks a second bond not shown to form.
    const marks = builder.primitives({});
    const arms = [...panel.betaFabs.map(a => [a, 34]), ...panel.lamaArms.map(a => [a, a.type === 'fv' ? 20 : 34])];
    for (const [arm, tipOffset] of arms) {
      const [x, y] = endpoint(arm, tipOffset);
      const reach = arm.bond === 'reach';
      marks.ellipsoid({ center: pos([x, y, 45]), radius: 5.8, color: 'white',
        tooltip: reach ? 'Second bond within reach; not shown to form' : 'Illustrated contact; not an atom-level bond' });
      marks.ellipsoid({ center: pos([x, y, 50]), radius: 3.8, color: reach ? palette.reach : palette.contact });
      if (reach) label('within reach', [x + (x < 0 ? -26 : 26), y - 12, 65], 6);
    }
  }
  label(panel.title, [0, 218, 30], 18);
  label('cell', [-144, membraneBottom + 61, 30], 7);
  label('well bottom', [-115, wellTop - 9, 40], 7);
  label('LAMA4 coat (homolog proxy)', [0, wellTop - 32, 30], 7);
  if (stage === 'context') {
    label('alpha-DG', [-118, 12, 45], 7);
    label('beta-DG', [-96, 100, 45], 7);
  } else {
    label(`${panel.betaFabs.length} beta-DG arm${panel.betaFabs.length > 1 ? 's' : ''}`, [0, 184, 35], 8);
    label(`${panel.lamaArms.length} LAMA4 arm${panel.lamaArms.length > 1 ? 's' : ''}`, [0, wellTop - 50, 35], 8);
    if (stage === 'antibody') {
      label('Fc', [panel.fc.center[0] + 48, panel.fc.center[1], 65], 8);
      if (panel.format === '1+1') label('shared hinge', [panel.hinge[0] - 40, panel.hinge[1] - 18, 65], 7);
      else label('Fc-terminal linker', [40, coatTop - 16, 65], 7);
    }
  }
  tube([[60, 246, 10], [160, 246, 10]], palette.text, 1);
  label('10 nm', [110, 262, 20], 7);
}
