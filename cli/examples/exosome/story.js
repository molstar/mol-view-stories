// Common code for all scenes
//# Set black background and emissive illumination
builder.canvas({
  background_color: 'grey',
  custom: {
    // add bloom effect
    molstar_postprocessing: {
      enable_bloom: true,
      bloom_params: {
        strength: 0.4,
        radius: 0.5,
        threshold: 0.1,
        mode: 'luminosity',
      },
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
      enable_fog: true,
      fog_params: {
        intensity: 90.0,
      },
      enable_dof: true,
      dof_params: {
        blurSize: 9,
        blurSpread: 1,
        inFocus: 0,
        PPM: 100.0,
        center: 'camera-target',
        mode: 'sphere',
      },
      enable_shadow: true,
      shadow_params: {
        maxDistance: 256,
        steps: 12,
        tolerance: 0.0,
      },
    },
    molstar_cameraClipping: {
      radius: 50,
      far: true,
      minNear: 5,
    },
  },
});

//in markdown we can use :
// surface = ITG,CD,RAB,HLA,Gprotein
// interior = HSP90AA1,HSP90AB1,HSPA8,ENO1,PKM,LDHA,ALDOA,PGK1,FASN,GAPDH,PPIA,PDCD6IPDimer,PDCD6IP,TSG101,EIF2C2,SDCBP,YWHAZ,YWHAE,EEF1A1tRNA,EEF1A1,EEF2,miRNA,ARNm
// membrane = LIP
// fiber = DNA
// foreach we need a presentative instance ID
const surfaceChainIds = {
  AP: 'ITG',
  AM: 'CD', //63',
  AN: 'CD', //81',
  AO: 'CD', //9',
  AQ: 'RAB', //5',
  AR: 'RAB', //7',
  AU: 'HLA', //II',
  AT: 'HLA', //I',
  AS: 'Gprotein',
};

const interiorChainIds = {
  AV: 'HSP90AA1',
  AW: 'HSP90AB1',
  AX: 'HSPA8',
  AY: 'ENO1',
  AZ: 'PKM',
  Aa: 'LDHA',
  Ab: 'ALDOA',
  Ac: 'PGK1',
  Ad: 'FASN',
  Ae: 'GAPDH',
  Af: 'PPIA',
  Ag: 'PDCD6IPDimer',
  Ah: 'PDCD6IP',
  Ai: 'TSG101',
  Aj: 'EIF2C2',
  Ak: 'SDCBP',
  Al: 'YWHAZ',
  Am: 'YWHAE',
  An: 'EEF1A1tRNA',
  Ao: 'EEF1A1',
  Ap: 'EEF2',
  Aq: 'miRNA',
  Ar: 'ARNm',
};

const fiberChainIds = {
  Av01: 'DNA',
  Av11: 'DNA',
};

// time in
const chainInstanceMap = {
  surface: {
    AM: { protein: 'CD63', instance: 'ASM-1034', time: 25000 },
    AN: { protein: 'CD81', instance: 'ASM-930', time: 25000 },
    AO: { protein: 'CD9', instance: 'ASM-616', time: 25000 },
    AP: { protein: 'ITG', instance: 'ASM-234', time: 33000 },
    AQ: { protein: 'RAB5', instance: 'ASM-178', time: 38000 },
    AR: { protein: 'RAB7', instance: 'ASM-143', time: 38000 },
    AS: { protein: 'Gprotein', instance: 'ASM-62', time: 44000 },
    AT: { protein: 'HLAI', instance: 'ASM-30', time: 49000 },
    AU: { protein: 'HLAII', instance: 'ASM-12', time: 49000 },
  },

  //Am 1192
  //Av01 8204
  interior: {
    // Interior chains
    AV: { protein: 'HSP90AA1', instance: 'ASM-1367', time: 27000 },
    AW: { protein: 'HSP90AB1', instance: 'ASM-1345', time: 27000 },
    AX: { protein: 'HSPA8', instance: 'ASM-1312', time: 27000 },
    AY: { protein: 'ENO1', instance: 'ASM-1288', time: 34000 },
    AZ: { protein: 'PKM', instance: 'ASM-1283', time: 35000 },
    Aa: { protein: 'LDHA', instance: 'ASM-1282', time: 36000 },
    Ab: { protein: 'ALDOA', instance: 'ASM-1278', time: -1 },
    Ac: { protein: 'PGK1', instance: 'ASM-1273', time: -1 },
    Ad: { protein: 'FASN', instance: 'ASM-1272', time: -1 },
    Ae: { protein: 'GAPDH', instance: 'ASM-1269', time: -1 },
    Af: { protein: 'PPIA', instance: 'ASM-1268', time: -1 },
    Ag: { protein: 'PDCD6IPDimer', instance: 'ASM-1253', time: 39000 },
    Ah: { protein: 'PDCD6IP', instance: 'ASM-1252', time: 39000 },
    Ai: { protein: 'TSG101', instance: 'ASM-1234', time: 40000 },
    Aj: { protein: 'EIF2C2', instance: 'ASM-1208', time: 41000 },
    Ak: { protein: 'SDCBP', instance: 'ASM-1204', time: -1 },
    Al: { protein: 'YWHAZ', instance: 'ASM-1195', time: -1 },
    Am: { protein: 'YWHAE', instance: 'ASM-1190', time: -1 },
    An: { protein: 'EEF1A1tRNA', instance: 'ASM-1186', time: -1 },
    Ao: { protein: 'EEF1A1', instance: 'ASM-1185', time: -1 },
    Ap: { protein: 'EEF2', instance: 'ASM-1184', time: -1 },
    Aq: { protein: 'miRNA', instance: 'ASM-1123', time: -1 },
    Ar: { protein: 'ARNm', instance: 'ASM-1084', time: 47000 },
  },
  fiber: {
    // Fiber chains
    Av01: { protein: 'DNA1', instance: 'ASM-19006' },
    Av11: { protein: 'DNA2', instance: 'ASM-19006' },
  },
};

// Convert GitHub blob URL to raw URL
const structure = builder
  .download({ url: 'exosome.bcif' })
  .parse({ format: 'bcif' }) // Note: using "bcif" format instead of "mmcif"
  .assemblyStructure({})
  .transform({ ref: 'xformexo', matrix: Mat4.identity() });

const default_representation = 'spacefill'; // 'surface' // 'spacefill' // 'surface type ?'
// const custom_params = {molstar_}
// use of lodLevels?
const lod = [
  { minDistance: 1, maxDistance: 500, overlap: 0, stride: 1, scaleBias: 1 },
  { minDistance: 500, maxDistance: 2000, overlap: 0, stride: 15, scaleBias: 3 },
  { minDistance: 2000, maxDistance: 6000, overlap: 0, stride: 70, scaleBias: 2.7 },
  { minDistance: 6000, maxDistance: 10000000, overlap: 0, stride: 200, scaleBias: 2.5 },
];
const granularity = {
  molstar_representation_params: {
    lodLevels: lod,
    instanceGranularity: true,
    emissive: 0.0,
    ignoreLight: true,
    clipPrimitive: true,
  },
};

const makeEmissivePulse = (proteinRef, start_ms, dur, freq) => ({
  kind: 'scalar',
  target_ref: proteinRef,
  start_ms: start_ms,
  duration_ms: dur,
  frequency: freq,
  alternate_direction: true,
  property: ['custom', 'molstar_representation_params', 'emissive'],
  end: 1.0,
});
