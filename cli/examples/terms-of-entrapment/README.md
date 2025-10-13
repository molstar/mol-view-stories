# Terms of Entrapment

A recreation of the historic 1985 SIGGRAPH molecular animation by Arthur Olson, John Tainer, and Elizabeth Getzoff, reimagined using modern Mol* visualization.

## About

This story recreates key moments from "Terms of Entrapment," a groundbreaking molecular animation that detailed the structure and function of **superoxide dismutase (SOD)**, an enzyme that scavenges harmful superoxide radicals produced during oxygen metabolism.

### Superoxide Dismutase

- **Function**: Protects cells by neutralizing toxic superoxide radicals
- **Structure**: Homodimer with beta-barrel architecture
- **Metal Centers**: Copper and zinc ions essential for catalytic activity
- **Symmetry**: Two-fold symmetry axis relates the two subunits

## Attribution

**Original 1985 Animation:**
- Arthur Olson (Scripps Research)
- John Tainer (Scripps Research)
- Elizabeth Getzoff (Scripps Research)
- Software: GRAMPS (T.J. O'Donnell, A.J. Olson) and GRANNY (M.L. Connolly, A.J. Olson)
- Filmed on 16mm from E&S color monitor

**Reference:** [SIGGRAPH 1985 Animation Archive](https://history.siggraph.org/animation-video-pod/terms-of-entrapment-by-olson-tainer-and-getzoff/)

This MVS recreation uses bloom and emissive effects to evoke the look of the original 16mm projected film.

## Story Structure

14 scenes exploring SOD structure:

1. Start - Introduction
2. Terms of Entrapment - Title and historical context
3. Superoxide dismutase - Overall structure
4. Metal Ions - Copper and zinc binding sites
5. Symmetry Axis - Two-fold symmetry
6. Sequences - Amino acid composition
7. Beta Barrel - Characteristic fold
8. Beta Barrel Slice - Cross-section view
9. Dimer - Subunit interaction
10. Buried Surface - Interface analysis
11. Open Buried Surface - Exposed interface
12. Active Site - Catalytic center
13. Electrostatic Surface - Charge distribution
14. Electrostatic - Guiding superoxide to active site

## Technical Details

### Audio Narration
16 synchronized audio clips (`part_01.mp3` through `part_16.mp3`) provide historical context and structural descriptions.

### Visualization Style
- **Bloom effects** - Mimics 16mm film glow
- **Emissive rendering** - CRT monitor aesthetic
- **Vector field visualization** - Electrostatic guidance pathways
- **Surface representations** - Molecular surfaces and buried interfaces

## Building

```bash
# Build to any format
mvs build . --output terms-of-entrapment.mvsx --format mvsx

# Watch for development
mvs watch .
```

## Educational Context

Demonstrates:
- Historic molecular visualization techniques
- Enzyme structure-function relationships
- Electrostatic steering in catalysis
- Protein symmetry and quaternary structure
- Beta-barrel protein architecture

## References

- [SIGGRAPH History - Terms of Entrapment](https://history.siggraph.org/animation-video-pod/terms-of-entrapment-by-olson-tainer-and-getzoff/)
- Tainer JA, Getzoff ED, Richardson JS, Richardson DC. "Structure and mechanism of copper, zinc superoxide dismutase." *Nature.* 1983;306:284-287.

## License

Copyright (c) 2025 mol* contributors, licensed under MIT. See LICENSE file for more info.

Original animation concept by Olson, Tainer, and Getzoff (1985).
