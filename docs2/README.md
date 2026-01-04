# MolViewStories Documentation (Quarto)

This directory contains the Quarto-based documentation for MolViewStories.

## Overview

This documentation has been converted from MkDocs to Quarto to take advantage of:
- Better integration with computational content
- Support for multiple output formats
- Enhanced code block features
- MolViewSpec extension support

## Prerequisites

1. **Quarto**: Install Quarto from [https://quarto.org/docs/get-started/](https://quarto.org/docs/get-started/)
2. **MolViewSpec Extension**: Install the extension using:
   ```bash
   quarto add zachcp/molviewspec-quarto
   ```

## Directory Structure

```
docs2/
├── _quarto.yml           # Quarto configuration file
├── index.qmd             # Homepage
├── getting-started.qmd   # Getting started guide
├── first-time-login.qmd  # Login instructions
├── core-features.qmd     # Core features documentation
├── tips-shortcuts.qmd    # Tips and shortcuts
├── cli.qmd               # CLI documentation
├── faq-troubleshooting.qmd  # FAQ and troubleshooting
├── img/                  # Images and assets
├── styles.css            # Custom CSS styles
└── README.md             # This file
```

## Building the Documentation

### Preview locally
```bash
cd docs2
quarto preview
```

This will start a local server (usually at http://localhost:4200) with live reload.

### Build for production
```bash
cd docs2
quarto render
```

The built site will be in the `_site/` directory.

### Publish to GitHub Pages
```bash
cd docs2
quarto publish gh-pages
```

## Configuration

The site is configured via `_quarto.yml`:
- **Website type**: Standard Quarto website
- **Navigation**: Left-hand sidebar with docked style
- **Theme**: Cosmo (can be customized)
- **Extensions**: MolViewSpec filter enabled
- **Features**: Search, table of contents, code copying

## Converting Content

When converting the original Markdown files to QMD:
1. Most Markdown syntax remains the same
2. You can add YAML frontmatter to individual pages for per-page configuration
3. You can use Quarto-specific features like:
   - Callout blocks: `:::{.callout-note}`, `:::{.callout-tip}`, etc.
   - Code execution blocks (if needed)
   - Cross-references
   - Includes and partials

## Next Steps

After the initial setup, you should:
1. Review each .qmd file and update content as needed
2. Add any Quarto-specific enhancements (callouts, tabsets, etc.)
3. Test all images and links
4. Verify MolViewSpec extension integration
5. Update any code examples to use Quarto syntax if applicable
6. Test the build and preview locally
7. Configure deployment (GitHub Pages, Netlify, etc.)

## Resources

- [Quarto Documentation](https://quarto.org/)
- [Quarto Websites Guide](https://quarto.org/docs/websites/)
- [MolViewSpec Extension](https://github.com/zachcp/molviewspec-quarto)
- [Quarto Markdown Basics](https://quarto.org/docs/authoring/markdown-basics.html)