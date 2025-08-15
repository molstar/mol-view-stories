# Getting Started with MolViewStories

Welcome to MolViewStories! This guide will help you create your first interactive molecular story in just a few minutes.

## Accessing MolViewStories

MolViewStories is a web-based application that runs in your browser. Simply visit: [https://stories.molstar.org](https://stories.molstar.org)

No downloads or installations required! MolViewStories works on any modern web browser including Chrome, Firefox, Safari, and Edge.

## Your First Look

When you open MolViewStories, you'll see the main landing page with:

- **Start Building** button - Jump directly into creating a new story
- **Example Stories** - Explore pre-made stories to see what's possible
- **Login** option - Sign in to save your work and access advanced features

## Creating Your First Story

### Step 1: Start Building

Click the **"Start Building"** button to open the Story Builder interface. You'll see several example templates to choose from:

- **Empty**: Start with a blank canvas
- **Basic**: Simple protein visualization example
- **Kinase**: Example showing enzyme structure
- **Comprehensive**: Advanced example with multiple scenes

For your first story, select **"Empty"** to start from scratch.

### Step 2: Understanding the Interface

The Story Builder consists of several key areas:

**Left Panel - Story Structure**
- Story metadata (title, description)
- List of scenes in your story
- Scene creation and management tools

**Center Panel - 3D Viewer**
- Interactive molecular visualization
- Real-time preview of your scenes

**Right Panel - Editor**
- Scene settings and options
- Code editor for advanced customizations
- Asset management

**Top Toolbar**
- File operations (save, load, export)
- Scene navigation
- Preview and sharing options

### Step 3: Load Your First Molecule

1. **Click "Add Scene"** in the left panel to create your first scene
2. **Name your scene** something descriptive like "Protein Overview"
3. **In the code editor**, you'll see a basic template. Replace it with:

```javascript
// Load a protein structure from the Protein Data Bank
const structure = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1cbs_updated.cif' })
  .parse({ format: 'mmcif' })
  .modelStructure({})
  .component({})
  .representation({})
  .color({ color: 'blue' });
```

4. **Click the play button** or **"Update Scene"** to load the molecule

You should now see a blue protein structure (Crambin, PDB ID: 1CBS) in the 3D viewer!

### Step 4: Add a Description

1. **Switch to the Markdown tab** in the right panel
2. **Add a description** for your scene:

```markdown
# My First Protein

This is **Crambin**, a small protein often used for testing crystallographic methods.

- Contains 46 amino acids
- First solved in 1981
- Shows typical protein secondary structure
```

### Step 5: Create a Second Scene

1. **Click "Add Scene"** again
2. **Name it** "Active Site Detail"
3. **Add this code**:

```javascript
// Same protein, but focused on a specific region
const structure = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1cbs_updated.cif' })
  .parse({ format: 'mmcif' })
  .modelStructure({});

// Show the whole protein in gray
structure.component({})
  .representation({})
  .color({ color: 'lightgray' });

// Highlight a specific residue in red
structure.component({ selector: { label_seq_id: 25 } })
  .representation({ type: 'ball_and_stick' })
  .color({ color: 'red' })
  .label({ text: 'Residue 25' })
  .focus({});
```

4. **Add a description** explaining what's highlighted

### Step 6: Preview Your Story

1. **Click the "Preview" button** in the top toolbar
2. **Navigate between scenes** using the arrow buttons
3. **See how your story flows** from overview to detail

## Saving Your Work

### For Guests (No Login)
- Use **"Export"** > **"Download Session"** to save a file to your computer
- Later, use **"Import Session"** to load it back

### For Registered Users
1. **Click "Login"** and sign in with your institutional credentials
2. **Click "Save"** to store your story in the cloud
3. **Access your stories** anytime from "My Stories"

## What's Next?

Congratulations! You've created your first molecular story. Here's what to explore next:

- **[Core Features](core-features.md)** - Learn about advanced visualization options
- **[Tips & Shortcuts](tips-shortcuts.md)** - Discover efficient workflows
- **Example Stories** - Study the pre-made examples for inspiration

## Common First Steps Issues

**Molecule doesn't load?**
- Check that the PDB ID exists (try searching on [rcsb.org](https://www.rcsb.org))
- Ensure your internet connection is stable
- Try a different example PDB ID like "1tqn" or "4hhb"

**Code editor seems intimidating?**
- Start with the visual tools and example templates
- Copy and modify existing examples rather than writing from scratch
- The code editor provides auto-completion to help you

**3D viewer is blank?**
- Make sure you clicked "Update Scene" after entering code
- Check the browser console for error messages (F12 key)
- Try refreshing the page and starting over

Remember: Every molecular story starts with a single scene. Don't worry about creating something perfect on your first try - experiment, explore, and have fun bringing molecules to life!