# Core Features

MolViewStories provides a comprehensive set of tools for creating interactive molecular visualizations. This guide covers the main features you'll use to build compelling molecular stories.

For all supported features, check [MolViewSpec](https://molstar.org/mol-view-spec) and its documentation.

## Story Structure

### Stories and Scenes

**Stories** are your complete molecular narratives, composed of multiple **scenes**. Think of:
- **Story** = A research paper or presentation
- **Scene** = Individual figures or slides within that story

Each scene can show different molecules, different views of the same molecule, or different aspects of a molecular process.

### Story Metadata

Every story has basic information:
- **Title**: Clear, descriptive name
- **Description**: Brief summary of what the story covers
- **Tags**: Keywords for organization and searching

## Working with Molecular Structures

### Loading Structures

**From Protein Data Bank (PDB)**
```javascript
const structure = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1cbs_updated.cif' })
  .parse({ format: 'mmcif' })
  .modelStructure({});
```

**From AlphaFold Database**
```javascript
const structure = builder
  .download({ url: 'https://alphafold.ebi.ac.uk/files/AF-P42212-F1-model_v4.cif' })
  .parse({ format: 'mmcif' })
  .modelStructure({});
```

**Upload Your Own Files**
- Use the "Assets" menu to upload .pdb, .cif, .mol, or any other supported file formats
- Reference uploaded files in your scenes

### Representations

**Cartoon (Secondary Structure)**
```javascript
structure.component({})
  .representation({ type: 'cartoon' })
  .color({ color: 'blue' });
```

**Ball-and-Stick (Atomic Detail)**
```javascript
structure.component({})
  .representation({ type: 'ball_and_stick' })
  .color({ color: 'red' });
```

**Surface (Molecular Surface)**
```javascript
structure.component({})
  .representation({ type: 'surface' })
  .color({ color: 'green' });
```

**Spacefill (van der Waals)**
```javascript
structure.component({})
  .representation({ type: 'spacefill' })
  .color({ color: 'orange' });
```

## Selection and Components

### Selecting Parts of Molecules

**By Chain**
```javascript
structure.component({ selector: { label_asym_id: 'A' } })
```

**By Residue Number**
```javascript
structure.component({ selector: { label_seq_id: 100 } })
```

**By Atom Type**
```javascript
structure.component({ selector: 'protein' })  // All protein atoms
structure.component({ selector: 'nucleic' })  // DNA/RNA
structure.component({ selector: 'ligand' })   // Small molecules
```

## Coloring Options

### Simple Colors
```javascript
.color({ color: 'red' })
.color({ color: '#ff0000' })  // Hex colors
```


## Camera and Focus

### Focusing on Specific Regions
```javascript
// Focus on a specific residue
structure.component({ selector: { label_seq_id: 100 } })
  .focus({});

// Custom camera position
structure.component({})
  .focus({
    up: [0, 1, 0],
    direction: [10, 10, 10],
    radius: 20
  });
```

### Camera Positioning Tips
- **radius**: Distance from the molecule (smaller = closer)
- **direction**: Where the camera points
- **up**: Which direction is "up" in the view

## Labels and Annotations

### Adding Labels
```javascript
structure.component({ selector: { label_seq_id: 100 } })
  .label({ text: 'Active Site Residue' });

// Custom label positioning
structure.component({ selector: { label_seq_id: 100 } })
  .label({ 
    text: 'Important Region',
    offset: [0, 2, 0]  // Move label up
  });
```

### Tooltips
```javascript
structure.component({ selector: 'ligand' })
  .tooltip({ text: 'ATP binding site' });
```

## Advanced Features

### Structural Superposition

Overlay multiple structures for comparison:
```javascript
// First structure (reference)
builder.download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/4hhb_updated.cif' })
  .parse({ format: 'mmcif' })
  .modelStructure({})
  .component({})
  .representation({})
  .color({ color: 'red' });

// Second structure with transformation
builder.download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1oj6_updated.cif' })
  .parse({ format: 'mmcif' })
  .modelStructure({})
  .transform({
    rotation: [-0.72, -0.33, -0.61, 0.36, 0.57, -0.74, 0.59, -0.75, -0.29],
    translation: [-12.54, 46.79, 94.50]
  })
  .component({})
  .representation({})
  .color({ color: 'blue' });
```

### Volume Data (Electron Density)

Display experimental electron density maps:
```javascript
// Load structure
const structure = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1tqn_updated.cif' })
  .parse({ format: 'mmcif' })
  .modelStructure({});

// Load electron density
const volume = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/densities/x-ray/1tqn/box/-22,-33,-21/-7,-10,-0?detail=3' })
  .parse({ format: 'bcif' });

// Show density as mesh
volume.volume({ channel_id: '2FO-FC' })
  .representation({ type: 'isosurface', relative_isovalue: 1.5 })
  .color({ color: 'blue' })
  .opacity({ opacity: 0.3 });
```

### Geometric Primitives

Add arrows, shapes, and other annotations:
```javascript
builder.primitives({ opacity: 0.8 })
  .arrow({
    start: [0, 0, 0],
    end: [5, 5, 5],
    color: 'yellow',
    tooltip: 'Direction of motion'
  })
  .ellipse({
    center: [10, 10, 10],
    major_axis: [2, 0, 0],
    minor_axis: [0, 2, 0],
    color: 'red',
    tooltip: 'Important region'
  });
```

## File Operations

### Saving Your Work

**Save as Session (Private)**
- Click "Story -> Save Session" button
- Add optional notes
- Accessible only to you
- Stored in "My Stories"

**Publish as Story (Public)**
- Click "Publish" button
- Add title, description, and tags
- Creates shareable public link
- Searchable by others

### Export Options

**Download Session File**
- Complete project file
- Can be imported later
- Includes all assets and scenes

**Export HTML**
- Standalone web page
- No internet required to view
- Perfect for presentations

**Share Link**
- Direct URL to your published story
- Works in any browser
- Easy to share via email or social media

## Working with Assets

### Uploading Files
1. Click "Assets" in the top menu
2. Click "Upload" or drag-and-drop files
3. Supported formats: anything MolViewSpec supports

### Using Uploaded Assets
```javascript
// Reference uploaded file
const structure = builder
  .download({ url: 'my-protein.pdb' })
  .parse({ format: 'pdb' })
  .modelStructure({});
```

### File Size Limits
- Maximum file size: 50 MB per session
- Total storage: 100 sessions and published stories
- Clean up unused sessions regularly

## Best Practices

### Scene Organization
- **One concept per scene**: Don't try to show everything at once
- **Logical progression**: Build from overview to detail
- **Clear transitions**: Make connections between scenes obvious

### Performance
- **Limit complexity**: Too many representations can slow down rendering
- **Use appropriate detail**: Cartoon for overview, ball-and-stick for detail
- **Test on different devices**: Ensure your stories work on various computers

### Accessibility
- **Descriptive labels**: Help viewers understand what they're seeing
- **Clear descriptions**: Explain the biological significance
- **Color considerations**: Some users may have color vision differences

Remember: The goal is to tell a clear, compelling story about molecular structure and function. Focus on the key message you want to convey, and use these technical features to support that narrative.