# Figure 8b: bispecific antibody bridges

A first, editable Mol* / MolViewSpec reconstruction of the **three molecular panels in Figure 8b** of [Tranbarger and Mithril Medicine, *Preclinical Characterization of a Bispecific Bridging Antibody for the Treatment of LAMA2-Related Congenital Muscular Dystrophy* (26 October 2026)](https://www-cdn.anthropic.com/52e1f5d50c47ca3818f56704c27cf19e59b62e77.pdf). Figure: PDF page 14; structural methods: page 25. This example covers 8b, not the assay diagrams or data plots in 8a/c/d.

**Status: representative template-based reconstruction, ready for visual feedback.** It does not reproduce the authors' original assembled coordinates, docking, engineered sequences, or experimentally determined binding poses. In particular, **the coat currently uses a LAMA2 LG4–5 homolog as a shape proxy for LAMA4**. This is stated in every scene and coat tooltip.

## Preview

Run from `cli/`:

```sh
# Three formats together at a shared coordinate scale
deno run --allow-all main.ts watch examples/anthropic-figure-8b/00-comparison --port 8098

# One independently editable story per Figure 8b panel
deno run --allow-all main.ts watch examples/anthropic-figure-8b/01-crossmab --port 8099
deno run --allow-all main.ts watch examples/anthropic-figure-8b/02-2plus1 --port 8100
deno run --allow-all main.ts watch examples/anthropic-figure-8b/03-igg-scfv --port 8101
```

Open the localhost address printed by the command. Widen the viewer for the three-panel comparison. Each panel story has four scenes: **context**, **antibody architecture**, **assembled bridge**, and **contacts/reach**. Click Next/Prev to compare; drag to inspect the scene in 3D. Watch mode rebuilds and reloads after edits.

## What is represented

| Piece | Implementation | Fidelity / limitation |
| --- | --- | --- |
| Cell membrane and cell interior | MolViewSpec boxes and lipid-headgroup primitives | Schematic bilayer, nominal 40 Å thickness; not an atomistic membrane |
| α/β-dystroglycan | Rabbit **9C3C**, α chain A residues 485–653, β chain B residues 654–798 | Experimental coordinates retain their relative arrangement. Released α-DG N-terminal domain and unmodeled regions omitted; no added glycans |
| β-DG-binding Fab(s) | **1HZH**, H residues 1–225 + L | Generic Fab scaffold with dark variable domains; not AS30 or an engineered crossover |
| Fc | **1HZH**, H/K residues 230–end + experimental Asn297 glycans (chains A/B) | Generic human IgG1 scaffold; glycans fill the CH2 cavity. CrossMab panel does not model its mouse IgG2a sequence |
| LAMA4-binding Fab | Same generic Fab scaffold, blue | Illustrative specificity coloring, not the tool antibody's variable domains |
| LAMA4-binding scFv(s) | **1HZH** H/L residues 1–110, blue | Fv shape proxy; engineered VH–VL peptide connection is absent |
| Hinge / Fc-terminal linkers | MolViewSpec tubes | Schematic connections; lengths and conformations are not peptide predictions |
| LAMA4 LG4–5 coat | **5IK8 chain B, mouse LAMA2 LG4–5 homolog proxy** | Temporary proxy. The paper uses **AF-Q16363-F1 v4** LAMA4; public AlphaFold file downloads returned HTTP 403 during preparation |
| Well bottom and pale bystanders | Slab + additional structural copies | Schematic adsorption poses and densities |
| Contacts and second-arm reach | Black markers for bonds, grey for a second bond within reach; placed at each arm's paratope end | Mirrors the figure's distinction, not atom-level bonds or measured stoichiometry |
| Scale | 100 Å bar = 10 nm; no coordinate scaling | Structural template dimensions retained. Relative placement is illustrative |

In 1+1, both Fabs connect at the hinge and the Fc tilts forward. In 2+1, one LAMA4 Fab connects below the Fc. In 2+2, two LAMA4 Fv proxies connect below the Fc. As in the figure, the second β-DG bond (2+1, 2+2) and the second LAMA4 bond (2+2) are shown as **within reach**, not asserted to form. The vertical layout follows the figure's ~21 nm from the inner membrane surface to the well bottom, and each LAMA4 arm rests on a coat copy. The paper explicitly states that coat orientation and density are unknown, stoichiometry was not measured, and poses are illustrative.

## Loading performance

The renderer uses **Gaussian surfaces** and groups copies with the same template, colors,
opacity, and tooltip into MolViewSpec **instances**. The comparison retains all 36 molecular
placements while reducing independently constructed structures from 36 to 8 and surface
representations from 52 to 11 per snapshot. The exact timings depend on the browser/GPU
and whether the Mol* viewer bundle is already cached; the validation script guards these
structure/representation counts. Gaussian envelopes are illustrative molecular shapes,
not solvent-excluded molecular surfaces for atom-level analysis.

Watch mode coalesces rapid file changes into a single rebuild and serializes rebuilds
so regeneration does not queue a reload for every written file. The generator also
leaves unchanged files untouched, including the bundled structure assets.

The CLI builder and default preview viewer use Mol* **5.13.1**. The viewer version comes
from the installed builder package, preventing the previous 5.8.0 preview mismatch.

## Feedback cycle

1. Watch a panel or the comparison above.
2. For a quick experiment, edit that story's `story.js` or `scenes/<stage>/<stage>.js`; the browser reloads. These are generated files, so move accepted changes to the shared sources before regeneration.
3. For persistent changes, edit **`shared/panels.json`** (domain centers, angles/tilt/spin, receptor positions, coat targets, `"bond": "reach"` on an arm) or **`shared/scene.js`** (styles, labels, primitives and connections).
4. Run `python3 examples/anthropic-figure-8b/generate.py` from `cli/`. This updates all four watchable stories. No third-party Python packages are required.
5. Run `deno run --allow-all examples/anthropic-figure-8b/check.ts`. It validates all 14 snapshots, checks bundled structure references and builds all four `.mvsx` and `.mvstory` files into `.build/`.
6. Record feedback in [FEEDBACK.md](FEEDBACK.md), using panel, scene, visible issue, and desired change. Make one geometric change at a time and compare the same scene/camera.

**Generated files are checked in** so normal preview/build needs no preparation. Regeneration overwrites each generated `story.js`, `story.yaml`, and scene files. Canonical sources live in `shared/`, `generate.py`, and `prepare_assets.py`.

## Export

From `cli/`:

```sh
# Mol* viewer package, with local structures embedded
deno run --allow-all main.ts build examples/anthropic-figure-8b/00-comparison -f mvsx -o figure-8b.mvsx

# Editable story container
deno run --allow-all main.ts build examples/anthropic-figure-8b/03-igg-scfv -f mvstory -o figure-8b-2plus2.mvstory
```

The structure downloads inside MVS use `./<name>.pdb`, matching the flat asset paths in the CLI's MVSX container. Molecular data need no remote requests after packaging. The watch viewer still loads its Mol* JavaScript/CSS through the CLI's normal CDN-based viewer.

## Reproduce the structural templates

Download these public files into a temporary directory as `1hzh.pdb`, `9c3c.cif`, and `5ik8.pdb`:

- [1HZH coordinates](https://files.rcsb.org/download/1HZH.pdb) · [entry / original citation](https://www.rcsb.org/structure/1HZH)
- [9C3C coordinates](https://files.rcsb.org/download/9C3C.cif) · [entry / original citation](https://www.rcsb.org/structure/9C3C)
- [5IK8 coordinates](https://files.rcsb.org/download/5IK8.pdb) · [entry / original citation](https://www.rcsb.org/structure/5IK8)

Then run from `cli/`:

```sh
python3 examples/anthropic-figure-8b/prepare_assets.py /path/to/downloads
python3 examples/anthropic-figure-8b/generate.py
deno run --allow-all examples/anthropic-figure-8b/check.ts
```

Preparation crops domains, retains source residue and chain identifiers, and applies rigid rotations/translations only. Domain coordinates are not scaled. `shared/templates.json` records sources, atom counts, and bounding boxes. Normalized PDBs carry provenance remarks; occupancy/B factors are reset for this illustrative use and must not be interpreted as confidence values. The script uses the first model, excludes non-ATOM records, and selects blank/A alternate locations.

## Next fidelity improvements

- Obtain the authors' original assembled Figure 8b coordinates / PyMOL session if available; the report does not link a public coordinate/code archive.
- Replace `shared/assets/lg45-proxy.pdb` with a prepared **LAMA4** LG4–5 model from **AF-Q16363-F1 v4**. Update the asset name, renderer tooltip, preparation script, provenance, and scene caveat together; adjust its placement after checking dimensions. Do not silently relabel LAMA2 coordinates as LAMA4.
- Replace generic Fab/Fv/Fc scaffolds with the actual construct models, including crossover, hinge, scFv connections, and Fc isotype.
- Refine placements and linker endpoints against the original figure, check clashes, then add residue-specific annotation only where supported by coordinates.
- Add modeled glycosylation and membrane chemistry if those details become part of the intended representation.
