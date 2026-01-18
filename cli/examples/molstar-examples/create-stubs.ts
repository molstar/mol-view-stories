#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Generate stub story.yaml and README.md files for all molstar examples
 */

import { parse } from "https://deno.land/std@0.224.0/yaml/mod.ts";

interface Example {
  id: string;
  title: string;
  description: string;
  type: string;
  source_url: string;
  molx_url?: string;
  github_molx_url?: string;
  github_demo_url?: string;
  image: string;
  pdb_id?: string;
  doi?: string;
  status: string;
  tier: number;
  notes: string;
  attribution?: string;
}

interface ExamplesYaml {
  examples: Example[];
}

const examplesYaml = await Deno.readTextFile('./examples.yaml');
const data = parse(examplesYaml) as ExamplesYaml;

for (const example of data.examples) {
  console.log(`Creating stubs for: ${example.id}`);

  const dir = `./${example.id}`;

  // Create story.yaml
  const storyYaml = `title: '${example.title}'
author_note: 'Based on Molstar example from molstar.org'

scenes:
  - id: main
    header: '${example.title}'
    key: 'overview'
    description: |
      # ${example.title}

      ${example.description}
      ${example.pdb_id ? `\n      **PDB ID:** ${example.pdb_id}` : ''}
      ${example.doi ? `**Reference:** [${example.doi}](https://dx.doi.org/${example.doi})` : ''}

      **Type:** ${example.type}

      **Status:** 🚧 Stub - needs implementation

      **Source:** [View in Molstar](${example.source_url})

    javascript: |
      // TODO: Implement visualization after investigating molx file
      console.log('${example.id} - not yet implemented');

    linger_duration_ms: 8000
    transition_duration_ms: 1500
`;

  await Deno.writeTextFile(`${dir}/story.yaml`, storyYaml);

  // Create README.md
  const readme = `# ${example.title}

## Description
${example.description}

## Source
- **Molstar URL:** ${example.source_url}
${example.molx_url ? `- **molx file:** ${example.molx_url}` : ''}
${example.github_molx_url ? `- **GitHub molx:** ${example.github_molx_url}` : ''}
${example.github_demo_url ? `- **GitHub demo:** ${example.github_demo_url}` : ''}
- **Type:** ${example.type}
- **Tier:** ${example.tier}

## References
${example.pdb_id ? `- **PDB ID:** ${example.pdb_id}` : ''}
${example.doi ? `- **DOI:** [${example.doi}](https://dx.doi.org/${example.doi})` : ''}
${example.attribution ? `- **Attribution:** ${example.attribution}` : ''}

## Implementation Status
- [ ] molx file downloaded and extracted
- [ ] state.json parsed and analyzed
- [ ] Data sources identified
- [ ] Representations documented
- [ ] Camera positions extracted
- [ ] Builder API implementation completed
- [ ] Educational content enhanced
- [ ] Testing complete

## Investigation Notes

### molx Contents
_To be filled after extraction_

### Transformers Found
_To be filled during Phase 2_

### Data Sources
_To be filled during Phase 2_

### Visual Elements
_To be filled during Phase 2_

### Camera & Timing
_To be filled during Phase 2_

### Builder API Mapping
_To be filled during Phase 2_

## Notes
${example.notes}
`;

  await Deno.writeTextFile(`${dir}/README.md`, readme);

  console.log(`  ✓ Created ${dir}/story.yaml and ${dir}/README.md`);
}

console.log('\nAll stubs created successfully!');
