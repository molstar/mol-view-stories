# MolViewSpec Basics

A comprehensive collection of examples demonstrating core MolViewSpec builder API features. This single-file story includes 8 scenes covering fundamental operations from simple structure loading to advanced features like annotations, transforms, and volumetric data visualization.

## Overview

This example uses the inline scene format where all scenes are defined directly in `story.yaml`, making it easy to understand and modify without managing multiple files.

## Scenes

### 1. Basic Structure
The simplest example: download a structure (1cbs), parse it, and display it with a single color.

**Key concepts:**
- `download()` - Load structure from URL
- `parse()` - Parse mmCIF format
- `modelStructure()` - Create model structure
- `component()` - Select components
- `representation()` - Add visual representation
- `color()` - Apply colors

### 2. Residue Coloring & Labeling
Demonstrates selective coloring and custom labels for specific residues (ALA 120 in chain A of 1lap).

**Key concepts:**
- Selector-based coloring
- Custom labels
- Camera focus on specific components

### 3. Assembly with Multiple Components
Shows how to work with biological assemblies (PheRS - 1c0a) with multiple component types.

**Key concepts:**
- `assemblyStructure()` - Use biological assembly
- Selector strings: "protein", "nucleic", "ligand"
- Multiple representation types (cartoon, ball-and-stick)
- Component-specific coloring and labeling

### 4. Multiple Structures with Transforms
Load multiple structures into the same scene and apply transformations to align them (deoxy vs oxy hemoglobin).

**Key concepts:**
- Loading multiple structures
- `transform()` - Apply rotation and translation matrices
- Structural alignment

### 5. Symmetry Structure
Generate symmetry mates to visualize crystal packing (1tqn with 3×3×3 unit cells).

**Key concepts:**
- `symmetryStructure()` - Generate crystal symmetry
- `ijkMin` / `ijkMax` - Define unit cell range

### 6. Annotations from URI
Load component definitions, colors, labels, and tooltips from external annotation files (1h9t example).

**Key concepts:**
- `componentFromUri()` - Define selections from external file
- `colorFromUri()` - Apply color schemes from external file
- `labelFromUri()` - Add labels from external file
- `tooltipFromUri()` - Add tooltips from external file
- Using mmCIF annotation format
- Snake_case parameter naming (e.g., `block_header`, `category_name`, `field_name`, `field_values`)

### 7. Geometric Primitives
Create custom geometric shapes for annotations and visualizations.

**Key concepts:**
- `primitives()` - Create primitive shapes
- `ellipse()` - 2D arcs in 3D space
- `arrow()` - Directional indicators
- `ellipsoid()` - 3D elliptical solids
- Custom tooltips and colors

### 8. Volume Data (Electron Density)
Visualize volumetric data like electron density maps using the PDBe Volume Server (1tqn with density maps).

**Key concepts:**
- Loading volume data from density servers
- `volume()` - Select volume channels
- `isosurface()` representation type
- Multiple isovalues (2Fo-Fc, Fo-Fc positive/negative)
- Wireframe and surface rendering
- Opacity control

## Building

Build the story in various formats:

```bash
# JSON format
./mvs build examples/molspec-basics -f json -o examples/molspec-basics/molspec-basics.json

# MVStory format
./mvs build examples/molspec-basics -f mvstory -o examples/molspec-basics/molspec-basics.mvstory

# Standalone HTML
./mvs build examples/molspec-basics -f html -o examples/molspec-basics/molspec-basics.html

# MVSX format
./mvs build examples/molspec-basics -f mvsx -o examples/molspec-basics/molspec-basics.mvsx
```

## Watching/Serving

Watch and serve with live reload during development:

```bash
./mvs watch examples/molspec-basics
```

Then open http://localhost:8080 in your browser.

## File Structure

```
molspec-basics/
├── story.yaml              # Main story definition with all 8 inline scenes
├── molspec-basics.json     # Built JSON output
├── molspec-basics.mvstory  # Built MVStory output
├── molspec-basics.html     # Built standalone HTML
└── README.md               # This file
```

## API Patterns

This example demonstrates common API patterns:

### Chaining Pattern
```javascript
const structure = builder
  .download({ url: "..." })
  .parse({ format: "mmcif" })
  .modelStructure({});

const comp = structure.component({});
const repr = comp.representation({});
repr.color({ color: "blue" });
```

### Component Selection
```javascript
// By selector string
structure.component({ selector: "protein" })
structure.component({ selector: "nucleic" })
structure.component({ selector: "ligand" })

// By specific residue
structure.component({
  selector: { label_asym_id: "A", label_seq_id: 120 }
})

// Multiple components
structure.component({
  selector: [
    { label_asym_id: "A" },
    { label_asym_id: "B", label_seq_id: 217 }
  ]
})
```

### Representation Types
- `cartoon` - Protein secondary structure
- `ball_and_stick` - Atomic detail
- `surface` - Molecular surface
- `isosurface` - Volumetric data

## Related Examples

- **simple-inline** - Minimal inline story example
- **motm-01** - Complex multi-scene story with folder structure
- **tbp** - Story with scene ordering
- **terms-of-entrapment** - Advanced story features

## Resources

- [MolViewSpec Documentation](https://molstar.org/mol-view-spec/)
- [PDBe Entry Files](https://www.ebi.ac.uk/pdbe/)
- [PDBe Volume Server](https://www.ebi.ac.uk/pdbe/volume-server/)
