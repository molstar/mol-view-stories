// Common code for all scenes
// Mol* library functions: Vec3, Mat3, Mat4, Quat, Euler, decodeColor, MolScriptBuilder, formatMolScript

// use generic download methods for the PDBS 
// PDB entries (8ucs, 8upl, 7cgo, 2zvy, 1f4v)
// PDB ID 8uox and 8ucs, 
// PDB ID 8upl, 8ucs, 1f4v
builder.canvas({background_color: 'white', custom:{
  // add bloom effect
  molstar_postprocessing:{
    enable_bloom: true,
    // bloom_params:{
    //   strength: 0.4,
    //   radius: 0.5,
    //   threshold: 0.1,
    //   mode: 'luminosity'    
    // },
    enable_ssao:true,
    ssao_params:{
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
            }
        },
        radius: 5,
        bias: 1,
        blurKernelSize: 11,
        blurDepthBias: 0.5,
        resolutionScale: 1,
        color: '0x000000',
        transparentThreshold: 0.4,
    },
    enable_fog:false,
    fog_params:{
      intensity: 90.0
    },
    enable_dof: false,
    dof_params:{
      blurSize: 9,
      blurSpread: 1,
      inFocus: 0,
      PPM: 100.0,
      center: 'camera-target',
      mode: 'sphere',      
    },
    enable_shadow: false,
    shadow_params:{
        maxDistance: 256,
        steps: 12,
        tolerance: 0.0,
    },
    enable_outline:true,
  },
}});

// the switch
const visual_option = true; // true is cpk

const lod = [
                { minDistance: 1, maxDistance: 500, overlap: 0, stride: 1, scaleBias: 1 },
                { minDistance: 500, maxDistance: 1000, overlap: 0, stride: 5, scaleBias: 3 },
                { minDistance: 1000, maxDistance: 6000, overlap: 0, stride: 30, scaleBias: 2.7 },
                { minDistance: 6000, maxDistance: 10000000, overlap: 0, stride: 200, scaleBias: 2.5 },
            ]
const granularity = {
    molstar_representation_params:{
      lodLevels: lod,
      instanceGranularity: true, 
      emissive: 0.0,
      ignoreLight: true,
      clipPrimitive: true,
      }
  }


const spacefillrep = { type: 'spacefill', custom: granularity };
const surfacerep = { type: 'surface', surface_type:'gaussian', custom: granularity };

const prot_rep = (visual_option)? spacefillrep : surfacerep;


//example [8427006, 8303358]
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
                                    colors: chainColors  // e.g., [255, 16711680] for blue/red
                                }
                            }
                        }
                    }
                },
                carbonLightness: carbonLightness
            }
        }
    };
}

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
                                    colors: chainColors  // e.g., [255, 16711680] for blue/red
                                }
                            }
                        }
                    }
                },
                carbonLightness: carbonLightness
            }
        }
    };
}

function decimalToHexColor(decimal) {  
    return '#' + ('000000' + decimal.toString(16)).slice(-6);  
}  

 function createChainColorDefaultTheme(chainColors, carbonLightness = 0.8) {
    return {color:decimalToHexColor(chainColors[0])};
 }

function createChainColorTheme(chainColors, carbonLightness = 0.8) {
  if (visual_option) return createChainColorIllustrateTheme(chainColors, carbonLightness);
  else return createChainColorDefaultTheme(chainColors, carbonLightness);
}


const makeEmissivePulse = (proteinRef, start_ms, dur, freq) => ({
  kind: 'scalar',
  target_ref: proteinRef,
  start_ms: start_ms,
  duration_ms: dur,
  frequency: freq,
  alternate_direction: true,
  property: ['custom', 'molstar_representation_params', 'emissive'],
  start:0.0,
  end: 0.65,
});


const pdbCenters = {
  "8UOX":{ center: [425.9787, 425.9856, 434.4256] },
  "8UCS":{ center: [154.3888, 153.3654, 157.5505] },
  "8UPL":{ center: [425.9848, 425.9806, 429.4423] },
  "7CGO":{ center: Vec3.create(333.6229, 335.3563, 303.2562) },
  "2ZVY":{ center: [1.2462, -17.1129,-11.6849] }, // bound on top of 8UCS
  "1F4V":{ center: [16.0163, 54.3369, 91.6346] },  // bound to FLIM; switch to CW mode (8UPL)
//   "6YKM":{ center: [] }
};


