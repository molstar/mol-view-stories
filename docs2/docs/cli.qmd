# CLI Tool

The MVS CLI is a command-line tool for creating, building, and serving molecular visualization stories. It provides an efficient workflow for developing interactive narratives with 3D molecular structures.


## Quick Start

```bash
# Install
git clone https://github.com/molstar/mol-view-stories.git
cd mol-view-stories/cli
deno task build

# Explore an example
./mvs watch examples/exosome

# Create your own story
./mvs create my-story --scenes-as-folders
cd my-story

# Edit your story files
nano story.yaml                    # Story configuration
nano scenes/scene1/scene1.yaml     # Scene settings
nano scenes/scene1/scene1.md       # Scene narrative
nano scenes/scene1/scene1.js       # Visualization code

# Develop with live reload
../mvs watch .

# Build for deployment
../mvs build . -o story.html
```

## Commands

```sh
mvs create <story-name>
mvs create <story-name> --scenes-as-folders  # Folder-based (separate scene files)

# builds a scene
mvs build <folder-path> \
    -o <filename>
    --format {json|mvsx|html|mvstory}

mvs watch <folder-path> # Serve on port 8080
```

## Story Structure

### Folder-Based Format

Recommended for complex stories with multiple scenes:

```
my-story/
├── story.yaml              # Story metadata and settings
├── story.js                # Optional global JavaScript
├── assets/                 # Local molecular files (optional)
└── scenes/
    ├── scene1/
    │   ├── scene1.yaml     # Camera, timing, settings
    │   ├── scene1.md       # Narrative content (Markdown)
    │   └── scene1.js       # Visualization code
    └── scene2/
        ├── scene2.yaml
        ├── scene2.md
        └── scene2.js
```

**story.yaml:**
```yaml
title: "My Molecular Story"
author_note: "Optional description"

settings:
  autoPlay: false
  loopStory: false
  showControls: true

scenes:
  - folder: scene1
  - folder: scene2
```

### Inline Format

Simpler format for basic stories - all scenes defined in `story.yaml`:

```
my-story/
├── story.yaml              # All configuration and scenes
└── assets/                 # Optional assets
```

**story.yaml with inline scenes:**
```yaml
title: "My Story"

scenes:
  - id: intro
    header: "Introduction"
    description: |
      # Scene content in Markdown
    javascript: |
      // Visualization code
      const structure = builder.download({...});
```

## Configuration Reference

### Story Settings

**Required:** `title`

**Optional:** `author_note`, `settings` (autoPlay, loopStory, showControls, backgroundColor), `global_js`, `scene_defaults`, `scene_order`

### Scene Settings

- `header` - Scene title
- `key` - Unique identifier
- `camera` - Position, target, FOV, mode
- `linger_duration_ms` - Display duration
- `transition_duration_ms` - Animation duration
- `settings` - Scene-specific options


## Examples

The CLI includes working examples in `examples/`:

**Full Stories:**
- `exosome` - 5-scene structural exploration
- `tbp` - TATA-binding protein
- `terms-of-entrapment` - 14-scene educational story
- `npc-basket` - Nuclear pore complex
- `motm-01` - Molecule of the Month

**Learning Examples:**
- `learning-simple` - Minimal folder-based starter
- `learning-simple-inline` - Inline format basics
- `learning-molviewspec-basics` - MolViewSpec API intro
- `learning-mvs-features` - Core features walkthrough

```bash
./mvs watch examples/exosome
./mvs build examples/tbp -o tbp.html
```
