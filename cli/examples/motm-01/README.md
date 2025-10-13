# Molecule of the Month: Myoglobin

A molecular visualization story showcasing myoglobin, the first protein structure ever solved and featured in the inaugural [RCSB PDB Molecule of the Month](https://pdb101.rcsb.org/motm/1) by David Goodsell in January 2000.

## About Myoglobin

Myoglobin is an oxygen-binding protein found in muscle tissue. It was the first protein structure to be determined by X-ray crystallography, earning John Kendrew the Nobel Prize in Chemistry in 1962. This groundbreaking achievement opened the door to understanding protein structure at the atomic level.

### Key Features

- **Function**: Stores and transports oxygen in muscle cells
- **Structure**: Compact globular protein with 8 alpha helices
- **Prosthetic Group**: Contains a heme group with an iron atom that binds oxygen
- **Evolutionary Importance**: Related to hemoglobin, found across diverse species from whales to humans

### Scientific Significance

Myoglobin's structure revealed fundamental principles of protein folding and function:
- How hydrophobic amino acids cluster in the protein interior
- How charged residues can form stabilizing salt bridges
- How proteins can reversibly bind small molecules like oxygen
- The importance of the heme cofactor in oxygen chemistry

## Attribution

This story is a port of the original myoglobin visualization created for the Mol* project. The original TypeScript implementation can be found in the [Mol* repository](https://github.com/molstar/molstar) under `examples/`.

**Original Authors:**
- David Sehnal
- Ludovic Autin  
- Victoria Doshchenko

This MVS CLI version demonstrates how complex molecular stories can be structured using the new scene-based format with YAML configuration, Markdown descriptions, and modular JavaScript.

## Story Structure

This story takes you through five scenes exploring myoglobin:

1. **Introduction** - Spinning myoglobin structure with audio introduction
2. **Molecule of the Month** - Detailed view showing the heme group and protein structure
3. **Myoglobin and Whales** - Comparison of whale and pig myoglobin, highlighting charged residues
4. **Oxygen Bound** - Visualization of oxygen binding and protein "breathing" motions
5. **Conclusion** - Amino acid types and salt bridges that stabilize the structure

## Technical Details

### Audio Integration

This story includes synchronized audio narration that auto-plays when each scene loads. Audio files are located in the `assets/` directory and are referenced using the `extendRootCustomState` pattern:

```javascript
builder.extendRootCustomState({
  molstar_on_load_markdown_commands: {
    'play-audio': _Audio1,  // References local audio file
  },
});
```

### Structure Files

The story uses multiple PDB structures:
- **1MBN** - Sperm whale myoglobin (primary structure)
- **1PMB** - Pig myoglobin (for comparison)
- **1MBO** - Myoglobin with bound oxygen
- **1MYF** - NMR ensemble showing protein dynamics

Structures are loaded directly from the PDB via BCIF format for fast loading.

### Visualization Techniques

- **David Goodsell style rendering** - Custom illustrative color schemes
- **Spacefill representations** - CPK coloring for atomic detail
- **Animated transformations** - Smooth transitions between scenes
- **Interactive elements** - "Next" buttons for scene navigation
- **Structural alignment** - Superposition matrices for comparing different myoglobins

## File Organization

```
motm-01/
├── story.yaml              # Story metadata and configuration
├── story.js                # Shared helper functions and constants
├── README.md               # This file
├── assets/                 # Audio and other media files
│   ├── AudioMOM1_A.mp3
│   ├── AudioMOM1_B.mp3
│   ├── AudioMOM1_C.mp3
│   └── AudioMOM1_D.mp3
└── scenes/                 # Individual scene definitions
    ├── scene1/             # Introduction
    │   ├── scene1.yaml     # Camera, timing config
    │   ├── scene1.md       # Scene description
    │   └── scene1.js       # Visualization code
    ├── scene2/             # Molecule of the Month
    ├── scene3/             # Myoglobin and Whales
    ├── scene4/             # Oxygen Bound
    └── scene5/             # Conclusion
```

## Building the Story

To build this story into various output formats:

```bash
# Build to MVSJ (JSON format)
mvs build . --output motm-01.mvsj.json

# Build to MVSX (binary format)
mvs build . --output motm-01.mvsx --format mvsx

# Build to standalone HTML
mvs build . --output motm-01.html --format html

# Build to MVStory container
mvs build . --output motm-01.mvstory --format mvstory
```

## Development

To work on this story with live reloading:

```bash
mvs watch .
```

Then open the provided URL in your browser to see live updates as you edit files.

## Usage

To build this story into a StoryContainer:

```bash
mvs build . --output story-container.json
```

## Educational Context

This story demonstrates:
- **Protein structure visualization** using multiple representation types
- **Comparative structural biology** by aligning different myoglobin structures
- **Molecular dynamics** through NMR ensemble visualization
- **Ligand binding** showing oxygen interaction with the heme group
- **Amino acid chemistry** highlighting hydrophobic and charged residues
- **Structural stability** via salt bridge visualization

Perfect for teaching:
- Introduction to protein structure
- History of structural biology
- Protein-ligand interactions
- Comparative biochemistry across species
- Molecular visualization techniques

## References

- [RCSB PDB Molecule of the Month: Myoglobin](https://pdb101.rcsb.org/motm/1)
- [PDB Entry 1MBN](https://www.rcsb.org/structure/1MBN) - Sperm whale myoglobin
- [Mol* Molecular Visualization](https://molstar.org/)
- Kendrew, J.C. et al. (1958). "A three-dimensional model of the myoglobin molecule obtained by x-ray analysis." Nature 181: 662-666.

## License

Copyright (c) 2025 mol* contributors, licensed under MIT. See LICENSE file for more info.