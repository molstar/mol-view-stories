# Zika Virus Assembly and Cryo-EM Density

## Description
Cryo-EM structure of the Zika virus at 3.8 Å resolution, revealing the detailed architecture of the viral capsid.

## Source
- **Molstar URL:** https://molstar.org/viewer/?snapshot-url=https%3A%2F%2Fmolstar.org%2Fdemos%2Fstates%2Fzikaem.molx&snapshot-url-type=molx
- **molx file:** https://molstar.org/demos/states/zikaem.molx
- **GitHub molx:** https://github.com/molstar/molstar.github.io/blob/master/demos/states/zikaem.molx

- **Type:** Structure + EM Data
- **Tier:** 1

## References
- **PDB ID:** 5IRE
- **EMDB ID:** EMD-8116
- **DOI:** [10.1126/science.aaf5316](https://dx.doi.org/10.1126/science.aaf5316)

## Status
✅ **COMPLETE** (Structure visualization)  
⚠️ **EM Volume Not Included** - requires volume streaming server support

## Implementation Notes

### What's Included
- **Structure:** 5IRE from PDBe (bcif format)
- **Assembly:** Assembly "1" - complete viral capsid sphere
- **Component:** Polymer chains
- **Representation:** Cartoon
- **Coloring:** Uniform black (#000000) matching original molx
- **Camera:** Perspective view of the complete viral capsid

### What's Missing
The original Molstar example includes EM density visualization from EMD-8116 using the LiteMol volume streaming server:
- URL: `https://ds.litemol.org/em/emd-8116/cell?detail=6`
- Isosurface at isoValue: 3.5
- Semi-transparent blue surface overlay

**Why not included:** Mol-view-spec supports X-ray density via PDBe volume server, but EM volumes from EMDB use a different streaming server/format that isn't currently supported. This is a **mol-view-spec API limitation**.

### molx Analysis
Downloaded and examined zikaem.molx (1.1MB ZIP archive):
- `state.json` (21KB) - Molstar plugin state
- `assets/1` (360KB) - Binary structure file (5IRE bcif)
- `assets/J44nmTnRFhWAQOcHilmLhA` (7.3MB) - Binary volume data (EMD-8116)
- `assets.json` - Asset metadata mapping

### Key Transformers
1. **ms-plugin.download** - Downloads 5IRE.bcif from ModelServer
2. **ms-plugin.parse-cif** - Parses binary CIF format
3. **ms-plugin.structure-selection-from-expression** - Selects polymer chains
4. **ms-plugin.structure-representation-3d** - Creates cartoon representation
5. **ms-plugin.create-volume-streaming-info** - Sets up volume streaming
6. **ms-plugin.create-volume-streaming-behavior** - Configures EMD-8116 (detail level 6, isoValue 3.5)
7. **ms-plugin.create-volume-streaming-visual** - Renders isosurface

### Future Enhancement
When EM volume support is added to mol-view-spec, the implementation would be:
```javascript
// Structure (already implemented)
const structure = builder
  .download({ url: "https://www.ebi.ac.uk/pdbe/entry-files/download/5ire.bcif" })
  .parse({ format: "bcif" })
  .assemblyStructure({ assembly_id: "1" });

structure
  .component({ ref: 'Polymer', selector: "polymer" })
  .representation({ type: "cartoon" })
  .color({ color: "#000000" });

// EM Volume (future - needs API support)
builder
  .download({ url: "https://www.ebi.ac.uk/emdb/emd-8116/..." })  // URL TBD
  .parse({ format: "..." })  // Format TBD
  .volume({ channel_id: "em" })
  .representation({ type: "isosurface", absolute_isovalue: 3.5 })
  .color({ color: "#6688ff" })
  .opacity({ opacity: 0.3 });
```

## Build Commands

```bash
# JSON output (to stdout)
deno run --allow-read --allow-write --allow-env --allow-net main.ts build examples/molstar-examples/zika-em

# HTML output (standalone file)
deno run --allow-read --allow-write --allow-env --allow-net main.ts build examples/molstar-examples/zika-em -f html -o zika-em.html

# Watch mode (live development)
deno run --allow-read --allow-write --allow-env --allow-net main.ts watch examples/molstar-examples/zika-em
```

## Lessons Learned

1. **EM volumes use different servers than X-ray density:** PDBe volume server supports X-ray density, but EM data comes from specialized volume streaming servers
2. **Volume streaming requires special format:** The LiteMol/DensityServer format is different from standard volume data
3. **Partial implementation is valid:** Showing structure without volume is still scientifically valuable and educationally useful
4. **API limitations should be clearly documented:** Users should understand what's missing and why

## Notes
Second completed Molstar example! Structure visualization is complete and functional. EM volume awaits future mol-view-spec API enhancement for EMDB/volume streaming server support.
