import { atom } from 'jotai';
import { type Camera } from 'molstar/lib/mol-canvas3d/camera';
import { init_js_code, init_js_code_02 } from './initial-data';
import { SceneData, Story } from './types';
import { UUID } from 'molstar/lib/mol-util';

const DefaultStory: Story = {
  metadata: { title: 'Molecular Visualization Story' },
  scenes: [
    {
      id: UUID.createv4(),
      header: 'Awesome Thing 01',
      key: 'scene_01',
      description:
        '# Retinoic Acid Visualization\n\nShowing a protein structure with retinoic acid ligand in green cartoon representation.',
      javascript: init_js_code,
    },
    {
      id: UUID.createv4(),
      header: 'Awesome Thing 02',
      key: 'scene_02',
      description: '# Alternative Visualization\n\nSame structure but with blue cartoon and orange ligand coloring.',
      javascript: init_js_code_02,
    },
  ],
};

// Core State Atoms
export const StoryAtom = atom<Story>(DefaultStory);

export const ActiveSceneIdAtom = atom<string>(DefaultStory.scenes[0].id);
// export const CurrentMvsDataAtom = atom<MVSData | Uint8Array | null>(null);
export const CameraSnapshotAtom = atom<Camera.Snapshot | null>(null);

// Derived atoms for automatic JavaScript execution
export const ActiveSceneAtom = atom((get) => {
  const story = get(StoryAtom);
  const activeId = get(ActiveSceneIdAtom);
  return getActiveScene(story, activeId);
});

// Utils

export const getActiveScene = (story: Story, activeId: string): SceneData | undefined => {
  return story.scenes.find((scene) => scene.id === activeId) || story.scenes[0];
};
