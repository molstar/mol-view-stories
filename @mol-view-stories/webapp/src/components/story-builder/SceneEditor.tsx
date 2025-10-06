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
import { CameraData, Story } from '@/app/appstate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, SingleTaskQueue } from '@/lib/utils';
import { atom, getDefaultStore, useAtom, useAtomValue, useSetAtom, useStore } from 'jotai/index';
import {
  Axis3D,
  BoltIcon,
  BoxIcon,
  CameraIcon,
  Circle,
  CopyIcon,
  Eclipse,
  Edit,
  FolderIcon,
  PinIcon,
  XIcon,
  RotateCw,
  LucideMessageCircleQuestion,
  Copy,
} from 'lucide-react';
import { MolViewSpec } from 'molstar/lib/extensions/mvs/behavior';
import { loadMVSData } from 'molstar/lib/extensions/mvs/components/formats';
import { Camera } from 'molstar/lib/mol-canvas3d/camera';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { fileToDataUri } from 'molstar/lib/mol-util/file';
import { Plugin, PluginContextContainer, Log } from 'molstar/lib/mol-plugin-ui/plugin';
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { Markdown } from 'molstar/lib/mol-plugin-ui/controls/markdown';
import { PluginConfig } from 'molstar/lib/mol-plugin/config';
import { PluginSpec } from 'molstar/lib/mol-plugin/spec';
import { Scheduler } from 'molstar/lib/mol-task';
import { memo, useEffect, useRef, useState } from 'react';
import { Label } from '../ui/label';
import { SceneCodeEditor } from './editors/SceneCodeEditor';
import { SceneMarkdownEditor } from './editors/SceneMarkdownEditor';
import { OptionsEditor } from './editors/SceneOptions';
import { PressToCodeComplete, PressToSave } from '../common';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra';
import { toast } from 'sonner';
import { UpdateSceneAtom } from '@/app/state/atoms';
import { PluginReactContext } from 'molstar/lib/mol-plugin-ui/base';
import Link from 'next/link';
import { ImmediateInput } from '../controls';

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

  return (
    <div className='flex items-start justify-between gap-4 w-full mt-2'>
      <div className='flex-1'>
        <Label className='text-xs font-medium text-muted-foreground'>Camera Position</Label>
        <Vector value={cameraSnapshot?.position} />
      </div>
      <div className='flex-1'>
        <Label className='text-xs font-medium text-muted-foreground'>Target</Label>
        <Vector value={cameraSnapshot?.target} />
      </div>
      <div className='flex-1'>
        <Label className='text-xs font-medium text-muted-foreground'>Up</Label>
        <Vector value={cameraSnapshot?.up} />
      </div>
      <div className='flex-1'>
        <Label className='text-xs font-medium text-muted-foreground'>Direction</Label>
        <Vector value={cameraDirection(cameraSnapshot)} />
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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline' size='sm'>
            <CameraIcon className='size-4 mr-1' />
            Camera
            {scene?.camera && (
              <span title='Saved'>
                <PinIcon className='size-4 ml-1' />
              </span>
            )}
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
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline' size='sm'>
            <Eclipse className='size-4 mr-1' />
            Clip
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start'>
          <DropdownMenuItem
            onClick={() => copyClipToClipboard('plane', cameraSnapshot)}
            title='Copy clip plane based on current camera position'
          >
            <Axis3D className='h-3 w-3 mr-1' /> Copy Plane
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => copyClipToClipboard('sphere', cameraSnapshot)}
            title='Copy clip sphere based on current camera position'
          >
            <Circle className='h-3 w-3 mr-1' /> Copy Sphere
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

