# MVS CLI - MolViewPack Story Creator

A command-line tool for creating and managing MolViewPack molecular visualization stories. This tool helps you create structured folder hierarchies with YAML configurations for molecular stories and build them into JSON StoryContainer format.

## Installation

### Method 1: Install from Source (Recommended)

```bash
git clone git@github.com:molstar/mol-view-stories.git
cd cli
deno task build
deno install --global --allow-read --allow-write --allow-env --allow-net --allow-scripts --config deno.json -f -n mvs main.ts
```

### Method 2: Run Directly with Deno

```bash
git clone  git@github.com:molstar/mol-view-stories.git
cd cli
deno run --allow-read --allow-write --allow-env --allow-net main.ts [command] [options]
```

### Verify Installation

```bash
mvs --version
mvs --help
```

## Features

- 🚀 **Create Story Structure**: Generate complete folder structure with 2 sample scenes
- 📦 **Build StoryContainer**: Parse folder structure and output in multiple formats (JSON, MVSX, MVStory)
- 🧬 **Molecular Structure Support**: Handles PDB, MOL2, SDF, CIF, and other formats
- 📝 **YAML Configuration**: Human-readable YAML configs for stories and scenes
- 📊 **Multiple Export Formats**: JSON, MVSX (binary with assets), and MVStory formats
- 📤 **Flexible Output**: Output to stdout or save to file with format control
- 🎯 **Template System**: Pre-configured templates with sensible defaults

## Usage

### Create a New Story

```bash
mvs create my-protein-story
```

This creates a complete folder structure:

```
my-protein-story/
├── story.yaml              # Main story configuration
├── README.md               # Story documentation
├── scenes/                 # Scene configurations
│   ├── scene1/
│   │   ├── config.yaml     # Scene 1 configuration
│   │   ├── structure.pdb   # Molecular structure file
│   │   └── annotations.md  # Scene description/notes
│   └── scene2/
│       ├── config.yaml     # Scene 2 configuration
│       ├── structure.pdb   # Molecular structure file
│       └── annotations.md  # Scene description/notes
└── assets/                 # Shared resources
    └── common-structures/  # Shared molecular files
```

### Build StoryContainer

Output StoryContainer JSON to stdout:

```bash
mvs build my-protein-story
```

Save StoryContainer to file with format auto-detection:

```bash
mvs build my-protein-story --output story.json
mvs build my-protein-story -o story.json
```

Export with explicit format options:

```bash
# Force JSON format
mvs build my-protein-story --format json -o story.json

# Force MVSX format (binary with assets)
mvs build my-protein-story --format mvsx -o story.mvsx

# Force MVStory format
mvs build my-protein-story --format mvstory -o story.mvstory
```

### Help and Version

```bash
mvs --help     # Show help
mvs --version  # Show version
```

## File Structure & Export Formats

The MVS CLI uses **YAML configuration files** for easy editing and supports **multiple output formats** for the final StoryContainer that can be consumed by MolViewPack.

### Export Formats

- **JSON** (`.json`) - Human-readable StoryContainer format, default output
- **MVSX** (`.mvsx`) - Binary format with embedded molecular assets (ZIP-based)
- **MVStory** (`.mvstory`) - MolViewPack story format for direct loading

### Story Configuration (`story.yaml`)

Main story metadata and settings:

```yaml
metadata:
  title: "My Protein Story"
  description: "A molecular visualization story"
  author: "Your Name"
  version: "1.0.0"
  created: "2025-01-01"
  tags:
    - "molecular-visualization"
    - "protein"

settings:
  autoPlay: false
  loopStory: false
  showControls: true
  backgroundColor: "#000000"

assets:
  commonStructures: []
  images: []
  other: []
```

### Scene Configuration (`scenes/*/config.yaml`)

Individual scene settings:

```yaml
name: "Initial View"
description: "Overview of the molecular structure"
duration: 5.0 # seconds

# Camera configuration
camera:
  position: [0, 0, 50]
  target: [0, 0, 0]
  up: [0, 1, 0]
  fov: 45

# Molecular representations
representations:
  - type: "cartoon"
    selection: "all"
    color: "chainname"
    opacity: 1.0
    visible: true

# Text annotations
annotations:
  - text: "Key structural elements"
    position: [0, 0, 0]
    style:
      fontSize: 16
      color: "#ffffff"
      backgroundColor: "rgba(0, 0, 0, 0.7)"

# Transition to next scene
transition:
  type: "fade"
  duration: 1.0
  easing: "ease-in-out"

# Structure files for this scene
structures:
  - "structure.pdb"
```

## Architecture

- **Input**: YAML configuration files (human-readable, easy to edit)
- **Output**: JSON StoryContainer (machine-readable, MolViewPack compatible)
- **File I/O**: Molecular structure files handled by Molstar

## Supported File Formats

### Molecular Structures

