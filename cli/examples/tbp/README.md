# TATA-Binding Protein (TBP) Molecular Visualization Story

An interactive molecular visualization story exploring the structural biology of TATA-binding protein and its critical role in transcription initiation in eukaryotic cells.

## Overview

This story presents a comprehensive journey through the structure and function of TBP, demonstrating:

- **Structural Architecture**: The unique saddle-shaped fold of TBP
- **Evolutionary Conservation**: Comparison of TBP across species (human and *A. thaliana*)
- **DNA Recognition**: How TBP recognizes and binds the TATA box sequence
- **Molecular Interactions**: Detailed analysis of arginine, phenylalanine, and hydrogen bonding
- **Biological Context**: TBP's role in the pre-initiation complex (PIC)

## Story Structure

### 10 Interactive Scenes

| Scene | Key | Title | PDB ID(s) | Focus |
|-------|-----|-------|-----------|-------|
| 1 | `intro` | TATA-Binding Protein | 1VOK | Overall structure and symmetry |
| 2 | `highly-conserved-1` | Highly Conserved [1/2] | 1CDW, 1VTL | Cross-species comparison |
| 3 | `highly-conserved-2` | Minor Groove [2/2] | 1CDW, 1VTL | TATA box sequence |
| 4 | `tata-box-overview` | Binding to TATA Box [1/5] | 1CDW | DNA bending mechanism |
| 5 | `tata-box-1` | Arginine [2/5] | 1CDW | Phosphate interactions |
| 6 | `tata-box-2` | Phenylalanine [3/5] | 1CDW | DNA kinking residues |
| 7 | `tata-box-3` | H-Bonds [4/5] | 1CDW | Minor groove hydrogen bonds |
| 8 | `tata-box-4` | Non-Polar [5/5] | 1CDW | Hydrophobic interactions |
| 9 | `pre-init-complex` | Pre-Initiation Complex | 7ENC | TBP in transcription machinery |
| 10 | `end` | The End | 7ENC | Conclusion and references |

## Structures Used

### Primary Structures

