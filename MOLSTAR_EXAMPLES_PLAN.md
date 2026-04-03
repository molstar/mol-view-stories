# Plan: Adding Molstar Interactive Examples to mol-view-stories

## Overview
Convert the 13 interactive examples from molstar.org into mol-view-stories format, organized in `cli/examples/molstar-examples/`.

**Important Notes:** 
- The StoryManager does NOT handle molx formats directly. These are Molstar viewer state files.
- **molx files are ZIP archives** containing:
  - `state.json` - Complete Molstar plugin state with transformation tree
  - `assets/` - Binary data files (structures, volumes, etc.)
  - `assets.json` - Metadata mapping asset IDs to files
- We can extract and parse state.json to understand the visualization structure
- The state.json contains transformers that map directly to builder API concepts

## Examples to Add

Based on the HTML from molstar.org, we have 13 examples (excluding the 2 Mesoscale Explorer examples which use a different viewer):

### Row 1
1. **alpha-orbitals** - Alpha orbitals and density of Atorvastatin
   - Source: `demos/alpha-orbitals` (custom demo, no molx)
   - Type: Custom visualization

2. **zika-em** - Zika virus assembly and Cryo-EM density
   - molx URL: `https://molstar.org/demos/states/zikaem.molx`
   - Type: Structure + EM data

3. **cytochromes** - Superposition and validation annotation of P-450 cytochromes
   - molx URL: `https://molstar.org/demos/states/cytochromes.molx`
   - Type: Superposition + validation

### Row 2
4. **gain-md** - GAIN domain tethered agonist exposure (MD trajectory)
   - molx URL: `https://molstar.org/demos/states/gain-md.molx`
   - DOI: 10.1016/j.molcel.2020.12.042
   - Type: MD trajectory

5. **npc** - IH/M structure of the Nuclear Pore Complex
   - molx URL: `https://molstar.org/demos/states/npc.molx`
   - Type: Integrative/Hybrid structure

6. **lighting** - Render styles and lighting modes demonstration
   - Source: `demos/lighting` (custom demo, no molx)
   - Type: Rendering showcase

7. **1rb8-assembly** - Annotated assembly of phiX174 DNA binding protein
   - molx URL: `https://molstar.org/demos/states/1rb8asm.molx`
   - PDB: 1RB8
   - Type: Assembly annotation

### Row 3
8. **villin-md** - Villin folding trajectory
   - molx URL: `https://molstar.org/demos/states/villin-md.molx`
   - DOI: 10.6084/m9.figshare.12040257.v1
   - Type: MD trajectory

9. **sars-cov-2-virion** - SARS-CoV-2 Virion coarse-grained model
   - molx URL: `https://molstar.org/demos/states/sars-cov-2_virion.molx`
   - DOI: 10.1016/j.bpj.2020.10.048
   - Type: Coarse-grained model

10. **btub** - BtuB molecules in lipid bilayer
    - molx URL: `https://molstar.org/demos/states/btub.molx`
    - DOI: 10.1038/s41467-018-05255-9
    - Type: Membrane protein + lipid bilayer

11. **motor-hook** - Bacterial flagellar motor-hook complex
    - molx URL: `https://molstar.org/demos/states/motor-hook.molx`
    - PDB: 7CGO
    - DOI: 10.1016/j.cell.2021.03.057
    - Type: Cryo-EM structure

**Note:** Excluded from this plan:
- **cellpack-hiv1** - Opens in Mesoscale Explorer (different viewer)
- **petworld-syngap** - Opens in Mesoscale Explorer (different viewer)

## molx File Structure (Discovery)

Based on extracting motor-hook.molx:

### Archive Contents
```
motor-hook.molx (ZIP archive)
├── state.json (67KB) - Molstar plugin state
├── assets.json (161 bytes) - Asset metadata
└── assets/
    └── 4iNZpUG_u01fITiLFutPMA (4.2MB) - Binary structure data
```

