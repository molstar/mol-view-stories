# P-450 Cytochromes Superposition

## Description
Superposition and validation annotation of P-450 cytochromes.

## Source
- **Molstar URL:** https://molstar.org/viewer/?snapshot-url=https%3A%2F%2Fmolstar.org%2Fdemos%2Fstates%2Fcytochromes.molx&snapshot-url-type=molx
- **molx file:** https://molstar.org/demos/states/cytochromes.molx
- **GitHub molx:** https://github.com/molstar/molstar.github.io/blob/master/demos/states/cytochromes.molx

- **Type:** Superposition + Validation
- **Tier:** 2

## References




## Implementation Status
- [x] molx file downloaded and extracted
- [x] state.json parsed and analyzed
- [x] Data sources identified (9 P-450 cytochrome structures)
- [x] Representations documented (cartoon with validation coloring)
- [x] Camera positions extracted
- [x] Builder API implementation completed
- [x] Chain selection optimized (chain A only)
- [x] Educational content enhanced
- [x] Testing complete (JSON and HTML builds successful)

## Investigation Notes

### molx Contents
Successfully extracted cytochromes.molx containing:
- state.json (229KB) - Complete Molstar plugin state with transformation tree
- assets.json - Metadata for 18 binary assets
- assets/ directory - 18 binary structure files (bcif format)

### Data Sources
Nine P-450 cytochrome structures from PDBe:
1. **2H7S** - CYP2C8 (reference structure, no transformation)
2. **2RFC** - CYP2C9
3. **2L8M** - CYP2C19
4. **3WRK** - CYP2D6
5. **2LQD** - CYP2E1
6. **3FWG** - CYP3A4
7. **6WE6** - CYP3A5
8. **1K2O** - CYP2A6
9. **6OOX** - CYP1A2

All structures downloaded from PDBe:
- Source: `https://www.ebi.ac.uk/pdbe/entry-files/download/{pdb_id}.bcif`

### Transformers Found
Each structure follows the same transformation pipeline:
- `ms-plugin.download` → Download bcif from PDBe
- `ms-plugin.parse-cif` → Parse bcif format
- `ms-plugin.trajectory-from-mmcif` → Extract trajectory
- `ms-plugin.model-from-trajectory` → Create model
- `ms-plugin.structure-from-model` → Build structure (assembly)
- `ms-plugin.transform-structure-conformation` → Apply superposition matrix
- `ms-plugin.structure-component` → Select polymer chains
- `ms-plugin.structure-representation-3d` → Cartoon representation

### Visual Elements
- **Representation**: Cartoon for all structures
- **Color scheme**: 
  - Structure 1 (2H7S): PDBe structure quality report coloring
  - Other structures: Solid colors (red, orange, yellow, green, blue, purple, magenta, pink)
  - Ligands: Element symbol coloring
- **Selection**: 
  - All polymer chains from each structure
  - Ligands shown as ball_and_stick for all structures
- **Superposition**: Transformation matrices extracted from state.json for structures 2-9

### Camera & Timing
- **Camera**: Perspective view from [50, 50, 50] looking at origin
- **Linger duration**: 10 seconds
- **Transition duration**: 1.5 seconds

### Builder API Mapping
Successfully mapped all transformers:
- `download()` with PDBe URLs
- `parse({ format: "bcif" })`
- `modelStructure({})` for assembly
- `transform({ rotation: [...], translation: [...] })` for superposition
- `component({ selector: { label_asym_id: 'A' } })` for chain selection
- `representation({ type: "cartoon" })`
- `color()` with custom validation coloring or hex colors

## Implementation Notes

### Component Selection
Uses `selector: "polymer"` to load all polymer chains from each structure, matching the original Molstar example. Ligands are added as separate components with `selector: "ligand"`.

This approach:
- Matches the original molx file structure
- Shows complete biological assemblies
- Includes important ligands and cofactors in the active sites
- Maintains visual fidelity to the original example

### Transformation Matrices
All transformation matrices were extracted directly from the original state.json file. These 4x4 matrices (stored as 3x3 rotation + 3D translation) align structures 2-9 to the reference structure (2H7S).

### Build Success
- JSON build: ✓ (with embedded local assets)
- HTML build: ✓ (1.1MB standalone file with ligands)

## Notes
This is a **Tier 2** example demonstrating:
- Multiple structure loading and superposition
- Transformation matrix application
- Validation data coloring
- Complex scene with 9 simultaneous structures
