import React, { memo, useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { CameraPositionAtom, ActiveSceneAtom, StoryAtom } from '../../app/appstate';
import { Plugin } from 'molstar/lib/mol-plugin-ui/plugin';
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { PluginSpec } from 'molstar/lib/mol-plugin/spec';
import { MolViewSpec } from 'molstar/lib/extensions/mvs/behavior';
import { PluginConfig } from 'molstar/lib/mol-plugin/config';
import { loadMVSData } from 'molstar/lib/extensions/mvs/components/formats';
import { SingleTaskQueue } from '@/lib/utils';
import { MVSData } from 'molstar/lib/extensions/mvs/mvs-data';
import { Camera } from 'molstar/lib/mol-canvas3d/camera';
import { getMVSData } from '@/lib/story-builder';
import { SceneData, Story } from '@/app/state/types';

function createViewer() {
  const spec = DefaultPluginUISpec();
  const plugin = new PluginUIContext({
    ...spec,
    layout: {
      initial: {
        isExpanded: false,
        showControls: false,
      },
    },
    components: {
      disableDragOverlay: true,
      remoteState: 'none',
      viewport: {
        snapshotDescription: EmptyDescription,
      },
    },
    behaviors: [...spec.behaviors, PluginSpec.Behavior(MolViewSpec)],
    config: [
      [PluginConfig.Viewport.ShowAnimation, false],
      [PluginConfig.Viewport.ShowSelectionMode, false],
      [PluginConfig.Viewport.ShowExpand, false],
      [PluginConfig.Viewport.ShowControls, false],
    ],
  });

  return plugin;
}

class CurrentStoryViewModel {
  private queue = new SingleTaskQueue();

  readonly plugin: PluginUIContext;

  setCameraSnapshot: (snapshot: Camera.Snapshot) => void = () => {};

  loadMVSData(data: MVSData | Uint8Array | null) {
    if (!data) return;

    setTimeout(() => {
      this.queue.run(async () => {
        try {
          await this.plugin.initialized;
          await loadMVSData(this.plugin, data, data instanceof Uint8Array ? 'mvsx' : 'mvsj');
        } catch (error) {
          console.error('Error loading MVS data into Molstar:', error);
        }
      });
    }, 0);
  }

  private async init() {
    await this.plugin.init();
    // Init the container now so canvas3d is ready
    this.plugin.initContainer();

    this.plugin.canvas3d?.didDraw.subscribe(() => {
      const snapshot = this.plugin.canvas3d?.camera.getSnapshot();
      if (snapshot) {
        this.setCameraSnapshot(snapshot);
      }
    });
  }

  constructor() {
    this.plugin = createViewer();
    this.init();
  }
}

function EmptyDescription() {
  return <></>;
}

const PluginWrapper = memo(function _PluginWrapper({ plugin }: { plugin: PluginUIContext }) {
  return <Plugin plugin={plugin} />;
});

async function loadCurrentScene(model: CurrentStoryViewModel, story: Story, scene: SceneData) {
  if (!scene) return;

  const mvsData = await getMVSData(story, [scene]);
  model.loadMVSData(mvsData);
}

// We want to use a single global instance for the viewer to avoid
// re-initializing each time the component is needed.
let _modelInstance: CurrentStoryViewModel | null = null;

export function CurrentSceneView() {
  const modelRef = useRef<CurrentStoryViewModel>(_modelInstance);
  if (!modelRef.current) {
    _modelInstance = modelRef.current = new CurrentStoryViewModel();
  }
  const model = modelRef.current;
  const [story] = useAtom(StoryAtom);
  const [scene] = useAtom(ActiveSceneAtom);

  model.setCameraSnapshot = useAtom(CameraPositionAtom)[1];

  useEffect(() => {
    loadCurrentScene(model, story, scene);
  }, [model, story, scene]);

  return (
    <div className='rounded overflow-hidden w-full h-full border border-border bg-background relative'>
      <div className='w-full h-full relative'>
        <PluginWrapper plugin={model.plugin} />
      </div>
    </div>
  );
}
