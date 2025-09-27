# MVS CLI - Molecular Visualization Stories

A command-line tool for creating and managing MolViewPack molecular visualization stories.

## Quick Start

```bash
# Install
git clone https://github.com/molstar/mol-view-stories.git
cd mol-view-stories/cli
deno task build

# Create a new story
./mvs create my-protein-story

# Build to various formats
./mvs build my-protein-story -o story.json      # JSON format
./mvs build my-protein-story -o story.mvstory   # Container format
./mvs build my-protein-story -o story.html      # Standalone HTML

# Watch and serve with live reload
./mvs watch my-protein-story
```

## Commands

- **`create <name>`** - Create new story folder structure
- **`build <folder>`** - Build story to JSON/MVStory/HTML formats
- **`watch <folder>`** - Serve story with live reload
- **`watch template`** - Create and serve a temporary example story

## Examples

### Serve Example Stories

The CLI includes two complete example stories that you can immediately serve:

```bash
# Serve the Exosome story (5 scenes, 3D molecular structures)
./mvs watch examples/exosome

# Serve the Terms of Entrapment story (14 scenes, superoxide dismutase)
./mvs watch examples/terms-of-entrapment

# Create and serve a temporary template
./mvs watch template
```

**Note**: You may see MVS validation warnings in the browser console like "Invalid MVS tree" - these are non-critical and don't affect story functionality. The stories will still load and display correctly.

### Build Example Stories

```bash
# Build examples to different formats
./mvs build examples/exosome -o exosome.html
./mvs build examples/exosome -o exosome.mvstory
./mvs build examples/terms-of-entrapment -o sod.json
```

### Create Your Own Story

```bash
# Create new story
./mvs create my-story
cd my-story

# Add your molecular files to assets/
cp ~/structures/*.pdb assets/

# Edit configurations
nano story.yaml                    # Story metadata
nano scenes/scene1/scene1.yaml     # Scene settings
nano scenes/scene1/scene1.md       # Scene description
nano scenes/scene1/scene1.js       # Scene JavaScript

# Serve with live reload during development
../mvs watch .

# Build final version
../mvs build . -o my-story.mvstory
```

## Story Structure

```
my-story/
├── story.yaml          # Story metadata
├── story.js           # Global JavaScript
├── scenes/
│   ├── scene1/
│   │   ├── scene1.yaml # Scene configuration
│   │   ├── scene1.md   # Scene description
│   │   └── scene1.js   # Scene JavaScript
│   └── scene2/
│       ├── scene2.yaml
│       ├── scene2.md
│       └── scene2.js
└── assets/            # Molecular structures (PDB, CIF, etc.)
```

## Output Formats

- **JSON** (`-f json`) - Human-readable story data
- **MVStory** (`-f mvstory`) - Binary container format
- **HTML** (`-f html`) - Standalone web page
- **MVSX** (`-f mvsx`) - Mol* viewer format

## Troubleshooting

**MVS Validation Warnings**: The browser console may show warnings like "Invalid MVS tree" when loading complex molecular stories. These are validation notices from the Mol* viewer and don't prevent the story from working. Look for "✅ MVSX/MVSJ Story loaded successfully!" to confirm the story loaded properly.

## Requirements

- [Deno](https://deno.land/) 1.40+

## License

MIT License