function CodeUIControls() {
  const setUpdate = useSetAtom(UpdateSceneAtom);

  return (
    <div className='flex items-center gap-2'>
      <CameraActions />
      <AssetList />
      <Button variant='ghost' size='sm' onClick={() => setUpdate(Date.now())}>
        <RotateCw className='size-4 mr-1' />
        Update Scene
      </Button>
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
        // First, build MVS data; errors here are already reported by getMVSData
        let data: Awaited<ReturnType<typeof getMVSData>>;
        try {
          data = await getMVSData(story, [scene]);
        } catch {
          return;
        }
        await this.plugin.initialized;
        // The plugin.initialized get triggered after plugin.init(),
        // before plugin.initContainer() is called. Depending on the use case,
        // there was an edge case where the `loadMVSData` was called before
        // the canvas was ready.
        await Scheduler.immediatePromise();
        try {
          await loadMVSData(this.plugin, data as Uint8Array<ArrayBuffer>, data instanceof Uint8Array ? 'mvsx' : 'mvsj');
        } catch (error) {
          toast.error(
            <>
              <b>MVS Load Error:</b>
              <div style={{ whiteSpace: 'pre-wrap' }}>{String(error)}. See console for details.</div>
            </>,
            { duration: 5000, id: 'mvs-load-error', closeButton: true }
          );
          console.error('Error loading MVS data into Molstar:', error);
        }
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
    <div
      className='absolute start-0 top-0 px-4 py-1 border-r border-b rounded-br'
      style={{ zIndex: 1000, background: 'rgb(243, 242, 238)' }}
    >
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
    <>
      <div className='rounded-t overflow-hidden w-full h-full bg-background relative border'>
        <div className='w-full h-full relative [&_.msp-plugin-content]:border-none!'>
          <PluginWrapper plugin={model.plugin} />
          <LoadingIndicator />
        </div>
      </div>
      <div className='rounded-b overflow-hidden w-full h-40 bg-background relative border [&_.msp-log-entry]:bg-gray-50! [&_.msp-log]:bg-white! border-t-0'>
        <PluginContextContainer plugin={model.plugin}>
          <Log />
        </PluginContextContainer>
      </div>
    </>
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
              <div className='flex gap-2'>
                <AssetList />
                <Button size='sm' variant='outline' asChild>
                  <Link
                    href='https://molstar.org/docs/plugin/managers/markdown-extensions/'
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <LucideMessageCircleQuestion />
                    Markdown Command Docs
                  </Link>
                </Button>
                <EncodeCommand />
              </div>
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
              <div className='flex gap-6 items-center'>
                <div className='flex-1'>
                  <CodeUIControls />
                </div>
                <div className='flex-1'>
                  <CameraState />
                </div>
              </div>
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

function EncodeCommand() {
  const [command, setCommand] = useState('');

  const copy = () => {
    navigator.clipboard.writeText(encodeURIComponent(command));
    toast.success('Copied to clipboard', { duration: 1000 });
  };

  return (
    <>
      <ImmediateInput
        className='h-8 w-100'
        value={command}
        placeholder='URL encode command'
        onChange={setCommand}
        onEnter={copy}
      />
      <Button variant='outline' size='sm' title='Copy URL-encoded command to clipboard' onClick={copy}>
        <Copy />
      </Button>
    </>
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
        <PluginReactContext.Provider value={getMarkdownMolStarContext()}>
          <Markdown>{scene?.description || ''}</Markdown>
        </PluginReactContext.Provider>
      </div>
    </div>
  );
}

let _markdownPlugin: PluginUIContext | null = null;
function getMarkdownMolStarContext() {
  if (_markdownPlugin) return _markdownPlugin;
  const plugin = new PluginUIContext(DefaultPluginUISpec());
  plugin.managers.markdownExtensions.registerUriResolver('markdown-preview', (_, uri) => {
    const store = getDefaultStore();
    const story = store.get(StoryAtom);
    if (!story) return;
    const assets = story.assets;
    const asset = assets.find((a) => a.name === uri);
    if (!asset) return;
    return fileToDataUri(new File([asset.content as Uint8Array<ArrayBuffer>], asset.name));
  });
  _markdownPlugin = plugin;
  return plugin;
}
