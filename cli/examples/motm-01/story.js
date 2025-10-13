/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 * @author Ludovic Autin <autin@scripps.edu>
 * @author Victoria Doshchenko <doshchenko.victoria@gmail.com>
 */

// All Mol* library functions are available in scope:
// - Vec3, Mat4, Mat3, Quat (from mol-math)
// - MolScriptBuilder as MS (from mol-script)
// - decodeColor, formatMolScript (from mvs)
// - builder (the MVS builder instance for each scene)

// Transformation matrices as plain arrays
// These will be converted to Mat4 by the transform function
// 1pmb->1mbn alignment
const alignMatrix = [
  0.4634187130865737, -0.7131589697034304, 0.5259728687171936, 0, -0.22944227902330105, -0.6698811108214233,
  -0.7061273127008398, 0, 0.8559202154942049, 0.2065522332899299, -0.4740643150728161, 0, -52.54880970106205,
  37.49099778180445, -6.133850309914719, 1,
];

// 1mbo->1myf alignment
const alignMboMatrix = [
  -0.8334619943964441, -0.512838061396133, -0.20576353166796402, 0, -0.20145089001561267, 0.628743285359846,
  -0.7510655776229758, 0, 0.5145474196737698, -0.5845332204089626, -0.6273453801378679, 0, 11.864847328611186,
  -1.5261713438028912, 23.638919347623467, 1,
];

// Color theme helper function - using const to ensure proper scoping
const ill_color = (color, carbonLightness) => ({
  molstar_color_theme_name: 'illustrative',
  molstar_color_theme_params: {
    style: {
      name: 'uniform',
      params: {
        value: color, // Pass color string directly
        saturation: 0,
        lightness: 0,
      },
    },
    carbonLightness: carbonLightness, // required parameter
  },
});

const GColors2 = ill_color('#947c7c', 0.8);

/* Color scheme from David Goodsell illustrate software */
const GColors3 = {
  schema: 'all_atomic',
  category_name: 'atom_site',
  field_name: 'type_symbol',
  palette: {
    kind: 'categorical',
    colors: {
      C: '#FFFFFF',
      N: '#CCE6FF',
      O: '#FFCCCC',
      S: '#FFE680',
    },
  },
};

// Audio file paths - using local assets directory
const _Audio1 = 'AudioMOM1_A.mp3';
const _Audio2 = 'AudioMOM1_B.mp3';
const _Audio3 = 'AudioMOM1_C.mp3';
const _Audio4 = 'AudioMOM1_D.mp3';

// Query helper function - using const for proper scoping
const q = (expr, lang = 'pymol') => `!query=${encodeURIComponent(expr)}&lang=${lang}&action=highlight,focus`;

// Simple query strings for use in markdown links
// Note: MolScript queries would require the MS global which may not be available
// Using simple PyMOL-style queries instead
const firstEntity1 = q('chain A', 'pymol');
const firstEntity2 = q('chain A', 'pymol');
const charged_residues = q('resi 12+140+87', 'pymol');

// Helper function to create audio controls - using const for proper scoping
const createAudioControls = (url) => {
  return `
  [‹ **▶ Play** ›](${encodeURIComponent(`!play-audio=${url}`)})
  [‹ **⏸ Pause** ›](!pause-audio)
  [‹ **⏹ Stop** ›](!stop-audio)
  [‹ **Hide** ›](!dispose-audio)
  `;
};

// Helper function to get PDB URL - using const for proper scoping
const pdbUrl = (id) => {
  return `https://www.ebi.ac.uk/pdbe/entry-files/download/${id.toLowerCase()}.bcif`;
};

// Helper function to create structure from PDB ID - using const for proper scoping
const structure = (builder, id) => {
  return builder
    .download({ url: pdbUrl(id) })
    .parse({ format: 'bcif' })
    .modelStructure();
};

// Helper function to add a "Next" button - using const for proper scoping
const addNextButton = (builder, snapshotKey, position) => {
  builder
    .primitives({
      ref: 'next',
      tooltip: 'Click for next part',
      label_opacity: 0,
      label_background_color: 'grey',
      snapshot_key: snapshotKey,
    })
    .label({
      ref: 'next_label',
      position: position,
      text: 'Next Scene →',
      label_color: 'white',
      label_size: 5,
    });
};

// Helper function to create an ellipsoid (for salt bridges) - using const for proper scoping
// Accepts plain arrays or Vec3 objects as positions
const getEllipse = (builder, pos1, pos2, ref) => {
  // Convert arrays to Vec3 if needed
  const p1 = Array.isArray(pos1) ? Vec3.fromArray(Vec3(), pos1, 0) : pos1;
  const p2 = Array.isArray(pos2) ? Vec3.fromArray(Vec3(), pos2, 0) : pos2;

  const center = Vec3.add(Vec3(), p1, p2);
  Vec3.scale(center, center, 0.5);
  const major_axis = Vec3.sub(Vec3(), p2, p1);
  const z_axis = Vec3.create(0, 0, 1);
  // cross to get minor axis
  const minor_axis = Vec3.cross(Vec3(), major_axis, z_axis);
  return builder.primitives({ ref: ref, opacity: 0.33 }).ellipsoid({
    center: center,
    major_axis: major_axis,
    minor_axis: minor_axis,
    radius: [5.0, 3.0, 3.0],
    color: '#cccccc',
  });
};

// Helper function to build the 1mbn structure with common representations - using const for proper scoping
const build1mbn = (builder) => {
  const struct = structure(builder, '1MBN');

  struct
    .component({ selector: 'ligand' })
    .representation({ ref: 'ligand', type: 'ball_and_stick' })
    .color({ color: 'orange' });

  // FE and O should be spacefill
  struct
    .component({ selector: { auth_seq_id: 155, label_atom_id: 'FE' } })
    .representation({ type: 'spacefill' })
    .color({ color: 'yellow' });

  struct
    .component({ selector: { auth_seq_id: 154 } })
    .representation({ type: 'spacefill' })
    .color({ color: 'blue' });

  const chA = struct.component({ selector: { label_asym_id: 'A' } });
  chA
    .representation({ type: 'surface', surface_type: 'gaussian' })
    .color({ color: '#ff0303' })
    .opacity({ ref: 'surfopa', opacity: 0.0 });

  chA
    .representation({ type: 'line' })
    .color({ custom: { molstar_color_theme_name: 'element-symbol' } })
    .opacity({ ref: 'lineopa', opacity: 0.0 });

  chA.representation({ type: 'cartoon' }).color({ custom: { molstar_color_theme_name: 'secondary-structure' } });

  return {
    struct,
    refs: {
      surfaceOpacity: 'surfopa',
      lineOpacity: 'lineopa',
    },
  };
};

// All helper functions and constants are available globally to scene files
// No exports needed - all code is combined together
