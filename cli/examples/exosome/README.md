# Exosome Structural Model

A molecular visualization story exploring the structure and function of exosomes, based on the integrative modeling work by Jiménez, Autin, and Goodsell.

## About Exosomes

Exosomes are small nanovesicles (30-150 nm in diameter) that are released by most cell types into bodily fluids including blood, urine, saliva, and breast milk. Originally thought to be cellular "garbage shuttles," recent research has revealed their critical role in cell-to-cell communication, making them important "information shuttles" in biological systems.

### Key Features

- **Size**: Nanoscale vesicles (~100 nm diameter)
- **Origin**: Secreted by most cell types through multivesicular bodies
- **Components**: Lipid bilayer membrane with embedded surface proteins and cargo proteins inside
- **Function**: Cell communication, molecular transport, immune response modulation
- **Clinical Significance**: Promising targets for cancer diagnosis and therapy

### Biological Significance

Exosomes are currently the subject of intense research due to their:
- Role in intercellular communication and signaling
- Potential as biomarkers for disease diagnosis
- Promise as drug delivery vehicles
- Involvement in cancer progression and metastasis
- Function in immune system regulation

## Attribution

This story is based on the exosome tour created for the **Mesoscale Explorer** application by the Goodsell laboratory at Scripps Research.

**Original Model and Visualization:**
- Ludovic Autin (Scripps Research)
- David S. Goodsell (Scripps Research)

**Reference:**
Jiménez J, Autin L, Ibáñez de Cáceres I, Goodsell DS. "Integrative Modeling and Visualization of Exosomes." *J Biocommun.* 2019 Nov 27;43(2):e10. doi: 10.5210/jbc.v43i2.10331. PMID: 36406636; PMCID: PMC9139774.

This MVS CLI version demonstrates how mesoscale cellular structures can be visualized using the scene-based story format.

## Story Structure

This story takes you through five scenes exploring exosome architecture:

1. **Intro** - Overview and introduction to exosomes
2. **Explore** - Interactive exploration of the complete structure
3. **Idealized Model** - Cutaway view showing internal organization
4. **Surface Proteins** - Focus on membrane-embedded surface proteins
5. **Interior Proteins** - Examination of cargo proteins inside the vesicle

## Technical Details

### Audio Narration

This story includes synchronized audio narration that guides viewers through each scene:
- `Exosome_intro.mp3` - Introduction to exosomes
- `Exosome_cut.mp3` - Cutaway model explanation
- `Exosome_surface.mp3` - Surface protein descriptions
- `Exosome_interior.mp3` - Interior cargo proteins

### Structure File

The complete exosome model is loaded from a single BCIF file:
- **exosome.bcif** - Integrated structural model combining experimental structures and modeling

The model integrates:
- Lipid bilayer membrane (coarse-grained representation)
- Surface proteins from experimental structures (PDB)
- Interior cargo proteins and RNA
- Tetraspanin proteins characteristic of exosomes

### Visualization Style

- **CPK coloring** - Atomic-level color coding for protein components
- **Mesoscale rendering** - David Goodsell illustrative style
- **Cutaway views** - Progressive reveal of internal structure
- **Interactive navigation** - Scene-to-scene guided tour

## File Organization

```
exosome/
├── story.yaml              # Story metadata and configuration
├── story.js                # Shared visualization code
├── README.md               # This file
├── assets/                 # Audio and structure files
│   ├── Exosome_intro.mp3
│   ├── Exosome_cut.mp3
│   ├── Exosome_surface.mp3
│   ├── Exosome_interior.mp3
│   └── exosome.bcif        # Complete structural model
└── scenes/                 # Individual scene definitions
    ├── scene1/             # Intro
    ├── scene2/             # Explore
    ├── scene3/             # Idealized Model
    ├── scene4/             # Surface Proteins
    └── scene5/             # Interior Proteins
```

## Building the Story

To build this story into various output formats:

```bash
# Build to MVSJ (JSON format)
mvs build . --output exosome.mvsj.json

# Build to MVSX (binary format)
mvs build . --output exosome.mvsx --format mvsx

# Build to standalone HTML
mvs build . --output exosome.html --format html

# Build to MVStory container
mvs build . --output exosome.mvstory --format mvstory
```

## Development

To work on this story with live reloading:

```bash
mvs watch .
```

Then open the provided URL in your browser to see live updates as you edit files.

## Educational Context

This story demonstrates:
- **Mesoscale structural biology** - Bridging atomic and cellular scales
- **Integrative modeling** - Combining experimental data with computational modeling
- **Cellular nanovesicles** - Understanding extracellular communication
- **Membrane protein organization** - Surface protein arrangement
- **Cargo packaging** - How molecules are loaded into exosomes

Perfect for teaching:
- Cell biology and intercellular communication
- Structural biology at multiple scales
- Biomedical applications of nanotechnology
- Scientific visualization techniques
- Integrative modeling approaches

## References

- Raposo G, Stoorvogel W. "Extracellular vesicles: exosomes, microvesicles, and friends." *J Cell Biol.* 2013;200(4):373-383. [PMID: 23420871](https://pubmed.ncbi.nlm.nih.gov/23420871)

- Huang-Doran I, Zhang CY, Vidal-Puig A. "Extracellular Vesicles: Novel Mediators of Cell Communication In Metabolic Disease." *Trends Endocrinol Metab.* 2017;28(1):3-18. [PMID: 27810172](https://pubmed.ncbi.nlm.nih.gov/27810172)

- Barile L, Vassalli G. "Exosomes: Therapy delivery tools and biomarkers of diseases." *Pharmacol Ther.* 2017;174:63-78. [PMID: 28202367](https://pubmed.ncbi.nlm.nih.gov/28202367)

- [Mesoscale Explorer - Exosome Tour](https://mesoscope.scripps.edu/explorer/)

- [Full manuscript (PMC9139774)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9139774)

## License

Copyright (c) 2025 mol* contributors, licensed under MIT. See LICENSE file for more info.

Original model and visualization by Ludovic Autin and David S. Goodsell, used with permission.