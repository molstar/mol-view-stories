# MolViewStories Documentation (Quarto)

Quarto-based documentation for MolViewStories with MolViewSpec extension support.

## Quick Start

```bash
# Install Quarto (one-time)
brew install quarto

# Install MolViewSpec extension (one-time)
cd docs
quarto add zachcp/molviewspec-quarto

# Preview with live reload
quarto preview docs
```

Open http://localhost:4200 in your browser.

## Directory Structure

```
docs/
├── _quarto.yml       # Quarto configuration
├── _extensions/      # MolViewSpec extension
├── *.qmd             # Documentation pages
├── img/              # Images
├── _site/            # Built site (gitignored)
└── README.md         # This file
```

## Commands

From project root:

```bash
# Preview
quarto preview docs

# Build
quarto render docs

# Publish
quarto publish gh-pages docs
```

Or from `docs/` directory:

```bash
cd docs
quarto preview
quarto render
quarto publish gh-pages
```

## Configuration

- **File**: `_quarto.yml`
- **Navigation**: Left-hand docked sidebar
- **Theme**: Cosmo
- **Features**: Search, TOC, code copying, MolViewSpec rendering

## Resources

- [Quarto Documentation](https://quarto.org/)
- [MolViewSpec Extension](https://github.com/zachcp/molviewspec-quarto)