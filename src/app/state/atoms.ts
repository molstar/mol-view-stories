import { ExampleStories } from '@/app/examples';
import { atom } from 'jotai';
import { type Camera } from 'molstar/lib/mol-canvas3d/camera';
import { CurrentView, Story } from './types';

// Core State Atoms
export const StoryAtom = atom<Story>(ExampleStories.Empty);

export const CurrentViewAtom = atom<CurrentView>({ type: 'story-options' });

export const ActiveSceneIdAtom = atom<string | undefined>((get) => {
  const view = get(CurrentViewAtom);
  return view.type === 'scene' ? view.id : undefined;
});

export const CameraSnapshotAtom = atom<Camera.Snapshot | null>(null);

// Derived atom for story assets
export const StoryAssetsAtom = atom((get) => {
  const story = get(StoryAtom);
  return story.assets || [];
});

// Derived atoms for automatic JavaScript execution
export const ActiveSceneAtom = atom((get) => {
  const story = get(StoryAtom);
  const activeId = get(ActiveSceneIdAtom);
  return story.scenes.find((scene) => scene.id === activeId) || story.scenes[0];
});
