# CLI Tool

The MVS CLI is a command-line tool for creating, building, and serving molecular visualization stories. It provides an efficient workflow for developing interactive narratives with 3D molecular structures.

## Rationale

The CLI tool addresses several key needs in creating molecular visualization stories:

- **Simplified Authoring**: Provides a structured, file-based approach to creating stories without manually building complex JSON structures
- **Rapid Development**: Live reload and local serving capabilities enable quick iteration during story development
- **Multiple Output Formats**: Build stories to various formats (JSON, MVStory containers, standalone HTML, MVSX) for different deployment scenarios
- **Separation of Concerns**: Keeps configuration (YAML), narrative content (Markdown), and visualization logic (JavaScript) in separate, maintainable files
- **Template-Based Creation**: Generates complete story scaffolding with sensible defaults and working examples

## Commands

The CLI provides four main commands:

### `create <story-name>`

Creates a new story with scaffolding and template files.

```bash
# Create inline story (all scenes in story.yaml)
mvs create my-protein-story

# Create folder-based story (separate scene files)
mvs create my-protein-story --scenes-as-folders
```

**Options:**
- `--scenes-as-folders` - Creates a folder structure with separate files for each scene (YAML, Markdown, JavaScript)

### `build <folder-path>`

Builds a story from source files into various output formats.

```bash
# Output to stdout as JSON
mvs build ./my-story

# Save to specific file
mvs build ./my-story -o story.json

# Specify format explicitly
mvs build ./my-story -f mvstory -o story.mvstory
mvs build ./my-story -f html -o story.html
mvs build ./my-story -f mvsx -o story.mvsx
```

**Options:**
- `-o, --output <file>` - Output file path (defaults to stdout)
- `-f, --format <format>` - Output format: `json`, `mvsx`, `mvstory`, or `html`

**Output Formats:**
- **JSON** - Human-readable story data structure
- **MVStory** - Binary container format for efficient storage
- **HTML** - Standalone web page with embedded viewer
- **MVSX** - Mol* viewer format for direct loading

### `watch <folder-path>`

Serves a story locally with live reload during development. Watches for file changes and automatically rebuilds and reloads the story in your browser.

```bash
# Serve on default port (8080)
mvs watch ./my-story

# Serve on custom port
mvs watch ./my-story -p 3000
```

**Options:**
- `-p, --port <number>` - Port for the development server (default: 8080)

**Environment Variables:**
- `MVS_DIRECT_SERVE=true` - Use direct serving mode (redirects to mol-view-stories online)

### `watch template`

Creates a temporary template story and serves it immediately for quick experimentation.

```bash
# Create and serve temporary template
mvs watch template

# Serve on custom port
mvs watch template -p 3000
```

## CLI Story Structure

### Folder-Based Story

The folder-based format separates each scene into its own directory with dedicated files for configuration, narrative, and visualization code:

```
my-story/
├── story.yaml              # Story metadata and configuration
├── story.js                # Optional global JavaScript
├── README.md               # Story documentation
├── assets/                 # Optional molecular files, images, etc.
│   ├── structure.pdb
│   └── structure.cif
└── scenes/
    ├── scene1/
    │   ├── scene1.yaml     # Scene configuration (camera, timing)
    │   ├── scene1.md       # Scene description (Markdown)
    │   └── scene1.js       # Scene visualization code
    ├── scene2/
    │   ├── scene2.yaml
    │   ├── scene2.md
    │   └── scene2.js
    └── scene3/
        ├── scene3.yaml
        ├── scene3.md
        └── scene3.js
```

**Key Files:**

- **`story.yaml`** - Root configuration containing story title, settings, and scene references
- **`story.js`** - Global JavaScript executed once at story initialization
- **`{scene}.yaml`** - Scene-specific configuration including camera position, timing, and display settings
- **`{scene}.md`** - Scene narrative content in Markdown format
- **`{scene}.js`** - Visualization code using the MolViewPack builder API
- **`assets/`** - Optional directory for local molecular structure files and other assets

### Inline Story

The inline format consolidates all scenes into a single `story.yaml` file, suitable for simpler stories:

```
my-story/
├── story.yaml              # All scenes defined inline
├── README.md               # Story documentation
└── assets/                 # Optional assets
```

**story.yaml structure:**

```yaml
title: "My Molecular Story"
author_note: "Brief description"

settings:
  autoPlay: false
  loopStory: false
  showControls: true

scenes:
  - id: intro
    header: "Introduction"
    key: "intro"
    description: |
      # Welcome
      Scene content in Markdown
    javascript: |
      // Visualization code
      const structure = builder.download({...});

  - id: detail
    header: "Detail View"
    # ... additional scene configuration
```

### Story Configuration (`story.yaml`)

The root `story.yaml` file contains:

**Required:**
- `title` - Story title displayed to users

