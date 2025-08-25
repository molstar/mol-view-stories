import { Story } from '@/app/appstate';
import { UUID } from 'molstar/lib/mol-util';

interface MolecularVisualizationConfig {
  proteinColor: string;
  ligandColor: string;
  ligandLabel?: string;
}

const createInitialJavaScriptCode = (config: MolecularVisualizationConfig): string => {
  return `// Create a builder for molecular visualization
// Define the structure with full type support
const structure = builder
  .download({url: 'https://www.ebi.ac.uk/pdbe/entry-files/1cbs.bcif'})
  .parse({ format: 'bcif' })
  .modelStructure({});

// Add components and representations
structure
  .component({ selector: 'polymer' })
  .representation({ type: 'cartoon' })
  .color({ color: '${config.proteinColor}' });

// Add ligand
structure
  .component({ selector: 'ligand' })
  .label({ text: '${config.ligandLabel || 'Retinoic Acid'}' })
  .focus({})
  .representation({ type: 'ball_and_stick' })
  .color({ color: '${config.ligandColor}' });
`;
};

export const SimpleStory: Story = {
  metadata: { title: 'Simple Molecular Visualization Story' },
  javascript: '// Common code for all scenes\n',
  scenes: [
    {
      id: UUID.createv4(),
      header: 'Awesome Thing 01',
      key: 'scene_01',
      description:
        '# Retinoic Acid Visualization\n\nShowing a protein structure with retinoic acid ligand in green cartoon representation.',
      javascript: createInitialJavaScriptCode({
        proteinColor: 'green',
        ligandColor: '#cc3399',
        ligandLabel: 'Retinoic Acid',
      }),
    },
    {
      id: UUID.createv4(),
      header: 'Awesome Thing 02',
      key: 'scene_02',
      description: '# Alternative Visualization\n\nSame structure but with blue cartoon and orange ligand coloring.',
      javascript: createInitialJavaScriptCode({
        proteinColor: 'blue',
        ligandColor: 'orange',
        ligandLabel: 'Retinoic Acid',
      }),
    },
  ],
  assets: [],
};
