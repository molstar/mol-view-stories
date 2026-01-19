// ============================================================================
// Story-wide (common) code shared by all scenes
// ============================================================================
//
// This code is executed once for the entire story and reused by every scene.
// It defines:
//
//  • Global Mol* canvas and postprocessing configuration
//  • Representation presets (spacefill vs surface, LOD settings)
//  • Color theme helpers (chain-based illustrative coloring)
//  • Animation helpers (emissive pulsing)
//  • PDB/BCIF download helpers
//  • Chain/entity tables for large flagellar motor assemblies
//  • Selector builders for grouping and alternating chains
//  • Symmetry helpers for Cn rotational duplication
//
// Mol* helper classes assumed to be available:
//   Vec3, Mat3, Mat4, Quat, Euler, decodeColor,
//   MolScriptBuilder, formatMolScript
//
// PDB assets are downloaded dynamically from PDBe in BCIF format.
// ============================================================================

// ----------------------------------------------------------------------------
// Canvas + rendering defaults
// ----------------------------------------------------------------------------
// We set a neutral white background and enable Mol* postprocessing effects.
// Bloom/SSAO improve depth perception for large assemblies.
// Outlines help visually separate subcomponents in dense regions.
builder.canvas({
  background_color: 'white',
  custom: {
    molstar_postprocessing: {
      enable_bloom: true,

      enable_ssao: true,
      ssao_params: {
        samples: 32,
        multiScale: {
          name: 'on',
          params: {
            levels: [
              { radius: 2, bias: 1.0 },
              { radius: 5, bias: 1.0 },
              { radius: 8, bias: 1.0 },
              { radius: 11, bias: 1.0 },
            ],
            nearThreshold: 10,
            farThreshold: 1500,
          },
        },
        radius: 5,
        bias: 1,
        blurKernelSize: 11,
        blurDepthBias: 0.5,
        resolutionScale: 1,
        color: '0x000000',
        transparentThreshold: 0.4,
      },

      enable_fog: false,
      fog_params: { intensity: 90.0 },

      enable_dof: false,
      dof_params: {
        blurSize: 9,
        blurSpread: 1,
        inFocus: 0,
        PPM: 100.0,
        center: 'camera-target',
        mode: 'sphere',
      },

      enable_shadow: false,
      shadow_params: {
        maxDistance: 256,
        steps: 12,
        tolerance: 0.0,
      },

      enable_outline: true,
    },
  },
});

// constant asset uploaded 
const cring_cw_centered_a = 'assets/8upl_centered.bcif';
const cring_ccw_centered_a = 'assets/8UOX.bcif';
const cheY_c34_a = 'assets/1F4V_C34a.bcif';
const motab_c11_a = 'assets/motab_c11m.bcif';
const motab_ccw_c11_a = 'assets/motabccw_c11m.bcif';
const motab_a = 'assets/6YKM.bcif';
// ----------------------------------------------------------------------------
// Representation mode toggle (spacefill vs surface)
// ----------------------------------------------------------------------------
// When true: use spacefill with an illustrative chain theme.
// When false: use surface for a "continuous body" look (useful for large shells).
const visual_option = true;


// Level-of-detail (LOD) controls downsampling at distance for performance.
// This matters a lot for mega-assemblies like the flagellar motor.
const lod = [
  { minDistance: 1, maxDistance: 500, overlap: 0, stride: 1, scaleBias: 1 },
  { minDistance: 500, maxDistance: 1000, overlap: 0, stride: 5, scaleBias: 3 },
  { minDistance: 1000, maxDistance: 6000, overlap: 0, stride: 30, scaleBias: 2.7 },
  { minDistance: 6000, maxDistance: 10000000, overlap: 0, stride: 200, scaleBias: 2.5 },
];

// Common Mol* representation parameters used across most components.
const granularity = {
  molstar_representation_params: {
    lodLevels: lod,
    instanceGranularity: true,
    emissive: 0.0,
    ignoreLight: true,
    clipPrimitive: true,
  },
};

// Two “base” representation presets used throughout the story.
const spacefillrep = { type: 'spacefill', custom: granularity };
const surfacerep  = { type: 'surface', surface_type: 'gaussian', custom: granularity };