- **PDB** (`.pdb`) - Protein Data Bank format
- **MOL2** (`.mol2`) - Tripos MOL2 format
- **SDF** (`.sdf`) - Structure Data Format
- **MOL** (`.mol`) - MDL Molfile format
- **XYZ** (`.xyz`) - XYZ coordinate format
- **CIF** (`.cif`) - Crystallographic Information File

### Configuration & Output

- **YAML** (`.yaml`, `.yml`) - Input configuration files (story.yaml, config.yaml)
- **JSON** (`.json`) - Output StoryContainer format
- **Markdown** (`.md`) - Annotations and documentation

## Examples

### Exported Example Files

The repository includes pre-built example files in all supported formats:

**Complex Example** (`examples/localfile/`) - *With molecular assets*:
- **`examples/localfile.json`** - JSON format StoryContainer (50.9KB)
- **`examples/localfile.mvsx`** - MVSX format with embedded assets (50.9KB)
- **`examples/localfile.mvstory`** - MVStory format for direct loading (50.9KB)

**Simple Example** (`examples/simple/`) - *Configuration only*:
- **`examples/simple.json`** - JSON format StoryContainer (631 bytes)
- **`examples/simple.mvsx`** - MVSX format (631 bytes)
- **`examples/simple.mvstory`** - MVStory format (631 bytes)

These demonstrate the different export formats available and can be used for testing with MolViewPack viewers.

### Basic Workflow

1. **Create a new story:**
   ```bash
   mvs create protein-folding-demo
   cd protein-folding-demo
   ```

2. **Add your molecular structures:**
   ```bash
   # Replace placeholder files with real structures
   cp ~/data/folded.pdb scenes/scene1/structure.pdb
   cp ~/data/unfolded.pdb scenes/scene2/structure.pdb
   ```

3. **Edit configurations:**
   ```bash
   # Edit story metadata
   nano story.yaml

   # Edit scene configurations
   nano scenes/scene1/config.yaml
   nano scenes/scene2/config.yaml
   ```

4. **Build the StoryContainer:**
   ```bash
   # Export as JSON (default)
   mvs build . -o folding-story.json

   # Export as MVSX with embedded assets
   mvs build . --format mvsx -o folding-story.mvsx

   # Export as MVStory for direct loading
   mvs build . --format mvstory -o folding-story.mvstory
   ```

5. **Test with included examples:**
   ```bash
   # Export the complex example (with assets) in different formats
   mvs build examples/localfile --format json -o my-complex.json
   mvs build examples/localfile --format mvsx -o my-complex.mvsx
   mvs build examples/localfile --format mvstory -o my-complex.mvstory

   # Export the simple example (configuration only)
   mvs build examples/simple --format json -o my-simple.json
   mvs build examples/simple --format mvsx -o my-simple.mvsx
   mvs build examples/simple --format mvstory -o my-simple.mvstory
   ```

### Advanced Scene Configuration

```yaml
name: "Active Site Detail"
description: "Zoom into the enzyme active site"
duration: 8.0

camera:
  position: [15, 10, 25]
  target: [0, 0, 0]
  up: [0, 1, 0]
  fov: 30

representations:
  - type: "cartoon"
    selection: "protein"
    color: "secondary_structure"
    opacity: 0.8
    visible: true
  - type: "ball-and-stick"
    selection: "ligand"
    color: "element"
    opacity: 1.0
    visible: true
  - type: "surface"
    selection: "resn ASP or resn GLU"
    color: "#ff4444"
    opacity: 0.6
    visible: true

annotations:
  - text: "Catalytic Triad"
    position: [2.1, -1.5, 0.8]
    style:
      fontSize: 14
      color: "#ffff00"
  - text: "Substrate Binding Site"
    position: [-1.2, 3.4, 1.1]
    style:
      fontSize: 12
      color: "#00ff00"

transition:
  type: "zoom"
  duration: 2.0
  easing: "ease-in-out"
```

## Development

### Requirements

- Deno 1.40+

### Development Workflow

```bash
# Install dependencies and run
deno task dev

# Format code
deno fmt

# Lint code
deno lint

# Type check
deno check main.ts

# Build binary
deno task build
```

### Project Structure

```
mvs-cli/
├── main.ts                 # CLI entry point
├── deno.json              # Deno configuration
├── src/
│   ├── commands/          # Command implementations
│   │   ├── create.ts      # create command
│   │   └── build.ts       # build command
│   ├── types/             # Type definitions
│   │   └── story.ts       # StoryContainer types
│   └── templates/         # YAML templates
│       └── story.ts       # Template strings
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Related Projects

- [Molstar](https://molstar.org/) - Modern web-based molecular viewer
- [MolViewStory Types](https://jsr.io/@zachcp/molviewstory-types) - TypeScript types for stories

## Support

- 📖 [Documentation](https://github.com/zachcp/mvs-cli/wiki)
- 🐛 [Issues](https://github.com/zachcp/mvs-cli/issues)
- 💬 [Discussions](https://github.com/zachcp/mvs-cli/discussions)
