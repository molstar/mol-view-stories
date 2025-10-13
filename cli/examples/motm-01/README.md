# Molecule of the Month: Myoglobin

Recreation of the inaugural [RCSB PDB Molecule of the Month](https://pdb101.rcsb.org/motm/1) by David Goodsell (January 2000), exploring myoglobin—the first protein structure ever solved.

## About Myoglobin

Myoglobin stores and transports oxygen in muscle tissue. Its structure determination by John Kendrew (1962 Nobel Prize) opened the door to atomic-level understanding of proteins.

**Key Features:**
- Compact globular protein with 8 alpha helices
- Heme group with iron atom binds oxygen
- Hydrophobic core, charged surface residues
- Stabilized by salt bridges

## Attribution

Port of the original Mol* implementation from the [molstar repository](https://github.com/molstar/molstar).

**Original Authors:** David Sehnal, Ludovic Autin, Victoria Doshchenko

## Story Structure

5 scenes with synchronized audio narration:

1. **Introduction** - Spinning structure overview
2. **Molecule of the Month** - Heme group and protein detail
3. **Myoglobin and Whales** - Comparing whale and pig myoglobin
4. **Oxygen Bound** - Oxygen binding and protein dynamics
5. **Conclusion** - Amino acid types and salt bridges

## Technical Details

**Structures:** 1MBN (whale), 1PMB (pig), 1MBO (oxygen-bound), 1MYF (NMR ensemble)

**Audio:** 4 MP3 files with auto-play using `extendRootCustomState` pattern

**Visualization:** David Goodsell illustrative style, CPK coloring, structural alignments

## Building

```bash
# Build to various formats
mvs build . --output motm-01.mvsx --format mvsx
mvs build . --output motm-01.html --format html

# Watch for development
mvs watch .
```

## Educational Use

Perfect for teaching:
- Introduction to protein structure
- History of structural biology
- Protein-ligand interactions
- Comparative biochemistry

## References

- [RCSB PDB Molecule of the Month: Myoglobin](https://pdb101.rcsb.org/motm/1)
- [PDB: 1MBN](https://www.rcsb.org/structure/1MBN) - Sperm whale myoglobin
- Kendrew JC et al. "A three-dimensional model of the myoglobin molecule obtained by x-ray analysis." *Nature* 1958;181:662-666.

## License

Copyright (c) 2025 mol* contributors, licensed under MIT.