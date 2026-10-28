# Figure 8b: bispecific antibody bridges

A Mol* / MolViewSpec reconstruction of the **three molecular panels in Figure 8b** of [Tranbarger and Mithril Medicine, *Preclinical Characterization of a Bispecific Bridging Antibody for the Treatment of LAMA2-Related Congenital Muscular Dystrophy* (26 October 2026)](https://www-cdn.anthropic.com/52e1f5d50c47ca3818f56704c27cf19e59b62e77.pdf) (figure: PDF p. 14; structural methods: p. 25).

**Representative, template-based reconstruction.** It does not reproduce the authors' assembled coordinates, engineered sequences or binding poses, and **the coat uses a LAMA2 LG4–5 homolog as a shape proxy for LAMA4**. Every scene and coat tooltip says so.

## Preview

From `cli/`:

```sh
deno run --allow-all main.ts watch examples/anthropic-figure-8b --port 8098
```

The story opens on all three formats side by side, then walks each panel through four scenes (**context**, **antibody**, **complete**, **contacts**) and ends with a contacts comparison. Edit `story.js` (panel geometry and renderer) or a scene's `.js`/`.md`; watch mode rebuilds and reloads.

To validate every snapshot and build `.mvsx` / `.mvstory` into `.build/`:

```sh
deno run --allow-all examples/anthropic-figure-8b/check.ts
```

## What is represented

| Piece | Implementation | Fidelity / limitation |
| --- | --- | --- |
| Membrane, cell interior, well | Flat backdrops and lipid-headgroup primitives | Schematic 4 nm bilayer |
| α/β-dystroglycan | **9C3C** (rabbit): α-DG A 485–653 light grey; β-DG B 654–749 near-black, TM 750–774 grey | Experimental relative arrangement. Cytoplasmic tail hidden (the figure's cell interior covers it); released α-DG N-terminal domain omitted |
| β-DG Fab(s) | **1HZH** H 1–225 + L | Colored by domain type, as in the figure: VH dark grey, VL mid grey, CH1 beige, CL near-white (Kabat VH ≤113, VL ≤107). The CrossMab arm shows its crossover by swapped CH1/CL colors; coordinates are not swapped |
| Fc | **1HZH** H/K 246–end + Asn297 glycans (pale) | Generic human IgG1; the hinge (230–245) is drawn as tubes. The 1+1 construct's mouse IgG2a Fc is not modeled |
| LAMA4 Fab / scFv | Same scaffolds; variable domains blue | Fv proxy lacks the engineered VH–VL linker |
| Hinge and Fc-terminal linkers | Tubes | Schematic paths, not peptide conformations |
| LAMA4 LG4–5 coat | **5IK8** chain B (mouse LAMA2 LG4–5), end-on | Proxy; the paper uses **AF-Q16363-F1 v4**, whose download returned HTTP 403 during preparation |
| Contacts | Black: bond drawn in the figure; grey: second bond within reach | Schematic markers at each arm's paratope end |

Placements, angles and colors are measured from the figure's own panel renders (about 4.43 px/Å). Surfaces are Gaussian with `size_factor: 1.5`, the only surface parameter MVS exposes, which smooths side chains into the figure's domain-level blobs (about 1 Å wider envelope). Repeated molecules are MVS instances of one styled structure, so a snapshot builds at most 9 structures; `check.ts` guards this.

## Open differences from the figure

- The coat is one row of copies; the figure shows two or three staggered rows.
- No outlines or flat toon shading.
- The 2+1 / 2+2 Fc is a little rounder than the figure's two-column shape.
- Not validated as a molecular complex: no clash checks, generic scaffolds, no engineered sequences.

## Reproduce the structural templates

Download [1HZH](https://www.rcsb.org/structure/1HZH) (`1hzh.pdb`), [9C3C](https://www.rcsb.org/structure/9C3C) (`9c3c.cif`) and [5IK8](https://www.rcsb.org/structure/5IK8) (`5ik8.pdb`) from RCSB into one directory, then from `cli/`:

```sh
python3 examples/anthropic-figure-8b/prepare_assets.py /path/to/downloads
```

The script (Python standard library only) crops domains and applies rigid rotations/translations; coordinates are not scaled. It keeps source chain IDs, residue numbers and insertion codes, and the 1HZH Fc glycans. Each PDB records its source in a REMARK. Occupancy and B-factors are reset and carry no meaning.

## Next fidelity improvements

- Use the authors' assembled coordinates or PyMOL session if they become available.
- Replace `assets/lg45-proxy.pdb` with LAMA4 LG4–5 from AF-Q16363-F1 v4, updating the tooltip, scene caveat and preparation script together.
- Replace generic Fab/Fv/Fc scaffolds with the construct models (crossover, hinge, scFv linker, Fc isotype).
