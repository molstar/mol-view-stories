# motm-01

A molecular visualization story created with MVS CLI.

## Description

A molecular visualization story exploring motm-01

## Structure

- `story.yaml` - Main story configuration and metadata
- `story.js` - Global JavaScript code affecting all scenes
- `scenes/` - Individual scene configurations
  - `scene1/` - First scene
    - `scene1.yaml` - Scene parameters
    - `scene1.md` - Scene description and annotations
    - `scene1.js` - Scene JavaScript code
  - `scene2/` - Second scene
    - `scene2.yaml` - Scene parameters
    - `scene2.md` - Scene description and annotations
    - `scene2.js` - Scene JavaScript code
- `assets/` - Additional resources (images, documents, etc.)

## Usage

To build this story into a StoryContainer:

```bash
mvs build . --output story-container.json
```

## Scenes

### Scene 1: Initial View
Initial overview of the molecular structure

### Scene 2: Detailed View
Focused view highlighting specific structural features

## Editing Guide

### Scene Configuration
1. **Parameters**: Edit `scenes/*/scene*.yaml` for camera, timing, and settings
2. **Description**: Edit `scenes/*/scene*.md` for detailed annotations and educational content
3. **Behavior**: Edit `scenes/*/scene*.js` for molecular visualization code and interactions

### Structure Loading
- **Remote Structures**: Structures are loaded from URLs in the JavaScript files
- **URL Configuration**: Edit the `STRUCTURE_URL` in each scene's `.js` file
- **Supported Formats**: BCIF, PDB, MOL2, SDF, CIF (served via HTTP/HTTPS)

### Story Configuration
- **Metadata**: Edit `story.yaml` for title, author, and global settings
- **Styling**: Modify global appearance and behavior settings

## File Structure Details

### Scene Files
- **`.yaml`**: Camera positions, timing, structure references
- **`.md`**: Narrative content, educational annotations, references
- **`.js`**: Visualization code, interactions, animations

### Structure Organization
- Structures loaded directly from public databases (PDB, ChEMBL, etc.)
- No local file management required
- Fast loading via optimized BCIF format

For more information about MolViewPack stories, visit the documentation.
