# Getting Started with MolViewStories

Welcome to MolViewStories! This guide will help you create your first interactive molecular story in just a few minutes.

## Accessing MolViewStories

MolViewStories is a web-based application that runs in your browser. Simply visit: [https://molstar.org/mol-view-stories](https://molstar.org/mol-view-stories)

No downloads or installations required! MolViewStories works on any modern web browser including Chrome, Firefox, Safari, and Edge.

## Your First Look

When you open MolViewStories, you'll see the main landing page with:

- **Start Building** button - Jump directly into creating a new story
- **Example Stories** - Explore pre-made stories to see what's possible
- **Login** option - Sign in to save your work and access publishing functionality

## Creating Your First Story

### Step 1: Start Building

Click the **"Start Building"** button to open the Story Builder interface.

### Step 2: Understanding the Interface

The Story Builder consists of several key areas:

**Story Section**
- Story title and other metadata
- Story-wide code
- Assets with local files

**Scene Section**
- Allows building of individual scenes

**Story Preview**
- Preview what you've build

### Step 3: Create Your 1st Scene

1. **Click "1 scene -> New Scene"** to navigate to the scene editor
2. **In the code editor**, enter:

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

3. **Press Ctrl/CMD + S** to see a blue molecule pop up in the 3D view

You should now see a blue protein structure (PDB ID: 1CBS) in the 3D viewer!

### Step 3: Add a Description

1. **Switch to the Scene Options tab** at the top of the page
2. **Name your scene** by editing the header
2. **Add a Markdown description** for your scene:

```markdown
# My First MolViewSpec Scene

A view of the [PDB ID 1cbs](https://www.ebi.ac.uk/pdbe/entry/pdb/1cbs) molecule
```

### Step 4: Create a Second Scene

1. **Click "Scene -> Add New Scene"** at the top of the page
2. **Switch to the 3D View**
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

// Add a ligand
structure.component({ selector: 'ligand' })
  .representation({ type: 'ball_and_stick' })
  .color({ color: 'red' }) 
```

4. **Position the camera** by interacting with the 3D to make ligand visible in a way you want

5. **Save the camera position** by clicking on "Camera -> Save Position" in top left

6. **Add a description** explaining what's highlighted similar to the previous step

### Step 6: Preview Your Story

1. **Click the "Preview" button** in the top toolbar
2. **Navigate between scenes** using the arrow buttons
3. **See how your story flows** from overview to detail

## Saving Your Work

### For Guests (No Login)
- Use **"Story"** > **"Download Session"** to save a file to your computer in the top right part of the page
  - Later, use **"Import Session"** to load it back
- Use **"Export MolViewSpec State"** to get a file openable in the Mol* Viewer
- Use **"Export HTML"** to create a standalone HTML file openable in any web browser. You can host this file yourself.

### For Registered Users
1. **Click "Login"** and sign in with your (institutional) credentials
2. **Click "Save Session"** to store your story in the cloud
  - **Access your stories** anytime from "My Stories"
3. **Click "Publish"** to make your story available online for anyone to see

## What's Next?

Congratulations! You've created your first molecular story. Here's what to explore next:

- **[MolViewSpec](https://molstar.org)** - Visit MolViewSpec to learn more about the underlying technology that powers MolViewStories
- **[Core Features](core-features.md)** - Learn about advanced visualization options
- **[Tips & Shortcuts](tips-shortcuts.md)** - Discover efficient workflows
- **Example Stories** - Study the pre-made examples for inspiration

## Common First Steps Issues

**Molecule doesn't load?**
- Check that the PDB ID exists (try searching on [rcsb.org](https://www.rcsb.org) or [pdbe.org](https://pdbe.org))
- Ensure your internet connection is stable
- Try a different example PDB ID like "1tqn" or "4hhb"

**Code editor seems intimidating?**
- Copy and modify existing examples rather than writing from scratch
- The code editor provides auto-completion to help you (Press "Ctrl+Space" to bring it up at any time)

**3D viewer is blank?**
- Make sure you saved the scene after entering code
- Check the browser console for error messages (F12 key)
- Try refreshing the page and starting over

Remember: Every molecular story starts with a single scene. Don't worry about creating something perfect on your first try - experiment, explore, and have fun bringing molecules to life!