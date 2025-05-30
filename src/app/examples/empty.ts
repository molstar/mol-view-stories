import { UUID } from 'molstar/lib/mol-util';
import { Story } from '../state/types';

export const EmptyStory: Story = {
  metadata: { title: 'New Story' },
  javascript: '// Common code for all scenes\n',
  scenes: [
    {
      id: UUID.createv4(),
      header: 'New Scene',
      key: '',
      description: '# New Scene\n\nWith a description',
      javascript: `// Use builder to create a new scene\n`,
    },
  ],
  assets: [],
};
