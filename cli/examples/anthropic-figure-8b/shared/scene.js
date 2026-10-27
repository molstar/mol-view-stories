// Canonical renderer. Run generate.py after editing. Coordinates are Angstroms.
const palette = {
  beta: '#545958', alpha: '#c7c7bd', antibody: '#c1bba6', lama: '#438ac6',
  coat: '#c0d9ee', membrane: '#d9d8cc', text: '#303b46', contact: '#20252a',
};

// One template/representation per style per snapshot; repeated molecules are instances.
const templateGroups = new Map();

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
  function endpoint(part, y) {
    const a = part.angle * Math.PI / 180;
    return [part.center[0] - Math.sin(a) * y, part.center[1] + Math.cos(a) * y, part.center[2]];
  }
  function template(name, center, angle, colors, opacity = 1, tooltip = '') {
    const a = angle * Math.PI / 180;
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
    structure.instance({
      rotation: [Math.cos(a), Math.sin(a), 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 1],
      translation: pos(center),
    });
  }

  builder.primitives({ opacity: envOpacity * 0.45 })
    .box({ center: pos([0, 180, -45]), extent: [330, 40, 60], face_color: '#ecebe4', tooltip: 'Cell interior (schematic)' })
    .box({ center: pos([0, 140, -30]), extent: [330, 40, 70], face_color: palette.membrane, tooltip: 'Cell membrane, schematic 4 nm bilayer' })
    .box({ center: pos([0, -183, -25]), extent: [330, 18, 80], face_color: '#dce1e5', tooltip: 'Well bottom (schematic)' });
  const lipids = builder.primitives({ opacity: envOpacity * 0.65 });
  for (let x = -160; x <= 160; x += 10) {
    for (const y of [120, 160]) {
      lipids.ellipsoid({ center: pos([x, y, 3]), radius: [4.5, 3.8, 4.5], color: palette.membrane,
        tooltip: 'Schematic lipid headgroup; no lipid chemistry implied' });
    }
  }
  const receptors = panel.receptors.map(x => [x, false]);
  if (panel.receptors.length === 1) receptors.push([110, true]);
  receptors.push([-140, true]);
  for (const [x, bystander] of receptors) {
    template('dg', [x, 140, bystander ? -20 : 0], 0,
      [[{ auth_asym_id: 'A' }, palette.alpha], [{ auth_asym_id: 'B' }, palette.beta]],
      envOpacity * (bystander ? 0.18 : 1),
      'Rabbit alpha/beta-DG from 9C3C; released alpha NTD omitted; illustrative placement');
  }
  const coatXs = [-140, -72, 0, 72, 140];
  for (const x of panel.coatTargets) if (!coatXs.includes(x)) coatXs.push(x);
  for (const x of coatXs) {
    template('lg45-proxy', [x, -149, panel.coatTargets.includes(x) ? 5 : -25], 90,
      [['polymer', palette.coat]], envOpacity * (panel.coatTargets.includes(x) ? 0.85 : 0.22),
      'LAMA4 coat SHAPE PROXY: mouse LAMA2 LG4-5, PDB 5IK8 B. Not LAMA4 coordinates; adsorption pose unknown.');
  }

  if (stage !== 'context') {
    template('fc', panel.fc.center, panel.fc.angle, [['polymer', palette.antibody]], 1,
      'Generic human IgG1 Fc from 1HZH, not the engineered construct sequence');
    for (const fab of panel.betaFabs) {
      template('fab', fab.center, fab.angle,
        [[[{ auth_asym_id: 'H', end_auth_seq_id: 110 }, { auth_asym_id: 'L', end_auth_seq_id: 110 }], palette.beta],
         [[{ auth_asym_id: 'H', beg_auth_seq_id: 111 }, { auth_asym_id: 'L', beg_auth_seq_id: 111 }], palette.antibody]],
        1, 'Beta-DG Fab: generic 1HZH scaffold; AS30 sequence and crossover not modeled');
      tube([panel.hinge, [fab.center[0] * 0.7, 25, 8], endpoint(fab, -34)], palette.antibody, 2.4, 'Schematic hinge connection');
    }
    tube([panel.hinge, endpoint(panel.fc, 40)], palette.antibody, 3, 'Schematic hinge to Fc');
    for (const arm of panel.lamaArms) {
      template(arm.type, arm.center, arm.angle, [['polymer', palette.lama]], 1,
        `LAMA4 ${arm.type === 'fv' ? 'scFv represented by generic Fv' : 'Fab'}; generic 1HZH scaffold, not tool sequence`);
      if (panel.format === '1+1') {
        tube([panel.hinge, [-10, -20, 8], endpoint(arm, -34)], palette.antibody, 2.4, 'Second Fab shares hinge with beta-DG Fab');
      } else {
        const side = arm.center[0] < 0 ? -1 : 1;
        tube([[side * 10, -70, 8], [side * 22, -91, 8], [side * 44, -76, 8], endpoint(arm, arm.type === 'fv' ? -22 : -34)],
          palette.antibody, 2, 'Illustrative C-terminal Fc-to-LAMA4 linker; no peptide conformation inferred');
      }
    }
  }
  if (stage === 'contacts') {
    const marks = builder.primitives({});
    for (const p of panel.contacts) {
      marks.ellipsoid({ center: pos([p[0], p[1], 45]), radius: 5.8, color: 'white', tooltip: 'Illustrated contact; not an atom-level bond' });
      marks.ellipsoid({ center: pos([p[0], p[1], 50]), radius: 3.8, color: palette.contact });
    }
    for (const p of panel.potentialContacts) {
      // Ellipse primitives are filled disks; draw a tube loop for an open marker.
      const ring = Array.from({ length: 25 }, (_, i) => {
        const a = i * 2 * Math.PI / 24;
        return [p[0] + 6 * Math.cos(a), p[1] + 6 * Math.sin(a), 50];
      });
      tube(ring, '#858b90', 0.9, 'Second contact within reach; not shown to form');
      label('within reach', [-105, -106, 65], 6);
    }
  }
  label(panel.title, [0, 218, 30], 18);
  label('cell', [-144, 181, 30], 7);
  label('well bottom', [-115, -183, 40], 7);
  label('LAMA4 coat (homolog proxy)', [0, -213, 30], 7);
  if (stage === 'context') {
    label('alpha-DG', [-105, 15, 45], 7);
    label('beta-DG', [-90, 103, 45], 7);
  } else {
    label(`${panel.betaFabs.length} beta-DG arm${panel.betaFabs.length > 1 ? 's' : ''}`, [0, 184, 35], 8);
    label(`${panel.lamaArms.length} LAMA4 arm${panel.lamaArms.length > 1 ? 's' : ''}`, [0, -235, 35], 8);
    if (stage === 'antibody') {
      label('Fc', [panel.fc.center[0] + 50, -35, 65], 8);
      label(panel.format === '1+1' ? 'shared hinge' : 'Fc-terminal linker', [85, -18, 65], 7);
    }
  }
  tube([[60, 246, 10], [160, 246, 10]], palette.text, 1);
  label('10 nm', [110, 262, 20], 7);
}
