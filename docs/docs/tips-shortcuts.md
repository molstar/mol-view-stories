# Tips & Shortcuts

Master MolViewStories with these helpful tips, efficient workflows, and best practices. Whether you're a beginner or experienced user, these insights will help you create better molecular stories faster.

## Workflow Tips

### Planning Your Story

**Start with a Storyboard**
- Sketch out your main points on paper first
- Identify 3-5 key scenes that tell your story
- Plan the progression from overview to detail
- Consider your audience's background knowledge

**Choose Your Starting Point**
- **Template stories**: Great for learning and adaptation
- **Example modifications**: Faster than starting from scratch  
- **Blank canvas**: When you have a specific, unique vision

### Building Efficiently

**Use the Scene List Strategically**
- Name scenes descriptively ("Overview", "Active Site", "Conformational Change")
- Reorder scenes by dragging them in the left panel
- Duplicate similar scenes and modify rather than starting over
- Delete unused scenes to keep your project clean

**Copy and Modify Approach**
```javascript
// Start with a working example, then customize
const structure = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1cbs_updated.cif' })
  .parse({ format: 'mmcif' })
  .modelStructure({});

// Base representation
structure.component({}).representation({}).color({ color: 'lightgray' });

// Then add specific highlights
structure.component({ selector: { label_seq_id: 25 } })
  .representation({ type: 'ball_and_stick' })
  .color({ color: 'red' });
```

## Code Editor Shortcuts

### Auto-completion and Help

