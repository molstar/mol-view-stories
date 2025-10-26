// Common code for all scenes

const volumes = [];
for (let i = 0; i < 8; i++) {
  const vol = builder
    .download({ url: `Yeast_C1_Double_MR_center_C8_${i}.bcif` })
    .parse({ format: 'bcif' })
    .volume();
  volumes.push(vol);
}

function structure(id) {
  let model = builder
    .download({ url: `${id}.bcif` })
    .parse({ format: 'bcif' })
    .modelStructure();
  model.pdbId = id.toLowerCase();
  return model;
}

const _9a8n = structure('9a8n');
const _9a8m = structure('9a8m');

const pdbIdToChainsMap = {
  '9a8m': {
    // Mlp: ['A', 'B'],
    Mlp: ['A'],
    Nup1: ['C'],
    // Nup2: ['D', 'E'],
    // Nup60: ['F', 'G']
    Nup2: ['D'], //show only proximal
    Nup60: ['F'], //show only proximal
  },
  '9a8n': {
    Mlp: `A B C D E F G H I J K L M N O P`.split(' '),
    Nup1: `Q R S T U V W X`.split(' '),
    Nup2: `Y AA AB AC AD AE AF AG AH AI AJ AK AL AM AN Z`.split(' '),
    Nup60: `AO AP AQ AR AS AT AU AV AW AX AY AZ BA BB BC BD`.split(' '),
  },
};

const proteinColors = {
  Mlp: '#1b9e77',
  Nup1: '#acfffc',
  Nup2: '#f0e68c',
  Nup60: '#779ecb',
};

const nuclearRing = {
  Nup120: `BE, BF, BG, BH, BI, BJ, BK, BL, BM, BN, BO, BP, BQ, BR, BS, BT`.split(', '),
  Nup85: `BU, BV, BW, BX, BY, BZ, CA, CB, CC, CD, CE, CF, CG, CH, CI, CJ`.split(' '),
  Nup145C: `CK, CL, CM, CN, CO, CP, CQ, CR, CS, CT, CU, CV, CW, CX, CY, CZ`.split(', '),
  Sec13: `DA, DB, DC, DD, DE, DF, DG, DH, DI, DJ, DK, DL, DM, DN, DO, DP`.split(', '),
  Seh1: `DQ, DR, DS, DT, DU, DV, DW, DX, DY, DZ, EA, EB, EC, ED, EE, EF`.split(', '),
  Nup84: `EG, EH, EI, EJ, EK, EL, EM, EN, EO, EP, EQ, ER, ES, ET, EU, EV`.split(', '),
  Nup133: `EW EX EY EZ FA FB FC FD FE FF FG FH FI FJ FK FL`.split(' '),
};

function createNuclRingSelectors() {
  let res = {
    proximal: [],
    distal: [],
  };
  Object.entries(nuclearRing).forEach(([proteinName, chains]) => {
    chains.forEach((chainId, index) => {
      index % 2 == 0 ? res.proximal.push({ label_asym_id: chainId }) : res.distal.push({ label_asym_id: chainId });
    });
  });
  return res;
}

const nuclRingSelectors = createNuclRingSelectors();

function createNuclearRing(structure, options) {
  const opacityValue = options?.opacity ? options.opacity : 1;
  Object.entries(nuclRingSelectors).forEach(([name, sel]) => {
    structure
      .component({ selector: sel })
      .representation({
        ref: sel,
        type: 'surface',
        surface_type: 'gaussian',
        custom: {
          molstar_representation_params: { emissive: 0 },
        },
      })
      .color({ color: name === 'proximal' ? '#ffb6c1' : '#fdd797' })
      .opacity({ opacity: opacityValue });
  });
}

function getProteins(pdbId, proteinNames) {
  return Object.fromEntries(Object.entries(pdbIdToChainsMap[pdbId]).filter(([name]) => proteinNames.includes(name)));
}