// Use either spacefill or surface depending on the global toggle.
const prot_rep = visual_option ? spacefillrep : surfacerep;


// ----------------------------------------------------------------------------
// Chain-color themes (illustrative / standard / default)
// ----------------------------------------------------------------------------
// These helpers create repeatable color themes for multi-chain assemblies.
// The input `chainColors` is an array of decimal RGB colors (Mol* style).
// Example: [8427006, 8303358]
function createChainColorIllustrateTheme(chainColors, carbonLightness = 0.8) {
  return {
    custom: {
      molstar_color_theme_name: 'illustrative',
      molstar_color_theme_params: {
        style: {
          name: 'chain-id',
          params: {
            asymId: 'label',
            palette: {
              name: 'colors',
              params: {
                list: {
                  kind: 'set',
                  colors: chainColors,
                },
              },
            },
          },
        },
        carbonLightness,
      },
    },
  };
}

// Alternative chain-id theme (non-illustrative) for cases where you want
// the default Mol* chain palette behavior.
function createChainColorStandardTheme(chainColors, carbonLightness = 0.8) {
  return {
    custom: {
      molstar_color_theme_name: 'chain-id',
      molstar_color_theme_params: {
        style: {
          name: 'chain-id',
          params: {
            asymId: 'auth',
            palette: {
              name: 'colors',
              params: {
                list: {
                  kind: 'set',
                  colors: chainColors,
                },
              },
            },
          },
        },
        carbonLightness,
      },
    },
  };
}

// Utility: convert decimal RGB (e.g. 8427006) into hex string "#808080".
function decimalToHexColor(decimal) {
  return '#' + ('000000' + decimal.toString(16)).slice(-6);
}

// Simplest fallback theme: use a single uniform color.
function createChainColorDefaultTheme(chainColors) {
  return { color: decimalToHexColor(chainColors[0]) };
}

// One entry point used by the rest of the story:
// - illustrative chain coloring when visual_option is true
// - single uniform color when visual_option is false
function createChainColorTheme(chainColors, carbonLightness = 0.8) {
  return visual_option
    ? createChainColorIllustrateTheme(chainColors, carbonLightness)
    : createChainColorDefaultTheme(chainColors);
}


// ----------------------------------------------------------------------------
// Small animation helper: emissive pulsing
// ----------------------------------------------------------------------------
// Returns a ready-to-use animation definition that makes a representation
// glow (emissive) in a pulsing manner to guide attention.
const makeEmissivePulse = (proteinRef, start_ms, dur, freq) => ({
  kind: 'scalar',
  target_ref: proteinRef,
  start_ms,
  duration_ms: dur,
  frequency: freq,
  alternate_direction: true,
  property: ['custom', 'molstar_representation_params', 'emissive'],
  start: 0.0,
  end: 0.65,
});


// ----------------------------------------------------------------------------
// PDB centers (used for framing / camera target / alignment helpers)
// ----------------------------------------------------------------------------
// These centers are used to position the camera and build transforms.
const pdbCenters = {
  '8UOX': { center: [425.9787, 425.9856, 434.4256] },
  '8UCS': { center: [154.3888, 153.3654, 157.5505] },
  '8UPL': { center: [425.9848, 425.9806, 429.4423] },
  '7CGO': { center: Vec3.create(333.6229, 335.3563, 303.2562) },
  '2ZVY': { center: [1.2462, -17.1129, -11.6849] },
  '1F4V': { center: [16.0163, 54.3369, 91.6346] },
};