- **[1VOK](https://www.rcsb.org/structure/1VOK)** - *Arabidopsis thaliana* TBP (apo form)
  - Shows the core saddle-shaped structure
  - Demonstrates the two-fold symmetry

- **[1CDW](https://www.rcsb.org/structure/1CDW)** - Human TBP bound to DNA
  - Primary structure for interaction analysis
  - Shows dramatic DNA bending (~80°)

- **[1VTL](https://www.rcsb.org/structure/1VTL)** - *A. thaliana* TBP-DNA complex
  - Demonstrates evolutionary conservation
  - 83% sequence identity with human TBP

- **[7ENC](https://www.rcsb.org/structure/7ENC)** - Pol II pre-initiation complex
  - Complete transcription machinery
  - Shows TBP with pol II, mediator, and TAFs

### Structural Superposition

The story uses structural alignments from RCSB to superimpose multiple structures:
- 1CDW and 1VTL aligned for comparison
- 7ENC transformed to show the full PIC context

## File Organization

```
tbp/
├── story.yaml              # Story metadata and configuration
├── story.js                # Global helper functions and constants
├── tbp.ts                  # Original TypeScript implementation (reference)
├── README.md               # This file
├── CONVERSION_NOTES.md     # Technical conversion documentation
└── scenes/                 # Individual scene directories
    ├── intro/
    │   ├── intro.yaml      # Scene configuration (camera, timing)
    │   ├── intro.js        # Visualization code
    │   └── intro.md        # Educational content
    ├── highly-conserved-1/
    ├── highly-conserved-2/
    ├── tata-box-overview/
    ├── tata-box-1/
    ├── tata-box-2/
    ├── tata-box-3/
    ├── tata-box-4/
    ├── pre-init-complex/
    └── end/
```

## Helper Functions

The `story.js` file provides reusable helper functions for all scenes:

### Structure Loading
```javascript
loadStructure(builder, id)
// Loads a PDB structure and applies transformation if available
```

### Styling and Selection
```javascript
selectAndStyle(structure, { color, selector, opacity, representationType })
// Selects components and applies visualization style

setup1CDWScene(structure, proteinColor, dnaColor)
// Common setup for 1CDW structure (protein C + DNA A/B)

showDNAChains(structure, chains, color, opacity)
// Style multiple DNA chains consistently
```

### Labeling and Annotations
```javascript
addLabel(structure, selector, text)
// Add text label to structure component

showBindingSite(structure, residues, options)
// Highlight binding site residues with labels
```

### Interactions
```javascript
drawInteraction(primitives, start, end, label, color)
// Draw interaction lines (H-bonds, contacts)

showInteractingResidues(structure, residues)
// Display residues as ball-and-stick with element colors
```

### Surfaces
```javascript
createSurface(structure, selector, carbonColor)
// Create surface representation with custom coloring
```

## Color Scheme

The story uses a consistent color palette defined in `story.js`:

```javascript
Colors = {
  '1vok': '#4577B2',    // Blue - A. thaliana TBP
  '1cdw': '#BC536D',    // Rose - Human TBP
  '1cdw-2': '#c5a3af',  // Light rose - DNA in 1CDW
  '1vtl': '#B9E3A0',    // Light green - A. thaliana TBP-DNA
  '7enc': '#0072B2',    // Dark blue - pol II complex
  '7enc-2': '#D55E00',  // Orange - DNA in 7ENC
  '7enc-3': '#009E73',  // Teal - Mediator
  '7enc-4': '#56B4E9',  // Sky blue - TAFs
}
```

## Key Interactions Visualized

### Arginine-Phosphate Interactions (Scene 5)
- **Arg192** (seq 38): NH1, NH2 → DNA phosphates
- **Arg199** (seq 45): NE, NH2 → DNA phosphates
- **Arg204** (seq 50): NH1, NH2 → DNA phosphates
- **Arg290** (seq 136): NH1 → DNA phosphates

### Phenylalanine Kinks (Scene 6)
- **Phe193** (seq 39): N-terminal kink
- **Phe210** (seq 56): N-terminal kink
- **Phe284** (seq 130): C-terminal kink
- **Phe301** (seq 147): C-terminal kink

### Minor Groove Hydrogen Bonds (Scene 7)
- **Asn163** (seq 9): ND2 → DNA bases
- **Thr309** (seq 155): OG1 → DNA bases
- **Asn253** (seq 99): Central interaction

## Code Examples

### Basic Scene Structure

```javascript
// Load structure
const structure = loadStructure(builder, '1cdw');

// Setup standard 1CDW coloring
setup1CDWScene(structure, Colors['1cdw'], Colors['1cdw-2']);

// Add specific features
addLabel(structure, { label_asym_id: 'C', label_seq_id: 38 }, 'Arg192');
```

### Drawing Interactions

```javascript
// Get primitives for drawing
const primitives = structure.primitives();

// Draw hydrogen bond
drawInteraction(
  primitives,
  { label_asym_id: 'C', label_seq_id: 38, label_atom_id: 'NH2' },
  { label_asym_id: 'B', label_seq_id: 7, label_atom_id: 'OP1' },
  'H-bond'
);
```

### Highlighting Binding Sites

```javascript
showBindingSite(structure, [
  { selector: { label_asym_id: 'C', label_seq_id: 39 }, label: 'Phe193' },
  { selector: { label_asym_id: 'C', label_seq_id: 56 }, label: 'Phe210' },
], { 
  color: Colors['1cdw'],
  label_size: 1.5 
});
```

## Building and Testing

### Build the Story

```bash
# From the CLI root directory
deno run --allow-all main.ts build examples/tbp
```

### Watch Mode (Live Reloading)

```bash
deno run --allow-all main.ts watch examples/tbp
```

### Serve the Story

```bash
deno run --allow-all main.ts serve examples/tbp
```

## Educational Content

Each scene includes markdown content explaining:
- The biological significance of the structure
- Specific molecular interactions being shown
- The role of TBP in transcription initiation
- Evolutionary conservation across species

### Learning Objectives

By the end of this story, viewers will understand:

1. **Structure-Function Relationship**: How TBP's saddle shape enables DNA binding
2. **Molecular Recognition**: Multiple interaction types that ensure specificity
3. **DNA Distortion**: How TBP bends and kinks DNA to facilitate transcription
4. **Biological Context**: TBP's central role in the pre-initiation complex
5. **Conservation**: Why TBP structure is highly conserved across eukaryotes

## Credits and References

### Authors
- **David Sehnal** - Original TypeScript implementation
- **Sebastian Bittrich** - Original TypeScript implementation

### Data Sources
- Structures from [RCSB Protein Data Bank](https://www.rcsb.org)
- Alignments from [RCSB Structure Alignment Tool](https://www.rcsb.org/alignment)

### Publications

- **1VOK**: Nikolov, D.B., Chen, H., Halay, E.D., et al. (1995) *Nat Struct Biol* 2(9):621-628
  - [DOI: 10.1038/nsb0994-621](https://doi.org/10.1038/nsb0994-621)

- **1CDW**: Kim, J.L., Nikolov, D.B., Burley, S.K. (1993) *Nature* 365:520-527
  - [DOI: 10.1038/365520a0](https://doi.org/10.1038/365520a0)

- **1VTL**: Kim, Y., Geiger, J.H., Hahn, S., Sigler, P.B. (1993) *Proc Natl Acad Sci USA* 93(10):4862-4867
  - [DOI: 10.1073/pnas.93.10.4862](https://doi.org/10.1073/pnas.93.10.4862)

- **7ENC**: Chen, X., Qi, Y., Wu, Z., et al. (2021) *Science* 372(6545):eabg0635
  - [DOI: 10.1126/science.abg0635](https://doi.org/10.1126/science.abg0635)

### Educational Resources

- [RCSB PDB-101: TATA-binding protein](https://pdb101.rcsb.org/motm/67)
- [RCSB PDB-101: Mediator](https://pdb101.rcsb.org/motm/289)

## Technical Notes

### Transformation Matrices

Structures 1CDW, 1VTL, and 7ENC use pre-computed transformation matrices for alignment:
- Format: `[rotation (3x3 as 9 numbers), translation (3 numbers)]`
- Applied automatically by `loadStructure()` function
- Matrices obtained from RCSB Structure Alignment tool

### Scene Configuration

Each scene YAML includes:
- **header**: Display title
- **key**: Unique identifier for scene
- **camera**: Position, target, up vector
- **linger_duration_ms**: Time to display scene (5000ms)
- **transition_duration_ms**: Time to transition between scenes (1500ms)

### Code Quality Improvements

Recent refactoring includes:
- ✅ Reusable helper functions for common patterns
- ✅ Data-driven approach for interactions and labels
- ✅ Reduced code duplication across scenes
- ✅ Consistent code formatting and style
- ✅ Comprehensive inline documentation

## Future Enhancements

Potential additions to the story:
- [ ] Interactive residue highlighting on click
- [ ] Smooth camera animations between scenes
- [ ] Audio narration for each scene
- [ ] Quiz questions to test understanding
- [ ] Comparison with other transcription factors
- [ ] Animation of DNA bending process
- [ ] Mobile-optimized layouts

## Troubleshooting

### Common Issues

**Issue**: Structures not loading
- Check internet connection (structures loaded from PDB)
- Verify URLs in `pdbUrl()` function

**Issue**: Incorrect transformations
- Ensure transformation matrices are in correct format
- Check `Superpositions` object in `story.js`

**Issue**: Labels not appearing
- Verify residue numbers match PDB file
- Check chain IDs are correct

## Contributing

To modify or extend this story:

1. Edit scene files in `scenes/[scene-name]/`
2. Update helper functions in `story.js` if needed
3. Test with `deno run --allow-all main.ts watch examples/tbp`
4. Document changes in `CONVERSION_NOTES.md`

## License

Based on original work by mol* contributors, licensed under MIT.
See LICENSE file for more information.

---

**Version**: 1.0  
**Last Updated**: January 2025  
**MVS CLI Version**: Compatible with latest CLI tools