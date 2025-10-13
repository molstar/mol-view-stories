# TATA-Binding Protein (TBP) Story

An interactive molecular visualization story exploring the structural biology of TATA-binding protein and its role in transcription initiation.

## Overview

This story takes viewers on a journey through the structure and function of TATA-binding protein (TBP), a critical component of the transcription machinery in eukaryotic cells. Through 10 interactive scenes, viewers will explore:

- The overall structure of TBP
- Conservation across species
- DNA binding mechanisms
- Specific molecular interactions
- The role of TBP in the pre-initiation complex

## Story Structure

### Scenes

1. **intro** - TATA-Binding Protein
   - Introduction to TBP structure (PDB: 1VOK)
   - Shows the saddle-shaped DNA-binding fold

2. **highly-conserved-1** - TBP: Highly Conserved in Eukaryotes [1/2]
   - Structural comparison between human (1CDW) and A. thaliana (1VTL) TBP
   - Demonstrates evolutionary conservation

3. **highly-conserved-2** - TBP: Minor Groove [2/2]
   - Focus on TATA box recognition
   - Labels individual nucleotides in the TATA sequence

4. **tata-box-overview** - TBP: Binding to TATA Box [1/5]
   - Overview of TBP-DNA interaction
   - Shows dramatic DNA bending

5. **tata-box-1** - TBP: Arginine [2/5]
   - Arginine residues interacting with DNA phosphates
   - Shows hydrogen bonds with Arg192, Arg199, Arg204, Arg290

6. **tata-box-2** - TBP: Phenylalanine [3/5]
   - Phenylalanine residues causing DNA kinks
   - Highlights Phe193, Phe210, Phe284, Phe301

7. **tata-box-3** - TBP: H-Bonds in Minor Groove [4/5]
   - Hydrogen bonding in the minor groove
   - Shows Asn163, Asn253, Thr309 interactions

8. **tata-box-4** - TBP: Non-Polar Interactions [5/5]
   - Hydrophobic and van der Waals interactions
   - Surface representation of DNA

9. **pre-init-complex** - TBP and Transcription Pre-Initiation Complex
   - Full pre-initiation complex (PDB: 7ENC)
   - Shows TBP's role with pol II, mediator, and TAFs

10. **end** - The End
    - Conclusion with references and resources

## Structures Used

- **1VOK** - TBP from Arabidopsis thaliana (apo form)
- **1CDW** - Human TBP bound to DNA
- **1VTL** - A. thaliana TBP bound to DNA
- **7ENC** - Pol II pre-initiation complex

## Files

- `story.yaml` - Story metadata and configuration
- `story.js` - Global helper functions and color schemes
- `tbp.ts` - Original TypeScript implementation (reference)
- `scenes/` - Individual scene directories, each containing:
  - `[scene-name].yaml` - Scene configuration and camera settings
  - `[scene-name].js` - Scene-specific visualization code
  - `[scene-name].md` - Scene description and educational content

## Helper Functions

The story uses several helper functions defined in `story.js`:

- `loadStructure(builder, id)` - Load PDB structures with automatic transformation
- `selectAndStyle(structure, options)` - Select and style molecular components
- `addLabel(structure, selector, text)` - Add labels to structures
- `drawInteraction(primitives, start, end, label)` - Draw interaction lines (H-bonds, etc.)
- `createSurface(structure, selector, carbonColor)` - Create surface representations
- `showBindingSite(structure, residues, options)` - Highlight binding site residues

## Color Scheme

- `#4577B2` - 1VOK (A. thaliana TBP)
- `#BC536D` - 1CDW (Human TBP)
- `#c5a3af` - 1CDW DNA (secondary)
- `#B9E3A0` - 1VTL (A. thaliana TBP-DNA)
- `#0072B2` - 7ENC (pol II complex)
- `#D55E00` - 7ENC DNA
- `#009E73` - 7ENC mediator
- `#56B4E9` - 7ENC TAFs

## Credits

**Authors:** David Sehnal & Sebastian Bittrich

Based on structural data from the Protein Data Bank and educational content from:
- [RCSB PDB Molecule of the Month: TATA-binding protein](https://pdb101.rcsb.org/motm/67)
- [RCSB PDB Molecule of the Month: Mediator](https://pdb101.rcsb.org/motm/289)

## References

- [PDB: 1VOK](https://doi.org/10.1038/nsb0994-621) - A. thaliana TBP structure
- [PDB: 1CDW](https://doi.org/10.1073/pnas.93.10.4862) - Human TBP-DNA complex
- [PDB: 1VTL](https://doi.org/10.1038/365520a0) - A. thaliana TBP-DNA complex
- [PDB: 7ENC](https://doi.org/10.1126/science.abg0635) - Pre-initiation complex

## Building and Testing

To build this story:

```bash
# From the CLI directory
npm run build

# Or using the CLI tool
mvs build cli/examples/tbp
```

To test the story:

```bash
mvs serve cli/examples/tbp
```

## Conversion Notes

This story was converted from the original TypeScript implementation (`tbp.ts`) to the MVS story format. The conversion includes:

1. Separated each step into an individual scene directory
2. Extracted visualization logic into JavaScript files
3. Converted descriptions to Markdown format
4. Preserved all camera positions and timing settings
5. Maintained all molecular interactions and labels
6. Created reusable helper functions in the global story.js

The original `tbp.ts` file is preserved for reference and demonstrates the mol* MVS Builder API usage.