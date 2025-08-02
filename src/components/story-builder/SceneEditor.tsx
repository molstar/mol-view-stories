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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, SingleTaskQueue } from '@/lib/utils';
import { atom, useAtom, useAtomValue, useStore } from 'jotai/index';
import {
  Axis3D,
  BoltIcon,
  BoxIcon,
  CameraIcon,
  Circle,
  CopyIcon,
  Edit,
  FolderIcon,
  PinIcon,
  XIcon,
} from 'lucide-react';
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
import { PressToCodeComplete, PressToSave } from '../common';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra';
import { toast } from 'sonner';

function Vector({ value, className }: { value?: Vec3 | number[]; title?: string; className?: string }) {
  return (
    <div className={cn('text-xs font-mono', className, !value ? 'text-muted-foreground' : '')}>
      {value ? `[${value[0]?.toFixed(1)}, ${value[1]?.toFixed(1)}, ${value[2]?.toFixed(1)}]` : '-'}
    </div>
  );
}

function cameraDirection(camera: CameraData | Camera.Snapshot | null | undefined): Vec3 | undefined {
  if (!camera) return undefined;
  const delta = Vec3.sub(Vec3(), camera.target as Vec3, camera.position as Vec3);
  Vec3.normalize(delta, delta);
  return delta;
}

function CameraState() {
  const cameraSnapshot = useAtomValue(CameraPositionAtom);
  const scene = useAtomValue(ActiveSceneAtom);

  return (
    <div className='flex items-start justify-between gap-4 w-full mt-2'>
      <div className='flex-1'>
        <Label className='text-xs font-medium text-muted-foreground'>Camera Position</Label>
        <Vector
          value={cameraSnapshot?.position}
          className={scene?.camera ? 'text-muted-foreground' : ''}
          title='Current'
        />
        <Vector value={scene?.camera?.position} title='Stored' />
      </div>
      <div className='flex-1'>
        <Label className='text-xs font-medium text-muted-foreground'>Target</Label>
        <Vector
          value={cameraSnapshot?.target}
          className={scene?.camera ? 'text-muted-foreground' : ''}
          title='Current'
        />
        <Vector value={scene?.camera?.target} title='Stored' />
      </div>
      <div className='flex-1'>
        <Label className='text-xs font-medium text-muted-foreground'>Up</Label>
        <Vector value={cameraSnapshot?.up} className={scene?.camera ? 'text-muted-foreground' : ''} title='Current' />
        <Vector value={scene?.camera?.up} title='Stored' />
      </div>
      <div className='flex-1'>
        <Label className='text-xs font-medium text-muted-foreground'>Direction</Label>
        <Vector
          value={cameraDirection(cameraSnapshot)}
          className={scene?.camera ? 'text-muted-foreground' : ''}
          title='Current'
        />
        <Vector value={cameraDirection(scene?.camera)} title='Stored' />
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
      <DropdownMenuContent align='start'>
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

function copyClipToClipboard(kind: 'plane' | 'sphere', snapshot: Camera.Snapshot | CameraData | null | undefined) {
  if (!snapshot) return;

  if (kind === 'plane') {
    const dir = cameraDirection(snapshot)!;
    Vec3.negate(dir, dir);

    const text = `.clip({
  type: 'plane',
  point: [${snapshot.target[0].toFixed(2)}, ${snapshot.target[1].toFixed(2)}, ${snapshot.target[2].toFixed(2)}],
  normal: [${dir[0].toFixed(2)}, ${dir[1].toFixed(2)}, ${dir[2].toFixed(2)}]
})`;
    navigator.clipboard.writeText(text);
    toast.success('Clip plane copied to clipboard');
  } else if (kind === 'sphere') {
    const text = `.clip({
  type: 'sphere',
  center: [${snapshot.target[0].toFixed(2)}, ${snapshot.target[1].toFixed(2)}, ${snapshot.target[2].toFixed(2)}],
  radius: 1.0
})`;

    navigator.clipboard.writeText(text);
    toast.success('Clip sphere copied to clipboard');
  }
}

function CameraActions() {
  const cameraSnapshot = useAtomValue(CameraPositionAtom);
  const scene = useAtomValue(ActiveSceneAtom);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='sm' className='relative'>
          <CameraIcon className='size-4 mr-1' />
          Camera
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start'>
        <DropdownMenuItem
          onClick={() => modifyCurrentScene({ camera: cameraSnapshot })}
          title='Save current camera position to use for this scene'
        >
          <PinIcon className='h-3 w-3 mr-1' /> Save Position
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!scene?.camera}
          onClick={() => modifyCurrentScene({ camera: undefined })}
          title='Clear stored camera position'
        >
          <XIcon className='h-3 w-3 mr-1' /> Clear Position
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => copyClipToClipboard('plane', cameraSnapshot)}
          title='Copy clip plane based on current camera position'
        >
          <Axis3D className='h-3 w-3 mr-1' /> Copy Clip Plane
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => copyClipToClipboard('sphere', cameraSnapshot)}
          title='Copy clip sphere based on current camera position'
        >
          <Circle className='h-3 w-3 mr-1' /> Copy Clip Sphere
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CodeUIControls() {
  return (
    <div className='flex items-center gap-2'>
      <CameraActions />
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
    await this.plugin.initContainerAsync();

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

function CurrentSceneView() {
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
    <div className='rounded overflow-hidden w-full h-full bg-background relative border'>
      <div className='w-full h-full relative [&_.msp-plugin-content]:border-none!'>
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
              <div className='flex gap-6'>
                <div className='flex-1'>
                  <SceneMarkdownEditor />
                </div>
                <div className='flex-1'>
                  <MarkdownRenderer />
                </div>
              </div>
              <PressToSave />
            </div>
          </TabsContent>
          <TabsContent value='scene' className='mt-0 h-full'>
            <div className='flex flex-col h-full gap-2'>
              <CodeUIControls />
              <div className='flex gap-6 h-full'>
                <div className='flex-1 flex flex-col gap-2 shrink-0'>
                  <div className='border rounded flex-1 relative'>
                    <SceneCodeEditor />
                  </div>
                  <div className='flex gap-2'>
                    <PressToSave />
                    <PressToCodeComplete />
                  </div>
                </div>
                <div className='flex-1 shrink-0'>
                  <div className='w-full' style={{ aspectRatio: '1.33/1' }}>
                    <CurrentSceneView />
                    <CameraState />
                  </div>
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