### state.json Structure
The state.json contains a transformation tree with nodes like:
- `ms-plugin.download` - Download data (URL: https://models.rcsb.org/7CGO.bcif)
- `ms-plugin.parse-cif` - Parse structure format
- `ms-plugin.trajectory-from-mmcif` - Extract trajectory
- `ms-plugin.model-from-trajectory` - Create model
- `ms-plugin.structure-from-model` - Build structure
- `ms-plugin.structure-component` - Select components
- `ms-plugin.structure-representation-3d` - Add representations

### Mapping to Builder API
Each transformer in state.json maps to builder API calls:
- `ms-plugin.download` → `builder.download()`
- `ms-plugin.parse-cif` → `.parse()`
- `ms-plugin.structure-component` → `.component()`
- `ms-plugin.structure-representation-3d` → `.representation()`
- Color/style params in transformers → `.color()`, style options

### Strategy
1. Extract molx files
2. Parse state.json to identify transformers
3. Map transformers to builder API calls
4. Extract camera position from state
5. Identify assets and their sources

## Phase 1: Setup and Initial Structure

### 1.1 Create Directory Structure
```
cli/examples/molstar-examples/
├── README.md                    # Overview of all examples
├── examples.yaml                # Metadata for all 13 examples
├── alpha-orbitals/
│   ├── story.yaml
│   └── README.md
├── zika-em/
│   ├── story.yaml
│   └── README.md
├── cytochromes/
│   ├── story.yaml
│   └── README.md
... (etc for all 13)
```

### 1.2 Create Top-Level Metadata File
Create `cli/examples/molstar-examples/examples.yaml` containing:
- Title, description, and source URL for each example
- molx URL (if available)
- DOI references where applicable
- PDB IDs where applicable
- Type classification (MD, EM, assembly, etc.)
- Implementation status (stub, in-progress, complete)

### 1.3 Create Stub Stories
For each of the 13 examples, create:

**story.yaml** (minimal):
```yaml
title: '[Example Name]'
author_note: 'Based on Molstar example: [URL]'

scenes:
  - id: main
    header: '[Example Title]'
    key: 'main'
    description: |
      # [Example Title]
      
      [Description from molstar.org]
      
      **Status:** Stub - needs implementation
      
      **Source:** [molx URL or demo URL]
    javascript: |
      // TODO: Implement visualization
      console.log('Not yet implemented');
```

**README.md**:
```markdown
# [Example Name]

## Description
[Full description from molstar.org]

## Source
- Molstar URL: [original URL]
- molx file: [URL if available]
- Type: [MD/EM/Assembly/etc]

## References
- [DOI links if applicable]
- [PDB IDs if applicable]

## Implementation Status
- [ ] molx file loaded and inspected in Molstar viewer
- [ ] Structures and data sources identified
- [ ] Representations documented
- [ ] Camera positions documented
- [ ] Builder API implementation started
- [ ] Educational content added
- [ ] Testing complete

## Notes
[Any special considerations, challenges, or observations]
```

## Phase 2: Investigation and Documentation

### 2.1 Load molx Files in Molstar Viewer
For each of the 9 examples with molx URLs:
1. Open in Molstar viewer: `https://molstar.org/viewer/?snapshot-url=[URL]&snapshot-url-type=molx`
2. Use browser dev tools to inspect what gets loaded
3. Document the following in README.md:
   - **Structures loaded:** PDB IDs, URLs, file formats
   - **Representations:** cartoon, surface, ball-and-stick, etc.
   - **Color schemes:** entity-based, chain-based, custom colors
   - **Camera position:** can we extract from the loaded state?
   - **Special features:** trajectories, volumes, labels, measurements
   - **Component selections:** what parts are shown/hidden

### 2.2 Inspect Custom Demos
For the 2 custom demos (alpha-orbitals, lighting):
1. Visit the demo pages directly
2. Inspect the source code if available
3. Document what they demonstrate
4. Note if they require special features

### 2.3 Create Investigation Template
For systematic documentation, create a checklist for each example:

```markdown
## Investigation Checklist

### Data Sources
- [ ] Primary structure source identified (PDB/URL/file)
- [ ] Additional data sources identified (EM maps, trajectories, etc.)
- [ ] File formats documented

### Visual Elements
- [ ] All representations documented
- [ ] Color schemes identified
- [ ] Transparency/opacity settings noted
- [ ] Labels and annotations documented

### Camera & Timing
- [ ] Camera position extracted or approximated
- [ ] Optimal linger duration estimated
- [ ] Scene transitions planned (if multi-scene)

### Builder API Mapping
- [ ] download() calls identified
- [ ] parse() formats determined
- [ ] component() selectors planned
- [ ] representation() types chosen
- [ ] color() schemes mapped
- [ ] Special features identified (focus, label, transform, etc.)
```

## Phase 3: Prioritized Implementation

### 3.1 Implementation Order (Simple → Complex)

**Tier 1: Single Structure, Standard Representations (Start Here)**
1. **motor-hook** (7CGO) - Single cryo-EM structure
2. **1rb8-assembly** (1RB8) - Single assembly
3. **zika-em** - Structure + volume (if volume support exists)

**Tier 2: Multiple Structures, Superposition**
4. **cytochromes** - Superposition of multiple structures
5. **npc** - Integrative structure (may be complex)
6. **btub** - Membrane system

**Tier 3: Trajectories and Advanced Features**
7. **gain-md** - MD trajectory (requires trajectory support)
8. **villin-md** - MD trajectory
9. **sars-cov-2-virion** - Coarse-grained model

**Tier 4: Custom Demos**
10. **alpha-orbitals** - Custom visualization (may require special code)
11. **lighting** - Render modes showcase

### 3.2 Implementation Workflow (Per Example)

For each example:

**Step 1: Investigate**
- Load molx in Molstar viewer
- Complete investigation checklist
- Document findings in README.md

**Step 2: Identify Builder API Calls**
- Map visual elements to builder API methods
- Identify any gaps or unsupported features
- Plan scene structure (single vs multi-scene)

**Step 3: Implement**
- Write JavaScript using builder API
- Configure camera settings
- Set linger/transition durations
- Test rendering

**Step 4: Enhance**
- Add educational markdown description
- Include scientific context
- Add references and attributions
- Consider multi-scene storytelling

**Step 5: Validate**
- Build with CLI
- Test in web viewer
- Compare with original molx rendering
- Verify educational content

### 3.3 Example Implementation Pattern

```yaml
title: 'Motor-Hook Complex'
author_note: 'Based on Molstar example from molstar.org'

scenes:
  - id: overview
    header: 'Bacterial Flagellar Motor-Hook Complex'
    key: 'overview'
    description: |
      # Bacterial Flagellar Motor-Hook Complex
      
      Cryo-EM structure of the bacterial flagellar motor-hook complex.
      
      **PDB ID:** 7CGO
      **Resolution:** [X] Å
      **Reference:** Tan et al., Cell 2021 ([doi:10.1016/j.cell.2021.03.057](https://dx.doi.org/10.1016/j.cell.2021.03.057))
      
      This structure reveals...
      
    javascript: |
      const structure = builder
        .download({ url: "https://files.rcsb.org/download/7CGO.bcif" })
        .parse({ format: "bcif" })
        .modelStructure({});
      
      // Main assembly view
      structure
        .component({ selector: "all" })
        .representation({ type: "cartoon" })
        .color({ color: "chain-id" });
      
      // Focus on key region if needed
      // structure
      //   .component({ selector: "..." })
      //   .focus()
      //   .representation({ type: "surface" });
    
    camera:
      mode: 'perspective'
      position: [100, 100, 100]  # To be determined from molx
      target: [0, 0, 0]
      up: [0, 1, 0]
      fov: 45
    
    linger_duration_ms: 8000
    transition_duration_ms: 1500
```

## Phase 4: Testing and Refinement

### 4.1 Build and Test
For each completed example:
```bash
cd cli
deno task build molstar-examples/[example-name]
```

### 4.2 Visual Comparison
- Compare rendered output with original molx in Molstar viewer
- Adjust colors, representations, camera as needed
- Iterate until satisfactory

### 4.3 Integration Testing
- Ensure all examples build without errors
- Test in web viewer
- Verify story navigation
- Check asset loading

## Phase 5: Documentation and Polish

### 5.1 Update Main README
Add section to `cli/examples/molstar-examples/README.md`:
- Overview of all examples
- Links to each example
- Implementation status
- Known limitations
- How to contribute

### 5.2 Document Conversion Process
Create a guide for future contributors:
- How to investigate molx files
- How to map to builder API
- Common patterns and pitfalls
- Examples of good implementations

### 5.3 Update Top-Level Documentation
- Add molstar-examples to main examples list
- Update any relevant documentation
- Note attribution to Molstar project

## Key Challenges and Solutions

### Challenge 1: Camera Positions
**Problem:** molx files contain camera state, but we need to manually extract it
**Solution:** 
- Load molx in Molstar viewer
- Use browser console to access camera state
- Or manually adjust until visually similar

### Challenge 2: Trajectory Support
**Problem:** MD trajectories may not be fully supported in builder API
**Solution:**
- Check builder API documentation for trajectory support
- If not supported, create static snapshots
- Document limitation and request feature enhancement

### Challenge 3: Volume Data (EM Maps)
**Problem:** May need to load EM density maps
**Solution:**
- Investigate if builder API supports volume loading
- Check existing examples for patterns
- May need to use direct Molstar API if builder API insufficient

### Challenge 4: Custom Demos
**Problem:** alpha-orbitals and lighting may require special code
**Solution:**
- Inspect demo source code
- May need to adapt or simplify
- Document if full recreation not feasible

## Success Criteria

**Phase 1 Complete:**
- [x] All 13 example folders created
- [x] examples.yaml metadata file created
- [x] All stub story.yaml and README.md files created

**Phase 2 Complete:**
- [ ] All 9 molx files investigated
- [ ] Investigation checklists completed for each
- [ ] Data sources and representations documented

**Phase 3 Complete:**
- [ ] At least 3 Tier 1 examples fully implemented
- [ ] At least 2 Tier 2 examples fully implemented
- [ ] Known limitations documented

**Phase 4 Complete:**
- [ ] All implemented examples build successfully
- [ ] Visual quality comparable to originals
- [ ] Web viewer testing complete

**Phase 5 Complete:**
- [ ] All documentation complete
- [ ] Conversion guide created
- [ ] Attribution and references verified

## Timeline Approach

**Immediate (Can start now):**
- Phase 1: Directory structure and stubs
- Phase 2.1: Begin investigating first molx file

**Short-term (First 3 examples):**
- Focus on Tier 1 examples
- Establish patterns and best practices
- Document learnings

**Medium-term (Remaining examples):**
- Work through Tier 2 and 3
- Address challenges as they arise
- Iterate on quality

**Long-term (Polish):**
- Custom demos if feasible
- Additional scenes for storytelling
- Community feedback integration

## Notes and Considerations

1. **No Automatic Conversion:** Unlike some formats, molx cannot be automatically converted to mol-view-stories. Each example requires manual recreation using the builder API.

2. **Fidelity vs. Storytelling:** We can choose to either:
   - Exactly replicate the molx visualization (high fidelity)
   - Enhance with multiple scenes and educational content (better storytelling)
   - Hybrid approach (recommended)

3. **Feature Gaps:** If builder API lacks features needed for certain examples:
   - Document the limitation
   - Create simplified version
   - Request feature enhancement from Molstar team

4. **Attribution:** All examples should clearly attribute:
   - Original Molstar example
   - Scientific publications
   - Data sources (PDB, etc.)

---

## Recommendation: Start with Phase 1

Begin with **Phase 1** to create the complete directory structure and stub files. This gives us:
1. A clear organizational structure
2. Metadata tracking for all examples
3. Placeholders for systematic implementation
4. A foundation for iterative development

Then proceed to **Phase 2.1** with the first Tier 1 example (motor-hook) to:
- Establish the investigation workflow
- Validate the builder API mapping process
- Create a reference implementation for others