// ----------------------------------------------------------------------------
// Chain/entity tables
// ----------------------------------------------------------------------------
// These mappings let you define semantic entities (e.g., "FlgG", "FliG", "LP ring")
// as sets of chains. This is crucial for huge assemblies where each entity can
// appear as many repeated chains with non-trivial IDs.
//
// Each entry groups chains belonging to one entity and stores helpful metadata.
// (Only excerpts are shown here; you can keep expanding as needed.)
const chains7CGO = {
  "1": { name: "Flagellar basal-body rod protein FlgG", uniprot: "P0A1J3",
    chains: ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","VA","WA","XA"] },

  "2": { name: "Flagellar basal-body rod protein FlgF", uniprot: "P16323",
    chains: ["V","W","X","Y","Z"] },

  "3": { name: "Flagellar MS ring L2", uniprot: "—",
    chains: ["AA","BA","CA","DA","EA"] },

  "4": { name: "Flagellar MS ring L1", uniprot: "P15928",
    chains: ["FA","GA","HA","IA","RA"] },

  "5": { name: "Flagellar basal-body rod protein FlgC", uniprot: "P0A1I7",
    chains: ["JA","KA","LA","MA","QA","SA"] },

  "6": { name: "Flagellar basal-body rod protein FlgB", uniprot: "P16437",
    chains: ["NA","OA","PA","TA","UA"] },

  "7": { name: "Flagellar hook-basal body complex protein FliE", uniprot: "P26462",
    chains: ["AB","BB","CB","DB","YA","ZA"] },

  "8": { name: "Flagellar hook protein FlgE", uniprot: "P0A1J1",
    chains: [
      "AH","BH","CH","DH","EB","EH","FB","FH","GB","GH","HB","HH","IB","IH",
      "JB","JH","KB","KH","LB","MB","NB","OB","PG","QG","RG","SG","TG","UG",
      "VG","WG","XG","YG","ZG"
    ] },

  "9":  { name: "Flagellar biosynthetic protein FliR", uniprot: "P54702", chains: ["PB"] },
  "10": { name: "Flagellar biosynthetic protein FliQ", uniprot: "P0A1L5", chains: ["QB","RB","SB","TB"] },
  "11": { name: "Flagellar biosynthetic protein FliP", uniprot: "P54700", chains: ["UB","VB","WB","XB","YB"] },

  "12": { name: "Flagellar M-ring protein", uniprot: "P15928",
    chains: [
      "AC","AE","BC","BE","CC","CE","DC","DE","EC","EE","FC","FE","GC","GE",
      "HC","HD","HE","IC","ID","IE","JC","JD","JE","KC","KD","KE","LC","LD",
      "LE","MC","MD","ME","NC","ND","NE","OC","OD","OE","PC","PD","QC","QD",
      "RC","RD","SC","SD","TC","TD","UC","UD","VC","VD","WD","XD","YD","ZB","ZD"
    ] },

  "13": { name: "FlgB-Dc loop", uniprot: "—", chains: ["DD","ED","FD","GD","WC"] },
  "14": { name: "FliE helix 1", uniprot: "—", chains: ["AD","BD","CD","XC","YC","ZC"] },

  "15": { name: "Flagellar L-ring protein", uniprot: "P0A1N8",
    chains: [
      "AF","BF","CF","DF","EF","FF","GF","HF","IF","JF","KF","LF","MF","NF","OF",
      "PE","QE","RE","SE","TE","UE","VE","WE","XE","YE","ZE"
    ] },

  "16": { name: "Flagellar P-ring protein", uniprot: "P15930",
    chains: [
      "AG","BG","CG","DG","EG","FG","GG","HG","IG","JG","KG","LG","MG","NG","OG",
      "PF","QF","RF","SF","TF","UF","VF","WF","XF","YF","ZF"
    ] },
};


// ----------------------------------------------------------------------------
// Chain/entity tables — 8UPL (C-ring + switch complex)
// ----------------------------------------------------------------------------
const chains8UPL = {
  "1": {
    name: "Flagellar M-ring protein",
    uniprot: "P15928",
    chains: [
      "A","AC","AF","CB","CE","EA","ED","EG","G","GC","GF","IB","IE","KA","KD","KG",
      "M","MC","MF","OB","OE","QA","QD","QG","S","SC","SF","UB","UE","WA","WD",
      "Y","YC","YF"
    ],
  },

  "2": {
    name: "Flagellar motor switch protein FliG",
    uniprot: "P0A1J9",
    chains: [
      "B","BC","BF","DB","DE","FA","FD","FG","H","HC","HF","JB","JE","LA","LD","LG",
      "N","NC","NF","PB","PE","RA","RD","RG","T","TC","TF","VB","VE","XA","XD",
      "Z","ZC","ZF"
    ],
  },

  "3": {
    name: "Flagellar motor switch protein FliM",
    uniprot: "P0A1K1",
    chains: [
      "C","CC","CF","DC","DF","FB","FE","FH","I","IC","IF","JC","JF","LB","LE","LH",
      "O","OC","OF","PC","PF","RB","RE","RH","U","UC","UF","WC","WE","YA","YD",
      "ZB","ZE","ZH"
    ],
  },

  "4": {
    name: "Flagellar motor switch protein FliN",
    uniprot: "P0A1J5",
    chains: [
      "D","DC","DF","DD","DG","FD","FE","FH","J","JC","JF","LC","LF","LI","P","PC",
      "PF","RC","RF","RI","V","VC","VF","WC","WF","YB","YE","YH","ZC","ZF","ZI"
    ],
  },
};


// ----------------------------------------------------------------------------
// Selector builder for grouped entities
// ----------------------------------------------------------------------------
// For a given chain table (chainsByEntity) and entity ID(s), build:
//  - full selector (all chains)
//  - odd selector  (every other chain)
//  - even selector (the remaining chains)
//
// Splitting into odd/even can help visual clarity, performance,
// or alternating color/opacity patterns.
function buildSelectors(chainsByEntity, entityIds) {
  const ids = Array.isArray(entityIds) ? entityIds : [entityIds];
  const combinedChains = [...new Set(ids.flatMap(id => chainsByEntity[id]?.chains || []))];

  const fullSel = { selector: combinedChains.map(ch => ({ label_asym_id: ch })) };
  const oddSel  = { selector: fullSel.selector.filter((_, i) => i % 2 === 0) };
  const evenSel = { selector: fullSel.selector.filter((_, i) => i % 2 === 1) };

  return { fullSel, oddSel, evenSel };
}


// ----------------------------------------------------------------------------
// PDB asset helpers (BCIF download via PDBe)
// ----------------------------------------------------------------------------
// We fetch BCIF from PDBe because it is compact and fast to parse in-browser.
function pdbUrl(id) {
  return `https://www.ebi.ac.uk/pdbe/entry-files/download/${id.toLowerCase()}.bcif`;
}

// Load the default model structure (coordinates as stored in the file).
function structure(builder, id) {
  return builder
    .download({ url: pdbUrl(id) })
    .parse({ format: 'bcif' })
    .modelStructure();
}

// Load assembly 1 (when biological assembly is required).
function structureBu(builder, id) {
  return builder
    .download({ url: pdbUrl(id) })
    .parse({ format: 'bcif' })
    .assemblyStructure({ assembly_id: '1' });
}

// ----------------------------------------------------------------------------
// Symmetry helper: generate Cn rotation matrices
// ----------------------------------------------------------------------------
// Builds N transforms that rotate around `axis` passing through `center`.
// Optionally adds a radial offset in the plane perpendicular to the axis.
// This is useful for duplicating repeating units around a ring.
function generateCnMatrices(n, axis, center, radius = 0) {
  const mats = [];
  const rotAxis = Vec3.normalize(Vec3(), axis);

  let perp = Vec3.create(1, 0, 0);
  if (Math.abs(Vec3.dot(rotAxis, perp)) > 0.9) perp = Vec3.create(0, 1, 0);

  Vec3.cross(perp, perp, rotAxis);
  Vec3.normalize(perp, perp);

  const angleStep = (2 * Math.PI) / n;

  for (let i = 0; i < n; i++) {
    const angle = i * angleStep;

    const rotation = Mat4.fromRotation(Mat4(), angle, rotAxis);
    const toOrigin = Mat4.fromTranslation(Mat4(), Vec3.negate(Vec3(), center));
    const fromOrigin = Mat4.fromTranslation(Mat4(), center);

    let m = Mat4.mul(Mat4(), rotation, toOrigin);
    m = Mat4.mul(m, fromOrigin, m);

    if (radius !== 0) {
      const offset = Vec3.scale(Vec3(), perp, radius);
      Vec3.transformMat4(offset, offset, rotation);
      Mat4.translate(m, m, offset);
    }

    mats.push(m);
  }

  return mats;
}