- **Ctrl+Space**: Trigger auto-completion suggestions
- **Hover over methods**: See parameter documentation
- **Ctrl+/**: Comment/uncomment lines

### Common Code Patterns

**Quick Structure Loading**
```javascript
// Save typing with variables
const pdbUrl = 'https://www.ebi.ac.uk/pdbe/entry-files/download/';
const structure = builder
  .download({ url: pdbUrl + '1cbs_updated.cif' })
  .parse({ format: 'mmcif' })
  .modelStructure({});
```

**Reusable Selections**
```javascript
// Define selections once, use multiple times
const activesite = { label_seq_id: [50, 55, 78, 102] };
const protein = structure.component({ selector: 'protein' });

protein.representation({}).color({ color: 'lightblue' });
structure.component({ selector: activesite })
  .representation({ type: 'ball_and_stick' })
  .color({ color: 'red' });
```

**Color Palettes**
```javascript
// Define a consistent color scheme
const colors = {
  protein: '#4A90E2',
  dna: '#F5A623',
  ligand: '#7ED321',
  highlight: '#D0021B'
};

structure.component({ selector: 'protein' })
  .color({ color: colors.protein });
```

## Visual Design Best Practices

### Color Strategy

**Use Meaningful Colors**
- Blue/cyan for proteins (traditional)
- Orange/yellow for nucleic acids
- Green for ligands/small molecules
- Red for highlights and important regions

**Maintain Consistency**
- Use the same colors for similar elements across scenes
- Create a color legend in your descriptions
- Consider colorblind-friendly palettes

**Contrast and Visibility**
```javascript
// Good contrast example
structure.component({ selector: 'protein' })
  .color({ color: 'lightgray' });  // Subtle background
  
structure.component({ selector: { label_seq_id: 100 } })
  .color({ color: 'red' });  // Strong highlight
```

### Camera Work

**Smooth Transitions**
- Plan camera movements between scenes
- Use gradual zooms rather than jarring jumps
- Focus on the most important elements

**Consistent Orientation**
```javascript
// Keep similar orientations for related scenes
const camera = {
  up: [0, 1, 0],
  position: [10, 10, 10],
  target: [2, 2, 2]
};

builder.camera(camera);
```

## Asset Management

### File Organization

**Naming Conventions**
- Use descriptive filenames: `kinase_apo.pdb`, `kinase_inhibitor_complex.pdb`
- Group related files with prefixes: `exp1_protein.pdb`, `exp1_ligand.pdb`

**Storage Strategy**
- Upload frequently used structures as assets
- Keep file sizes reasonable (under 10MB when possible)
- Clean up unused assets regularly
- Export important stories as backups locally

### Working with Large Files

**Optimization Techniques**
- Remove water molecules if not needed
- Use biological assemblies only when necessary
- Consider cartoon representations for large complexes
- Split complex stories into multiple smaller ones

## Collaboration and Sharing

### Version Control

**Track Changes**
- Export session files before major changes
- Use "Save As New" to create branches
- Document what changed in scene descriptions

**Sharing Strategies**
- **Private sessions**: For work in progress
- **Published stories**: For final, polished content
- **Exported HTML**: For offline presentations
- **Direct links**: For quick sharing with colleagues

### Working with Others

**Consistent Styles**
- Agree on color schemes and representation styles
- Use similar camera angles and orientations
- Standardize labeling and annotation approaches
- Share asset libraries for common structures

## Performance Optimization

### Faster Loading

**Efficient Code Structure**
```javascript
// Load structure once, create multiple components
const structure = builder
  .download({ url: 'your-structure-url' })
  .parse({ format: 'mmcif' })
  .modelStructure({});

// Multiple representations of the same structure
const protein = structure.component({ selector: 'protein' });
const ligand = structure.component({ selector: 'ligand' });
```

**Minimize Downloads**
- Reuse structures across scenes when possible
- Upload frequently used files as assets
- Use smaller PDB entries for examples and testing

### Smooth Rendering

**Representation Choices**
- Cartoon for large proteins
- Ball-and-stick for small molecules and active sites
- Surface sparingly (computationally expensive)
- Spacefill only for specific purposes

**Scene Complexity**
- Limit the number of representations per scene
- Use LOD (Level of Detail) - simpler representations for distant objects
- Consider splitting complex scenes into multiple simpler ones

## Common Shortcuts and Tricks

### Navigation
- **Mouse wheel**: Zoom in/out
- **Left drag**: Rotate view
- **Right drag**: Pan view
- **Double-click**: Center on clicked atom
- **R key**: Reset camera view

### Interface Tips
- **Tab between panels**: Quickly switch between code/markdown editors
- **Ctrl+Enter in editor**: Update scene without clicking button
- **Scene thumbnails**: Click to preview without updating
- **Drag scenes**: Reorder in left panel

### Code Snippets

**Quick Testing**
```javascript
// Fast way to test if a structure loads
builder.download({ url: 'YOUR_URL' }).parse({ format: 'mmcif' });
```

**Debug Information**
```javascript
// Check what's in your structure
console.log(structure);  // View in browser console (F12)
```

**Template for New Scenes**
```javascript
// Basic template to copy and modify
const structure = builder
  .download({ url: 'STRUCTURE_URL' })
  .parse({ format: 'FORMAT' })
  .modelStructure({});

structure.component({ selector: 'SELECTION' })
  .representation({ type: 'TYPE' })
  .color({ color: 'COLOR' });
```

## Troubleshooting Quick Fixes

### When Things Don't Work

**Structure won't load**
1. Check the URL in a browser
2. Verify the file format
3. Try a known working PDB ID
4. Check browser console for errors

**Scene appears empty**
1. Click "Update Scene" or press "Ctrl/CMD + S ""
2. Check for JavaScript errors in console
3. Verify your selectors match actual residues
4. Try a simpler representation first

**Performance issues**
1. Reduce scene complexity
2. Use simpler representations
3. Check for infinite loops in code
4. Close other browser tabs

### Quick Debugging
```javascript
// Add these lines to see what's happening
console.log('Structure loaded:', structure);
console.log('Component created:', component);
```

Remember: The best molecular stories combine technical excellence with clear communication. Use these tips to work more efficiently, but always keep your audience and message in mind!