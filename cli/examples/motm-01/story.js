/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 * @author Ludovic Autin <autin@scripps.edu>
 * @author Victoria Doshchenko <doshchenko.victoria@gmail.com>
 */

import { decodeColor } from '../../../extensions/mvs/helpers/utils';
import { createMVSBuilder } from '../../../extensions/mvs/tree/mvs/mvs-builder';
import { Mat4 } from '../../../mol-math/linear-algebra/3d/mat4';
import { Vec3 } from '../../../mol-math/linear-algebra/3d/vec3';
import { MolScriptBuilder as MS } from '../../../mol-script/language/builder';
import { formatMolScript } from '../../../mol-script/language/expression-formatter';

// Transformation matrices
// 1pmb->1mbn alignment
const align = Mat4.fromArray(
  Mat4.zero(),
  [
    0.4634187130865737, -0.7131589697034304, 0.5259728687171936, 0, -0.22944227902330105, -0.6698811108214233,
    -0.7061273127008398, 0, 0.8559202154942049, 0.2065522332899299, -0.4740643150728161, 0, -52.54880970106205,
    37.49099778180445, -6.133850309914719, 1,
  ],
  0
);

// 1mbo->1myf alignment
const alignmbo = Mat4.fromArray(
  Mat4.zero(),
  [
    -0.8334619943964441, -0.512838061396133, -0.20576353166796402, 0, -0.20145089001561267, 0.628743285359846,
    -0.7510655776229758, 0, 0.5145474196737698, -0.5845332204089626, -0.6273453801378679, 0, 11.864847328611186,
    -1.5261713438028912, 23.638919347623467, 1,
  ],
  0
);

// Color theme helper function
const ill_color = (color, carbonLightness) => ({
  molstar_color_theme_name: 'illustrative',
  molstar_color_theme_params: {
    style: {
      name: 'uniform',
      params: {
        value: decodeColor(color),
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

// Audio file paths
const audioPathBase = 'https://raw.githubusercontent.com/molstar/molstar/master';
// For local development, uncomment:
// const audioPathBase = '';

const _Audio1 = audioPathBase + '/examples/audio/AudioMOM1_A.mp3';
const _Audio2 = audioPathBase + '/examples/audio/AudioMOM1_B.mp3';
const _Audio3 = audioPathBase + '/examples/audio/AudioMOM1_C.mp3';
const _Audio4 = audioPathBase + '/examples/audio/AudioMOM1_D.mp3';

// Query helper function
const q = (expr, lang = 'pymol') => `!query=${encodeURIComponent(expr)}&lang=${lang}&action=highlight,focus`;

// MolScript queries
const query1 = MS.struct.generator.atomGroups({
  'entity-test': MS.core.rel.eq([MS.struct.atomProperty.core.modelEntryId(), '1MBN']),
});
const firstEntity1 = q(formatMolScript(query1), 'mol-script');

const query2 = MS.struct.generator.atomGroups({
  'entity-test': MS.core.rel.eq([MS.struct.atomProperty.core.modelEntryId(), '1PMB']),
});
const firstEntity2 = q(formatMolScript(query2), 'mol-script');

const query3 = MS.struct.generator.atomGroups({
  'entity-test': MS.core.rel.eq([MS.struct.atomProperty.core.modelEntryId(), '1MBN']),
  'residue-test': MS.core.set.has([MS.set(12, 140, 87), MS.struct.atomProperty.macromolecular.auth_seq_id()]),
});
const charged_residues = q(formatMolScript(query3), 'mol-script');

// Helper function to create audio controls
function createAudioControls(url) {
  return `
  [‹ **▶ Play** ›](${encodeURIComponent(`!play-audio=${url}`)})
  [‹ **⏸ Pause** ›](!pause-audio)
  [‹ **⏹ Stop** ›](!stop-audio)
  [‹ **Hide** ›](!dispose-audio)
  `;
}

// Helper function to add a "Next" button
function addNextButton(builder, snapshotKey, position) {
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
}

// Helper function to create structure from PDB ID
function structure(builder, id) {
  return builder
    .download({ url: pdbUrl(id) })
    .parse({ format: 'bcif' })
    .modelStructure();
}

// Helper function to get PDB URL
function pdbUrl(id) {
  return `https://www.ebi.ac.uk/pdbe/entry-files/download/${id.toLowerCase()}.bcif`;
}

// Helper function to create an ellipsoid (for salt bridges)
function getEllipse(builder, pos1, pos2, ref) {
  const center = Vec3.add(Vec3(), pos1, pos2);
  Vec3.scale(center, center, 0.5);
  const major_axis = Vec3.sub(Vec3(), pos2, pos1);
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
}

// Helper function to build the 1mbn structure with common representations
function build1mbn(builder) {
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
}

// Export all helper functions and constants for use in scene files
export {
  align,
  alignmbo,
  ill_color,
  GColors2,
  GColors3,
  _Audio1,
  _Audio2,
  _Audio3,
  _Audio4,
  q,
  firstEntity1,
  firstEntity2,
  charged_residues,
  createAudioControls,
  addNextButton,
  structure,
  pdbUrl,
  getEllipse,
  build1mbn,
  createMVSBuilder,
  Vec3,
  decodeColor,
};