**Optional:**
- `author_note` - Subtitle or attribution
- `settings` - Story-wide settings (autoPlay, loopStory, showControls, backgroundColor)
- `global_js` - JavaScript executed at story initialization
- `scene_defaults` - Default values for all scenes
- `scene_order` - Explicit scene ordering
- `scenes` - Scene references (folder-based) or inline scene definitions

### Scene Configuration

Each scene can specify:

- **`header`** - Scene title
- **`key`** - Unique scene identifier
- **`camera`** - Camera position, target, FOV, and mode
- **`linger_duration_ms`** - Display duration in milliseconds
- **`transition_duration_ms`** - Animation duration to next scene
- **`settings`** - Scene-specific settings (autoRotate, showAxes, etc.)

For complete format details, see the [STORY_FORMAT.md](https://github.com/molstar/mol-view-stories/blob/main/cli/STORY_FORMAT.md) reference.

## Getting Started

### Prerequisites

- [Deno](https://deno.land/) 1.40 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/molstar/mol-view-stories.git
cd mol-view-stories/cli

# Build the CLI
deno task build
```

### Quick Start

**1. Explore existing examples:**

```bash
# Serve the exosome example
./mvs watch examples/exosome

# Serve the TATA-binding protein example
./mvs watch examples/tbp

# Open http://localhost:8080 in your browser
```

**2. Create your first story:**

```bash
# Create a new story with folder structure
./mvs create my-first-story --scenes-as-folders
cd my-first-story

# Add your molecular structure files to assets/
# (Or use remote URLs in scene JavaScript)

# Edit story configuration
nano story.yaml

# Edit the first scene
nano scenes/scene1/scene1.yaml    # Configure camera and timing
nano scenes/scene1/scene1.md      # Write narrative content
nano scenes/scene1/scene1.js      # Add visualization code

# Serve with live reload
../mvs watch .
```

**3. Develop and iterate:**

Open `http://localhost:8080` in your browser. The story will automatically reload when you save changes to any file.

**4. Build for deployment:**

```bash
# Build standalone HTML
./mvs build my-first-story -o story.html

# Build MVStory container
./mvs build my-first-story -o story.mvstory

# Build JSON format
./mvs build my-first-story -o story.json
```

### Learning Path

1. **Start with examples** - Run `./mvs watch examples/learning-simple` to see a minimal working story
2. **Examine the structure** - Look at the example's YAML, Markdown, and JavaScript files
3. **Create your own** - Use `./mvs create` to scaffold a new story
4. **Iterate rapidly** - Use `./mvs watch` for live reload during development
5. **Review the format** - See [STORY_FORMAT.md](https://github.com/molstar/mol-view-stories/blob/main/cli/STORY_FORMAT.md) for complete configuration options

## Examples

The CLI includes several complete example stories in the `examples/` directory:

**Full Examples:**
- `exosome` - Comprehensive exosome structure with detailed annotations (5 scenes)
- `tbp` - TATA-binding protein structural exploration
- `terms-of-entrapment` - Educational example with 14 scenes
- `npc-basket` - Nuclear pore complex basket structure
- `motm-01` - Molecule of the Month feature story

**Learning Examples:**
- `learning-simple` - Minimal folder-based starter
- `learning-simple-inline` - Simple inline format example
- `learning-molviewspec-basics` - MolViewSpec API introduction
- `learning-mvs-features` - Core MVS features walkthrough
- `learning-localfile` - Local structure file loading

All examples can be served with:

```bash
./mvs watch examples/<example-name>
```

Or built to any format:

```bash
./mvs build examples/exosome -o exosome.html
./mvs build examples/tbp -o tbp.mvstory
```

## Additional Resources

- **[STORY_FORMAT.md](https://github.com/molstar/mol-view-stories/blob/main/cli/STORY_FORMAT.md)** - Complete format reference and best practices
- **[MIGRATION_GUIDE.md](https://github.com/molstar/mol-view-stories/blob/main/cli/MIGRATION_GUIDE.md)** - Guide for updating stories from older formats
- **[Examples Directory](https://github.com/molstar/mol-view-stories/tree/main/cli/examples)** - Working examples and templates
- **[GitHub Repository](https://github.com/molstar/mol-view-stories)** - Source code and issue tracker

## Troubleshooting

**MVS validation warnings in browser console:**
Messages like "Invalid MVS tree" are non-critical validation notices from the Mol* viewer. Stories will still load and function correctly. Look for "✅ MVSX/MVSJ Story loaded successfully!" to confirm proper loading.

**Port already in use:**
Use the `-p` option to specify a different port: `./mvs watch ./my-story -p 3001`

**Scene not loading:**
Ensure scene folders are correctly referenced in `story.yaml` and contain all three required files (`.yaml`, `.md`, `.js`).

**JavaScript errors:**
Use `console.log()` in scene JavaScript and check the browser console when running `./mvs watch`.
