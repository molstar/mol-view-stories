'use client';

import {
  ActiveSceneAtom,
  CameraPositionAtom,
  modifyCurrentScene,
  SceneData,
  StoryAssetsAtom,
  StoryAtom,
} from '@/app/appstate';
import { getMVSData } from '@/app/state/actions';
import { CameraData, Story } from '@/app/state/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SingleTaskQueue } from '@/lib/utils';
import { atom, useAtom, useAtomValue, useStore } from 'jotai/index';
import { BoltIcon, BoxIcon, CameraIcon, CopyIcon, Edit, FolderIcon, XIcon } from 'lucide-react';
import { MolViewSpec } from 'molstar/lib/extensions/mvs/behavior';
import { loadMVSData } from 'molstar/lib/extensions/mvs/components/formats';
import { Camera } from 'molstar/lib/mol-canvas3d/camera';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { Plugin } from 'molstar/lib/mol-plugin-ui/plugin';
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { PluginConfig } from 'molstar/lib/mol-plugin/config';
import { PluginSpec } from 'molstar/lib/mol-plugin/spec';
import { Scheduler } from 'molstar/lib/mol-task';
import { memo, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import { Label } from '../ui/label';
import { SceneCodeEditor } from './editors/SceneCodeEditor';
import { SceneMarkdownEditor } from './editors/SceneMarkdownEditor';
import { OptionsEditor } from './editors/SceneOptions';
import { PressToSave } from '../common';

// Camera Position Component
const CameraPositionDisplay = ({ cameraSnapshot }: { cameraSnapshot?: CameraData | null }) => {
  if (!cameraSnapshot) return <div className='text-xs text-muted-foreground italic'>No camera data available</div>;

  return (
    <div className='bg-muted/50 rounded p-2 text-xs font-mono space-y-0.5'>
      <div className='flex'>
        <span className='w-12 text-muted-foreground'>Pos:</span>
        <span>
          {cameraSnapshot.position
            ? `[${cameraSnapshot.position[0]?.toFixed(1)}, ${cameraSnapshot.position[1]?.toFixed(1)}, ${cameraSnapshot.position[2]?.toFixed(1)}]`
            : 'N/A'}
        </span>
      </div>
      <div className='flex'>
        <span className='w-12 text-muted-foreground'>Tgt:</span>
        <span>
          {cameraSnapshot.target
            ? `[${cameraSnapshot.target[0]?.toFixed(1)}, ${cameraSnapshot.target[1]?.toFixed(1)}, ${cameraSnapshot.target[2]?.toFixed(1)}]`
            : 'N/A'}
        </span>
      </div>
      <div className='flex'>
        <span className='w-12 text-muted-foreground'>Up:</span>
        <span>
          {cameraSnapshot.up
            ? `[${cameraSnapshot.up[0]?.toFixed(1)}, ${cameraSnapshot.up[1]?.toFixed(1)}, ${cameraSnapshot.up[2]?.toFixed(1)}]`
            : 'N/A'}
        </span>
      </div>
    </div>
  );
};

export function CameraComponent() {
  const cameraSnapshot = useAtomValue(CameraPositionAtom);
  const scene = useAtomValue(ActiveSceneAtom);

  return (
    <div className='flex items-start gap-4'>
      <div>
        <p className='text-xs font-medium text-muted-foreground mb-1'>Current Camera:</p>
        <CameraPositionDisplay cameraSnapshot={cameraSnapshot} />
      </div>
      <div>
        <p className='text-xs font-medium text-muted-foreground mb-1'>Stored Camera:</p>
        {scene?.camera ? (
          <CameraPositionDisplay cameraSnapshot={scene.camera} />
        ) : (
          <p className='text-xs text-muted-foreground italic'>No stored camera position</p>
        )}
      </div>
      <div className='flex flex-col gap-1'>
        <Button size='sm' onClick={() => modifyCurrentScene({ camera: cameraSnapshot })}>
          <CameraIcon className='h-3 w-3 mr-1' />
          Store
        </Button>
        <Button size='sm' variant='outline' onClick={() => modifyCurrentScene({ camera: undefined })}>
          <XIcon className='h-3 w-3 mr-1' />
          Clear
        </Button>
      </div>
    </div>
  );
}

// Assets overlay component
function AssetList() {
  const storyAssets = useAtomValue(StoryAssetsAtom);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size='sm' variant='outline'>
          <FolderIcon />
          Assets
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {storyAssets.length === 0 ? (
          <DropdownMenuItem disabled>No assets uploaded</DropdownMenuItem>
        ) : (
          storyAssets.map((asset, index) => (
            <DropdownMenuItem
              key={`${asset.name}-${index}`}
              onClick={() => {
                navigator.clipboard.writeText(asset.name);
              }}
              title='Click to copy asset name'
            >
              <CopyIcon className='size-4' /> {asset.name} ({Math.round(asset.content.length / 1024)}KB)
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CodeUIControls() {
  return (
    <div className='flex items-start gap-6 mb-2'>
      <CameraComponent />
      <AssetList />
    </div>
  );
}

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

  store: ReturnType<typeof useStore> | undefined = undefined;
  setCameraSnapshot: (snapshot: Camera.Snapshot) => void = () => {};

  loadStory(story: Story, scene: SceneData) {
    if (!scene) return;

    this.queue.run(async () => {
      try {
        this.store?.set(IsLoadingAtom, true);
        const data = await getMVSData(story, [scene]);
        await this.plugin.initialized;
        // The plugin.initialized get triggered after plugin.init(),
        // before plugin.initContainer() is called. Depending on the use case,
        // there was an edge case where the `loadMVSData` was called before
        // the canvas was ready.
        await Scheduler.immediatePromise();
        await loadMVSData(this.plugin, data, data instanceof Uint8Array ? 'mvsx' : 'mvsj');
      } catch (error) {
        console.error('Error loading MVS data into Molstar:', error);
      } finally {
        this.store?.set(IsLoadingAtom, false);
      }
    });
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
// We want to use a single global instance for the viewer to avoid
// re-initializing each time the component is needed.
let _modelInstance: CurrentStoryViewModel | null = null;
const IsLoadingAtom = atom(false);

function LoadingIndicator() {
  const isLoading = useAtomValue(IsLoadingAtom);
  if (!isLoading) return null;

  return (
    <div className='absolute start-0 top-0 ps-4 pt-1' style={{ zIndex: 1000 }}>
      <span className='text-sm text-gray-500'>Loading...</span>
    </div>
  );
}

export function CurrentSceneView() {
  const modelRef = useRef<CurrentStoryViewModel>(_modelInstance);
  if (!modelRef.current) {
    _modelInstance = modelRef.current = new CurrentStoryViewModel();
  }
  const model = modelRef.current;

  const story = useAtomValue(StoryAtom);
  const scene = useAtomValue(ActiveSceneAtom);

  model.store = useStore();
  model.setCameraSnapshot = useAtom(CameraPositionAtom)[1];

  useEffect(() => {
    model.loadStory(story, scene);
  }, [model, story, scene]);

  return (
    <div className='rounded overflow-hidden w-full h-full border border-border bg-background relative'>
      <div className='w-full h-full relative'>
        <PluginWrapper plugin={model.plugin} />
        <LoadingIndicator />
      </div>
    </div>
  );
}

export function SceneEditors() {
  return (
    <Tabs defaultValue='scene' className='w-full h-full'>
      <Card className='w-full h-full'>
        <CardHeader className='border-b'>
          <div className='flex items-center gap-6'>
            <div className='flex items-center gap-2'>
              <Edit className='h-4 w-4' />
              <CardTitle className='text-sm text-muted-foreground'>
                <SceneTitle />
              </CardTitle>
            </div>
            <TabsList>
              <TabsTrigger value='scene'>
                <BoxIcon className='size-4' /> 3D View
              </TabsTrigger>
              <TabsTrigger value='options'>
                <BoltIcon className='size-4' /> Scene Options
              </TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>

        <CardContent className='flex-1 overflow-hidden'>
          <TabsContent value='options' className='mt-0 h-full'>
            <div className='space-y-4'>
              <OptionsEditor />
              <Label>Markdown Description</Label>
              <PressToSave />
              <div className='flex gap-6'>
                <div className='flex-1'>
                  <SceneMarkdownEditor />
                </div>
                <div className='flex-1'>
                  <MarkdownRenderer />
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value='scene' className='mt-0 h-full'>
            <div className='flex gap-6'>
              <div className='space-y-4 flex-1'>
                <CodeUIControls />
                <PressToSave />
                <SceneCodeEditor />
              </div>
              <div className='flex-1'>
                <div className='w-full' style={{ aspectRatio: '1.3/1' }}>
                  <CurrentSceneView />
                </div>
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  );
}

function SceneTitle() {
  const scene = useAtomValue(ActiveSceneAtom);
  return <>{scene?.header || 'Untitled Scene'}</>;
}

function MarkdownRenderer() {
  const scene = useAtomValue(ActiveSceneAtom);
  return (
    <div className='h-full min-h-[500px] max-h-[500px] bg-gray-50 rounded-lg p-4 overflow-y-auto'>
      <div className='prose'>
        <Markdown skipHtml>{scene?.description || ''}</Markdown>
      </div>
    </div>
  );
}