const chains7CGO = {
  "1": {
    name: "Flagellar basal-body rod protein FlgG",
    uniprot: "P0A1J3",
    chains: ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","VA","WA","XA"]
  },
  "2": {
    name: "Flagellar basal-body rod protein FlgF",
    uniprot: "P16323",
    chains: ["V","W","X","Y","Z"]
  },
  "3": {
    name: "Flagellar MS ring L2",
    uniprot: "—",
    chains: ["AA","BA","CA","DA","EA"]
  },
  "4": {
    name: "Flagellar MS ring L1",
    uniprot: "P15928",
    chains: ["FA","GA","HA","IA","RA"]
  },
  "5": {
    name: "Flagellar basal-body rod protein FlgC",
    uniprot: "P0A1I7",
    chains: ["JA","KA","LA","MA","QA","SA"]
  },
  "6": {
    name: "Flagellar basal-body rod protein FlgB",
    uniprot: "P16437",
    chains: ["NA","OA","PA","TA","UA"]
  },
  "7": {
    name: "Flagellar hook-basal body complex protein FliE",
    uniprot: "P26462",
    chains: ["AB","BB","CB","DB","YA","ZA"]
  },
  "8": {
    name: "Flagellar hook protein FlgE",
    uniprot: "P0A1J1",
    chains: [
      "AH","BH","CH","DH","EB","EH","FB","FH","GB","GH","HB","HH","IB","IH",
      "JB","JH","KB","KH","LB","MB","NB","OB","PG","QG","RG","SG","TG","UG",
      "VG","WG","XG","YG","ZG"
    ]
  },
  "9": {
    name: "Flagellar biosynthetic protein FliR",
    uniprot: "P54702",
    chains: ["PB"]
  },
  "10": {
    name: "Flagellar biosynthetic protein FliQ",
    uniprot: "P0A1L5",
    chains: ["QB","RB","SB","TB"]
  },
  "11": {
    name: "Flagellar biosynthetic protein FliP",
    uniprot: "P54700",
    chains: ["UB","VB","WB","XB","YB"]
  },
  "12": {
    name: "Flagellar M-ring protein",
    uniprot: "P15928",
    chains: [
      "AC","AE","BC","BE","CC","CE","DC","DE","EC","EE","FC","FE","GC","GE",
      "HC","HD","HE","IC","ID","IE","JC","JD","JE","KC","KD","KE","LC","LD",
      "LE","MC","MD","ME","NC","ND","NE","OC","OD","OE","PC","PD","QC","QD",
      "RC","RD","SC","SD","TC","TD","UC","UD","VC","VD","WD","XD","YD","ZB","ZD"
    ]
  },
  "13": {
    name: "FlgB-Dc loop",
    uniprot: "—",
    chains: ["DD","ED","FD","GD","WC"]
  },
  "14": {
    name: "FliE helix 1",
    uniprot: "—",
    chains: ["AD","BD","CD","XC","YC","ZC"]
  },
  "15": {
    name: "Flagellar L-ring protein",
    uniprot: "P0A1N8",
    chains: [
      "AF","BF","CF","DF","EF","FF","GF","HF","IF","JF","KF","LF","MF","NF","OF",
      "PE","QE","RE","SE","TE","UE","VE","WE","XE","YE","ZE"
    ]
  },
  "16": {
    name: "Flagellar P-ring protein",
    uniprot: "P15930",
    chains: [
      "AG","BG","CG","DG","EG","FG","GG","HG","IG","JG","KG","LG","MG","NG","OG",
      "PF","QF","RF","SF","TF","UF","VF","WF","XF","YF","ZF"
    ]
  }
};


