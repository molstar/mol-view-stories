# Exosome Structural Model

Recreation of the exosome visualization from the **Mesoscale Explorer** app, showcasing an integrative structural model of these important cellular nanovesicles.

## About Exosomes

Exosomes are small vesicles (30-150 nm) secreted by cells into bodily fluids. Once thought to be "garbage shuttles," they're now recognized as critical "information shuttles" for cell-to-cell communication.

**Key Features:**
- Lipid bilayer membrane with embedded proteins
- Interior cargo proteins and RNA
- Role in immune response and disease signaling
- Promising targets for cancer diagnosis and therapy

## Attribution

Based on the exosome tour from the **Mesoscale Explorer** by the Goodsell lab at Scripps Research.

**Original Authors:** Ludovic Autin, David S. Goodsell

**Reference:** Jiménez J, Autin L, Ibáñez de Cáceres I, Goodsell DS. "Integrative Modeling and Visualization of Exosomes." *J Biocommun.* 2019;43(2):e10. doi: 10.5210/jbc.v43i2.10331.

## Story Structure

5 scenes with synchronized audio narration:

1. **Intro** - Overview and introduction
2. **Explore** - Interactive tour of complete structure
3. **Idealized Model** - Cutaway view showing interior
4. **Surface Proteins** - Membrane-embedded proteins
5. **Interior Proteins** - Cargo proteins inside vesicle

## Technical Details

**Structure:** Complete integrative model in BCIF format combining experimental structures and computational modeling

**Audio:** 4 MP3 narration tracks guiding through the structure

**Visualization:** David Goodsell mesoscale style, CPK coloring, progressive cutaway views

## Building

```bash
# Build to various formats
mvs build . --output exosome.mvsx --format mvsx
mvs build . --output exosome.html --format html

# Watch for development
mvs watch .
```

## Educational Use

Perfect for teaching:
- Mesoscale structural biology
- Integrative modeling approaches
- Cell biology and intercellular communication
- Membrane protein organization
- Scientific visualization techniques

## References

- Raposo G, Stoorvogel W. "Extracellular vesicles: exosomes, microvesicles, and friends." *J Cell Biol.* 2013;200(4):373-383. [PMID: 23420871](https://pubmed.ncbi.nlm.nih.gov/23420871)
- [Mesoscale Explorer - Exosome Tour](https://mesoscope.scripps.edu/explorer/)
- [Full manuscript (PMC9139774)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9139774)

## License

Copyright (c) 2025 mol* contributors, licensed under MIT.

Original model by Ludovic Autin and David S. Goodsell, used with permission.