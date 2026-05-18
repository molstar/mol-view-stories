'use client';

import {
  ActiveSceneAtom,
  ActiveSceneIdAtom,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, copyToClipboard, SingleTaskQueue } from '@/lib/utils';
import { atom, getDefaultStore, useAtom, useAtomValue, useStore } from 'jotai/index';
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
  TriangleAlert,
  XIcon,
  LucideMessageCircleQuestion,
  Copy,
  BadgeInfo,
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
import { memo, useEffect, useRef, useState, type RefObject } from 'react';
import { Label } from '../ui/label';
import { MolViewEditor, useSyncToBuilder } from '@molstar/molstar-components';
import { setupMonacoWorkers } from '@/lib/monaco-worker-setup';

setupMonacoWorkers();
import { SceneMarkdownEditor } from './editors/SceneMarkdownEditor';
import { OptionsEditor } from './editors/SceneOptions';
import { PressToCodeComplete, PressToSave } from '../common';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra';
import { toast } from 'sonner';

import { PluginReactContext } from 'molstar/lib/mol-plugin-ui/base';
import Link from 'next/link';
import { ImmediateInput } from '../controls';
import { adjustedCameraPosition } from '@mol-view-stories/lib';
import { snapshotToCameraParams, UIBuilder, UIBuilderProvider } from '@molstar/molstar-components';
import type { UIBuilderHandle, UIBuilderSnapshot, ConstantDefinition } from '@molstar/molstar-components';
import { LLMContext } from './editors/llm-context';
import { modifyStoryConstants } from '@/app/state/actions';

function Vector({ value, className }: { value?: Vec3 | number[]; title?: string; className?: string }) {
  return (
    <div
      className={cn(
        'overflow-hidden whitespace-nowrap text-xs font-mono',
        className,
        !value ? 'text-muted-foreground' : ''
      )}
    >
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
  const adjustedPosition = cameraSnapshot ? adjustedCameraPosition(cameraSnapshot as CameraData) : undefined;

  return (
    <div className='flex items-start justify-between gap-4 w-full mt-2'>
      <div className='flex-1'>
        <Label className='text-xs font-medium text-muted-foreground'>Camera Position</Label>
        <Vector value={adjustedPosition} />
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
                copyToClipboard(asset.name, 'Asset name');
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
    copyToClipboard(text, 'Clip plane');
  } else if (kind === 'sphere') {
    const text = `.clip({
  type: 'sphere',
  center: [${snapshot.target[0].toFixed(2)}, ${snapshot.target[1].toFixed(2)}, ${snapshot.target[2].toFixed(2)}],
  radius: 1.0
})`;

    copyToClipboard(text, 'Clip sphere');
  }
}

function copyFovAdjustedCameraToClipboard(snapshot: Camera.Snapshot | CameraData | null | undefined) {
  if (!snapshot) return;

  const adjustedPosition = adjustedCameraPosition(snapshot as CameraData);

  const text = `builder.camera({
  position: [${adjustedPosition[0].toFixed(2)}, ${adjustedPosition[1].toFixed(2)}, ${adjustedPosition[2].toFixed(2)}],
  target: [${snapshot.target[0].toFixed(2)}, ${snapshot.target[1].toFixed(2)}, ${snapshot.target[2].toFixed(2)}],
  up: [${snapshot.up[0].toFixed(2)}, ${snapshot.up[1].toFixed(2)}, ${snapshot.up[2].toFixed(2)}],
});`;

  copyToClipboard(text, 'Camera position');
}

function CameraActions({ builderRef }: { builderRef: RefObject<UIBuilderHandle | null> }) {
  const cameraSnapshot = useAtomValue(CameraPositionAtom);
  const scene = useAtomValue(ActiveSceneAtom);

  const sendToBuilder = () => {
    if (!cameraSnapshot) return;
    builderRef.current?.setCamera(snapshotToCameraParams(cameraSnapshot as CameraData));
  };

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
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => copyFovAdjustedCameraToClipboard(cameraSnapshot)}
            title='Copy current camera position to clipboard'
          >
            <CopyIcon className='h-3 w-3 mr-1' /> Copy Position
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={sendToBuilder}
            disabled={!cameraSnapshot}
            title='Send FOV-adjusted camera position to the Visual Builder camera section'
          >
            <BoxIcon className='h-3 w-3 mr-1' /> Send to Builder
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

function CodeUIControls({ builderRef }: { builderRef: RefObject<UIBuilderHandle | null> }) {
  return (
    <div className='flex items-center gap-2'>
      <CameraActions builderRef={builderRef} />
      <AssetList />
      <div className='m-auto' />
      <Button
        variant='ghost'
        size='sm'
        title='Copy LLM context to clipboard. Paste this at the start of your chat.'
        onClick={() => {
          copyToClipboard(LLMContext, 'LLM Context');
        }}
        className='text-gray-500'
      >
        <BadgeInfo className='size-4 mr-1' />
        LLM Context
      </Button>
    </div>
  );
}

function ExperimentalBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className='rounded border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-sm flex flex-col gap-1'>
      <div className='flex items-start gap-2'>
        <TriangleAlert className='size-4 shrink-0 mt-0.5' />
        <span className='flex-1'>
          The State Builder is an <strong>experimental feature</strong> — features and workflows may evolve before the
          stable release, and you may also encounter bugs.
        </span>
        <button onClick={onDismiss} title='Dismiss' className='shrink-0 opacity-70 hover:opacity-100'>
          <XIcon className='size-4' />
        </button>
      </div>
      <div className='flex gap-4 pl-6 text-xs font-medium'>
        <Link
          href='https://molstar.org/molstar-components/state-builder-docs.html'
          target='_blank'
          rel='noopener noreferrer'
          className='font-semibold hover:opacity-70'
        >
          Getting started (docs) ↗
        </Link>
        <Link
          href='https://github.com/molstar/molstar-components/issues'
          target='_blank'
          rel='noopener noreferrer'
          className='font-semibold hover:opacity-70'
        >
          Have an idea or a bug to report? ↗
        </Link>
      </div>
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
        this.plugin.managers.markdownExtensions.audio.stop();

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

  const storyRef = useRef(story);
  storyRef.current = story;
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  // Only depend on fields that affect MVS rendering — not ui_builder_state, header, description
  useEffect(() => {
    model.loadStory(storyRef.current, sceneRef.current);
  }, [
    model,
    story?.javascript,
    scene?.id,
    scene?.javascript,
    scene?.camera,
    scene?.linger_duration_ms,
    scene?.transition_duration_ms,
  ]);

  useEffect(() => {
    return () => model.plugin.managers.markdownExtensions.audio.stop();
  }, [model.plugin.managers.markdownExtensions.audio]);

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
      <Card className='w-full h-full min-h-[1000px]'>
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
              <SceneMarkdownEditorSection />
              <PressToSave />
            </div>
          </TabsContent>
          <TabsContent value='scene' className='mt-0 h-full'>
            <SceneCodeEditorSection />
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  );
}

