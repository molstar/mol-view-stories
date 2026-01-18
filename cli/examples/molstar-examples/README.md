# Molstar Interactive Examples

This directory contains mol-view-stories adaptations of the interactive examples from [molstar.org](https://molstar.org).

## Overview

These examples showcase the conversion of Molstar's molx state files into the mol-view-stories format. Each example demonstrates different molecular visualization techniques and scientific use cases.

**Source:** https://molstar.org (Interactive Examples section)  
**GitHub Repository:** https://github.com/molstar/molstar.github.io

## Examples

### Tier 1: Simple Examples (Good Starting Points)

| Example | Description | PDB | Type | Status |
|---------|-------------|-----|------|--------|
| [motor-hook](./motor-hook/) | Bacterial flagellar motor-hook complex | 7CGO | Cryo-EM | ✅ Complete |
| [zika-em](./zika-em/) | Zika virus assembly (360-mer) | 5IRE | Structure + EM | ✅ Complete |
| [1rb8-assembly](./1rb8-assembly/) | PhiX174 DNA binding protein assembly | 1RB8 | Assembly | 🚧 Stub |

### Tier 2: Medium Complexity

| Example | Description | Type |
|---------|-------------|------|
| [cytochromes](./cytochromes/) | P-450 cytochromes superposition | Superposition |
| [npc](./npc/) | Nuclear Pore Complex | Integrative/Hybrid |
| [btub](./btub/) | BtuB in lipid bilayer | Membrane System |

### Tier 3: Advanced Examples

| Example | Description | DOI | Type |
|---------|-------------|-----|------|
| [gain-md](./gain-md/) | GAIN domain MD trajectory | [10.1016/j.molcel.2020.12.042](https://dx.doi.org/10.1016/j.molcel.2020.12.042) | MD Trajectory |
| [villin-md](./villin-md/) | Villin folding trajectory | [10.6084/m9.figshare.12040257.v1](https://dx.doi.org/10.6084/m9.figshare.12040257.v1) | MD Trajectory |
| [sars-cov-2-virion](./sars-cov-2-virion/) | SARS-CoV-2 virion model | [10.1016/j.bpj.2020.10.048](https://dx.doi.org/10.1016/j.bpj.2020.10.048) | Coarse-Grained |

### Tier 4: Custom Demos

| Example | Description | Type |
|---------|-------------|------|
| [alpha-orbitals](./alpha-orbitals/) | Alpha orbitals of Atorvastatin | Custom Viz |
| [lighting](./lighting/) | Render styles and lighting modes | Demo |

## Implementation Status

| Status | Count | Examples |
|--------|-------|----------|
| 🚧 Stub | 9 | Most examples |
| 🔍 Investigating | 0 | - |
| 🚧 In Progress | 0 | - |
| ✅ Complete | 2 | **motor-hook**, **zika-em** |

**Latest:** 
- **zika-em** completed 2026-01-18 - Full assembly visualization (360-mer viral capsid)
- **motor-hook** completed 2026-01-18 - First successful molx → mol-view-stories conversion with 5 functional components

## molx File Format

molx files are ZIP archives containing:
- **state.json** - Complete Molstar plugin state with transformation tree
- **assets/** - Binary data files (structures, volumes, etc.)
- **assets.json** - Metadata mapping asset IDs to files

### Example Structure (motor-hook.molx)
```
motor-hook.molx
├── state.json (67KB) - Plugin state with transformers
├── assets.json (161 bytes) - Asset metadata
└── assets/
    └── 4iNZpUG_u01fITiLFutPMA (4.2MB) - Binary structure data
```

### state.json Transformers

The state.json contains a transformation tree that maps to mol-view-stories builder API:

| Molstar Transformer | Builder API |
|---------------------|-------------|
| `ms-plugin.download` | `builder.download()` |
| `ms-plugin.parse-cif` | `.parse({ format: 'bcif' })` |
| `ms-plugin.structure-component` | `.component({ selector: ... })` |
| `ms-plugin.structure-representation-3d` | `.representation({ type: ... })` |
| Color/style params | `.color({ color: ... })` |

## Implementation Workflow

For each example, follow this workflow:

### Phase 1: Investigation
1. Download molx file from GitHub
2. Extract ZIP contents
3. Parse state.json
4. Document transformers and parameters
5. Identify data sources (PDB IDs, URLs)
6. Extract camera position

### Phase 2: Implementation
1. Map transformers to builder API calls
2. Write JavaScript visualization code
3. Configure camera settings
4. Set timing (linger/transition)
5. Test rendering

### Phase 3: Enhancement
1. Expand markdown descriptions
2. Add scientific context
3. Include references and citations
4. Consider multi-scene storytelling
5. Final testing and validation

## Resources

### GitHub Repositories
- **molx state files:** https://github.com/molstar/molstar.github.io/tree/master/demos/states
- **Custom demos:** https://github.com/molstar/molstar.github.io/tree/master/demos

### Documentation
- **Molstar Viewer:** https://molstar.org/viewer/
- **mol-view-stories:** https://molstar.org/mol-view-stories
- **Builder API:** See existing examples in `cli/examples/`

### Tools
- **Stub generator:** `create-stubs.ts` - Generates initial story.yaml and README.md
- **State parser:** (To be created) - Parse state.json and generate builder API code

## Contributing

To implement an example:

1. Choose an example from Tier 1 (simplest) or based on your interest
2. Update its status in `examples.yaml`
3. Follow the implementation workflow above
4. Update the README with findings
5. Test with `deno task build molstar-examples/[example-name]`
6. Document any challenges or limitations

## Known Limitations

- MD trajectories may require special builder API support
- Some advanced features may not map directly to builder API
- Camera positions may need manual adjustment
- Asset files may be large and require external hosting

## Attribution

All examples are based on demonstrations from the Molstar project:
- **Molstar Website:** https://molstar.org
- **Molstar GitHub:** https://github.com/molstar

Individual examples may have additional citations - see each example's README for details.

## License

Please respect the original Molstar project's licensing and attribution requirements.