const chains8UPL = {
  "1": {
    name: "Flagellar M-ring protein",
    uniprot: "P15928",
    chains: [
      "A", "AC", "AF", "CB", "CE", "EA", "ED", "EG",
      "G", "GC", "GF", "IB", "IE", "KA", "KD", "KG",
      "M", "MC", "MF", "OB", "OE", "QA", "QD", "QG",
      "S", "SC", "SF", "UB", "UE", "WA", "WD", "Y",
      "YC", "YF"
    ]
  },
  "2": {
    name: "Flagellar motor switch protein FliG",
    uniprot: "P0A1J9",
    chains: [
      "B", "BC", "BF", "DB", "DE", "FA", "FD", "FG",
      "H", "HC", "HF", "JB", "JE", "LA", "LD", "LG",
      "N", "NC", "NF", "PB", "PE", "RA", "RD", "RG",
      "T", "TC", "TF", "VB", "VE", "XA", "XD", "Z",
      "ZC", "ZF"
    ]
  },
  "3": {
    name: "Flagellar motor switch protein FliM",
    uniprot: "P0A1K1",
    chains: [
      "C", "CC", "CF", "DC", "DF", "FB", "FE", "FH",
      "I", "IC", "IF", "JC", "JF", "LB", "LE", "LH",
      "O", "OC", "OF", "PC", "PF", "RB", "RE", "RH",
      "U", "UC", "UF", "WC", "WE", "YA", "YD", "ZB",
      "ZE", "ZH"
    ]
  },
  "4": {
    name: "Flagellar motor switch protein FliN",
    uniprot: "P0A1J5",
    chains: [
      "D", "DC", "DF", "DD", "DG", "FD", "FE", "FH",
      "J", "JC", "JF", "LC", "LF", "LI", "P", "PC",
      "PF", "RC", "RF", "RI", "V", "VC", "VF", "WC",
      "WF", "YB", "YE", "YH", "ZC", "ZF", "ZI"
    ]
  }
};

function buildSelectors(chainsByEntity, entityIds) {
  // Allow single ID or array of IDs
  const ids = Array.isArray(entityIds) ? entityIds : [entityIds];

  // Combine and deduplicate all chains from the requested entities
  const combinedChains = [...new Set(ids.flatMap(id => chainsByEntity[id]?.chains || []))];

  // Build the base selector
  const fullSel = {
    selector: combinedChains.map(ch => ({ label_asym_id: ch }))
  };

  // Split into odd and even chains
  const oddSel = {
    selector: fullSel.selector.filter((_, i) => i % 2 === 0)
  };

  const evenSel = {
    selector: fullSel.selector.filter((_, i) => i % 2 === 1)
  };

  return { fullSel, oddSel, evenSel };
}

function pdbUrl(id) {
    return `https://www.ebi.ac.uk/pdbe/entry-files/download/${id.toLowerCase()}.bcif`;
}

function structure(builder, id) {
    let ret = builder
        .download({ url: pdbUrl(id) })
        .parse({ format: 'bcif' })
        .modelStructure();
    return ret;
}

function structureBu(builder, id) {
    let ret = builder
        .download({ url: pdbUrl(id) })
        .parse({ format: 'bcif' })
        .assemblyStructure({ assembly_id: '1' })
    return ret;
}

function generateCnMatrices(n, axis, center, radius = 0) {  
    const mats = [];  
    const rotAxis = Vec3.normalize(Vec3(), axis);  
  
    // Build perpendicular vector properly  
    let perp = Vec3.create(1, 0, 0);  
    if (Math.abs(Vec3.dot(rotAxis, perp)) > 0.9) {  
        perp = Vec3.create(0, 1, 0);  
    }  
    Vec3.cross(perp, perp, rotAxis);  // Fixed: perp × rotAxis  
    Vec3.normalize(perp, perp);  
  
    const angleStep = (2 * Math.PI) / n;  
  
    for (let i = 0; i < n; i++) {  
        const angle = i * angleStep;  
          
        // Build rotation matrix  
        const rotation = Mat4.fromRotation(Mat4(), angle, rotAxis);  
          
        // Build translation matrices  
        const toOrigin = Mat4.fromTranslation(Mat4(), Vec3.negate(Vec3(), center));  
        const fromOrigin = Mat4.fromTranslation(Mat4(), center);  
          
        // Compose: translate back → rotate → translate to origin  
        let m = Mat4.mul(Mat4(), rotation, toOrigin);  
        m = Mat4.mul(m, fromOrigin, m);  
          
        // Optional: add radial offset  
        if (radius !== 0) {  
            const offset = Vec3.scale(Vec3(), perp, radius);  
            Vec3.transformMat4(offset, offset, rotation);  
            Mat4.translate(m, m, offset);  
        }  
  
        mats.push(m);  
    }  
  
    return mats;  
}