function createProteinsSelectors() {
  const makeEntry = () => ({ Mlp: [], Nup1: [], Nup2: [], Nup60: [] });
  const res = Object.fromEntries(['9a8n', '9a8m'].map((k) => [k, makeEntry()]));

  Object.entries(pdbIdToChainsMap).forEach(([pdbId, proteins]) => {
    Object.entries(proteins).forEach(([protein, chains]) => {
      chains.forEach((chainId) => {
        res[pdbId][protein].push({ label_asym_id: chainId });
      });
    });
  });

  return res;
}

const proteinSelectors = createProteinsSelectors();

function createProteinsRepr(structure, proteins, options) {
  Object.entries(proteinSelectors[structure.pdbId])
    .filter(([proteinName]) => proteins.includes(proteinName))
    .forEach(([proteinName, sel]) => {
      structure
        .component({ selector: sel })
        .representation({
          ref: sel,
          type: 'surface',
          surface_type: 'gaussian',
          custom: {
            molstar_representation_params: { emissive: 0 },
          },
        })
        .color({ color: proteinColors[proteinName] });
      if (options?.labels) {
        lprimitives.label({
          position: { label_asym_id: pdbIdToChainsMap[structure.pdbId][proteinName][0] },
          text: proteinName,
          label_color: proteinColors[proteinName],
          label_size: 40,
        });
      }
    });
}

// NUP120: H, I; NUP85: J, K, L; SEC13: O, P                not showing L
// NUP145C: M, N; SEH1: Q, R;  NUP84: S, T; NUP133: U, V;
// 9a8m
const nup84Complex = {
  proximal: {
    chains: `H J M O S Q U`.split(' '),
    color: '#ffb6c1',
    labelAt: 'J',
    labelText: 'Proximal Nup84 complex',
  },
  distal: {
    chains: `I K N P R T V `.split(' '),
    color: '#fdd797',
    labelAt: 'P',
    labelText: 'Distal Nup84 complex',
  },
};

function createNup84ComplexSelectors() {
  let res = {
    proximal: [],
    distal: [],
  };
  Object.entries(nup84Complex).forEach(([arm, data]) => {
    data.chains.forEach((chainId) => {
      res[arm].push({ label_asym_id: chainId });
    });
  });
  return res;
}

const nup84ComplexSelectors = createNup84ComplexSelectors();

function createNup84ComplexRepr(options) {
  const opacityValue = options?.opacity ? options.opacity : 1;

  Object.entries(nup84Complex).forEach(([armName, data]) => {
    _9a8m
      .component({ selector: nup84ComplexSelectors[armName] })
      .representation({
        ref: nup84ComplexSelectors[armName],
        type: 'surface',
      })
      .color({ color: data.color })
      .opacity({ opacity: opacityValue });
    if (options?.labels) {
      lprimitives.label({
        position: { label_asym_id: nup84Complex[armName].labelAt },
        text: data.labelText,
        label_color: data.color,
        label_size: 40,
      });
    }

    // for (let i = 0; i < currArm.chains.length - 1; i++) {
    //   currArm.chains.forEach((chainId) => {
    //     const selector = { label_asym_id: chainId };
    // _9a8m
    // .component({ selector: selector })
    // .representation({
    //   ref: chainId,
    //   type: 'surface',
    // })
    //   .color({ color: currArm.color  })
    //   .opacity({ opacity: opacityValue });
    //   if (options?.labels && chainId === currArm.labelAt) {
    //     lprimitives.label({
    //       position: selector,
    //       text: currArm.labelText,
    //       label_color: currArm.color,
    //       label_size: 40,
    //     });
    //   }
    //   })
    // }
  });
}

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

builder.canvas({
  custom: {
    molstar_postprocessing: {
      enable_ssao: true,
      enable_dof: true,
      dof_params: {
        blurSize: 9,
        blurSpread: 1,
        inFocus: 0,
        PPM: 50.0,
        center: 'camera-target',
        mode: 'sphere',
      },
    },
  },
});
