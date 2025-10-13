/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 * @author Ludovic Autin <autin@scripps.edu>
 * @author Victoria Doshchenko <doshchenko.victoria@gmail.com>
 */

// Import shared helpers from story.js
import { structure, ill_color, getEllipse, addNextButton, Vec3, _Audio4 } from '../../story.js';

// Scene 5: Conclusion
// Shows different amino acid types and salt bridges in myoglobin

const _1mbn = structure(builder, '1mbn');

// Define amino acid groups
// Carbon-rich amino acids (hydrophobic)
const carb = ['ALA', 'VAL', 'LEU', 'ILE', 'MET', 'PHE', 'TRP', 'PRO'].map((amk) => ({ label_comp_id: amk }));

// Positively charged amino acids
const chargedp = ['LYS', 'ARG', 'HIS'].map((amk) => ({ label_comp_id: amk }));

// Negatively charged amino acids
const chargedn = ['ASP', 'GLU'].map((amk) => ({ label_comp_id: amk }));

// Salt bridges
// ASP44-OD1-356 to LYS47-NZ-388
// LYS77-NZ-613 to GLU18-OE1-149
_1mbn
  .primitives({ ref: 'dist', label_opacity: 0.0 })
  .distance({
    start: { label_asym_id: 'A', auth_seq_id: 44, atom_id: 356 },
    end: { label_asym_id: 'A', auth_seq_id: 47, atom_id: 388 },
    radius: 0.1,
    dash_length: 0.1,
    label_size: 2,
  })
  .distance({
    start: { label_asym_id: 'A', auth_seq_id: 77, atom_id: 613 },
    end: { label_asym_id: 'A', auth_seq_id: 18, atom_id: 149 },
    radius: 0.1,
    dash_length: 0.1,
    label_size: 2,
  });

// Create ellipse visualization for first salt bridge
// ASP44 OD1: 22.300 33.300 -6.200
// LYS47 NZ: 23.200 32.000 -8.400
const r44 = Vec3.create(22.3, 33.3, -6.2);
const r47 = Vec3.create(23.2, 32.0, -8.4);
getEllipse(builder, r44, r47, 'salt1');

// Create ellipse visualization for second salt bridge
// GLU18 OE1: 16.600 22.500 20.500
// LYS77 NZ: 14.100 23.600 22.200
const r18 = Vec3.create(16.6, 22.5, 20.5);
const r77 = Vec3.create(14.1, 23.6, 22.2);
getEllipse(builder, r18, r77, 'salt2');

// Carbon-rich amino acids representation
const a = _1mbn.component({ selector: carb });
a.representation({ type: 'ball_and_stick' })
  .color({ color: '#bec0f2' })
  .opacity({ ref: 'carb', opacity: 1.0 });

// Positively charged amino acids representation
const b = _1mbn.component({ selector: chargedp });
b.representation({ type: 'ball_and_stick' })
  .color({ custom: ill_color('blue', 3.0) })
  .opacity({ ref: 'chargedp', opacity: 1.0 });

// Negatively charged amino acids representation
const c = _1mbn.component({ selector: chargedn });
c.representation({ type: 'ball_and_stick' })
  .color({ custom: ill_color('red', 3.0) })
  .opacity({ ref: 'chargedn', opacity: 1.0 });

// Backbone representation
_1mbn
  .component({ selector: { label_asym_id: 'A' } })
  .representation({ type: 'backbone' })
  .color({ color: '#919191' });

// Ligand (heme) representation
_1mbn
  .component({ selector: 'ligand' })
  .representation({
    ref: 'ligand',
    type: 'ball_and_stick',
    custom: {
      molstar_representation_params: {
        emissive: 0.0,
      },
    },
  })
  .color({ color: 'orange' });

builder.extendRootCustomState({
  molstar_on_load_markdown_commands: {
    'play-audio': _Audio4,
  },
});

const anim = builder.animation({});

// Pulse carbon-rich amino acids
anim.interpolate({
  kind: 'scalar',
  target_ref: 'carb',
  duration_ms: 2000,
  start_ms: 8000,
  frequency: 2,
  alternate_direction: true,
  property: 'opacity',
  start: 0.0,
  end: 1.0,
});

// Show positively charged amino acids
anim.interpolate({
  kind: 'scalar',
  target_ref: 'chargedp',
  duration_ms: 1000,
  start_ms: 10000,
  property: 'opacity',
  start: 0.0,
  end: 1.0,
});

// Show negatively charged amino acids
anim.interpolate({
  kind: 'scalar',
  target_ref: 'chargedn',
  duration_ms: 1000,
  start_ms: 10000,
  property: 'opacity',
  start: 0.0,
  end: 1.0,
});

// Show salt bridge ellipses
anim.interpolate({
  kind: 'scalar',
  target_ref: 'salt1',
  duration_ms: 1000,
  start_ms: 11000,
  property: 'opacity',
  start: 0.0,
  end: 0.3,
});

anim.interpolate({
  kind: 'scalar',
  target_ref: 'salt2',
  duration_ms: 1000,
  start_ms: 11000,
  property: 'opacity',
  start: 0.0,
  end: 0.3,
});

// Show distance measurements
anim.interpolate({
  kind: 'scalar',
  target_ref: 'dist',
  duration_ms: 1000,
  start_ms: 11000,
  property: 'label_opacity',
  start: 0.0,
  end: 1.0,
});

// Add "Next" button to loop back to intro
addNextButton(builder, 'intro', [13.5, -10.0, 7.7]);

anim.interpolate({
  kind: 'scalar',
  target_ref: 'next',
  duration_ms: 2000,
  start_ms: 20000,
  property: 'label_opacity',
  start: 0.0,
  end: 1.0,
});
