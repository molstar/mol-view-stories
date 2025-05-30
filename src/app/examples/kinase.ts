import { Story } from '@/app/state/types';
import { UUID } from 'molstar/lib/mol-util';

export const KinaseStory: Story = {
  metadata: { title: 'Kinase Story' },
  javascript: `const Colors = {
    '1opl': '#4577B2',
    '2gqg': '#BC536D',
    '2g2i': '#BC536D',
    '1iep': '#B9E3A0',
    '3ik3': '#F3774B',
    '3oxz': '#7D7EA5',

    'active-site': '#F3794C',
    'binding-site': '#FEEB9F',
};

const Domains = {
    ChainA: { auth_asym_id: 'A' },

    SH2: { auth_asym_id: 'A', beg_auth_seq_id: 146, end_auth_seq_id: 247 },
    SH3: { auth_asym_id: 'A', beg_auth_seq_id: 83, end_auth_seq_id: 145 },
    P_loop: { auth_asym_id: 'A', beg_auth_seq_id: 246, end_auth_seq_id: 255 },
    Activation_loop: { auth_asym_id: 'A', beg_auth_seq_id: 384, end_auth_seq_id: 402 },
};

const DomainColors = {
    SH2: '#8ED1A4',
    SH2_BCR: '#D03B4B',
    SH3: '#64B9AA',
    P_loop: '#FF8DA1',
    Activation_loop: '#FF0000',
    DFG_motif: '#FFA500',
};

const Superpositions = {
    '1opl': [[-0.6321036327,0.3450463255,0.6938213248,-0.6288677634,-0.7515716885,-0.1991615756,0.4527364948,-0.5622126202,0.6920597055], [36.3924122492,118.2516908402,-26.4992054179]],
    '3ik3': [[-0.7767826245,-0.6295936551,0.0148520572,0.6059737752,-0.7408035481,0.2898376906,-0.1714775143,0.2341408391,0.9569605684], [21.0648276775,53.0266628762,-0.3385906075]],
    '2gqg': [[0.0648740828,-0.7163272638,0.6947421137,0.0160329972,-0.6953706204,-0.7184724374,0.9977646498,0.0577490387,-0.0336266582], [-31.0690973964,146.0940883054,39.7107422531]],
    '2g2i': [[-0.5680242227,0.6527660987,0.5012433569,-0.10067389,0.5493518768,-0.8295042395,-0.8168312251,-0.5216406194,-0.2463286704], [-8.1905690894,75.7603329146,-6.1327389269]],
    '3oxz': [[0.7989033646,0.5984398921,-0.0601922711,-0.1303123126,0.269921501,0.9540236289,0.5871729857,-0.754328893,0.2936252816], [-8.0697093741,58.1709160658,19.0363028443]],
};

function hexColorToNumber(color) {
    return parseInt(color.substring(1), 16);
}

function pdbUrl(id) {
    return \`https://www.ebi.ac.uk/pdbe/entry-files/download/\${id.toLowerCase()}.bcif\`;
}

function transform(structure, id) {
    const [rotation, translation] = Superpositions[id];
    return structure.transform({ rotation, translation });
}

function structure(builder, id) {
    let ret = builder
        .download({ url: pdbUrl(id) })
        .parse({ format: 'bcif' })
        .modelStructure();

    if (id in Superpositions) {
        ret = transform(ret, id);
    }

    return ret;
}

function polymer(structure, options) {
    const component = structure.component({ selector: { label_asym_id: 'A' } });
    const reprensentation = component.representation({ type: 'cartoon' });
    reprensentation.color({ color: options.color });
    return [component, reprensentation];
}

function domains(structure, reprensentation, domains, options) {
    const hasLabels = domains.some(d => !!d[2]);
    const primitives = hasLabels ? structure.primitives() : undefined;

    for (const [selector, color, label, opts] of domains) {
        reprensentation.color({ selector, color });
        if (label) primitives.label({ position: selector, text: label, label_color: color, label_size: opts?.label_size ?? options?.label_size ?? 1.5 });
    }
}

function ligand(structure, options) {
    const comp = structure.component({ selector: options.selector });
    const coloring = options.uniform_color
        ? { color: options.uniform_color }
        : {
            custom: {
                molstar_color_theme_name: 'element-symbol',
                molstar_color_theme_params: { carbonColor: options?.carbon_color ? { name: 'uniform', params: { value: hexColorToNumber(options?.carbon_color) } } : { name: 'element-symbol', params: {} } }
            }
        };

    if (options.surface) comp.representation({ type: 'surface' }).color(coloring).opacity({ opacity: 0.33 });
    const repr = comp.representation({ type: 'ball_and_stick' }).color(coloring);
    if (options.opacity) repr.opacity({ opacity: options.opacity });

    const label_color = options?.label_color ?? options.uniform_color ?? options.carbon_color ?? '#5B53A4';
    if (options.label) {
        structure.primitives().label({
            position: Array.isArray(options.selector) ? { expressions: options.selector } : options.selector,
            text: options.label,
            label_color,
            label_size: options?.label_size ?? 1.5
        });
    }

    return comp;
}

function bindingSite(structure, residues, options) {
    const color = options.color ?? '#5B53A4';
    const coloring = {
        custom: {
            molstar_color_theme_name: 'element-symbol',
            molstar_color_theme_params: { carbonColor: { name: 'uniform', params: { value: hexColorToNumber(color) } } }
        }
    };

    structure.component({ selector: residues.map(r => r[0]) }).representation({ type: 'ball_and_stick' }).color(coloring);

    const primitives = structure.primitives();
    for (const [selector, label] of residues) {
        primitives.label({
            position: selector,
            text: label,
            label_color: color,
            label_size: options?.label_size ?? 1.5
        });
    }
}

function drawInteractions(structure, interactions) {
    const primitives = structure.primitives();

    const interactingResidues = [];
    const addedResidues = new Set<string>();

    for (const [tooltip, a, b, options] of interactions) {
        primitives.tube({ start: a, end: b, color: '#4289B5', tooltip, radius: 0.1, dash_length: 0.1 });

        if (options?.skipResidue) continue;

        const expressions = isPrimitiveComponentExpressions(a) ? a.expressions : [a as ComponentExpressionT];
        for (const _e of expressions) {
            const e = { ..._e };
            delete e.auth_atom_id;
            delete e.label_atom_id;

            const key = JSON.stringify(e);
            if (addedResidues.has(key)) continue;
            interactingResidues.push(e);
            addedResidues.add(key);
        }
    }

    if (interactingResidues.length === 0) return;

    structure
        .component({ selector: interactingResidues })
        .representation({ type: 'ball_and_stick' })
        .color({
            custom: {
                molstar_color_theme_name: 'element-symbol',
                molstar_color_theme_params: { carbonColor: { name: 'element-symbol', params: {} } },
            }
        });
}
`,
  scenes: [
    {
      id: UUID.createv4(),
      header: 'A Kinase Out of Control',
      key: 'intro',
      camera: {
        mode: 'perspective',
        fov: (45 * Math.PI) / 180,
        position: [103.72, 69.35, 20.52],
        target: [0.36, 55.32, 21.8],
        up: [-0.01, 0.01, -1],
      },
      description: `### The Structural Story of BCR-ABL: A Kinase Out of Control

BCR-ABL is a classic case of how structural biology can drive drug discovery. This story will help you understand:

- How the [ABL kinase is normally regulated](#regulated-kinase).
- How a small genetic fusion creates a [rogue kinase](#rogue-kinase).
- How ATP binding fuels [uncontrolled cancer growth](#unstoppable-signaling).
- How [Imatinib revolutionized treatment](#imatinib) by locking the kinase in an inactive state.
- How a [single mutation (T315I) enabled resistance](#mutation) and brought new challenges.
- How [Ponatinib](#ponatinib) and future inhibitors are being designed to keep up in this ongoing battle.`,
      javascript: `const _1opl = structure(builder, '1opl');
const [_1opl_poly,] = polymer(_1opl, { color: Colors['1opl'] });
_1opl_poly.label({ text: 'ABL Kinase' });

ligand(_1opl, {
    selector: { label_asym_id: 'C' },
    uniform_color: Colors['1opl'],
});

ligand(_1opl, {
    selector: { label_asym_id: 'D' },
    surface: true,
    carbon_color: Colors['1opl'],
})
`,
    },
    {
      id: UUID.createv4(),
      header: 'The Birth of a Rogue Kinase',
      key: 'rogue-kinase',
      camera: {
        mode: 'perspective',
        fov: (45 * Math.PI) / 180,
        position: [30.7, -18.5, 13.47],
        target: [3.99, 47.45, 0.08],
        up: [-0.22, -0.28, -0.94],
      },
      description: `### The Birth of a Rogue Kinase

But in BCR-ABL, this safety mechanism is gone. A reciprocal translocation between chromosomes 9 and 22 creates the Philadelphia chromosome (Ph),
fusing the ABL1 gene from chromosome 9 with the BCR gene on chromosome 22. This fusion produces the chimeric protein, BCR-ABL, which lacks the
regulation of the wildtype protein. Read more about this [here](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/philadelphia-chromosome)
and [the history of its discovery](https://pmc.ncbi.nlm.nih.gov/articles/PMC1934591/).

Comparing the normal protein to the kinase domain alone ([PDB ID 2GQG](https://doi.org/10.2210/pdb2gqg/pdb), in light red), you can
see how the SH3 and SH2 domains (teal in normal ABL, red in BCR-ABL, with SH3 domain being unresolved in the crystal structure) are no longer positioned to restrain the kinase.

With this lock removed, BCR-ABL is stuck in an active conformation, like an accelerator pedal jammed to the floor. Without
its normal regulation, BCR-ABL will keep signaling, unchecked causing unregulated cell growth and cancer — [chronic myeloid leukemia (CML)](https://en.wikipedia.org/wiki/Chronic_myelogenous_leukemia).

[Go to start](#intro)`,
      javascript: `const _1opl = structure(builder, '1opl');
const [_1opl_poly, _1opl_poly_repr] = polymer(_1opl, { color: Colors['1opl'] });

ligand(_1opl, {
    selector: { label_asym_id: 'C' },
    uniform_color: Colors['1opl'],
});

ligand(_1opl, {
    selector: { label_asym_id: 'D' },
    surface: true,
    carbon_color: Colors['1opl'],
});

domains(_1opl, _1opl_poly_repr, [
    [Domains.SH2, DomainColors.SH2, 'SH2'],
    [Domains.SH3, DomainColors.SH3, 'SH3'],
], { label_size: 9 });

const _2gqg = structure(builder, '2gqg');
const [, _2gqg_poly_repr] = polymer(_2gqg, { color: '#BF99A1' });

domains(_2gqg, _2gqg_poly_repr, [
    [Domains.SH2, DomainColors['SH2_BCR'], 'SH2 (BCR)'],
], { label_size: 6 });
`,
    },
  ],
  assets: [],
};
