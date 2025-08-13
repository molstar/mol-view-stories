import { UUID } from 'molstar/lib/mol-util';
import { Story } from '../state/types';

const LibraryFns = `// Mol* library functions: Vec3, Mat3, Mat4, Quat`;

export const EmptyStory: Story = {
  metadata: { title: 'New Story' },
  javascript: `// Common code for all scenes\n${LibraryFns}\n`,
  scenes: [
    {
      id: UUID.createv4(),
      header: 'New Scene',
      key: '',
      description: '# New Scene\n\nWith a description',
      javascript: `// Start typing 'builder' to create a new scene\n${LibraryFns}`,
    },
  ],
  assets: [],
};