function EncodeCommand() {
  const [command, setCommand] = useState('');

  const copy = () => {
    copyToClipboard(encodeURIComponent(command), 'URL encode command');
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

function SceneMarkdownEditorSection() {
  const scene = useAtomValue(ActiveSceneAtom);

  return (
    <div className='flex gap-6'>
      <div className='flex-1'>
        <SceneMarkdownEditor
          value={scene?.description || ''}
          onSave={(description) => modifyCurrentScene({ description })}
        />
      </div>
      <div className='flex-1'>
        <MarkdownRenderer />
      </div>
    </div>
  );
}

function SceneCodeEditorSection() {
  const builderRef = useRef<UIBuilderHandle>(null);
  const editorRef = useRef<{ getValue(): string } | null>(null);
  const scene = useAtomValue(ActiveSceneAtom);
  const story = useAtomValue(StoryAtom);
  const activeSceneId = useAtomValue(ActiveSceneIdAtom);
  const cameraSnapshot = useAtomValue(CameraPositionAtom);
  const [viewMode, setViewMode] = useState<'code' | 'builder'>('code');
  const [confirmingSync, setConfirmingSync] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const {
    sync,
    isSyncing,
    error: syncError,
    clearError,
  } = useSyncToBuilder(builderRef, {
    commonCode: story.javascript || undefined,
  });

  const handleSyncConfirm = async () => {
    const code = editorRef.current?.getValue() ?? scene?.javascript ?? '';
    const ok = await sync(code);
    if (ok) {
      setConfirmingSync(false);
      setViewMode('builder');
    }
  };

  return (
    <div className='flex flex-col h-full gap-2'>
      <div className='flex gap-6 items-center'>
        <div className='flex-1'>
          <CodeUIControls builderRef={builderRef} />
        </div>
        <div className='flex-1'>
          <CameraState />
        </div>
      </div>
      <div className='flex gap-6 flex-1 min-h-0'>
        <div className='flex-1 flex flex-col gap-2 shrink-0 min-h-0'>
          <div className='flex gap-2 items-center mb-2'>
            <Button size='sm' variant={viewMode === 'code' ? 'default' : 'outline'} onClick={() => setViewMode('code')}>
              Code Editor
            </Button>
            <Button
              size='sm'
              variant={viewMode === 'builder' ? 'default' : 'outline'}
              onClick={() => setViewMode('builder')}
            >
              UI Builder (experimental)
            </Button>
            {viewMode === 'code' && (
              <Button
                size='sm'
                variant='outline'
                className='ml-auto'
                onClick={() => {
                  clearError();
                  setConfirmingSync(true);
                }}
              >
                → Sync to Builder
              </Button>
            )}
          </div>
          {/* Code editor — always mounted to avoid losing editor state; hidden when in builder mode */}
          <div className={cn('flex flex-col flex-1 gap-2', viewMode !== 'code' && 'hidden')}>
            <div className='border rounded flex-1 relative'>
              <MolViewEditor
                value={scene?.javascript || ''}
                commonCode={story.javascript || ''}
                onSave={(code) => modifyCurrentScene({ javascript: code })}
                onEditorMount={(editor) => {
                  editorRef.current = editor;
                }}
                className='absolute inset-0'
                editorOptions={{ theme: 'vs' }}
                hybridMode={true}
              />
            </div>
            <div className='flex gap-2'>
              <PressToSave />
              <PressToCodeComplete />
            </div>
          </div>

          {/* Sync confirmation dialog */}
          {confirmingSync && (
            <div
              className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'
              onClick={() => {
                if (!isSyncing) {
                  setConfirmingSync(false);
                  clearError();
                }
              }}
            >
              <div
                className='bg-white rounded-lg border shadow-lg p-6 max-w-md w-[90%] flex flex-col gap-3'
                onClick={(e) => e.stopPropagation()}
              >
                <p className='font-semibold text-base'>Sync Code to Builder?</p>
                <p className='text-sm text-muted-foreground'>
                  This will overwrite the UI Builder state by running your code with the MVS builder.
                </p>
                <p className='text-sm text-amber-600'>
                  ⚠ If you later generate code from the builder, it will be reformatted and may differ from your
                  original code.
                </p>
                {syncError && <p className='text-sm text-destructive'>{syncError}</p>}
                <div className='flex gap-2 justify-end'>
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={isSyncing}
                    onClick={() => {
                      setConfirmingSync(false);
                      clearError();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size='sm' disabled={isSyncing} onClick={handleSyncConfirm}>
                    {isSyncing ? 'Syncing…' : 'Sync to Builder'}
                  </Button>
                </div>
              </div>
            </div>
          )}
          {viewMode === 'builder' && !bannerDismissed && (
            <ExperimentalBanner onDismiss={() => setBannerDismissed(true)} />
          )}

          {/* Builder — always mounted so Jotai store survives tab switches; hidden when in code mode */}
          <div className={cn('border rounded flex-1 relative overflow-hidden', viewMode !== 'builder' && 'hidden')}>
            <UIBuilderProvider
              ref={builderRef}
              sceneKey={activeSceneId || 'default'}
              sceneInitialState={scene?.ui_builder_state as Partial<UIBuilderSnapshot> | undefined}
              onStateChange={(snapshot: UIBuilderSnapshot) =>
                modifyCurrentScene({ ui_builder_state: snapshot as unknown as Record<string, unknown> })
              }
              storyConstants={story.ui_builder_constants as ConstantDefinition[] | undefined}
              onStoryConstantsChange={(constants: ConstantDefinition[]) => modifyStoryConstants(constants)}
              plugin={_modelInstance?.plugin}
              cameraSnapshot={cameraSnapshot}
              onCodeGenerated={(code: string) => modifyCurrentScene({ javascript: code })}
              onNotification={(n: { type: 'success' | 'error'; message: string }) =>
                n.type === 'error' ? toast.error(n.message) : toast.success(n.message)
              }
            >
              <UIBuilder />
            </UIBuilderProvider>
          </div>
        </div>
        <div className='flex-1 shrink-0'>
          <div className='w-full' style={{ aspectRatio: '1.33/1' }}>
            <CurrentSceneView />
          </div>
        </div>
      </div>
    </div>
  );
}
